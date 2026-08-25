// Hooks React pour LTPC AI : conversations, messages, contexte, envoi.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ConversationService } from "@/lib/ltpc-ai/ConversationService";
import { AgentOrchestrator } from "@/lib/ltpc-ai/AgentOrchestrator";
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

/** Traduit une erreur technique en message clair pour l'utilisateur. */
function humanizeAIError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("429") || m.includes("rate limit") || m.includes("limite")) {
    return "Limite d'utilisation atteinte (trop de questions en peu de temps). Réessayez dans une minute.";
  }
  if (m.includes("402") || m.includes("credit")) {
    return "Crédits IA épuisés : rechargez les crédits Lovable pour continuer à utiliser LTPC AI.";
  }
  if (m.includes("401") || m.includes("jwt") || m.includes("unauthorized")) {
    return "Session expirée : reconnectez-vous puis relancez votre question.";
  }
  if (m.includes("failed to fetch") || m.includes("network")) {
    return "Connexion au service IA impossible (réseau ou service indisponible). Réessayez.";
  }
  return raw;
}

/** Envoi d'un message : Router → Tools (client) → edge function → persistance. */
export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { conversationId: string; content: string; context?: AIContext | null; debug?: boolean }) => {
      const history = await ConversationService.messages(input.conversationId);
      await ConversationService.addMessage({
        conversation_id: input.conversationId, role: "user", content: input.content,
        citations: [], meta: {},
      });

      // === Agent v1.1 : Router + Tools s'exécutent côté client (RLS naturel) ===
      const agent = await AgentOrchestrator.run(input.content, input.context);
      const toolErrors = agent.tool_results
        .filter((r) => !r.ok && r.error)
        .map((r) => ({ tool: r.tool, error: String(r.error) }));

      const { data, error } = await supabase.functions.invoke("ltpc-ai-chat", {
        body: {
          conversation_id: input.conversationId,
          history: history.map((m) => ({ role: m.role === "tool" ? "assistant" : m.role, content: m.content })),
          user_query: input.content,
          context: input.context?.data ?? null,
          // Nouveau contrat v1.1 : Gemini reçoit UNIQUEMENT des résultats structurés.
          tool_results: agent.tool_results,
          agent_debug: agent.debug,
          citations: agent.citations,
          aggregated_confidence: agent.aggregated_confidence,
          debug: input.debug ?? false,
        },
      });
      if (error) throw new Error(humanizeAIError(error.message));
      if (data?.error) throw new Error(humanizeAIError(String(data.error)));

      const meta = {
        ...(data.meta ?? {}),
        confidence: agent.aggregated_confidence,
        ...(toolErrors.length ? { tool_errors: toolErrors } : {}),
        ...(input.debug ? { debug: data.debug, agent_debug: agent.debug } : {}),
      };

      const assistant = await ConversationService.addMessage({
        conversation_id: input.conversationId,
        role: "assistant",
        content: String(data.answer ?? ""),
        citations: (data.citations ?? agent.citations) as AICitation[],
        meta,
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


