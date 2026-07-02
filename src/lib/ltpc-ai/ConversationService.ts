// ConversationService — CRUD des conversations et messages LTPC AI.
import { supabase } from "@/integrations/supabase/client";
import type { AIConversation, AIMessage, AICitation, AIContext } from "./types";

type Row = Record<string, unknown>;
const toConv = (r: Row): AIConversation => r as unknown as AIConversation;
const toMsg = (r: Row): AIMessage => ({
  ...(r as unknown as AIMessage),
  citations: ((r as { citations?: unknown }).citations as AICitation[] | undefined) ?? [],
  meta: ((r as { meta?: unknown }).meta as AIMessage["meta"] | undefined) ?? {},
});

export const ConversationService = {
  async list(opts: { archived?: boolean; favorite?: boolean } = {}): Promise<AIConversation[]> {
    let q = supabase.from("ai_conversations").select("*").order("last_message_at", { ascending: false });
    if (opts.archived !== undefined) q = q.eq("is_archived", opts.archived);
    if (opts.favorite !== undefined) q = q.eq("is_favorite", opts.favorite);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map((r) => toConv(r as Row));
  },

  async get(id: string): Promise<AIConversation | null> {
    const { data } = await supabase.from("ai_conversations").select("*").eq("id", id).maybeSingle();
    return data ? toConv(data as Row) : null;
  },

  async create(titre = "Nouvelle conversation", contexte: Record<string, unknown> = {}): Promise<AIConversation> {
    const { data: userRes } = await supabase.auth.getUser();
    const user_id = userRes.user?.id;
    if (!user_id) throw new Error("Utilisateur non authentifié");
    const payload = { user_id, titre, contexte } as never;
    const { data, error } = await supabase.from("ai_conversations").insert(payload).select("*").single();
    if (error) throw error;
    return toConv(data as Row);
  },

  async update(id: string, patch: Partial<Pick<AIConversation, "titre" | "is_favorite" | "is_archived" | "contexte">>) {
    const { error } = await supabase.from("ai_conversations").update(patch as never).eq("id", id);
    if (error) throw error;
  },

  async remove(id: string) {
    const { error } = await supabase.from("ai_conversations").delete().eq("id", id);
    if (error) throw error;
  },

  async messages(conversation_id: string): Promise<AIMessage[]> {
    const { data, error } = await supabase.from("ai_messages")
      .select("*").eq("conversation_id", conversation_id).order("created_at");
    if (error) throw error;
    return (data ?? []).map((m) => toMsg(m as Row));
  },

  async addMessage(msg: Omit<AIMessage, "id" | "created_at">): Promise<AIMessage> {
    const payload = {
      conversation_id: msg.conversation_id,
      role: msg.role,
      content: msg.content,
      citations: msg.citations ?? [],
      tool_calls: msg.tool_calls ?? null,
      meta: msg.meta ?? {},
    } as never;
    const { data, error } = await supabase.from("ai_messages").insert(payload).select("*").single();
    if (error) throw error;
    await supabase.from("ai_conversations")
      .update({ last_message_at: new Date().toISOString() } as never)
      .eq("id", msg.conversation_id);
    return toMsg(data as Row);
  },

  async saveContext(conversation_id: string, ctx: AIContext, message_id?: string) {
    const payload = {
      conversation_id,
      message_id: message_id ?? null,
      route: ctx.route,
      entity_type: ctx.entity_type ?? null,
      entity_id: ctx.entity_id ?? null,
      payload: ctx.data ?? {},
    } as never;
    await supabase.from("ai_context_snapshots").insert(payload);
  },
};
