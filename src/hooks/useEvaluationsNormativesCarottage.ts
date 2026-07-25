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
  carottes: Json;
  statistiques: Json;
  criteres: Json;
  verdict: string | null;
  conclusion: string | null;
  figee: boolean;
  created_by: string | null;
  created_by_nom: string | null;
  created_at: string;
  updated_at: string;
}

export type EvaluationNormativeInsert = Omit<
  EvaluationNormativeRow,
  "id" | "created_at" | "updated_at" | "figee" | "created_by" | "created_by_nom"
> & { figee?: boolean; created_by?: string | null; created_by_nom?: string | null };

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
      return (data ?? []) as EvaluationNormativeRow[];
    },
    enabled: !!echantillonId,
  });
}

export function useCreateEvaluationNormative() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: EvaluationNormativeInsert) => {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id ?? null;
      let nom: string | null = null;
      if (userId) {
        const { data: u } = await supabase
          .from("utilisateurs")
          .select("nom, email")
          .eq("user_id", userId)
          .maybeSingle();
        nom = (u as { nom?: string; email?: string } | null)?.nom ?? (u as { email?: string } | null)?.email ?? null;
      }
      const { data, error } = await supabase
        .from("evaluations_normatives_carottage")
        .insert({ ...payload, created_by: userId, created_by_nom: nom })
        .select()
        .single();
      if (error) throw error;
      return data as EvaluationNormativeRow;
    },
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: ["evaluations-normatives-carottage", row.echantillon_id] });
    },
  });
}
