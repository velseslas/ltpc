import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";

export interface Cimenterie {
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

const repo = getRepositoryForTable<Cimenterie>("cimenteries", {
  defaultOrder: { column: "nom", ascending: true },
});

export function useCimenteries() {
  return useQuery({
    queryKey: ["cimenteries"],
    queryFn: async () => (await repo.list()).data,
  });
}

export function useCimenterie(id: string) {
  return useQuery({
    queryKey: ["cimenteries", id],
    queryFn: async () => (await repo.getById(id)).data,
    enabled: !!id,
  });
}

export function useCreateCimenterie() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cimenterie: Omit<Cimenterie, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await repo.insert(cimenterie as Partial<Cimenterie>);
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cimenteries"] }),
  });
}

export function useUpdateCimenterie() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Cimenterie> & { id: string }) => {
      const { data, error } = await repo.update(updates, { id });
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cimenteries"] }),
  });
}

export function useDeleteCimenterie() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await repo.delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cimenteries"] }),
  });
}
