import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Poste = Tables<"postes">;
export type PosteInsert = TablesInsert<"postes">;
export type PosteUpdate = TablesUpdate<"postes">;

export function usePostes() {
  return useQuery({
    queryKey: ["postes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("postes")
        .select("*")
        .order("nom");

      if (error) throw error;
      return data as Poste[];
    },
  });
}

export function usePoste(id: string) {
  return useQuery({
    queryKey: ["postes", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("postes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Poste;
    },
    enabled: !!id,
  });
}

export function useCreatePoste() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (poste: PosteInsert) => {
      const { data, error } = await supabase
        .from("postes")
        .insert(poste)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postes"] });
    },
  });
}

export function useUpdatePoste() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...poste }: PosteUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("postes")
        .update(poste)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postes"] });
    },
  });
}

export function useDeletePoste() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("postes").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postes"] });
    },
  });
}
