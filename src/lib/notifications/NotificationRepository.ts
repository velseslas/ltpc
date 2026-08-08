// Phase 9 — Repository unique pour les notifications persistantes.
import { supabase as _supabase } from "@/integrations/supabase/client";
import type { NotificationInput, PersistedNotification, NotificationCategory, NotificationPriority } from "./types";

// Types Supabase régénérés post-migration — cast souple pour tables récentes.
const supabase = _supabase as unknown as {
  from: (t: string) => any;
  auth: typeof _supabase.auth;
  channel: typeof _supabase.channel;
  removeChannel: typeof _supabase.removeChannel;
};

export interface ListFilters {
  category?: NotificationCategory | "all";
  priority?: NotificationPriority | "all";
  unreadOnly?: boolean;
  archived?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export const NotificationRepository = {
  async list(filters: ListFilters = {}): Promise<PersistedNotification[]> {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return [];

    let q = supabase.from("notifications").select("*").eq("user_id", uid);
    if (filters.category && filters.category !== "all") q = q.eq("category", filters.category);
    if (filters.priority && filters.priority !== "all") q = q.eq("priority", filters.priority);
    if (filters.unreadOnly) q = q.eq("is_read", false);
    q = filters.archived ? q.eq("is_archived", true) : q.eq("is_archived", false);
    if (filters.search) q = q.ilike("title", `%${filters.search}%`);
    q = q.order("created_at", { ascending: false })
      .range(filters.offset ?? 0, (filters.offset ?? 0) + (filters.limit ?? 50) - 1);

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as PersistedNotification[];
  },

  async unreadCount(): Promise<number> {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return 0;
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid).eq("is_read", false).eq("is_archived", false);
    return count ?? 0;
  },

  async create(input: NotificationInput): Promise<PersistedNotification | null> {
    const { data: auth } = await supabase.auth.getUser();
    const uid = input.user_id ?? auth.user?.id;
    if (!uid) return null;
    const payload = {
      user_id: uid,
      type: input.type,
      category: input.category ?? "systeme",
      priority: input.priority ?? "info",
      title: input.title,
      message: input.message ?? null,
      icon: input.icon ?? null,
      color: input.color ?? null,
      link: input.link ?? null,
      data: input.data ?? {},
      source: input.source ?? "system",
      role: input.role ?? null,
    };
    const { data, error } = await supabase.from("notifications").insert(payload).select().single();
    if (error) { console.warn("[NotificationRepository] create failed", error); return null; }
    return data as PersistedNotification;
  },

  async markRead(id: string): Promise<void> {
    await supabase.from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() }).eq("id", id);
  },

  /**
   * LOT 15.4 — marque comme lues les notifications `message_recu` d'une
   * conversation donnée (ouverture depuis la cloche, le Push ou l'app).
   */
  async markConversationMessagesRead(conversationId: string): Promise<void> {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid || !conversationId) return;
    await supabase.from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", uid)
      .eq("type", "message_recu")
      .eq("is_read", false)
      .eq("link", `/messagerie/${conversationId}`);
  },

  async markAllRead(): Promise<void> {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return;
    await supabase.from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", uid).eq("is_read", false);
  },

  async archive(id: string): Promise<void> {
    await supabase.from("notifications").update({ is_archived: true }).eq("id", id);
  },

  async remove(id: string): Promise<void> {
    await supabase.from("notifications").delete().eq("id", id);
  },
};
