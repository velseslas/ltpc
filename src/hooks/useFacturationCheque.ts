import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";

const SELECT_WITH_CLIENT = "*, clients(id, nom)";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const repo = getRepositoryForTable<any>("paiements_cheque", {
  defaultSelect: SELECT_WITH_CLIENT,
  defaultOrder: { column: "date_emission", ascending: false },
});

export function usePaiementsCheque() {
  return useQuery({
    queryKey: ["paiements-cheque"],
    queryFn: async () => (await repo.list()).data,
  });
}

export function usePaiementCheque(id: string | undefined) {
  return useQuery({
    queryKey: ["paiements-cheque", id],
    enabled: !!id,
    queryFn: async () => (await repo.getById(id!, SELECT_WITH_CLIENT)).data,
  });
}

export function useCreatePaiementCheque() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Record<string, unknown>) => {
      const { data, error } = await repo.insert(item);
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["paiements-cheque"] }),
  });
}

export function useUpdatePaiementCheque() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...item }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await repo.update(item, { id });
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["paiements-cheque"] }),
  });
}

export function useDeletePaiementCheque() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await repo.delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["paiements-cheque"] }),
  });
}
