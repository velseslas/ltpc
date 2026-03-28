import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMaitresOeuvre() {
  return useQuery({
    queryKey: ["maitres-oeuvre"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("maitres_oeuvre")
        .select("*")
        .order("nom", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useMaitreOeuvre(id?: string) {
  return useQuery({
    queryKey: ["maitres-oeuvre", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("maitres_oeuvre")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateMaitreOeuvre() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await (supabase as any).from("maitres_oeuvre").insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maitres-oeuvre"] }),
  });
}

export function useUpdateMaitreOeuvre() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...item }: any) => {
      const { data, error } = await (supabase as any).from("maitres_oeuvre").update(item).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maitres-oeuvre"] }),
  });
}

export function useDeleteMaitreOeuvre() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("maitres_oeuvre").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maitres-oeuvre"] }),
  });
}
