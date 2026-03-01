import { usePermissionContext } from "@/hooks/usePermissionContext";

export function useCurrentUserRole() {
  const { role, isLoading } = usePermissionContext();
  return { data: role, isLoading };
}
