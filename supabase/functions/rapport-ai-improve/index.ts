import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { callAIFeature } from "../_shared/ai-provider.ts";
import { SYSTEM_INGENIEUR_LABO, promptImproveText, type ImproveAction } from "../_shared/ai-prompts.ts";
import { logAICall, getUserIdFromReq } from "../_shared/ai-log.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { rapport_id, texte, action, contexte } = await req.json();
    if (!texte || !action) {
      return new Response(JSON.stringify({ error: "texte et action requis" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const provider = getDefaultProvider();
    const userId = getUserIdFromReq(req);
    const userPrompt = promptImproveText({ texte, action: action as ImproveAction, contexte });

    try {
      const result = await provider.call({
        messages: [
          { role: "system", content: SYSTEM_INGENIEUR_LABO },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
      });
      await logAICall({ rapport_id: rapport_id ?? null, operation: `improve:${action}`, provider: provider.name, model: result.model, prompt_system: SYSTEM_INGENIEUR_LABO, prompt_user: userPrompt, raw_response: result.raw, duration_ms: result.durationMs, tokens_input: result.tokensInput, tokens_output: result.tokensOutput, tokens_total: result.tokensTotal, created_by: userId });
      return new Response(JSON.stringify({ texte: result.raw.trim(), meta: { model: result.model, durationMs: result.durationMs, tokensTotal: result.tokensTotal } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await logAICall({ rapport_id: rapport_id ?? null, operation: `improve:${action}`, provider: "lovable-ai", model: "google/gemini-2.5-flash", prompt_user: userPrompt, status: "error", error: msg, created_by: userId });
      const status = msg.startsWith("AI_RATE_LIMIT") ? 429 : msg.startsWith("AI_CREDITS_EXHAUSTED") ? 402 : 500;
      return new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
