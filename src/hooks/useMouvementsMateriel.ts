import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  disponible: "Disponible",
  affecte: "Affecté",
  pris_en_charge: "Pris en charge",
  en_passation: "En passation",
  restitue: "Restitué",
  en_maintenance: "En maintenance",
  hors_service: "Hors service",
  perdu: "Perdu",
  vole: "Volé",
  reforme: "Réformé",
};

export const ITEM_ETAT_LABEL: Record<ItemEtat, string> = {
  bon: "Bon",
  usage: "Usagé",
  casse: "Cassé",
  manquant: "Manquant",
  a_reparer: "À réparer",
};

export function useMouvements(filters?: { type?: MouvementType; statut?: MouvementStatut }) {
  return useQuery({
    queryKey: ["materiel-mouvements", filters],
    queryFn: async () => {
      let q = supabase
        .from("materiel_movements" as any)
        .select("*, chantiers(id,nom), sortant:intervenants!materiel_movements_technicien_sortant_id_fkey(id,nom,prenom), entrant:intervenants!materiel_movements_technicien_entrant_id_fkey(id,nom,prenom), responsable:intervenants!materiel_movements_responsable_id_fkey(id,nom,prenom)")
        .order("created_at", { ascending: false });
      if (filters?.type) q = q.eq("type", filters.type);
      if (filters?.statut) q = q.eq("statut", filters.statut);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useMouvement(id: string) {
  return useQuery({
    queryKey: ["materiel-mouvement", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materiel_movements" as any)
        .select("*, chantiers(id,nom), sortant:intervenants!materiel_movements_technicien_sortant_id_fkey(id,nom,prenom), entrant:intervenants!materiel_movements_technicien_entrant_id_fkey(id,nom,prenom), responsable:intervenants!materiel_movements_responsable_id_fkey(id,nom,prenom)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!id,
  });
}

export function useMouvementItems(movementId: string) {
  return useQuery({
    queryKey: ["materiel-mouvement-items", movementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movement_items" as any)
        .select("*, materiel_laboratoire(id,nom,reference,marque,modele,numero_serie)")
        .eq("movement_id", movementId);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!movementId,
  });
}

export function useMouvementSignatures(movementId: string) {
  return useQuery({
    queryKey: ["materiel-mouvement-sig", movementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movement_signatures" as any)
        .select("*")
        .eq("movement_id", movementId)
        .order("signed_at");
      if (error) throw error;
      return data as any[];
    },
    enabled: !!movementId,
  });
}

export function useCreateMouvement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ movement, items }: { movement: any; items: any[] }) => {
      const { data: m, error } = await supabase
        .from("materiel_movements" as any)
        .insert(movement)
        .select()
        .single();
      if (error) throw error;
      if (items.length > 0) {
        const payload = items.map((it) => ({ ...it, movement_id: (m as any).id }));
        const { error: e2 } = await supabase.from("movement_items" as any).insert(payload);
        if (e2) throw e2;
      }
      return m as any;
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
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase.from("movement_signatures" as any).insert({
        movement_id: movementId, role, signataire_nom: nom, signataire_fonction: fonction,
        signature_data, user_id: userRes.user?.id,
      });
      if (error) throw error;
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
      const { error } = await supabase
        .from("materiel_movements" as any)
        .update({ statut: "signe" })
        .eq("id", id);
      if (error) throw error;
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
      const { data: items, error } = await supabase
        .from("movement_items" as any)
        .select("*, materiel_movements(*, chantiers(nom), entrant:intervenants!materiel_movements_technicien_entrant_id_fkey(nom,prenom), sortant:intervenants!materiel_movements_technicien_sortant_id_fkey(nom,prenom))")
        .eq("materiel_id", materielId);
      if (error) throw error;
      const { data: status } = await supabase
        .from("material_status_history" as any)
        .select("*")
        .eq("materiel_id", materielId)
        .order("changed_at", { ascending: false });
      return { items: (items || []) as any[], status: (status || []) as any[] };
    },
    enabled: !!materielId,
  });
}

export function useMaterialStatusCounts() {
  return useQuery({
    queryKey: ["materiel-statut-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materiel_laboratoire")
        .select("statut_courant");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data as any[]).forEach((r) => { counts[r.statut_courant] = (counts[r.statut_courant] || 0) + 1; });
      return counts;
    },
  });
}
