import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { getRepositoryForTable } from "@/lib/repositories";

export type Poste = Tables<"postes">;
export type PosteInsert = TablesInsert<"postes">;
export type PosteUpdate = TablesUpdate<"postes">;

const repo = getRepositoryForTable<Poste>("postes", {
  defaultOrder: { column: "nom", ascending: true },
});

export function usePostes() {
  return useQuery({
    queryKey: ["postes"],
    queryFn: async () => (await repo.list()).data,
  });
}

export function usePoste(id: string) {
  return useQuery({
    queryKey: ["postes", id],
    queryFn: async () => (await repo.getById(id)).data,
    enabled: !!id,
  });
}

export function useCreatePoste() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (poste: PosteInsert) => {
      const { data, error } = await repo.insert(poste as Partial<Poste>);
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["postes"] }),
  });
}

export function useUpdatePoste() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...poste }: PosteUpdate & { id: string }) => {
      const { data, error } = await repo.update(poste as Partial<Poste>, { id });
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["postes"] }),
  });
}

export function useDeletePoste() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await repo.delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["postes"] }),
  });
}
