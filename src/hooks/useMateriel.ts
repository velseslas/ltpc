import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { getRepositoryForTable } from "@/lib/repositories";

export type Materiel = Tables<"materiel">;
export type MaterielInsert = TablesInsert<"materiel">;
export type MaterielUpdate = TablesUpdate<"materiel">;

const repo = getRepositoryForTable<Materiel>("materiel", {
  defaultOrder: { column: "nom", ascending: true },
});
const statsRepo = getRepositoryForTable<{ statut: string }>("materiel", {
  defaultSelect: "statut",
});

export function useMateriel() {
  return useQuery({
    queryKey: ["materiel"],
    queryFn: async () => (await repo.list()).data,
  });
}

export function useMaterielItem(id: string) {
  return useQuery({
    queryKey: ["materiel", id],
    queryFn: async () => (await repo.getById(id)).data,
    enabled: !!id,
  });
}

export function useCreateMateriel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (materiel: MaterielInsert) => {
      const { data, error } = await repo.insert(materiel as Partial<Materiel>);
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materiel"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUpdateMateriel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: MaterielUpdate & { id: string }) => {
      const { data, error } = await repo.update(updates as Partial<Materiel>, { id });
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materiel"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteMateriel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await repo.delete({ id });
      if (error) throw new Error(error);
      return id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["materiel"] });
      purgeDerivedNotifications(qc, id);
    },
  });
}


export function useMaterielStats() {
  return useQuery({
    queryKey: ["materiel-stats"],
    queryFn: async () => {
      const { data } = await statsRepo.list();
      return {
        total: data.length,
        operational: data.filter(m => m.statut === "operational").length,
        maintenance: data.filter(m => m.statut === "maintenance").length,
        offline: data.filter(m => m.statut === "offline").length,
      };
    },
  });
}
