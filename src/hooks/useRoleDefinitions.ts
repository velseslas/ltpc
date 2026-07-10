// Phase 3-ter — Migré vers BaseRepository (via getRepositoryForTable).
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getRepositoryForTable } from "@/lib/repositories/registry";
import type { AppRole } from "@/hooks/useRolesPermissions";

export interface RoleDefinition {
  id: string;
  key: string;
  label: string;
  description: string | null;
  color: string | null;
  alias_of: AppRole | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

function repo() {
  return getRepositoryForTable<RoleDefinition>("role_definitions", {
    defaultSelect: "*",
    // Ordre composé (is_system desc, created_at asc) : Repository ne gère qu'un ORDER —
    // on garde le premier tri (is_system desc) et on retrie côté client sur created_at asc.
    defaultOrder: { column: "is_system", ascending: false },
  });
}

export function useRoleDefinitions() {
  return useQuery({
    queryKey: ["role_definitions"],
    queryFn: async () => {
      const { data } = await repo().list();
      // Second tri stable (comme avant): created_at ASC
      return [...data].sort((a, b) => {
        if (a.is_system !== b.is_system) return a.is_system ? -1 : 1;
        return (a.created_at || "").localeCompare(b.created_at || "");
      });
    },
  });
}

export function useUpdateRoleDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, label, description, color }: { id: string; label: string; description?: string | null; color?: string | null }) => {
      const patch: Partial<RoleDefinition> = { label };
      if (description !== undefined) patch.description = description;
      if (color !== undefined) patch.color = color;
      const { error } = await repo().update(patch, { id });
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["role_definitions"] });
      toast.success("Rôle mis à jour");
    },
    onError: (e: Error) => toast.error("Erreur: " + e.message),
  });
}

export function useCreateRoleAlias() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, label, description, alias_of, color }: { key: string; label: string; description?: string | null; alias_of: AppRole; color?: string | null }) => {
      const { error } = await repo().insert({
        key, label, description: description ?? null, alias_of, color: color ?? null, is_system: false,
      } as Partial<RoleDefinition>);
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["role_definitions"] });
      toast.success("Rôle créé");
    },
    onError: (e: Error) => toast.error("Erreur: " + e.message),
  });
}

export function useDeleteRoleDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await repo().delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["role_definitions"] });
      toast.success("Rôle supprimé");
    },
    onError: (e: Error) => toast.error("Erreur: " + e.message),
  });
}
