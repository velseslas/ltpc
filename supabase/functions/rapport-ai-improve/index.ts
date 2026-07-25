import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { callAIFeature } from "../_shared/ai-provider.ts";
import { SYSTEM_INGENIEUR_LABO, promptImproveText, type ImproveAction } from "../_shared/ai-prompts.ts";
import { logAICall, getUserIdFromReq } from "../_shared/ai-log.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { retrieveKnowledge, formatKnowledgeBlock, ragSourcesMeta } from "../_shared/rag.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const _rl = await enforceRateLimit(req, { scope: "rapport-ai-improve", userLimit: 20, ipLimit: 40, windowSec: 60 });
  if (_rl) return _rl;
  const _auth = await requireAuth(req);
  if (!_auth.ok) return _auth.response;
  try {
    const { rapport_id, texte, action, contexte } = await req.json();
    if (!texte || !action) {
      return new Response(JSON.stringify({ error: "texte et action requis" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userId = getUserIdFromReq(req);

    // P3/4 — RAG : uniquement pour les actions qui enrichissent le contenu technique.
    // Aucune source n'est injectée « pour remplir » : correction de style/grammaire = pas de RAG.
    let ragSources: unknown[] = [];
    let documents: string | undefined;
    if (action === "plus_technique" || action === "developper") {
      const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const chunks = await retrieveKnowledge(admin, String(texte).slice(0, 2000), {
        topK: 4,
        excludeSourceId: rapport_id ?? undefined,
      });
      if (chunks.length) {
        documents = formatKnowledgeBlock(chunks);
        ragSources = ragSourcesMeta(chunks);
      }
    }

    const userPrompt = promptImproveText({ texte, action: action as ImproveAction, contexte, documents });

    try {
      const result = await callAIFeature("reformulation", {
        messages: [
          { role: "system", content: SYSTEM_INGENIEUR_LABO },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
      });
      await logAICall({ rapport_id: rapport_id ?? null, operation: `improve:${action}`, provider: result.provider, model: result.model, prompt_system: SYSTEM_INGENIEUR_LABO, prompt_user: userPrompt, raw_response: result.raw, duration_ms: result.durationMs, tokens_input: result.tokensInput, tokens_output: result.tokensOutput, tokens_total: result.tokensTotal, created_by: userId, rag_sources: ragSources });
      return new Response(JSON.stringify({ texte: result.raw.trim(), sources: ragSources, meta: { model: result.model, provider: result.provider, durationMs: result.durationMs, tokensTotal: result.tokensTotal, attempts: result.attempts } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
