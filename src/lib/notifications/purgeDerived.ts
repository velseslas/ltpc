// Retire immédiatement du cache les notifications dérivées liées à un enregistrement supprimé,
// puis force un refetch réseau pour resynchroniser le centre de notifications.
import type { QueryClient } from "@tanstack/react-query";
import type { Notification } from "@/hooks/useNotifications";

export function purgeDerivedNotifications(queryClient: QueryClient, recordId: string) {
  queryClient.setQueriesData<Notification[]>({ queryKey: ["notifications"] }, (old) =>
    Array.isArray(old) ? old.filter((n) => !n.id.includes(recordId)) : old
  );
  queryClient.invalidateQueries({ queryKey: ["notifications"] });
  queryClient.refetchQueries({ queryKey: ["notifications"], type: "active" });
}
