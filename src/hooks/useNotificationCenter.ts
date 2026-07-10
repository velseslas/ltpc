// Phase 9 — Hooks React Query autour du Centre de Notifications persistantes.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NotificationRepository, type ListFilters } from "@/lib/notifications/NotificationRepository";
import { PreferenceService } from "@/lib/notifications/PreferenceService";
import type { NotificationPreferences } from "@/lib/notifications/types";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function usePersistedNotifications(filters: ListFilters = {}) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["notif-center", filters],
    queryFn: () => NotificationRepository.list(filters),
    staleTime: 30_000,
  });

  // Realtime : rafraîchit sur INSERT/UPDATE/DELETE pour l'utilisateur courant.
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid || cancelled) return;
      channel = supabase.channel(`notif-${uid}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` },
          () => qc.invalidateQueries({ queryKey: ["notif-center"] }))
        .subscribe();
    });
    return () => { cancelled = true; if (channel) supabase.removeChannel(channel); };
  }, [qc]);

  return query;
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ["notif-center-unread"],
    queryFn: () => NotificationRepository.unreadCount(),
    staleTime: 15_000,
  });
}

export function useNotificationActions() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["notif-center"] });
    qc.invalidateQueries({ queryKey: ["notif-center-unread"] });
  };
  const markRead    = useMutation({ mutationFn: (id: string) => NotificationRepository.markRead(id),    onSuccess: invalidate });
  const markAllRead = useMutation({ mutationFn: () => NotificationRepository.markAllRead(),             onSuccess: invalidate });
  const archive     = useMutation({ mutationFn: (id: string) => NotificationRepository.archive(id),     onSuccess: invalidate });
  const remove      = useMutation({ mutationFn: (id: string) => NotificationRepository.remove(id),      onSuccess: invalidate });
  return { markRead, markAllRead, archive, remove };
}

export function useNotificationPreferences() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["notif-prefs"],
    queryFn: () => PreferenceService.get(),
    staleTime: 60_000,
  });
  const save = useMutation({
    mutationFn: (patch: Partial<Omit<NotificationPreferences, "user_id">>) => PreferenceService.save(patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notif-prefs"] }),
  });
  return { ...query, save };
}
