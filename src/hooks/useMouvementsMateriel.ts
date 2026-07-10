import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";
import { supabase } from "@/integrations/supabase/client";

export type MouvementType = "affectation" | "decharge" | "passation" | "restitution";
export type MouvementStatut = "brouillon" | "valide" | "signe" | "annule";
export type ItemEtat = "bon" | "usage" | "casse" | "manquant" | "a_reparer";
export type MaterielStatutCourant =
  | "disponible" | "affecte" | "pris_en_charge" | "en_passation" | "restitue"
  | "en_maintenance" | "hors_service" | "perdu" | "vole" | "reforme";

export const MOUVEMENT_TYPE_LABEL: Record<MouvementType, string> = {
  affectation: "Affectation chantier",
  decharge: "Décharge de prise en charge",
  passation: "Passation",
  restitution: "Restitution",
};

export const STATUT_LABEL: Record<MaterielStatutCourant, string> = {
  disponible: "Disponible", affecte: "Affecté", pris_en_charge: "Pris en charge",
  en_passation: "En passation", restitue: "Restitué", en_maintenance: "En maintenance",
  hors_service: "Hors service", perdu: "Perdu", vole: "Volé", reforme: "Réformé",
};

export const ITEM_ETAT_LABEL: Record<ItemEtat, string> = {
  bon: "Bon", usage: "Usagé", casse: "Cassé", manquant: "Manquant", a_reparer: "À réparer",
};

const movementsSelect =
  "*, chantiers(id,nom), sortant:intervenants!materiel_movements_technicien_sortant_id_fkey(id,nom,prenom), entrant:intervenants!materiel_movements_technicien_entrant_id_fkey(id,nom,prenom), responsable:intervenants!materiel_movements_responsable_id_fkey(id,nom,prenom)";

const movementsRepo = getRepositoryForTable("materiel_movements", {
  defaultSelect: movementsSelect,
  defaultOrder: { column: "created_at", ascending: false },
});
const itemsRepo = getRepositoryForTable("movement_items", {
  defaultSelect: "*, materiel_laboratoire(id,nom,reference,marque,modele,numero_serie)",
});
const signaturesRepo = getRepositoryForTable("movement_signatures", {
  defaultSelect: "*",
  defaultOrder: { column: "signed_at", ascending: true },
});
const statusHistoryRepo = getRepositoryForTable("material_status_history", {
  defaultSelect: "*",
  defaultOrder: { column: "changed_at", ascending: false },
});
const materielRepo = getRepositoryForTable("materiel_laboratoire", { defaultSelect: "statut_courant" });

export function useMouvements(filters?: { type?: MouvementType; statut?: MouvementStatut }) {
  return useQuery({
    queryKey: ["materiel-mouvements", filters],
    queryFn: async () => {
      const f: Record<string, unknown> = {};
      if (filters?.type) f.type = filters.type;
      if (filters?.statut) f.statut = filters.statut;
      const { data } = await movementsRepo.list({ filters: f });
      return data as any[];
    },
  });
}

export function useMouvement(id: string) {
  return useQuery({
    queryKey: ["materiel-mouvement", id],
    queryFn: async () => (await movementsRepo.getById(id)).data as any,
    enabled: !!id,
  });
}

export function useMouvementItems(movementId: string) {
  return useQuery({
    queryKey: ["materiel-mouvement-items", movementId],
    queryFn: async () => {
      const { data } = await itemsRepo.list({ filters: { movement_id: movementId } });
      return data as any[];
    },
    enabled: !!movementId,
  });
}

export function useMouvementSignatures(movementId: string) {
  return useQuery({
    queryKey: ["materiel-mouvement-sig", movementId],
    queryFn: async () => {
      const { data } = await signaturesRepo.list({ filters: { movement_id: movementId } });
      return data as any[];
    },
    enabled: !!movementId,
  });
}

export function useCreateMouvement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ movement, items }: { movement: any; items: any[] }) => {
      const res = await movementsRepo.insert(movement);
      if (res.error) throw new Error(res.error);
      const m = res.data[0] as any;
      if (items.length > 0) {
        const payload = items.map((it) => ({ ...it, movement_id: m.id }));
        const r2 = await itemsRepo.insert(payload);
        if (r2.error) throw new Error(r2.error);
      }
      return m;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materiel-mouvements"] });
      qc.invalidateQueries({ queryKey: ["materiel-laboratoire"] });
    },
  });
}

export function useSignMouvement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      movementId, role, nom, fonction, signature_data,
    }: { movementId: string; role: string; nom: string; fonction?: string; signature_data?: string }) => {
      // auth.getUser() reste un appel d'authentification (module Auth exclu de la migration Repository).
      const { data: userRes } = await supabase.auth.getUser();
      const res = await signaturesRepo.insert({
        movement_id: movementId, role, signataire_nom: nom, signataire_fonction: fonction,
        signature_data, user_id: userRes.user?.id,
      });
      if (res.error) throw new Error(res.error);
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["materiel-mouvement-sig", v.movementId] });
    },
  });
}

export function useValidateMouvement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await movementsRepo.update({ statut: "signe" }, { id });
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materiel-mouvements"] });
      qc.invalidateQueries({ queryKey: ["materiel-mouvement"] });
      qc.invalidateQueries({ queryKey: ["materiel-laboratoire"] });
    },
  });
}

export function useMaterielTimeline(materielId: string) {
  return useQuery({
    queryKey: ["materiel-timeline", materielId],
    queryFn: async () => {
      const { data: items } = await itemsRepo.list({
        select: "*, materiel_movements(*, chantiers(nom), entrant:intervenants!materiel_movements_technicien_entrant_id_fkey(nom,prenom), sortant:intervenants!materiel_movements_technicien_sortant_id_fkey(nom,prenom))",
        filters: { materiel_id: materielId },
      });
      const { data: status } = await statusHistoryRepo.list({ filters: { materiel_id: materielId } });
      return { items: (items || []) as any[], status: (status || []) as any[] };
    },
    enabled: !!materielId,
  });
}

export function useMaterialStatusCounts() {
  return useQuery({
    queryKey: ["materiel-statut-counts"],
    queryFn: async () => {
      const { data } = await materielRepo.list();
      const counts: Record<string, number> = {};
      (data as any[]).forEach((r) => { counts[r.statut_courant] = (counts[r.statut_courant] || 0) + 1; });
      return counts;
    },
  });
}
