// LOT 15 — Messagerie interne LTPC : hooks React Query + Realtime.
import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase as _supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { dispatchNotificationEvent } from "@/lib/notifications/dispatch";

// Types Supabase régénérés après migration — cast souple pour les tables récentes.
const supabase = _supabase as unknown as {
  from: (t: string) => any;
  rpc: (fn: string, args?: Record<string, unknown>) => any;
  auth: typeof _supabase.auth;
  channel: typeof _supabase.channel;
  removeChannel: typeof _supabase.removeChannel;
};

export {
  MESSAGE_MAX_LENGTH,
  conversationLabel,
  isSendableMessage,
  sortConversations,
} from "@/lib/messagerie/model";
export type { ConversationSummary, Message, MessagingUser } from "@/lib/messagerie/model";

import {
  MESSAGE_MAX_LENGTH as MAX_LEN,
  type ConversationSummary,
  type Message,
  type MessagingUser,
} from "@/lib/messagerie/model";
import { buildAudioPath, validateAudioUpload } from "@/lib/messagerie/audio";

const PAGE_SIZE = 30;

/** Liste des conversations (triées : dernier message en premier). */
export function useConversations() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["conversations"],
    queryFn: async (): Promise<ConversationSummary[]> => {
      const { data, error } = await supabase.rpc("list_conversations", { _limit: 50, _offset: 0 });
      if (error) throw error;
      return (data ?? []) as ConversationSummary[];
    },
    enabled: !!user?.id,
    staleTime: 15_000,
  });

  // Realtime : tout nouveau message remonte la conversation.
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("messagerie-conversations")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        qc.invalidateQueries({ queryKey: ["conversations"] });
        qc.invalidateQueries({ queryKey: ["messages-unread-count"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc, user?.id]);

  return query;
}

/** Compteur global de messages non lus (persisté côté base). */
export function useUnreadMessagesCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["messages-unread-count"],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc("unread_messages_count");
      if (error) return 0;
      return (data as number) ?? 0;
    },
    enabled: !!user?.id,
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
}

/** Messages d'une conversation avec chargement progressif (pagination vers le haut). */
export function useMessages(conversationId: string | null) {
  const qc = useQueryClient();
  const [pages, setPages] = useState(1);

  // Réinitialise la pagination au changement de conversation.
  useEffect(() => { setPages(1); }, [conversationId]);

  const limit = PAGE_SIZE * pages;

  const query = useQuery({
    queryKey: ["messages", conversationId, limit],
    queryFn: async (): Promise<Message[]> => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, content, message_type, audio_path, audio_duration, created_at, deleted_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return ((data ?? []) as Message[]).slice().reverse();
    },
    enabled: !!conversationId,
    staleTime: 5_000,
    placeholderData: (prev: Message[] | undefined) => prev,
  });

  const hasMore = (query.data?.length ?? 0) >= limit;
  const loadOlder = useCallback(() => {
    if (!query.isFetching && hasMore) setPages((p) => p + 1);
  }, [query.isFetching, hasMore]);

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messagerie-thread-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        () => qc.invalidateQueries({ queryKey: ["messages", conversationId] })
      )
      // LOT 15.2 — accusés de lecture : même canal, aucun nouveau WebSocket.
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_participants",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => qc.invalidateQueries({ queryKey: ["conversation-read-state", conversationId] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, qc]);

  return { ...query, hasMore, loadOlder, isLoadingOlder: query.isFetching && pages > 1 };
}

/**
 * LOT 15.2 — Date de lecture la plus ancienne parmi les AUTRES participants.
 * Un message envoyé est « lu » (✓✓) si created_at <= cette date.
 */
export function useConversationReadCutoff(conversationId: string | null): string | null {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["conversation-read-state", conversationId],
    queryFn: async (): Promise<string | null> => {
      if (!conversationId || !user?.id) return null;
      const { data, error } = await supabase
        .from("conversation_participants")
        .select("user_id, last_read_at")
        .eq("conversation_id", conversationId);
      if (error) return null;
      const others = ((data ?? []) as { user_id: string; last_read_at: string | null }[])
        .filter((p) => p.user_id !== user.id);
      if (others.length === 0) return null;
      if (others.some((p) => !p.last_read_at)) return null;
      return others
        .map((p) => p.last_read_at as string)
        .reduce((min, d) => (new Date(d) < new Date(min) ? d : min));
    },
    enabled: !!conversationId && !!user?.id,
    staleTime: 5_000,
  });
  return data ?? null;
}


