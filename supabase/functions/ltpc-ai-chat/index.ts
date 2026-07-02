// Edge function : LTPC AI Copilote — orchestrateur conversationnel.
// Reçoit historique + contexte + résultats de recherche (déjà RLS-scopés côté client)
// + un bloc debug/totaux, appelle Lovable AI Gateway avec un prompt système strict,
// et renvoie systématiquement un objet `debug` (prompt, tailles, erreurs).
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Tu es LTPC AI, le copilote technique du Laboratoire des Travaux Publics et de la Construction.

RÈGLES ABSOLUES :
1. Tu réponds à partir des données internes fournies (résultats de recherche, contexte, totaux). Si l'information est vraiment absente ET que le bloc "Totaux base de données" est également vide, dis-le clairement. Sinon exploite les totaux et les échantillons récents fournis.
2. Pour les questions de comptage ("combien de X ?"), utilise le bloc "Totaux base de données" (nombre exact par domaine).
3. Pour les questions de liste ("quels X ?", "liste des X"), utilise les échantillons récents fournis et cite-les.
4. Tu cites systématiquement tes sources sous la forme [ref:<source_type>:<source_id>] au fil du texte.
5. Tu donnes un niveau de confiance (0-100 %) à la fin de chaque réponse pertinente.
6. Tu réponds en français, ton professionnel, précis, orienté ingénierie civile / béton / géotechnique.
7. Tu structures les réponses longues avec des titres markdown courts.

Domaines : rapports techniques, essais béton, formulations Dreux-Gorisse, granulats, géotechnique, matériel de laboratoire, chantiers, clients, intervenants, documents officiels.`;

interface Hit {
  source_type: string; source_id: string; label: string;
  reference?: string | null; snippet?: string; url?: string | null;
}
interface SearchDebug {
  original_query: string; keywords: string[]; intents: string[];
  domains_searched: string[];
  hits_per_domain: Record<string, number>;
  totals_per_domain: Record<string, number>;
  errors: Array<{ domain: string; message: string }>;
}
interface Payload {
  conversation_id: string;
  history: { role: "user" | "assistant" | "system"; content: string }[];
  user_query: string;
  context?: Record<string, unknown> | null;
  search_hits?: Hit[];
  search_debug?: SearchDebug;
  model?: string;
  debug?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY manquant");

    const body = (await req.json()) as Payload;
    if (!body.user_query || typeof body.user_query !== "string") {
      return new Response(JSON.stringify({ error: "user_query requis" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const model = body.model ?? "google/gemini-2.5-flash";
    const hits = body.search_hits ?? [];
    const debugIn = body.search_debug;

    const contextBlock = body.context && Object.keys(body.context).length
      ? `\n\n### Contexte utilisateur (route active)\n\`\`\`json\n${JSON.stringify(body.context, null, 2).slice(0, 4000)}\n\`\`\``
      : "";

    // Bloc TOTAUX — critique pour les questions "combien"
    const totalsBlock = debugIn?.totals_per_domain && Object.keys(debugIn.totals_per_domain).length
      ? `\n\n### Totaux base de données (nombre exact d'enregistrements)\n` +
        Object.entries(debugIn.totals_per_domain)
          .map(([d, n]) => `- **${d}** : ${n}`).join("\n")
      : "";

    const hitsBlock = hits.length
      ? `\n\n### Échantillons récents / correspondances (${hits.length})\n` +
        hits.slice(0, 60).map((h, i) =>
          `${i + 1}. [ref:${h.source_type}:${h.source_id}] **${h.label}**${h.reference ? " (" + h.reference + ")" : ""} — ${h.snippet ?? ""}`
        ).join("\n")
      : (totalsBlock ? "\n\n_Aucun échantillon détaillé mais utilise les totaux ci-dessus._"
                     : "\n\n_Aucun résultat interne._");

    const introspection = debugIn
      ? `\n\n### Analyse de la requête\n- Intentions détectées : ${debugIn.intents.join(", ") || "aucune"}\n- Mots-clés retenus : ${debugIn.keywords.join(", ") || "aucun (mode navigation)"}\n- Domaines interrogés : ${debugIn.domains_searched.join(", ")}`
      : "";

    const systemContent = SYSTEM_PROMPT + introspection + contextBlock + totalsBlock + hitsBlock;

    const messages = [
      { role: "system", content: systemContent },
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
      console.error("[ltpc-ai-chat] Gateway error", res.status, t);
      return new Response(JSON.stringify({ error: `AI Gateway: ${res.status} ${t}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const answer = data?.choices?.[0]?.message?.content ?? "";
    const durationMs = Date.now() - started;

    const usedIds = new Set<string>();
    for (const m of String(answer).matchAll(/\[ref:([a-z_]+):([0-9a-f-]{8,})\]/gi)) usedIds.add(`${m[1]}:${m[2]}`);
    const citations = hits.filter((h) => usedIds.has(`${h.source_type}:${h.source_id}`));

    // Logs serveur (visibles dans edge function logs)
    console.log("[ltpc-ai-chat]", JSON.stringify({
      q: body.user_query.slice(0, 120),
      hits: hits.length,
      totals: debugIn?.totals_per_domain,
      intents: debugIn?.intents,
      keywords: debugIn?.keywords,
      systemChars: systemContent.length,
      durationMs, model,
      tokens: data?.usage?.total_tokens ?? null,
    }));

    const debugOut = body.debug ? {
      system_prompt_preview: systemContent.slice(0, 8000),
      system_prompt_length: systemContent.length,
      hits_sent: hits.length,
      search_debug: debugIn ?? null,
      history_length: body.history?.length ?? 0,
    } : null;

    return new Response(JSON.stringify({
      answer,
      citations,
      meta: { model, durationMs, tokensTotal: data?.usage?.total_tokens ?? null },
      debug: debugOut,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[ltpc-ai-chat] fatal", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
