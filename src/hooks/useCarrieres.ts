import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Carriere {
  id: string;
  nom: string;
  contact: string | null;
  email: string | null;
  telephone: string | null;
  ville: string | null;
  adresse: string | null;
  type_agregat: string | null;
  created_at: string;
  updated_at: string;
}

export function useCarrieres() {
  return useQuery({
    queryKey: ["carrieres"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("carrieres")
        .select("*")
        .order("nom", { ascending: true });
      
      if (error) throw error;
      return data as Carriere[];
    },
  });
}

export function useCarriere(id: string) {
  return useQuery({
    queryKey: ["carrieres", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("carrieres")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Carriere | null;
    },
    enabled: !!id,
  });
}

export function useCreateCarriere() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (carriere: Omit<Carriere, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("carrieres")
        .insert(carriere)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carrieres"] });
    },
  });
}

export function useUpdateCarriere() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Carriere> & { id: string }) => {
      const { data, error } = await supabase
        .from("carrieres")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carrieres"] });
    },
  });
}

export function useDeleteCarriere() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("carrieres")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carrieres"] });
    },
  });
}
