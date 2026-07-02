import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { callAIFeature } from "../_shared/ai-provider.ts";
import { SYSTEM_INGENIEUR_LABO } from "../_shared/ai-prompts.ts";
import { logAICall, getUserIdFromReq } from "../_shared/ai-log.ts";

// AI Review — jamais destructive. Retourne des observations que l'ingénieur décide d'appliquer.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { rapport_id } = await req.json();
    if (!rapport_id) return new Response(JSON.stringify({ error: "rapport_id requis" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, key);

    const { data: r } = await admin.from("rapports_techniques").select("*").eq("id", rapport_id).maybeSingle();
    if (!r) return new Response(JSON.stringify({ error: "Rapport introuvable" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const contenu = r.contenu_rapport as Record<string, unknown> | null;
    const editorHtml = (r as { editor_html?: string | null }).editor_html || "";

    const prompt = `Tu es reviewer senior d'un laboratoire. Vérifie le rapport ci-dessous et retourne EXCLUSIVEMENT un JSON:
{
  "score": number (0-100, qualité globale),
  "observations": [
    { "severity": "info"|"warning"|"critique", "category": "section_manquante"|"incoherence"|"contradiction"|"reco_non_justifiee"|"reference_essai_absente"|"style"|"autre", "message": string }
  ]
}
Règles:
- N'invente rien. Ne modifie jamais le rapport.
- Vérifie: sections manquantes (Objet, Contexte, Constatations, Analyse, Conséquences, Recommandations, Conclusion), incohérences internes, informations contradictoires, recommandations insuffisamment justifiées, références d'essais/normes absentes.
- Retourne 0 observation si tout est conforme.

DESCRIPTION INITIALE:
"""
${r.description_probleme}
"""

CONTENU STRUCTURÉ:
${contenu ? JSON.stringify(contenu, null, 2) : "Aucun"}

CONTENU ÉDITEUR (HTML):
"""
${editorHtml.substring(0, 12000)}
"""

Retourne uniquement le JSON.`;

    const userId = getUserIdFromReq(req);
    try {
      const result = await callAIFeature("review", {
        messages: [
          { role: "system", content: SYSTEM_INGENIEUR_LABO },
          { role: "user", content: prompt },
        ],
        responseFormat: "json",
        temperature: 0.2,
      });

      const parsed = (result.parsed ?? {}) as { score?: number; observations?: unknown[] };
      const observations = Array.isArray(parsed.observations) ? parsed.observations : [];
      const score = typeof parsed.score === "number" ? parsed.score : null;

      await admin.from("rapport_ai_reviews").insert({
        rapport_id,
        observations: observations as never,
        score,
        model: result.model,
        duration_ms: result.durationMs,
        tokens_total: result.tokensTotal,
        created_by: userId,
      });
      await logAICall({ rapport_id, operation: "review", provider: result.provider, model: result.model, prompt_system: SYSTEM_INGENIEUR_LABO, prompt_user: prompt, raw_response: result.raw, parsed_json: result.parsed, duration_ms: result.durationMs, tokens_input: result.tokensInput, tokens_output: result.tokensOutput, tokens_total: result.tokensTotal, created_by: userId });

      return new Response(JSON.stringify({ observations, score, meta: { model: result.model, durationMs: result.durationMs, tokensTotal: result.tokensTotal } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await logAICall({ rapport_id, operation: "review", provider: "lovable-ai", model: "google/gemini-2.5-flash", prompt_system: SYSTEM_INGENIEUR_LABO, prompt_user: prompt, status: "error", error: msg, created_by: userId });
      const status = msg.startsWith("AI_RATE_LIMIT") ? 429 : msg.startsWith("AI_CREDITS_EXHAUSTED") ? 402 : 500;
      return new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
