// Retire immédiatement du cache les notifications (dérivées ET persistantes) liées à un
// enregistrement supprimé, resynchronise le badge/compteur, puis force un refetch réseau.
import type { QueryClient } from "@tanstack/react-query";
import type { Notification } from "@/hooks/useNotifications";
import type { PersistedNotification } from "./types";
import { NotificationRepository } from "./NotificationRepository";

function matchesRecord(n: PersistedNotification, recordId: string): boolean {
  if (n.link?.includes(recordId)) return true;
  try {
    return JSON.stringify(n.data ?? {}).includes(recordId);
  } catch {
    return false;
  }
}

export function purgeDerivedNotifications(queryClient: QueryClient, recordId: string) {
  // 1. Notifications dérivées (calculées côté client)
  queryClient.setQueriesData<Notification[]>({ queryKey: ["notifications"] }, (old) =>
    Array.isArray(old) ? old.filter((n) => !n.id.includes(recordId)) : old
  );

  // 2. Notifications persistantes : retrait du cache + suppression en base
  const removedUnread = new Set<string>();
  queryClient.setQueriesData<PersistedNotification[]>({ queryKey: ["notif-center"] }, (old) => {
    if (!Array.isArray(old)) return old;
    const kept = old.filter((n) => {
      if (!matchesRecord(n, recordId)) return true;
      if (!n.is_read && !n.is_archived) removedUnread.add(n.id);
      else removedUnread.add(`__read__${n.id}`);
      return false;
    });
    return kept.length === old.length ? old : kept;
  });

  const unreadRemoved = [...removedUnread].filter((id) => !id.startsWith("__read__")).length;
  if (unreadRemoved > 0) {
    // 3. Badge / compteur : mise à jour optimiste immédiate
    queryClient.setQueryData<number>(["notif-center-unread"], (old) =>
      typeof old === "number" ? Math.max(0, old - unreadRemoved) : old
    );
  }

  const idsToDelete = [...removedUnread].map((id) => id.replace("__read__", ""));
  if (idsToDelete.length > 0) {
    void Promise.allSettled(idsToDelete.map((id) => NotificationRepository.remove(id))).then(() => {
      queryClient.invalidateQueries({ queryKey: ["notif-center"] });
      queryClient.invalidateQueries({ queryKey: ["notif-center-unread"] });
    });
  }

  // 4. Resynchronisation réseau
  queryClient.invalidateQueries({ queryKey: ["notifications"] });
  queryClient.refetchQueries({ queryKey: ["notifications"], type: "active" });
  queryClient.invalidateQueries({ queryKey: ["notif-center"] });
  queryClient.invalidateQueries({ queryKey: ["notif-center-unread"] });
}
