import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

export function useRoleDefinitions() {
  return useQuery({
    queryKey: ["role_definitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_definitions")
        .select("*")
        .order("is_system", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as RoleDefinition[];
    },
  });
}

export function useUpdateRoleDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, label, description, color }: { id: string; label: string; description?: string | null; color?: string | null }) => {
      const patch: Record<string, unknown> = { label };
      if (description !== undefined) patch.description = description;
      if (color !== undefined) patch.color = color;
      const { error } = await supabase.from("role_definitions").update(patch).eq("id", id);
      if (error) throw error;
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
      const { error } = await supabase.from("role_definitions").insert({
        key, label, description: description ?? null, alias_of, color: color ?? null, is_system: false,
      });
      if (error) throw error;
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
      const { error } = await supabase.from("role_definitions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["role_definitions"] });
      toast.success("Rôle supprimé");
    },
    onError: (e: Error) => toast.error("Erreur: " + e.message),
  });
}
