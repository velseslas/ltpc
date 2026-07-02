// Edge function : produit un narratif technique court à partir d'un rapport d'analyse déjà calculé.
// Toutes les données factuelles viennent du client (findings, stats, sources).
// L'IA ne fait que rédiger — jamais inventer de chiffres.
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { callAIFeature } from "../_shared/ai-provider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `Tu es le rédacteur technique du laboratoire LTPC. Tu rédiges en français une synthèse courte (150-250 mots) à partir des faits, statistiques et recommandations fournis. Règles strictes :
- Ne jamais inventer de valeurs. Ne cite que ce qui figure dans les données.
- Utilise un ton d'ingénieur civil, précis, sans emphase commerciale.
- Structure : constat → analyse → actions recommandées.
- Cite les sources au fil du texte avec [ref:<source_type>:<source_id>].`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const payload = JSON.stringify({ domain: body.domain, summary: body.summary, findings: body.findings, recommendations: body.recommendations, stats: body.stats }, null, 2).slice(0, 8000);

    try {
      const result = await callAIFeature("narrative", {
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: "Données du rapport d'analyse :\n```json\n" + payload + "\n```\n\nRédige la synthèse." },
        ],
        temperature: 0.2,
        model: body.model,
      });
      return new Response(JSON.stringify({
        narrative: result.raw,
        meta: { model: result.model, provider: result.provider, durationMs: result.durationMs, tokensTotal: result.tokensTotal, attempts: result.attempts },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const status = msg.startsWith("AI_RATE_LIMIT") ? 429 : msg.startsWith("AI_CREDITS_EXHAUSTED") ? 402 : 500;
      const label = status === 429 ? "Limite atteinte" : status === 402 ? "Crédits IA épuisés" : msg;
      return new Response(JSON.stringify({ error: label }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
