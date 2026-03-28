import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMaitresOuvrage() {
  return useQuery({
    queryKey: ["maitres-ouvrage"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("maitres_ouvrage")
        .select("*")
        .order("nom", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useMaitreOuvrage(id?: string) {
  return useQuery({
    queryKey: ["maitres-ouvrage", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("maitres_ouvrage")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateMaitreOuvrage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await (supabase as any).from("maitres_ouvrage").insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maitres-ouvrage"] }),
  });
}

export function useUpdateMaitreOuvrage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...item }: any) => {
      const { data, error } = await (supabase as any).from("maitres_ouvrage").update(item).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maitres-ouvrage"] }),
  });
}

export function useDeleteMaitreOuvrage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("maitres_ouvrage").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maitres-ouvrage"] }),
  });
}
