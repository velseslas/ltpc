import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";

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

const repo = getRepositoryForTable<CentraleBeton>("centrales_beton", {
  defaultOrder: { column: "nom", ascending: true },
});

export function useCentralesBeton() {
  return useQuery({
    queryKey: ["centrales_beton"],
    queryFn: async () => (await repo.list()).data,
  });
}

export function useCentraleBeton(id: string) {
  return useQuery({
    queryKey: ["centrales_beton", id],
    queryFn: async () => (await repo.getById(id)).data,
    enabled: !!id,
  });
}

export function useCreateCentraleBeton() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (centrale: Omit<CentraleBeton, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await repo.insert(centrale as Partial<CentraleBeton>);
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["centrales_beton"] }),
  });
}

export function useUpdateCentraleBeton() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CentraleBeton> & { id: string }) => {
      const { data, error } = await repo.update(updates, { id });
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["centrales_beton"] }),
  });
}

export function useDeleteCentraleBeton() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await repo.delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["centrales_beton"] }),
  });
}
