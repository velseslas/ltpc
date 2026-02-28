import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Affectation = Tables<"affectations">;
export type AffectationInsert = TablesInsert<"affectations">;
export type AffectationUpdate = TablesUpdate<"affectations">;

export function useAffectations() {
  return useQuery({
    queryKey: ["affectations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affectations")
        .select(`
          *,
          intervenant:intervenants(*),
          client:clients(*),
          chantier:chantiers(*)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useAffectation(id: string) {
  return useQuery({
    queryKey: ["affectations", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affectations")
        .select(`
          *,
          intervenant:intervenants(*),
          client:clients(*),
          chantier:chantiers(*)
        `)
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateAffectation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (affectation: AffectationInsert) => {
      const { data, error } = await supabase
        .from("affectations")
        .insert(affectation)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affectations"] });
    },
  });
}

export function useUpdateAffectation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: AffectationUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("affectations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affectations"] });
    },
  });
}

export function useDeleteAffectation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("affectations")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affectations"] });
    },
  });
}

export function useAffectationsByIntervenant(intervenantId: string) {
  return useQuery({
    queryKey: ["affectations", "intervenant", intervenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affectations")
        .select(`
          *,
          client:clients(*),
          chantier:chantiers(*)
        `)
        .eq("intervenant_id", intervenantId)
        .order("date_debut", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!intervenantId,
  });
}
