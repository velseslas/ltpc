import { useEffect } from "react";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { useCurrentIntervenant } from "@/hooks/useCurrentIntervenant";

/**
 * For technician users: auto-fills the operateur field with their own intervenant id
 * and signals that the field should be locked (read-only).
 *
 * Usage:
 *   const { isLocked, intervenant } = useTechnicianOperateurLock(operateurId, setOperateurId);
 *   // Pass `disabled={isLocked}` to the Select.
 */
export function useTechnicianOperateurLock(
  currentValue: string,
  setValue: (id: string) => void,
) {
  const { data: role } = useCurrentUserRole();
  const { data: intervenant } = useCurrentIntervenant();

  const isTechnician = role === "technicien" || role === "operateur";
  const isLocked = Boolean(isTechnician && intervenant?.id);

  useEffect(() => {
    if (isLocked && intervenant?.id && currentValue !== intervenant.id) {
      setValue(intervenant.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocked, intervenant?.id]);

  return { isLocked, intervenant, isTechnician };
}
