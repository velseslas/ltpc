// Edge function : produit un narratif technique court à partir d'un rapport d'analyse déjà calculé.
// Toutes les données factuelles viennent du client (findings, stats, sources).
// L'IA ne fait que rédiger — jamais inventer de chiffres.
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY manquant");
    const body = await req.json();
    const payload = JSON.stringify({ domain: body.domain, summary: body.summary, findings: body.findings, recommendations: body.recommendations, stats: body.stats }, null, 2).slice(0, 8000);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: body.model ?? "google/gemini-2.5-flash",
        temperature: 0.2,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: "Données du rapport d'analyse :\n```json\n" + payload + "\n```\n\nRédige la synthèse." },
        ],
      }),
    });
    if (res.status === 429) return new Response(JSON.stringify({ error: "Limite atteinte" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (res.status === 402) return new Response(JSON.stringify({ error: "Crédits IA épuisés" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!res.ok) return new Response(JSON.stringify({ error: `AI Gateway ${res.status}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const data = await res.json();
    return new Response(JSON.stringify({ narrative: data?.choices?.[0]?.message?.content ?? "" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
