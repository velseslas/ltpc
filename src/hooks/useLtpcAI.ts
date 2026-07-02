// Hooks React pour LTPC AI : conversations, messages, contexte, envoi.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ConversationService } from "@/lib/ltpc-ai/ConversationService";
import { SearchService } from "@/lib/ltpc-ai/SearchService";
import { ContextService } from "@/lib/ltpc-ai/ContextService";
import type { AIContext, AIMessage, AICitation } from "@/lib/ltpc-ai/types";

export function useConversations(filter: "active" | "favorite" | "archived" = "active") {
  return useQuery({
    queryKey: ["ai-conversations", filter],
    queryFn: () => {
      if (filter === "favorite") return ConversationService.list({ favorite: true, archived: false });
      if (filter === "archived") return ConversationService.list({ archived: true });
      return ConversationService.list({ archived: false });
    },
  });
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["ai-messages", conversationId],
    queryFn: () => (conversationId ? ConversationService.messages(conversationId) : Promise.resolve<AIMessage[]>([])),
    enabled: !!conversationId,
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (titre?: string) => ConversationService.create(titre),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-conversations"] }),
  });
}

export function useUpdateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof ConversationService.update>[1] }) =>
      ConversationService.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-conversations"] }),
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ConversationService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-conversations"] }),
  });
}

/** Contexte automatique dérivé de la route courante. */
export function useCurrentContext(): { context: AIContext | null; loading: boolean } {
  const { pathname } = useLocation();
  const [context, setContext] = useState<AIContext | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    ContextService.fromRoute(pathname).then((c) => { if (alive) { setContext(c); setLoading(false); } });
    return () => { alive = false; };
  }, [pathname]);
  return { context, loading };
}

/** Envoi d'un message : recherche interne → edge function → persistance messages user+assistant. */
export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { conversationId: string; content: string; context?: AIContext | null }) => {
      const history = await ConversationService.messages(input.conversationId);
      await ConversationService.addMessage({
        conversation_id: input.conversationId, role: "user", content: input.content,
        citations: [], meta: {},
      });

      const hits = await SearchService.searchAll(input.content, { limitPerDomain: 4 });

      const { data, error } = await supabase.functions.invoke("ltpc-ai-chat", {
        body: {
          conversation_id: input.conversationId,
          history: history.map((m) => ({ role: m.role === "tool" ? "assistant" : m.role, content: m.content })),
          user_query: input.content,
          context: input.context?.data ?? null,
          search_hits: hits,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(String(data.error));

      const assistant = await ConversationService.addMessage({
        conversation_id: input.conversationId,
        role: "assistant",
        content: String(data.answer ?? ""),
        citations: (data.citations ?? []) as AICitation[],
        meta: data.meta ?? {},
      });

      if (input.context) await ConversationService.saveContext(input.conversationId, input.context, assistant.id);
      return assistant;
    },
    onSuccess: (_a, vars) => {
      qc.invalidateQueries({ queryKey: ["ai-messages", vars.conversationId] });
      qc.invalidateQueries({ queryKey: ["ai-conversations"] });
    },
  });
}
