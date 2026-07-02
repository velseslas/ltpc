import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  materiau: string | null;
  date_probleme: string | null;
  statut: RapportStatut;
  analyse_ia: Record<string, unknown> | null;
  gravite: RapportGravite | null;
  contenu_rapport: Record<string, unknown> | null;
  version: number;
  technicien_id: string | null;
  ingenieur_id: string | null;
  soumis_at: string | null;
  valide_at: string | null;
  refuse_at: string | null;
  motif_refus: string | null;
  pdf_url: string | null;
  qr_token: string | null;
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
        .update(updates)
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
