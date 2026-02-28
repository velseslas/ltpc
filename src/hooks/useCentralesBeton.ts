import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CentraleBeton {
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

export function useCentralesBeton() {
  return useQuery({
    queryKey: ["centrales_beton"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("centrales_beton")
        .select("*")
        .order("nom", { ascending: true });
      
      if (error) throw error;
      return data as CentraleBeton[];
    },
  });
}

export function useCentraleBeton(id: string) {
  return useQuery({
    queryKey: ["centrales_beton", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("centrales_beton")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data as CentraleBeton | null;
    },
    enabled: !!id,
  });
}

export function useCreateCentraleBeton() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (centrale: Omit<CentraleBeton, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("centrales_beton")
        .insert(centrale)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centrales_beton"] });
    },
  });
}

export function useUpdateCentraleBeton() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CentraleBeton> & { id: string }) => {
      const { data, error } = await supabase
        .from("centrales_beton")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centrales_beton"] });
    },
  });
}

export function useDeleteCentraleBeton() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("centrales_beton")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centrales_beton"] });
    },
  });
}
