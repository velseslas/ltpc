import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Essai = Tables<"essais">;
export type EssaiInsert = TablesInsert<"essais">;
export type EssaiUpdate = TablesUpdate<"essais">;

export type EssaiWithRelations = Essai & {
  clients: Tables<"clients"> | null;
  intervenants: Tables<"intervenants"> | null;
  materiel: Tables<"materiel"> | null;
};

export function useEssais() {
  return useQuery({
    queryKey: ["essais"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("essais")
        .select(`
          *,
          clients(*),
          intervenants(*),
          materiel(*)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as EssaiWithRelations[];
    },
  });
}

export function useEssai(id: string) {
  return useQuery({
    queryKey: ["essais", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("essais")
        .select(`
          *,
          clients(*),
          intervenants(*),
          materiel(*)
        `)
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data as EssaiWithRelations | null;
    },
    enabled: !!id,
  });
}

export function useCreateEssai() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (essai: EssaiInsert) => {
      const { data, error } = await supabase
        .from("essais")
        .insert(essai)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["essais"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUpdateEssai() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: EssaiUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("essais")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["essais"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteEssai() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("essais")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["essais"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useEssaisStats() {
  return useQuery({
    queryKey: ["essais-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("essais")
        .select("statut");
      
      if (error) throw error;
      
      const stats = {
        total: data.length,
        pending: data.filter(e => e.statut === "pending").length,
        inProgress: data.filter(e => e.statut === "in-progress").length,
        completed: data.filter(e => e.statut === "completed").length,
        cancelled: data.filter(e => e.statut === "cancelled").length,
      };
      
      return stats;
    },
  });
}
