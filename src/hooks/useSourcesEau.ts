import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SourceEau {
  id: string;
  nom: string;
  contact: string | null;
  email: string | null;
  telephone: string | null;
  ville: string | null;
  adresse: string | null;
  debit: string | null;
  created_at: string;
  updated_at: string;
}

export function useSourcesEau() {
  return useQuery({
    queryKey: ["sources_eau"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sources_eau")
        .select("*")
        .order("nom", { ascending: true });
      
      if (error) throw error;
      return data as SourceEau[];
    },
  });
}

export function useSourceEau(id: string) {
  return useQuery({
    queryKey: ["sources_eau", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sources_eau")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data as SourceEau | null;
    },
    enabled: !!id,
  });
}

export function useCreateSourceEau() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sourceEau: Omit<SourceEau, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("sources_eau")
        .insert(sourceEau)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources_eau"] });
    },
  });
}

export function useUpdateSourceEau() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SourceEau> & { id: string }) => {
      const { data, error } = await supabase
        .from("sources_eau")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources_eau"] });
    },
  });
}

export function useDeleteSourceEau() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sources_eau")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources_eau"] });
    },
  });
}
