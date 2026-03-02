import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePrixEssais() {
  return useQuery({
    queryKey: ["prix-essais"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("prix_essais")
        .select("*")
        .order("categorie", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePrixEssai() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await (supabase as any).from("prix_essais").insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prix-essais"] }),
  });
}

export function useUpdatePrixEssai() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...item }: any) => {
      const { data, error } = await (supabase as any).from("prix_essais").update(item).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prix-essais"] }),
  });
}

export function useDeletePrixEssai() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("prix_essais").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prix-essais"] }),
  });
}
