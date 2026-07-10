import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { getRepositoryForTable } from "@/lib/repositories";

export type Intervenant = Tables<"intervenants">;
export type IntervenantInsert = TablesInsert<"intervenants">;
export type IntervenantUpdate = TablesUpdate<"intervenants">;

export type IntervenantWithPoste = Intervenant & {
  postes: { id: string; nom: string } | null;
};

const repo = getRepositoryForTable<IntervenantWithPoste>("intervenants", {
  defaultSelect: `*, postes(id, nom)`,
  defaultOrder: { column: "nom", ascending: true },
});
const statsRepo = getRepositoryForTable<{ statut: string }>("intervenants", {
  defaultSelect: "statut",
});

export function useIntervenants() {
  return useQuery({
    queryKey: ["intervenants"],
    queryFn: async () => (await repo.list()).data,
  });
}

export function useIntervenant(id: string) {
  return useQuery({
    queryKey: ["intervenants", id],
    queryFn: async () => (await repo.getById(id, "*")).data,
    enabled: !!id,
  });
}

export function useCreateIntervenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (intervenant: IntervenantInsert) => {
      const { data, error } = await repo.insert(intervenant as Partial<IntervenantWithPoste>);
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["intervenants"] }),
  });
}

export function useUpdateIntervenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: IntervenantUpdate & { id: string }) => {
      const { data, error } = await repo.update(updates as Partial<IntervenantWithPoste>, { id });
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["intervenants"] }),
  });
}

export function useDeleteIntervenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await repo.delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["intervenants"] }),
  });
}

export function useIntervenantsStats() {
  return useQuery({
    queryKey: ["intervenants-stats"],
    queryFn: async () => {
      const { data } = await statsRepo.list();
      return {
        total: data.length,
        active: data.filter(i => i.statut === "active").length,
        mission: data.filter(i => i.statut === "mission").length,
        inactive: data.filter(i => i.statut === "inactive").length,
      };
    },
  });
}
