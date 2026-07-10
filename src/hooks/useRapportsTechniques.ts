import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DocumentRepository } from "@/lib/repositories";

export type RapportStatut =
  | "brouillon"
  | "en_cours"
  | "a_completer"
  | "en_attente_validation"
  | "valide"
  | "refuse"
  | "archive";

export type RapportGravite = "faible" | "moderee" | "elevee" | "critique";

export interface RapportCategorie {
  id: string;
  nom: string;
  slug: string;
  icone: string | null;
  ordre: number;
}

export interface RapportModele {
  id: string;
  categorie_id: string | null;
  titre: string;
  slug: string;
  description: string | null;
  ordre: number;
  actif: boolean;
}

export interface RapportTechnique {
  id: string;
  numero: string | null;
  titre: string | null;
  description_probleme: string;
  categorie_id: string | null;
  modele_id: string | null;
  sous_type: string | null;
  client_id: string | null;
  chantier_id: string | null;
  entreprise: string | null;
  projet: string | null;
  materiau: string | null;
  date_probleme: string | null;
  statut: RapportStatut;
  analyse_ia: Record<string, unknown> | null;
  gravite: RapportGravite | null;
  contenu_rapport: Record<string, unknown> | null;
  contexte_auto: Record<string, unknown> | null;
  prompt_utilisateur: string | null;
  metadonnees: Record<string, unknown> | null;
  version: number;
  technicien_id: string | null;
  ingenieur_id: string | null;
  soumis_at: string | null;
  valide_at: string | null;
  refuse_at: string | null;
  motif_refus: string | null;
  pdf_url: string | null;
  qr_token: string | null;
  last_autosave_at: string | null;
  version_courante?: number;
  template_id?: string | null;
  signature_ingenieur_id?: string | null;
  publie_at?: string | null;
  editor_html?: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useRapportCategories() {
  return useQuery({
    queryKey: ["rapport_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rapport_categories")
        .select("*")
        .order("ordre", { ascending: true });
      if (error) throw error;
      return data as RapportCategorie[];
    },
  });
}

export function useRapportModeles(categorieId?: string | null) {
  return useQuery({
    queryKey: ["rapport_modeles", categorieId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("rapport_modeles_bibliotheque")
        .select("*")
        .eq("actif", true)
        .order("ordre", { ascending: true });
      if (categorieId) q = q.eq("categorie_id", categorieId);
      const { data, error } = await q;
      if (error) throw error;
      return data as RapportModele[];
    },
  });
}

export interface RapportListFilters {
  statuts?: RapportStatut[];
  categorieId?: string | null;
  search?: string;
}

export type RapportListItem = RapportTechnique & {
  rapport_categories?: { nom: string; slug: string } | null;
  clients?: { nom: string } | null;
  chantiers?: { nom: string } | null;
};

export function useRapportsTechniques(filters: RapportListFilters = {}) {
  return useQuery({
    queryKey: ["rapports_techniques", filters],
    queryFn: async () => {
      let q = supabase
        .from("rapports_techniques")
        .select("*, rapport_categories(nom, slug), clients(nom), chantiers(nom)")
        .order("created_at", { ascending: false });
      if (filters.statuts && filters.statuts.length) {
        q = q.in("statut", filters.statuts);
      }
      if (filters.categorieId) q = q.eq("categorie_id", filters.categorieId);
      if (filters.search) {
        q = q.or(
          `titre.ilike.%${filters.search}%,description_probleme.ilike.%${filters.search}%,numero.ilike.%${filters.search}%`
        );
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as RapportListItem[];
    },
  });
}

export function useRapportTechnique(id: string) {
  return useQuery({
    queryKey: ["rapports_techniques", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rapports_techniques")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as RapportTechnique | null;
    },
    enabled: !!id,
  });
}

export function useCreateRapportTechnique() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Partial<RapportTechnique> & { description_probleme: string }
    ) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id ?? null;
      const payload = {
        ...input,
        created_by: uid,
        technicien_id: input.technicien_id ?? uid,
      } as never;
      const { data, error } = await supabase
        .from("rapports_techniques")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as RapportTechnique;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rapports_techniques"] });
    },
  });
}

export function useUpdateRapportTechnique() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<RapportTechnique> & { id: string }) => {
      const { data, error } = await supabase
        .from("rapports_techniques")
        .update(updates as never)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as RapportTechnique;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["rapports_techniques"] });
      qc.invalidateQueries({ queryKey: ["rapports_techniques", data.id] });
    },
  });
}

export function useDeleteRapportTechnique() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("rapports_techniques")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rapports_techniques"] });
    },
  });
}

export const STATUT_LABELS: Record<RapportStatut, string> = {
  brouillon: "Brouillon",
  en_cours: "En cours",
  a_completer: "À compléter",
  en_attente_validation: "En attente",
  valide: "Validé",
  refuse: "Refusé",
  archive: "Archivé",
};

