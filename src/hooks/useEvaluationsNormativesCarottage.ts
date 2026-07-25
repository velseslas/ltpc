import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface EvaluationNormativeRow {
  id: string;
  echantillon_id: string;
  reference: string | null;
  objectif: string;
  objectif_label: string | null;
  norme_code: string;
  norme_nom: string | null;
  norme_version: string | null;
  norme_date: string | null;
  procedure_code: string | null;
  procedure_label: string | null;
  classe_beton: string | null;
  fck_cyl: number | null;
  fck_cube: number | null;
  dmax: number | null;
  dmax_source: string | null;
  carottes: Json;
  statistiques: Json;
  criteres: Json;
  verdict: string | null;
  conclusion: string | null;
  figee: boolean;
  created_by: string | null;
  created_by_nom: string | null;
  validee_at: string | null;
  validee_par: string | null;
  validee_par_nom: string | null;
  created_at: string;
  updated_at: string;
}

export type EvaluationNormativeInsert = Omit<
  EvaluationNormativeRow,
  | "id"
  | "created_at"
  | "updated_at"
  | "figee"
  | "created_by"
  | "created_by_nom"
  | "validee_at"
  | "validee_par"
  | "validee_par_nom"
> & { figee?: boolean };

async function currentUser() {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id ?? null;
  let nom: string | null = null;
  if (userId) {
    const { data: u } = await supabase
      .from("utilisateurs")
      .select("nom, email")
      .eq("user_id", userId)
      .maybeSingle();
    const rec = u as { nom?: string; email?: string } | null;
    nom = rec?.nom ?? rec?.email ?? null;
  }
  return { userId, nom };
}

export function useEvaluationsNormatives(echantillonId: string) {
  return useQuery({
    queryKey: ["evaluations-normatives-carottage", echantillonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluations_normatives_carottage")
        .select("*")
        .eq("echantillon_id", echantillonId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as EvaluationNormativeRow[];
    },
    enabled: !!echantillonId,
  });
}

/** Création — brouillon par défaut (figee = false) ou évaluation validée. */
export function useCreateEvaluationNormative() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: EvaluationNormativeInsert & { figee?: boolean }) => {
      const { userId, nom } = await currentUser();
      const figee = payload.figee === true;
      const { data, error } = await supabase
        .from("evaluations_normatives_carottage")
        .insert({
          ...payload,
          figee,
          created_by: userId,
          created_by_nom: nom,
          validee_at: figee ? new Date().toISOString() : null,
          validee_par: figee ? userId : null,
          validee_par_nom: figee ? nom : null,
        } as never)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as EvaluationNormativeRow;
    },
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: ["evaluations-normatives-carottage", row.echantillon_id] });
    },
  });
}

/** Mise à jour d'un brouillon (refusée par la RLS si l'évaluation est figée). */
export function useUpdateEvaluationNormative() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      figee,
      ...payload
    }: Partial<EvaluationNormativeInsert> & { id: string; figee?: boolean }) => {
      const { userId, nom } = await currentUser();
      const validation = figee
        ? { figee: true, validee_at: new Date().toISOString(), validee_par: userId, validee_par_nom: nom }
        : {};
      const { data, error } = await supabase
        .from("evaluations_normatives_carottage")
        .update({ ...payload, ...validation } as never)
        .eq("id", id)
        .eq("figee", false)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Évaluation figée ou introuvable — modification refusée");
      return data as unknown as EvaluationNormativeRow;
    },
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: ["evaluations-normatives-carottage", row.echantillon_id] });
    },
  });
}
