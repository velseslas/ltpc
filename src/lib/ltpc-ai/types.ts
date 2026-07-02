// Types partagés du copilote LTPC AI.
export type AIRole = "user" | "assistant" | "tool" | "system";

export interface AICitation {
  source_type: string;      // "rapport_technique" | "essai_compression" | "formulation" | "chantier" | ...
  source_id: string;
  label: string;
  reference?: string | null; // ex. "RAPP-2026-0012"
  url?: string | null;       // lien in-app
  snippet?: string | null;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: AIRole;
  content: string;
  citations: AICitation[];
  tool_calls?: unknown;
  meta: { model?: string; tokens?: number; tokensTotal?: number | null; durationMs?: number; confidence?: number; debug?: unknown; search_debug?: unknown };
  created_at: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  titre: string;
  is_favorite: boolean;
  is_archived: boolean;
  contexte: Record<string, unknown>;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface AISearchHit {
  source_type: string;
  source_id: string;
  label: string;
  reference?: string | null;
  snippet: string;
  url?: string | null;
  score?: number;
}

export interface AISearchDebug {
  original_query: string;
  keywords: string[];
  intents: string[];
  domains_searched: string[];
  hits_per_domain: Record<string, number>;
  totals_per_domain: Record<string, number>;
  errors: Array<{ domain: string; message: string }>;
}

export interface AIContext {
  route: string;
  entity_type?: string;
  entity_id?: string;
  data: Record<string, unknown>;
}
