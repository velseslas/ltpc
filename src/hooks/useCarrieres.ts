import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";

export interface Carriere {
  id: string;
  nom: string;
  contact: string | null;
  email: string | null;
  telephone: string | null;
  ville: string | null;
  adresse: string | null;
  type_agregat: string | null;
  created_at: string;
  updated_at: string;
}

const repo = getRepositoryForTable<Carriere>("carrieres", {
  defaultOrder: { column: "nom", ascending: true },
});

export function useCarrieres() {
  return useQuery({
    queryKey: ["carrieres"],
    queryFn: async () => (await repo.list()).data,
  });
}

export function useCarriere(id: string) {
  return useQuery({
    queryKey: ["carrieres", id],
    queryFn: async () => (await repo.getById(id)).data,
    enabled: !!id,
  });
}

export function useCreateCarriere() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (carriere: Omit<Carriere, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await repo.insert(carriere as Partial<Carriere>);
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["carrieres"] }),
  });
}

export function useUpdateCarriere() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Carriere> & { id: string }) => {
      const { data, error } = await repo.update(updates, { id });
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["carrieres"] }),
  });
}

export function useDeleteCarriere() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await repo.delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["carrieres"] }),
  });
}
