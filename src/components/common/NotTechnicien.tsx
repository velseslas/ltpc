import { ReactNode } from "react";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";

/**
 * Affiche son contenu uniquement si l'utilisateur N'EST PAS technicien
 * (ni lecteur/operateur). Visible pour super_admin, admin, manager.
 * Utilisé pour masquer les actions de suppression aux techniciens.
 */
export function NotTechnicien({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { data: role } = useCurrentUserRole();
  const allowed = role === "super_admin" || role === "admin" || role === "manager";
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
