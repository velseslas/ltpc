import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { getRepositoryForTable } from "@/lib/repositories";
import { supabase } from "@/integrations/supabase/client";

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

// Public directory hook — reads from the PII-free view (safe for all authenticated users).
export function useIntervenants() {
  return useQuery({
    queryKey: ["intervenants"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("intervenants_directory")
        .select("*")
        .order("nom", { ascending: true });
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as Array<Record<string, unknown>>;
      // Re-shape into the historical { ..., postes: { id, nom } } contract.
      return rows.map((r) => ({
        ...r,
        postes: r.poste_id
          ? { id: String(r.poste_id), nom: (r.poste_nom as string | null) ?? "" }
          : null,
      })) as unknown as IntervenantWithPoste[];
    },
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
      const { data, error } = await (supabase as any)
        .from("intervenants_directory")
        .select("statut");
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as Array<{ statut: string }>;
      return {
        total: rows.length,
        active: rows.filter((i) => i.statut === "active").length,
        mission: rows.filter((i) => i.statut === "mission").length,
        inactive: rows.filter((i) => i.statut === "inactive").length,
      };
    },
  });
}
