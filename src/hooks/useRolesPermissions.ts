import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AppRole = 'super_admin' | 'admin' | 'manager' | 'technicien' | 'operateur' | 'lecteur';

export interface Permission {
  id: string;
  code: string;
  nom: string;
  description: string | null;
  module: string;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role: AppRole;
  permission_id: string;
  created_at: string;
  permission?: Permission;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

export interface UserWithRole {
  id: string;
  user_id: string | null;
  email: string;
  nom: string;
  role: AppRole;
  statut: string;
  derniere_connexion: string | null;
}

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: 'Super Administrateur',
  admin: 'Administrateur',
  manager: 'Manager',
  technicien: 'Technicien',
  operateur: 'Opérateur',
  lecteur: 'Lecteur'
};

export const ROLE_COLORS: Record<AppRole, string> = {
  super_admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  admin: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  manager: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  technicien: 'bg-green-500/20 text-green-400 border-green-500/30',
  operateur: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  lecteur: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  super_admin: 'Accès complet à toutes les fonctionnalités, y compris la gestion des rôles',
  admin: 'Accès à toutes les fonctionnalités sauf la gestion des rôles',
  manager: 'Peut gérer les essais, clients, chantiers et valider les rapports',
  technicien: 'Peut créer et modifier les essais, générer des rapports',
  operateur: 'Peut créer des essais et consulter les données',
  lecteur: 'Accès en lecture seule à toutes les données'
};

// Permissions hooks
export function usePermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permissions")
        .select("*")
        .order("module", { ascending: true });
      if (error) throw error;
      return data as Permission[];
    },
  });
}

export function usePermissionsByModule() {
  const { data: permissions, ...rest } = usePermissions();
  
  const groupedPermissions = permissions?.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return { data: groupedPermissions, ...rest };
}

// Role Permissions hooks
export function useRolePermissions(role?: AppRole) {
  return useQuery({
    queryKey: ["role_permissions", role],
    queryFn: async () => {
      let query = supabase
        .from("role_permissions")
        .select(`
          *,
          permission:permissions(*)
        `);
      
      if (role) {
        query = query.eq("role", role);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as (RolePermission & { permission: Permission })[];
    },
  });
}

export function useAllRolePermissions() {
  return useQuery({
    queryKey: ["all_role_permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("role, permission_id");
      if (error) throw error;
      
      // Group by role
      const grouped = data.reduce((acc, rp) => {
        if (!acc[rp.role]) {
          acc[rp.role] = [];
        }
        acc[rp.role].push(rp.permission_id);
        return acc;
      }, {} as Record<AppRole, string[]>);
      
      return grouped;
    },
  });
}

export function useToggleRolePermission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ role, permissionId, hasPermission }: { role: AppRole; permissionId: string; hasPermission: boolean }) => {
      if (hasPermission) {
        // Remove permission
        const { error } = await supabase
          .from("role_permissions")
          .delete()
          .eq("role", role)
          .eq("permission_id", permissionId);
        if (error) throw error;
      } else {
        // Add permission
        const { error } = await supabase
          .from("role_permissions")
          .insert({ role, permission_id: permissionId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role_permissions"] });
      queryClient.invalidateQueries({ queryKey: ["all_role_permissions"] });
      toast.success("Permission mise à jour");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour: " + error.message);
    },
  });
}

// User Roles hooks
export function useUserRoles() {
  return useQuery({
    queryKey: ["user_roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserRole[];
    },
  });
}

export function useUsersWithRoles() {
  return useQuery({
    queryKey: ["users_with_roles"],
    queryFn: async () => {
      // Get users from utilisateurs table
      const { data: users, error: usersError } = await supabase
        .from("utilisateurs")
        .select("*")
        .order("nom", { ascending: true });
      if (usersError) throw usersError;

      // Get user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");
      if (rolesError) throw rolesError;

      // Merge data
      const usersWithRoles = users.map(user => {
        const userRole = roles.find(r => r.user_id === user.user_id);
        return {
          ...user,
          role: userRole?.role || 'lecteur' as AppRole
        };
      });

      return usersWithRoles as UserWithRole[];
    },
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // First, delete existing roles for this user
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      
      // Then insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_roles"] });
      queryClient.invalidateQueries({ queryKey: ["users_with_roles"] });
      toast.success("Rôle attribué avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors de l'attribution: " + error.message);
    },
  });
}

export function useRemoveUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_roles"] });
      queryClient.invalidateQueries({ queryKey: ["users_with_roles"] });
      toast.success("Rôle retiré");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });
}

// Create permission
export function useCreatePermission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (permission: Omit<Permission, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from("permissions")
        .insert(permission)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      toast.success("Permission créée");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });
}

export function useDeletePermission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("permissions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      queryClient.invalidateQueries({ queryKey: ["role_permissions"] });
      toast.success("Permission supprimée");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });
}
