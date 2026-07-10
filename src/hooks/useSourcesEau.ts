import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";

export interface SourceEau {
  id: string;
  nom: string;
  contact: string | null;
  email: string | null;
  telephone: string | null;
  ville: string | null;
  adresse: string | null;
  debit: string | null;
  created_at: string;
  updated_at: string;
}

const repo = getRepositoryForTable<SourceEau>("sources_eau", {
  defaultOrder: { column: "nom", ascending: true },
});

export function useSourcesEau() {
  return useQuery({
    queryKey: ["sources_eau"],
    queryFn: async () => (await repo.list()).data,
  });
}

export function useSourceEau(id: string) {
  return useQuery({
    queryKey: ["sources_eau", id],
    queryFn: async () => (await repo.getById(id)).data,
    enabled: !!id,
  });
}

export function useCreateSourceEau() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sourceEau: Omit<SourceEau, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await repo.insert(sourceEau as Partial<SourceEau>);
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sources_eau"] }),
  });
}

export function useUpdateSourceEau() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SourceEau> & { id: string }) => {
      const { data, error } = await repo.update(updates, { id });
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sources_eau"] }),
  });
}

export function useDeleteSourceEau() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await repo.delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sources_eau"] }),
  });
}
