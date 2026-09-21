import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";

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

const repo = getRepositoryForTable<Adjuvant>("adjuvants", {
  defaultOrder: { column: "nom", ascending: true },
});

export function useAdjuvants() {
  return useQuery({
    queryKey: ["adjuvants"],
    queryFn: async () => {
      const { data } = await repo.list();
      return data;
    },
  });
}

export function useAdjuvant(id: string) {
  return useQuery({
    queryKey: ["adjuvants", id],
    queryFn: async () => {
      const { data } = await repo.getById(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateAdjuvant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (adjuvant: Omit<Adjuvant, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await repo.insert(adjuvant as Partial<Adjuvant>);
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adjuvants"] });
      queryClient.invalidateQueries({ queryKey: ["formulation-details"] }); },
  });
}

export function useUpdateAdjuvant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Adjuvant> & { id: string }) => {
      const { data, error } = await repo.update(updates, { id });
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adjuvants"] });
      queryClient.invalidateQueries({ queryKey: ["formulation-details"] }); },
  });
}

export function useDeleteAdjuvant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await repo.delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adjuvants"] });
      queryClient.invalidateQueries({ queryKey: ["formulation-details"] }); },
  });
}
