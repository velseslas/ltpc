import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getAIProvider } from "@/lib/ai/aiProvider";

export function useAnalyzeRapport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rapportId: string) => getAIProvider().analyzeProblem(rapportId),
    onSuccess: (_d, rapportId) => {
      qc.invalidateQueries({ queryKey: ["rapports_techniques", rapportId] });
      qc.invalidateQueries({ queryKey: ["rapport_questions_ia", rapportId] });
    },
  });
}

export function useGenerateAIQuestions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rapportId: string) => getAIProvider().generateQuestions(rapportId),
    onSuccess: (_d, rapportId) => qc.invalidateQueries({ queryKey: ["rapport_questions_ia", rapportId] }),
  });
}

export function useGenerateDraftReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rapportId: string) => getAIProvider().generateDraftReport(rapportId),
    onSuccess: (_d, rapportId) => qc.invalidateQueries({ queryKey: ["rapports_techniques", rapportId] }),
  });
}

export interface AIQuestionRow {
  id: string;
  rapport_id: string;
  question: string;
  ordre: number;
  reponse_utilisateur: string | null;
  repondu_at: string | null;
  meta: Record<string, unknown> | null;
}

export function useAIQuestions(rapportId?: string | null) {
  return useQuery({
    queryKey: ["rapport_questions_ia", rapportId],
    enabled: !!rapportId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rapport_questions_ia")
        .select("*")
        .eq("rapport_id", rapportId!)
        .order("ordre", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as AIQuestionRow[];
    },
  });
}

export function useAnswerAIQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reponse, rapportId }: { id: string; reponse: string; rapportId: string }) => {
      const { error } = await supabase
        .from("rapport_questions_ia")
        .update({ reponse_utilisateur: reponse, repondu_at: new Date().toISOString() } as never)
        .eq("id", id);
      if (error) throw error;
      return { id, rapportId };
    },
    onSuccess: ({ rapportId }) => qc.invalidateQueries({ queryKey: ["rapport_questions_ia", rapportId] }),
  });
}