export const STATUT_COLORS: Record<RapportStatut, string> = {
  brouillon: "bg-muted text-muted-foreground",
  en_cours: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  a_completer: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  en_attente_validation:
    "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
  valide: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  refuse: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  archive: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
};

export const GRAVITE_LABELS: Record<RapportGravite, string> = {
  faible: "Faible",
  moderee: "Modérée",
  elevee: "Élevée",
  critique: "Critique",
};

export const GRAVITE_COLORS: Record<RapportGravite, string> = {
  faible: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  moderee: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  elevee: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
  critique: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
};

// ------- Pièces jointes -------
export type PieceJointeType = "photo" | "pdf" | "essai" | "document" | "autre";

export interface PieceJointe {
  id: string;
  rapport_id: string;
  type: PieceJointeType;
  nom: string;
  url: string | null;
  storage_path: string | null;
  essai_ref: string | null;
  meta: Record<string, unknown> | null;
  uploaded_by: string | null;
  created_at: string;
}

export function usePiecesJointes(rapportId?: string | null) {
  return useQuery({
    queryKey: ["rapport_pieces_jointes", rapportId],
    enabled: !!rapportId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rapport_pieces_jointes")
        .select("*")
        .eq("rapport_id", rapportId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PieceJointe[];
    },
  });
}

function detectType(file: File): PieceJointeType {
  const n = file.name.toLowerCase();
  if (file.type.startsWith("image/")) return "photo";
  if (n.endsWith(".pdf")) return "pdf";
  if (n.endsWith(".doc") || n.endsWith(".docx")) return "document";
  if (n.endsWith(".xls") || n.endsWith(".xlsx") || n.endsWith(".csv")) return "essai";
  return "autre";
}

export function useUploadPieceJointe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ rapportId, file }: { rapportId: string; file: File }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id ?? null;
      const type = detectType(file);
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${rapportId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      await DocumentRepository.uploadRapportPiece(path, file, { upsert: false, contentType: file.type || undefined });
      const signedUrl = await DocumentRepository.signedRapportUrl(path, 60 * 60 * 24 * 7);
      const payload = {
        rapport_id: rapportId,
        type,
        nom: file.name,
        storage_path: path,
        url: signedUrl,
        uploaded_by: uid,
        meta: { size: file.size, mime: file.type },
      } as never;
      const { data, error } = await supabase
        .from("rapport_pieces_jointes")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as PieceJointe;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["rapport_pieces_jointes", data.rapport_id] });
    },
  });
}

export function useDeletePieceJointe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (piece: PieceJointe) => {
      if (piece.storage_path) {
        await DocumentRepository.deleteRapportPiece(piece.storage_path);
      }
      const { error } = await supabase
        .from("rapport_pieces_jointes")
        .delete()
        .eq("id", piece.id);
      if (error) throw error;
      return piece;
    },
    onSuccess: (piece) => {
      qc.invalidateQueries({ queryKey: ["rapport_pieces_jointes", piece.rapport_id] });
    },
  });
}

// ------- Contexte automatique chantier -------
export interface ContexteAuto {
  client_id: string | null;
  client_nom: string | null;
  chantier_id: string | null;
  chantier_nom: string | null;
  entreprise: string | null;
  projet: string | null;
  materiaux: string[];
  formulations: Array<{ id: string; nom: string; resistance_28j: number | null }>;
  essais_disponibles: Array<{ type: string; count: number }>;
}

export function useContexteChantier(chantierId?: string | null) {
  return useQuery({
    queryKey: ["rapport_contexte_chantier", chantierId],
    enabled: !!chantierId,
    queryFn: async (): Promise<ContexteAuto> => {
      const [chantierRes, formulationsRes, compressionRes] = await Promise.all([
        supabase.from("chantiers").select("*, clients(id, nom, representant)").eq("id", chantierId!).maybeSingle(),
        supabase.from("formulations").select("id, nom, resistance_28j").eq("chantier_id", chantierId!),
        supabase.from("echantillons_compression").select("id", { count: "exact", head: true }).eq("chantier_id", chantierId!),
      ]);
      const chantier = chantierRes.data as { nom?: string; description?: string; clients?: { id: string; nom: string; representant?: string } | null } | null;
      const formulations = (formulationsRes.data ?? []) as Array<{ id: string; nom: string; resistance_28j: number | null }>;
      const materiauxSet = new Set<string>();
      formulations.forEach((f) => f.nom && materiauxSet.add(f.nom));
      const essais: Array<{ type: string; count: number }> = [];
      if (compressionRes.count && compressionRes.count > 0) essais.push({ type: "Compression béton", count: compressionRes.count });
      return {
        client_id: chantier?.clients?.id ?? null,
        client_nom: chantier?.clients?.nom ?? null,
        chantier_id: chantierId!,
        chantier_nom: chantier?.nom ?? null,
        entreprise: chantier?.clients?.representant ?? chantier?.clients?.nom ?? null,
        projet: chantier?.description ?? chantier?.nom ?? null,
        materiaux: Array.from(materiauxSet),
        formulations,
        essais_disponibles: essais,
      };
    },
  });
}

