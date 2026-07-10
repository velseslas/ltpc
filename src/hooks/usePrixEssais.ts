import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const repo = getRepositoryForTable<any>("prix_essais", {
  defaultOrder: { column: "categorie", ascending: true },
});

export function usePrixEssais() {
  return useQuery({
    queryKey: ["prix-essais"],
    queryFn: async () => (await repo.list()).data,
  });
}

export function useCreatePrixEssai() {
  const qc = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (item: any) => {
      const { data, error } = await repo.insert(item);
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prix-essais"] }),
  });
}

export function useUpdatePrixEssai() {
  const qc = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async ({ id, ...item }: any) => {
      const { data, error } = await repo.update(item, { id });
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prix-essais"] }),
  });
}

export function useDeletePrixEssai() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await repo.delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prix-essais"] }),
  });
}
