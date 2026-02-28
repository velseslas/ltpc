import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Materiel = Tables<"materiel">;
export type MaterielInsert = TablesInsert<"materiel">;
export type MaterielUpdate = TablesUpdate<"materiel">;

export function useMateriel() {
  return useQuery({
    queryKey: ["materiel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materiel")
        .select("*")
        .order("nom", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useMaterielItem(id: string) {
  return useQuery({
    queryKey: ["materiel", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materiel")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateMateriel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (materiel: MaterielInsert) => {
      const { data, error } = await supabase
        .from("materiel")
        .insert(materiel)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materiel"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUpdateMateriel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: MaterielUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("materiel")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materiel"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteMateriel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("materiel")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materiel"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMaterielStats() {
  return useQuery({
    queryKey: ["materiel-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materiel")
        .select("statut");
      
      if (error) throw error;
      
      return {
        total: data.length,
        operational: data.filter(m => m.statut === "operational").length,
        maintenance: data.filter(m => m.statut === "maintenance").length,
        offline: data.filter(m => m.statut === "offline").length,
      };
    },
  });
}
