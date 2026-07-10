// Edge function LTPC AI v1.1 — reçoit uniquement des résultats d'outils déjà
// exécutés côté client (RLS respectées). Gemini raisonne / synthétise / rédige,
// jamais il ne recalcule. Rétro-compatible : accepte encore search_hits/search_debug.
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { callAIFeature } from "../_shared/ai-provider.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Tu es LTPC AI, le copilote technique du Laboratoire des Travaux Publics et de la Construction.

ARCHITECTURE : Un Agent a analysé la question et appelé des outils spécialisés (SQL, RAG, analyses métier).
Tu reçois UNIQUEMENT les résultats de ces outils. Tu NE dois JAMAIS :
- recalculer des statistiques ou refaire une requête
- inventer des chiffres qui ne sont pas dans les résultats
- prétendre avoir cherché toi-même

RÈGLES ABSOLUES :
1. Réponds à partir des blocs "Résultats des outils" fournis.
2. Cite les sources sous la forme [ref:<source_type>:<source_id>] dès que tu mentionnes un enregistrement.
3. Pour les questions de comptage, utilise SQLCountTool.data.counts.
4. Pour les questions statistiques, utilise SQLStatisticsTool.data (moyenne, écart-type, CV).
5. Pour les questions d'analyse ou recommandation, exploite les findings/recommendations des outils métier (CompressionTool, MixDesignTool, GranulometryTool, NonConformityTool).
6. Termine par « **Confiance : X %** » en reprenant la confiance agrégée fournie.
7. Français, ton professionnel, concis. Titres markdown pour les réponses longues.
8. Si tous les outils ont retourné vide ET aucun compte n'est disponible, dis clairement que la base ne contient pas cette information.`;

interface ToolResultIn {
  tool: string;
  ok: boolean;
  summary: string;
  data: Record<string, unknown>;
  citations: Array<{ source_type: string; source_id: string; label: string; reference?: string | null; url?: string | null; snippet?: string | null }>;
  confidence: number;
  duration_ms: number;
  rows?: number;
  chunks?: number;
  error?: string;
}
interface AgentDebugIn {
  router: { intents: string[]; domains: string[]; keywords: string[]; confidence: number };
  tools_selected: string[];
  tools_executed: Array<{ tool: string; confidence: number; ok: boolean; duration_ms: number; rows?: number; chunks?: number; error?: string }>;
  aggregated_confidence: number;
  total_tool_duration_ms: number;
}
interface Payload {
  conversation_id: string;
  history: { role: "user" | "assistant" | "system"; content: string }[];
  user_query: string;
  context?: Record<string, unknown> | null;
  tool_results?: ToolResultIn[];
  agent_debug?: AgentDebugIn;
  citations?: ToolResultIn["citations"];
  aggregated_confidence?: number;
  // Legacy (v1.0) — conservé pour rétro-compat
  search_hits?: Array<{ source_type: string; source_id: string; label: string; reference?: string | null; snippet?: string; url?: string | null }>;
  search_debug?: { original_query: string; keywords: string[]; intents: string[]; domains_searched: string[]; hits_per_domain: Record<string, number>; totals_per_domain: Record<string, number>; errors: Array<{ domain: string; message: string }> };
  model?: string;
  debug?: boolean;
}

function truncate(o: unknown, max = 3500): string {
  const s = JSON.stringify(o, null, 2);
  return s.length > max ? s.slice(0, max) + "\n… (tronqué)" : s;
}

function buildToolsBlock(results: ToolResultIn[]): string {
  if (!results.length) return "\n\n_Aucun outil n'a été jugé pertinent par l'Agent._";
  const parts: string[] = ["\n\n### Résultats des outils (source unique de vérité)"];
  for (const r of results) {
    const header = `\n#### 🔧 ${r.tool} — ${r.ok ? "✅" : "❌"} · confiance ${(r.confidence * 100).toFixed(0)} % · ${r.duration_ms} ms`;
    parts.push(header);
    parts.push(`_${r.summary}_`);
    if (r.error) parts.push(`> ⚠️ Erreur : ${r.error}`);
    if (Object.keys(r.data).length) parts.push("```json\n" + truncate(r.data) + "\n```");
  }
  return parts.join("\n");
}

