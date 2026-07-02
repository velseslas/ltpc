// AgentOrchestrator — étape 2 : router → registry → exécution parallèle → agrégation.
// Aucun composant React n'appelle un outil directement : tout passe par ici.
// Toutes les requêtes s'exécutent côté client → respect natif des RLS Supabase.
import { AIIntentRouter } from "./router/AIIntentRouter";
import { ToolRegistry } from "./tools/ToolRegistry";
import type { AgentDebug, RouterDecision, ToolResult, ToolTrace } from "./tools/types";
import type { AICitation, AIContext } from "./types";

export interface AgentResult {
  decision: RouterDecision;
  tool_results: ToolResult[];
  citations: AICitation[];
  aggregated_confidence: number; // 0..100
  debug: AgentDebug;
}

/** Déduplique les citations par (source_type, source_id) en gardant la meilleure. */
function dedupCitations(cs: AICitation[]): AICitation[] {
  const map = new Map<string, AICitation>();
  for (const c of cs) {
    const key = `${c.source_type}:${c.source_id}`;
    if (!map.has(key)) map.set(key, c);
  }
  return [...map.values()];
}

export const AgentOrchestrator = {
  async run(query: string, context?: AIContext | null): Promise<AgentResult> {
    const decision = AIIntentRouter.route(query, context);
    const tools = ToolRegistry.pick(decision);

    const results = await Promise.all(tools.map((t) => t.execute(decision)));

    const traces: ToolTrace[] = results.map((r, i) => ({
      tool: r.tool,
      confidence: r.confidence,
      ok: r.ok,
      duration_ms: r.duration_ms,
      rows: r.rows,
      chunks: r.chunks,
      error: r.error,
    }));

    const okResults = results.filter((r) => r.ok);
    // Confiance agrégée : moyenne pondérée par le score outil, clampée à [0,1] puis %.
    const weightSum = okResults.reduce((s, r) => s + r.confidence, 0);
    const weightedConf = weightSum > 0
      ? okResults.reduce((s, r) => s + r.confidence * r.confidence, 0) / weightSum
      : 0;
    const aggregated = Math.round(Math.min(1, weightedConf) * 100);

    const citations = dedupCitations(results.flatMap((r) => r.citations));

    const debug: AgentDebug = {
      router: {
        intents: decision.intents,
        domains: decision.domains,
        keywords: decision.keywords,
        confidence: +decision.confidence.toFixed(2),
      },
      tools_selected: tools.map((t) => t.name),
      tools_executed: traces,
      aggregated_confidence: aggregated,
      total_tool_duration_ms: traces.reduce((s, t) => s + t.duration_ms, 0),
    };

    return { decision, tool_results: results, citations, aggregated_confidence: aggregated, debug };
  },
};
