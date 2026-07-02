// Edge function : LTPC AI Copilote — orchestrateur conversationnel.
// Reçoit l'historique + le contexte + les résultats de recherche déjà collectés côté client
// (respect RLS de l'utilisateur), puis appelle Lovable AI Gateway avec un prompt système strict :
// "cite tes sources, ne jamais inventer".
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Tu es LTPC AI, le copilote technique du Laboratoire des Travaux Publics et de la Construction.

RÈGLES ABSOLUES :
1. Tu ne réponds qu'à partir des données internes fournies (résultats de recherche, contexte automatique). Si l'information est absente, tu le dis clairement.
2. Tu cites systématiquement tes sources sous la forme [ref:<source_type>:<source_id>] au fil du texte.
3. Tu donnes un niveau de confiance (0-100 %) à la fin de chaque réponse pertinente.
4. Tu réponds en français, ton professionnel, précis, orienté ingénierie civile / béton / géotechnique.
5. Tu ne divulgues jamais d'informations personnelles hors du strict nécessaire.
6. Tu structures les réponses longues avec des titres markdown courts.

Domaines : rapports techniques, essais béton (compression, traction, permeabilité…), formulations Dreux-Gorisse, granulats, géotechnique, matériel de laboratoire, chantiers, clients, documents officiels.`;

interface Payload {
  conversation_id: string;
  history: { role: "user" | "assistant" | "system"; content: string }[];
  user_query: string;
  context?: Record<string, unknown> | null;
  search_hits?: Array<{ source_type: string; source_id: string; label: string; reference?: string | null; snippet?: string; url?: string | null }>;
  model?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY manquant");

    const body = (await req.json()) as Payload;
    if (!body.user_query || typeof body.user_query !== "string") {
      return new Response(JSON.stringify({ error: "user_query requis" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const model = body.model ?? "google/gemini-2.5-flash";
    const contextBlock = body.context && Object.keys(body.context).length
      ? `\n\n### Contexte automatique de l'utilisateur\n\`\`\`json\n${JSON.stringify(body.context, null, 2).slice(0, 6000)}\n\`\`\``
      : "";

    const hitsBlock = body.search_hits?.length
      ? `\n\n### Résultats de recherche interne (${body.search_hits.length})\n` +
        body.search_hits.slice(0, 40).map((h, i) => `${i + 1}. [ref:${h.source_type}:${h.source_id}] **${h.label}**${h.reference ? " (" + h.reference + ")" : ""} — ${h.snippet ?? ""}`).join("\n")
      : "\n\n_Aucun résultat interne pertinent — indique-le à l'utilisateur._";

    const messages = [
      { role: "system", content: SYSTEM_PROMPT + contextBlock + hitsBlock },
      ...(body.history ?? []).slice(-12),
      { role: "user", content: body.user_query },
    ];

    const started = Date.now();
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, temperature: 0.2 }),
    });

    if (res.status === 429) return new Response(JSON.stringify({ error: "Limite atteinte, réessayez." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (res.status === 402) return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!res.ok) {
      const t = await res.text();
      return new Response(JSON.stringify({ error: `AI Gateway: ${res.status} ${t}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await res.json();
    const answer = data?.choices?.[0]?.message?.content ?? "";
    const durationMs = Date.now() - started;

    // Extraction des citations effectivement utilisées dans la réponse.
    const usedIds = new Set<string>();
    for (const m of String(answer).matchAll(/\[ref:([a-z_]+):([0-9a-f-]{8,})\]/gi)) usedIds.add(`${m[1]}:${m[2]}`);
    const citations = (body.search_hits ?? []).filter((h) => usedIds.has(`${h.source_type}:${h.source_id}`));

    return new Response(JSON.stringify({
      answer,
      citations,
      meta: { model, durationMs, tokensTotal: data?.usage?.total_tokens ?? null },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