function buildAgentBlock(dbg?: AgentDebugIn, conf?: number): string {
  if (!dbg) return "";
  return `\n\n### Analyse de l'Agent
- Intentions : ${dbg.router.intents.join(", ") || "aucune"}
- Domaines : ${dbg.router.domains.join(", ") || "aucun"}
- Mots-clés : ${dbg.router.keywords.join(", ") || "aucun"}
- Outils choisis : ${dbg.tools_selected.join(", ") || "aucun"}
- Confiance agrégée : ${conf ?? dbg.aggregated_confidence} %`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const _rl = await enforceRateLimit(req, { scope: "ltpc-ai-chat", userLimit: 20, ipLimit: 40, windowSec: 60 });
  if (_rl) return _rl;
  try {
    // Les clés fournisseurs sont lues par AIProviderFactory. Aucune ne
    // conditionne l'entrée : si toutes sont absentes, callAIFeature lèvera.



    const body = (await req.json()) as Payload;
    if (!body.user_query || typeof body.user_query !== "string") {
      return new Response(JSON.stringify({ error: "user_query requis" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const model = body.model ?? "google/gemini-2.5-flash";
    const toolResults = body.tool_results ?? [];
    const agentDebug = body.agent_debug;
    const providedCitations = body.citations ?? [];

    const contextBlock = body.context && Object.keys(body.context).length
      ? `\n\n### Contexte utilisateur (route active)\n\`\`\`json\n${JSON.stringify(body.context, null, 2).slice(0, 3000)}\n\`\`\``
      : "";

    // Rétro-compat : si aucun tool_results (client v1.0), on retombe sur l'ancien format.
    const legacyBlock = (!toolResults.length && body.search_hits)
      ? `\n\n### (v1.0 fallback) Échantillons de recherche\n${body.search_hits.slice(0, 40)
          .map((h, i) => `${i + 1}. [ref:${h.source_type}:${h.source_id}] ${h.label}${h.reference ? " (" + h.reference + ")" : ""} — ${h.snippet ?? ""}`).join("\n")}`
      : "";

    const toolsBlock = buildToolsBlock(toolResults);
    const agentBlock = buildAgentBlock(agentDebug, body.aggregated_confidence);

    const systemContent = SYSTEM_PROMPT + agentBlock + contextBlock + toolsBlock + legacyBlock;

    const messages = [
      { role: "system", content: systemContent },
      ...(body.history ?? []).slice(-12),
      { role: "user", content: body.user_query },
    ];

    let answer = "";
    let durationMs = 0;
    let tokensTotal: number | null = null;
    let usedModel = model;
    let usedProvider = "lovable";
    let attempts: Array<{ provider: string; model: string; error?: string }> = [];
    try {
      const result = await callAIFeature("chat", { messages, model, temperature: 0.2 });
      answer = result.raw;
      durationMs = result.durationMs;
      tokensTotal = result.tokensTotal ?? null;
      usedModel = result.model;
      usedProvider = result.provider;
      attempts = result.attempts;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.startsWith("AI_RATE_LIMIT")) return new Response(JSON.stringify({ error: "Limite atteinte, réessayez." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (msg.startsWith("AI_CREDITS_EXHAUSTED")) return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      console.error("[ltpc-ai-chat] AI factory error", msg);
      return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Filtre les citations effectivement citées dans la réponse.
    const usedIds = new Set<string>();
    for (const m of String(answer).matchAll(/\[ref:([a-z_]+):([0-9a-f-]{8,})\]/gi)) usedIds.add(`${m[1]}:${m[2]}`);
    const finalCitations = providedCitations.filter((c) => usedIds.has(`${c.source_type}:${c.source_id}`));

    console.log("[ltpc-ai-chat]", JSON.stringify({
      q: body.user_query.slice(0, 120),
      tools: toolResults.map((t) => `${t.tool}(${t.ok ? "✓" : "✗"},${t.duration_ms}ms)`),
      intents: agentDebug?.router.intents,
      domains: agentDebug?.router.domains,
      systemChars: systemContent.length,
      durationMs, model: usedModel, provider: usedProvider,
      tokens: tokensTotal,
      answerLen: answer.length,
      attempts,
    }));

    const debugOut = body.debug ? {
      system_prompt_preview: systemContent.slice(0, 12000),
      system_prompt_length: systemContent.length,
      tools_received: toolResults.length,
      agent_debug: agentDebug ?? null,
      history_length: body.history?.length ?? 0,
      gemini_duration_ms: durationMs,
      provider: usedProvider,
      attempts,
    } : null;

    return new Response(JSON.stringify({
      answer,
      citations: finalCitations,
      meta: {
        model: usedModel, provider: usedProvider, durationMs,
        tokensTotal,
        confidence: body.aggregated_confidence ?? agentDebug?.aggregated_confidence ?? null,
      },
      debug: debugOut,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[ltpc-ai-chat] fatal", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
