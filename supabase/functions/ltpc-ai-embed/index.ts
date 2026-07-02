// Génère des embeddings via Lovable AI Gateway.
// Entrée : { texts: string[], model?: string }. Sortie : { embeddings: number[][], model }.
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_MODEL = "google/gemini-embedding-001";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY manquant");
    const body = await req.json().catch(() => ({}));
    const rawTexts: unknown = body?.texts;
    if (!Array.isArray(rawTexts) || rawTexts.length === 0) {
      return new Response(JSON.stringify({ error: "texts requis (array)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const texts = rawTexts.slice(0, 100).map((t) => String(t ?? "").slice(0, 8000)).filter((t) => t.length > 0);
    if (!texts.length) return new Response(JSON.stringify({ embeddings: [], model: DEFAULT_MODEL }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const model = typeof body?.model === "string" ? body.model : DEFAULT_MODEL;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, input: texts }),
    });
    if (res.status === 429) return new Response(JSON.stringify({ error: "Limite atteinte" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (res.status === 402) return new Response(JSON.stringify({ error: "Crédits IA épuisés" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!res.ok) {
      const txt = await res.text();
      return new Response(JSON.stringify({ error: `AI Gateway ${res.status}`, detail: txt.slice(0, 500) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await res.json();
    const embeddings: number[][] = (data?.data ?? []).map((d: { embedding: number[] }) => d.embedding);
    return new Response(JSON.stringify({ embeddings, model }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
