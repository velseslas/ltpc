import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Adjuvant {
  id: string;
  nom: string;
  contact: string | null;
  email: string | null;
  telephone: string | null;
  ville: string | null;
  adresse: string | null;
  produits: string | null;
  created_at: string;
  updated_at: string;
}

export function useAdjuvants() {
  return useQuery({
    queryKey: ["adjuvants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("adjuvants")
        .select("*")
        .order("nom", { ascending: true });
      
      if (error) throw error;
      return data as Adjuvant[];
    },
  });
}

export function useAdjuvant(id: string) {
  return useQuery({
    queryKey: ["adjuvants", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("adjuvants")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Adjuvant | null;
    },
    enabled: !!id,
  });
}

export function useCreateAdjuvant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (adjuvant: Omit<Adjuvant, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("adjuvants")
        .insert(adjuvant)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjuvants"] });
    },
  });
}

export function useUpdateAdjuvant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Adjuvant> & { id: string }) => {
      const { data, error } = await supabase
        .from("adjuvants")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjuvants"] });
    },
  });
}

export function useDeleteAdjuvant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("adjuvants")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjuvants"] });
    },
  });
}
