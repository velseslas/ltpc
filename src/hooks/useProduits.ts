import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Produit {
  id: string;
  nom: string;
  producteur_id: string;
  producteur_type: string;
  created_at: string;
  updated_at: string;
}

export function useProduits(producteurId: string, producteurType: string) {
  return useQuery({
    queryKey: ["produits", producteurId, producteurType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produits")
        .select("*")
        .eq("producteur_id", producteurId)
        .eq("producteur_type", producteurType)
        .order("nom", { ascending: true });
      
      if (error) throw error;
      return data as Produit[];
    },
    enabled: !!producteurId && !!producteurType,
  });
}

export function useCreateProduit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (produit: Omit<Produit, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("produits")
        .insert(produit)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["produits", variables.producteur_id, variables.producteur_type] });
    },
  });
}

export function useUpdateProduit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, nom, producteurId, producteurType }: { id: string; nom: string; producteurId: string; producteurType: string }) => {
      const { data, error } = await supabase
        .from("produits")
        .update({ nom })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["produits", variables.producteurId, variables.producteurType] });
    },
  });
}

export function useDeleteProduit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, producteurId, producteurType }: { id: string; producteurId: string; producteurType: string }) => {
      const { error } = await supabase
        .from("produits")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["produits", variables.producteurId, variables.producteurType] });
    },
  });
}
