// Journalisation des appels IA dans rapport_ai_calls.
import { createClient } from "npm:@supabase/supabase-js@2";

export interface AILogEntry {
  rapport_id?: string | null;
  operation: string;
  provider: string;
  model: string;
  prompt_system?: string;
  prompt_user?: string;
  raw_response?: string;
  parsed_json?: unknown;
  duration_ms?: number;
  tokens_input?: number;
  tokens_output?: number;
  tokens_total?: number;
  status?: "success" | "error";
  error?: string;
  created_by?: string | null;
}

export async function logAICall(entry: AILogEntry) {
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, key);
    await admin.from("rapport_ai_calls").insert({
      rapport_id: entry.rapport_id ?? null,
      operation: entry.operation,
      provider: entry.provider,
      model: entry.model,
      prompt_system: entry.prompt_system,
      prompt_user: entry.prompt_user,
      raw_response: entry.raw_response,
      parsed_json: entry.parsed_json as never,
      duration_ms: entry.duration_ms,
      tokens_input: entry.tokens_input,
      tokens_output: entry.tokens_output,
      tokens_total: entry.tokens_total,
      status: entry.status ?? "success",
      error: entry.error,
      created_by: entry.created_by ?? null,
    });
  } catch (e) {
    console.error("logAICall failed", e);
  }
}

export function getUserIdFromReq(req: Request): string | null {
  try {
    const auth = req.headers.get("Authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub ?? null;
  } catch { return null; }
}
