import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { AppRole } from "@/hooks/useRolesPermissions";

interface PermissionContextType {
  role: AppRole | null;
  isLoading: boolean;
  hasPermission: (code: string) => boolean;
  isAdmin: boolean;
  isTechnicien: boolean;
  canAccess: (module: string, action?: string) => boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const isExpiredJwtError = (error: unknown) => {
    const err = error as { code?: string; message?: string } | null;
    return err?.code === "PGRST303" || /jwt expired|token is expired/i.test(err?.message || "");
  };

  const { data: role = null, isLoading: isRoleLoading } = useQuery({
    queryKey: ["current_user_role", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const runQuery = () => supabase.rpc("get_user_role", { _user_id: user.id });

      let { data, error } = await runQuery();
      if (isExpiredJwtError(error)) {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError) {
          ({ data, error } = await runQuery());
        }
      }

      if (error) throw error;
      return data as AppRole | null;
    },
    enabled: !!user?.id,
    retry: (failureCount, error) => isExpiredJwtError(error) && failureCount < 2,
  });

  const { data: userPermissions = [], isLoading: isPermsLoading } = useQuery({
    queryKey: ["current_user_permissions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const runQuery = () => supabase
          .from("role_permissions")
          .select("permission:permissions(code)")
          .eq("role", role!);

      let { data, error } = await runQuery();
      if (isExpiredJwtError(error)) {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError) {
          ({ data, error } = await runQuery());
        }
      }

      if (error) throw error;
      return (data || []).map((rp: any) => rp.permission?.code).filter(Boolean) as string[];
    },
    enabled: !!user?.id && !!role,
    retry: (failureCount, error) => isExpiredJwtError(error) && failureCount < 2,
  });

  const isLoading = isRoleLoading || isPermsLoading;

  const hasPermission = (code: string): boolean => {
    if (!role) return false;
    if (role === "super_admin") return true;
    return userPermissions.includes(code);
  };

  const canAccess = (module: string, action: string = "voir"): boolean => {
    return hasPermission(`${module}.${action}`);
  };

  const isAdmin = role === "super_admin" || role === "admin" || role === "manager";
  const isTechnicien = role === "technicien" || role === "operateur" || role === "lecteur";

  return (
    <PermissionContext.Provider
      value={{ role, isLoading, hasPermission, isAdmin, isTechnicien, canAccess }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissionContext() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error("usePermissionContext must be used within a PermissionProvider");
  }
  return context;
}
