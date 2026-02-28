import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Cimenterie {
  id: string;
  nom: string;
  contact: string | null;
  email: string | null;
  telephone: string | null;
  ville: string | null;
  adresse: string | null;
  capacite: string | null;
  created_at: string;
  updated_at: string;
}

export function useCimenteries() {
  return useQuery({
    queryKey: ["cimenteries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cimenteries")
        .select("*")
        .order("nom", { ascending: true });
      
      if (error) throw error;
      return data as Cimenterie[];
    },
  });
}

export function useCimenterie(id: string) {
  return useQuery({
    queryKey: ["cimenteries", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cimenteries")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Cimenterie | null;
    },
    enabled: !!id,
  });
}

export function useCreateCimenterie() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (cimenterie: Omit<Cimenterie, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("cimenteries")
        .insert(cimenterie)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cimenteries"] });
    },
  });
}

export function useUpdateCimenterie() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Cimenterie> & { id: string }) => {
      const { data, error } = await supabase
        .from("cimenteries")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cimenteries"] });
    },
  });
}

export function useDeleteCimenterie() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cimenteries")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cimenteries"] });
    },
  });
}