/** Noms des participants (pour l'affichage de l'expéditeur). */
export function useConversationParticipants(conversationId: string | null) {
  return useQuery({
    queryKey: ["conversation-participants", conversationId],
    queryFn: async (): Promise<Record<string, string>> => {
      if (!conversationId) return {};
      const { data, error } = await supabase.rpc("conversation_sender_names", { _conversation_id: conversationId });
      if (error) return {};
      const map: Record<string, string> = {};
      for (const row of (data ?? []) as MessagingUser[]) {
        if (row.user_id) map[row.user_id] = row.nom || "Utilisateur";
      }
      return map;
    },
    enabled: !!conversationId,
    staleTime: 300_000,
  });
}

export function useSearchMessagingUsers(term: string) {
  return useQuery({
    queryKey: ["messaging-users", term],
    queryFn: async (): Promise<MessagingUser[]> => {
      const { data, error } = await supabase.rpc("search_messaging_users", { _q: term });
      if (error) throw error;
      return (data ?? []) as MessagingUser[];
    },
    staleTime: 30_000,
  });
}

export function useMessagerieActions() {
  const qc = useQueryClient();

  const invalidateLists = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["conversations"] });
    qc.invalidateQueries({ queryKey: ["messages-unread-count"] });
  }, [qc]);

  const sendMessage = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      const body = content.trim();
      if (!body) throw new Error("Message vide");
      if (body.length > MAX_LEN) throw new Error("Message trop long");
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Non authentifié");
      const { data, error } = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, sender_id: uid, content: body })
        .select("id")
        .single();
      if (error) throw error;
      return data as { id: string };
    },
    onSuccess: (created, vars) => {
      qc.invalidateQueries({ queryKey: ["messages", vars.conversationId] });
      invalidateLists();
      // Notification in-app persistante pour les autres participants (Push optionnel).
      void dispatchNotificationEvent("message_recu", created.id);
    },
  });
  /** Message vocal : upload Storage privé puis création du message (rollback si échec). */
  const sendVoiceMessage = useMutation({
    mutationFn: async ({ conversationId, blob, duration, mimeType }: {
      conversationId: string; blob: Blob; duration: number; mimeType: string;
    }) => {
      const problem = validateAudioUpload({ mime: mimeType, size: blob.size, duration });
      if (problem) throw new Error(problem);
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Non authentifié");

      const path = buildAudioPath(conversationId, crypto.randomUUID(), mimeType);
      const { error: upErr } = await _supabase.storage
        .from("message-audio")
        .upload(path, blob, { contentType: mimeType.split(";")[0], upsert: false });
      if (upErr) throw new Error("Envoi du vocal impossible : " + upErr.message);

      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: uid,
          message_type: "audio",
          audio_path: path,
          audio_duration: Math.round(duration),
        })
        .select("id")
        .single();
      if (error) {
        // Pas de message incomplet : on supprime le fichier orphelin.
        await _supabase.storage.from("message-audio").remove([path]);
        throw error;
      }
      return data as { id: string };
    },
    onSuccess: (created, vars) => {
      qc.invalidateQueries({ queryKey: ["messages", vars.conversationId] });
      invalidateLists();
      void dispatchNotificationEvent("message_recu", created.id);
    },
  });


  const openDirectConversation = useMutation({
    mutationFn: async (otherUserId: string): Promise<string> => {
      const { data, error } = await supabase.rpc("get_or_create_direct_conversation", { _other_user_id: otherUserId });
      if (error) throw error;
      return data as string;
    },
    onSuccess: invalidateLists,
  });

  const createChantierConversation = useMutation({
    mutationFn: async ({ chantierId, titre, participants }: { chantierId: string; titre?: string; participants?: string[] }) => {
      const { data, error } = await supabase.rpc("create_chantier_conversation", {
        _chantier_id: chantierId,
        _titre: titre ?? null,
        _participants: participants ?? [],
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: invalidateLists,
  });

  const markRead = useMutation({
    mutationFn: async (conversationId: string) => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      await supabase
        .from("conversation_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("user_id", uid);
    },
    onSuccess: invalidateLists,
  });

  const archiveConversation = useMutation({
    mutationFn: async ({ conversationId, archived }: { conversationId: string; archived: boolean }) => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      await supabase
        .from("conversation_participants")
        .update({ is_archived: archived })
        .eq("conversation_id", conversationId)
        .eq("user_id", uid);
    },
    onSuccess: invalidateLists,
  });

  return { sendMessage, sendVoiceMessage, openDirectConversation, createChantierConversation, markRead, archiveConversation };
}
