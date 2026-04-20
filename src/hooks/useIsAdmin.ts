import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";

export function useIsAdmin(): boolean {
  const { data: role } = useCurrentUserRole();
  return role === "admin" || role === "super_admin";
}
