// Phase 3-ter — Migré vers BaseRepository (via getRepositoryForTable).
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { getRepositoryForTable } from "@/lib/repositories/registry";

export type Essai = Tables<"essais">;
export type EssaiInsert = TablesInsert<"essais">;
export type EssaiUpdate = TablesUpdate<"essais">;

export type EssaiWithRelations = Essai & {
  clients: Tables<"clients"> | null;
  intervenants: Tables<"intervenants"> | null;
  materiel: Tables<"materiel"> | null;
};

const FULL_SELECT = `
  *,
  clients(*),
  intervenants(id, nom, prenom, email, telephone, role, departement, statut, date_embauche, poste_id, specialite, signature_url, created_at, updated_at),
  materiel(*)
`;

function repo() {
  return getRepositoryForTable<EssaiWithRelations>("essais", {
    defaultSelect: FULL_SELECT,
    defaultOrder: { column: "created_at", ascending: false },
  });
}

export function useEssais() {
  return useQuery({
    queryKey: ["essais"],
    queryFn: async () => {
      const { data } = await repo().list();
      return data;
    },
  });
}

export function useEssai(id: string) {
  return useQuery({
    queryKey: ["essais", id],
    queryFn: async () => {
      const { data } = await repo().getById(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateEssai() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (essai: EssaiInsert) => {
      const { data, error } = await repo().insert(essai as unknown as Partial<EssaiWithRelations>);
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["essais"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUpdateEssai() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: EssaiUpdate & { id: string }) => {
      const { data, error } = await repo().update(updates as unknown as Partial<EssaiWithRelations>, { id });
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["essais"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteEssai() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await repo().delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["essais"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useEssaisStats() {
  return useQuery({
    queryKey: ["essais-stats"],
    queryFn: async () => {
      const r = getRepositoryForTable<{ statut: string }>("essais", { defaultSelect: "statut" });
      const { data } = await r.list();
      return {
        total: data.length,
        pending: data.filter(e => e.statut === "pending").length,
        inProgress: data.filter(e => e.statut === "in-progress").length,
        completed: data.filter(e => e.statut === "completed").length,
        cancelled: data.filter(e => e.statut === "cancelled").length,
      };
    },
  });
}
