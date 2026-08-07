// LOT 15 — Modèle et helpers purs de la messagerie (aucune dépendance réseau).
export const MESSAGE_MAX_LENGTH = 4000;

export interface ConversationSummary {
  id: string;
  type: "direct" | "chantier";
  titre: string | null;
  chantier_id: string | null;
  chantier_nom: string | null;
  other_user_id: string | null;
  other_user_nom: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  unread_count: number;
  is_archived: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  deleted_at: string | null;
}

export interface MessagingUser {
  user_id: string;
  nom: string | null;
  role: string | null;
}

export function conversationLabel(c: ConversationSummary): string {
  if (c.type === "chantier") return c.titre || c.chantier_nom || "Conversation chantier";
  return c.other_user_nom || "Utilisateur";
}

/** Un message est envoyable s'il est non vide après trim et de longueur raisonnable. */
export function isSendableMessage(raw: string): boolean {
  const body = raw.trim();
  return body.length > 0 && body.length <= MESSAGE_MAX_LENGTH;
}

/** Tri : dernier message le plus récent en premier. */
export function sortConversations(list: ConversationSummary[]): ConversationSummary[] {
  return list.slice().sort((a, b) => +new Date(b.last_message_at) - +new Date(a.last_message_at));
}
