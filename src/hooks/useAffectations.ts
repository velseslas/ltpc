import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { getRepositoryForTable } from "@/lib/repositories";
import { dispatchNotificationEvent } from "@/lib/notifications/dispatch";


export type Affectation = Tables<"affectations">;
export type AffectationInsert = TablesInsert<"affectations">;
export type AffectationUpdate = TablesUpdate<"affectations">;

const FULL_SELECT = `*, intervenant:intervenants(*), client:clients(*), chantier:chantiers(*)`;
const BY_INT_SELECT = `*, client:clients(*), chantier:chantiers(*)`;

const repo = getRepositoryForTable<Affectation>("affectations", {
  defaultSelect: FULL_SELECT,
  defaultOrder: { column: "created_at", ascending: false },
});
const byIntRepo = getRepositoryForTable<Affectation>("affectations", {
  defaultSelect: BY_INT_SELECT,
  defaultOrder: { column: "date_debut", ascending: false },
});

export function useAffectations() {
  return useQuery({
    queryKey: ["affectations"],
    queryFn: async () => (await repo.list()).data,
  });
}

export function useAffectationsByChantier(chantierId: string) {
  return useQuery({
    queryKey: ["affectations", "chantier", chantierId],
    queryFn: async () => (
      await repo.list({
        select: "id, chantier_id, intervenant_id, statut, date_debut, date_fin",
        filters: { chantier_id: chantierId },
      })
    ).data,
    enabled: !!chantierId,
  });
}

export function useAffectation(id: string) {
  return useQuery({
    queryKey: ["affectations", id],
    queryFn: async () => (await repo.getById(id, FULL_SELECT)).data,
    enabled: !!id,
  });
}

export function useCreateAffectation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (affectation: AffectationInsert) => {
      const { data, error } = await repo.insert(affectation as Partial<Affectation>);
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["affectations"] });
      // LOT 14.2 — événement métier → notification LTPC (in-app + Push).
      // Non bloquant : un échec de notification n'affecte pas l'affectation.
      const id = (created as Affectation | undefined)?.id;
      if (id) void dispatchNotificationEvent("affectation_creee", id);
    },
  });
}


export function useUpdateAffectation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: AffectationUpdate & { id: string }) => {
      const { data, error } = await repo.update(updates as Partial<Affectation>, { id });
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["affectations"] }),
  });
}

export function useDeleteAffectation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await repo.delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["affectations"] }),
  });
}

export function useAffectationsByIntervenant(intervenantId: string) {
  return useQuery({
    queryKey: ["affectations", "intervenant", intervenantId],
    queryFn: async () => (await byIntRepo.list({ filters: { intervenant_id: intervenantId } })).data,
    enabled: !!intervenantId,
  });
}
