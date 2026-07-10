import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const repo = getRepositoryForTable<any>("maitres_ouvrage", {
  defaultOrder: { column: "nom", ascending: true },
});

export function useMaitresOuvrage() {
  return useQuery({
    queryKey: ["maitres-ouvrage"],
    queryFn: async () => (await repo.list()).data,
  });
}

export function useMaitreOuvrage(id?: string) {
  return useQuery({
    queryKey: ["maitres-ouvrage", id],
    queryFn: async () => (await repo.getById(id!)).data,
    enabled: !!id,
  });
}

export function useCreateMaitreOuvrage() {
  const qc = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (item: any) => {
      const { data, error } = await repo.insert(item);
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maitres-ouvrage"] }),
  });
}

export function useUpdateMaitreOuvrage() {
  const qc = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async ({ id, ...item }: any) => {
      const { data, error } = await repo.update(item, { id });
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maitres-ouvrage"] }),
  });
}

export function useDeleteMaitreOuvrage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await repo.delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maitres-ouvrage"] }),
  });
}
