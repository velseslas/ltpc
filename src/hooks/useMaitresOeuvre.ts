import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const repo = getRepositoryForTable<any>("maitres_oeuvre", {
  defaultOrder: { column: "nom", ascending: true },
});

export function useMaitresOeuvre() {
  return useQuery({
    queryKey: ["maitres-oeuvre"],
    queryFn: async () => (await repo.list()).data,
  });
}

export function useMaitreOeuvre(id?: string) {
  return useQuery({
    queryKey: ["maitres-oeuvre", id],
    queryFn: async () => (await repo.getById(id!)).data,
    enabled: !!id,
  });
}

export function useCreateMaitreOeuvre() {
  const qc = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (item: any) => {
      const { data, error } = await repo.insert(item);
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maitres-oeuvre"] }),
  });
}

export function useUpdateMaitreOeuvre() {
  const qc = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async ({ id, ...item }: any) => {
      const { data, error } = await repo.update(item, { id });
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maitres-oeuvre"] }),
  });
}

export function useDeleteMaitreOeuvre() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await repo.delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maitres-oeuvre"] }),
  });
}
