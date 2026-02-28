import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Intervenant = Tables<"intervenants">;
export type IntervenantInsert = TablesInsert<"intervenants">;
export type IntervenantUpdate = TablesUpdate<"intervenants">;

export type IntervenantWithPoste = Intervenant & {
  postes: { id: string; nom: string } | null;
};

export function useIntervenants() {
  return useQuery({
    queryKey: ["intervenants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("intervenants")
        .select(`
          *,
          postes(id, nom)
        `)
        .order("nom", { ascending: true });
      
      if (error) throw error;
      return data as IntervenantWithPoste[];
    },
  });
}

export function useIntervenant(id: string) {
  return useQuery({
    queryKey: ["intervenants", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("intervenants")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateIntervenant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (intervenant: IntervenantInsert) => {
      const { data, error } = await supabase
        .from("intervenants")
        .insert(intervenant)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intervenants"] });
    },
  });
}

export function useUpdateIntervenant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: IntervenantUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("intervenants")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intervenants"] });
    },
  });
}

export function useDeleteIntervenant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("intervenants")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intervenants"] });
    },
  });
}

export function useIntervenantsStats() {
  return useQuery({
    queryKey: ["intervenants-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("intervenants")
        .select("statut");
      
      if (error) throw error;
      
      return {
        total: data.length,
        active: data.filter(i => i.statut === "active").length,
        mission: data.filter(i => i.statut === "mission").length,
        inactive: data.filter(i => i.statut === "inactive").length,
      };
    },
  });
}
