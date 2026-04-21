import { ReactNode } from "react";
import { useIsAdmin } from "@/hooks/useIsAdmin";

/**
 * Affiche son contenu uniquement pour les utilisateurs admin/super_admin.
 * Utilisé pour masquer les actions sensibles (suppression, etc.).
 */
export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const isAdmin = useIsAdmin();
  if (!isAdmin) return <>{fallback}</>;
  return <>{children}</>;
}
