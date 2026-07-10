import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";

export interface Produit {
  id: string;
  nom: string;
  densite: number | null;
  producteur_id: string;
  producteur_type: string;
  created_at: string;
  updated_at: string;
}

const repo = getRepositoryForTable<Produit>("produits", {
  defaultOrder: { column: "nom", ascending: true },
});

export function useProduits(producteurId: string, producteurType: string) {
  return useQuery({
    queryKey: ["produits", producteurId, producteurType],
    queryFn: async () => {
      const { data } = await repo.list({
        filters: { producteur_id: producteurId, producteur_type: producteurType },
      });
      return data;
    },
    enabled: !!producteurId && !!producteurType,
  });
}

export function useCreateProduit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (produit: Omit<Produit, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await repo.insert(produit as Partial<Produit>);
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["produits", variables.producteur_id, variables.producteur_type] });
    },
  });
}

export function useUpdateProduit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, nom, densite, producteurId, producteurType }: { id: string; nom: string; densite?: number | null; producteurId: string; producteurType: string }) => {
      const { data, error } = await repo.update({ nom, densite } as Partial<Produit>, { id });
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["produits", variables.producteurId, variables.producteurType] });
    },
  });
}

export function useDeleteProduit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; producteurId: string; producteurType: string }) => {
      const { error } = await repo.delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["produits", variables.producteurId, variables.producteurType] });
    },
  });
}
