import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const repo = getRepositoryForTable<any>("prestataires", {
  defaultOrder: { column: "nom", ascending: true },
});
const bcpRepo = getRepositoryForTable<Record<string, unknown>>("bons_commande_prestataire", {
  defaultSelect: "*, prestataires(*)",
  defaultOrder: { column: "created_at", ascending: false },
});

export function usePrestataires() {
  return useQuery({
    queryKey: ["prestataires"],
    queryFn: async () => (await repo.list()).data,
  });
}

export function usePrestataire(id?: string) {
  return useQuery({
    queryKey: ["prestataires", id],
    queryFn: async () => (await repo.getById(id!)).data,
    enabled: !!id,
  });
}

export function useCreatePrestataire() {
  const qc = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (item: any) => {
      const { data, error } = await repo.insert(item);
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prestataires"] }),
  });
}

export function useUpdatePrestataire() {
  const qc = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async ({ id, ...item }: any) => {
      const { data, error } = await repo.update(item, { id });
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prestataires"] }),
  });
}

export function useDeletePrestataire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await repo.delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prestataires"] }),
  });
}

// Bons de commande prestataire
export function useBonsCommandePrestataire() {
  return useQuery({
    queryKey: ["bons-commande-prestataire"],
    queryFn: async () => (await bcpRepo.list()).data,
  });
}

export function useCreateBonCommandePrestataire() {
  const qc = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (item: any) => {
      const { data, error } = await bcpRepo.insert(item);
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bons-commande-prestataire"] }),
  });
}

export function useDeleteBonCommandePrestataire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await bcpRepo.delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bons-commande-prestataire"] }),
  });
}
