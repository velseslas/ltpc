// LTPC AI — Contrats de l'architecture Agent + Tools (v1.1).
// Un outil est une unité autonome : il ne connaît ni Gemini, ni le router.
// Le router détermine intents/domains → ToolRegistry choisit les outils →
// AgentOrchestrator exécute en parallèle → l'edge function n'utilise plus
// que les résultats structurés pour construire son prompt.
import type { AICitation } from "../types";

export type ToolIntent =
  | "count" | "list" | "search" | "compare" | "analyse"
  | "summarize" | "recommend" | "trend" | "statistics"
  | "workflow" | "document";

export type ToolDomain =
  | "clients" | "entreprises" | "chantiers" | "essais"
  | "compression" | "granulometrie" | "formulations"
  | "rapports" | "documents" | "materiels" | "etalonnages"
  | "non_conformites" | "audits" | "utilisateurs"
  | "knowledge" | "monitoring";

export interface RouterDecision {
  original_query: string;
  keywords: string[];
  intents: ToolIntent[];
  domains: ToolDomain[];
  confidence: number;               // 0..1 sur l'ensemble de la décision
  entity_context?: {                // provenant de ContextService (route active)
    entity_type?: string;
    entity_id?: string;
  } | null;
}

export interface ToolResult {
  tool: string;
  ok: boolean;
  /** Résumé lisible d'une phrase pour l'IA (jamais du SQL brut). */
  summary: string;
  /** Payload structuré destiné au prompt Gemini. */
  data: Record<string, unknown>;
  citations: AICitation[];
  confidence: number;               // 0..1
  duration_ms: number;
  /** Nombre de lignes/chunks traités — utilisé par le trace de debug. */
  rows?: number;
  chunks?: number;
  error?: string;
  /** Traces Repository (table, filtres, SQL preview, count exact, warnings). */
  repo_debug?: Array<{
    repository: string; table: string; operation: string;
    select: string; filters: Record<string, unknown>;
    sql_preview: string; rows_returned: number; count_exact?: number;
    warning?: string; duration_ms: number;
  }>;
}

export interface Tool {
  readonly name: string;
  readonly description: string;
  /** L'outil s'estime-t-il compétent pour cette décision ? */
  supports(decision: RouterDecision): boolean;
  /** Score 0..1 utilisé par le Registry pour prioriser. */
  confidence(decision: RouterDecision): number;
  /** Exécution — ne doit JAMAIS jeter (les erreurs vont dans ToolResult.error). */
  execute(decision: RouterDecision): Promise<ToolResult>;
}

// -----------------------------------------------------------------------------
// Debug — étendu pour tracer toute la chaîne Agent → Tools → Gemini.
// -----------------------------------------------------------------------------
export interface ToolTrace {
  tool: string;
  confidence: number;
  ok: boolean;
  duration_ms: number;
  rows?: number;
  chunks?: number;
  error?: string;
  repo_debug?: ToolResult["repo_debug"];
}

export interface ToolScoreTrace {
  tool: string;
  score: number;
  supported: boolean;
  selected: boolean;
  reason?: string;
}

export interface AgentDebug {
  router: {
    intents: ToolIntent[];
    domains: ToolDomain[];
    keywords: string[];
    confidence: number;
  };
  tools_selected: string[];
  tools_executed: ToolTrace[];
  tools_scores: ToolScoreTrace[];        // NEW — score de tous les outils, sélectionnés ou non
  selection_reason: string;              // NEW — explication humaine du choix
  aggregated_confidence: number;         // 0..100 (moyenne pondérée)
  total_tool_duration_ms: number;
}

// -----------------------------------------------------------------------------
// Helper : construit un ToolResult "vide" cohérent.
// -----------------------------------------------------------------------------
export function emptyResult(tool: string, summary = "Aucune donnée."): ToolResult {
  return { tool, ok: true, summary, data: {}, citations: [], confidence: 0, duration_ms: 0 };
}
