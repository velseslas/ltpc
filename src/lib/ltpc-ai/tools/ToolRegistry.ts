// ToolRegistry — catalogue des outils disponibles + sélection par décision Router.
// Ajouter un outil = 1 ligne dans register(). Le router n'a jamais besoin d'être modifié.
import type { Tool, RouterDecision, ToolScoreTrace } from "./types";

// Import des outils livrés en v1.1.
import { SQLCountTool } from "./SQLCountTool";
import { SQLListTool } from "./SQLListTool";
import { SQLSearchTool } from "./SQLSearchTool";
import { SQLStatisticsTool } from "./SQLStatisticsTool";
import { CompressionTool } from "./CompressionTool";
import { GranulometryTool } from "./GranulometryTool";
import { MixDesignTool } from "./MixDesignTool";
import { ReportTool } from "./ReportTool";
import { DocumentTool } from "./DocumentTool";
import { MaterialTool } from "./MaterialTool";
import { CalibrationTool } from "./CalibrationTool";
import { NonConformityTool } from "./NonConformityTool";
import { MonitoringTool } from "./MonitoringTool";
import { KnowledgeTool } from "./KnowledgeTool";

const TOOLS: Tool[] = [];

/**
 * Sélection pure : donne un rapport complet (scores + raison), et priorise
 * SQLCountTool lorsque l'intention est "count", peu importe le score des autres.
 * Extrait comme fonction pour être testable sans dépendance Supabase.
 */
export function selectTools(
  decision: RouterDecision,
  tools: readonly Tool[],
  opts: { minConfidence?: number; max?: number } = {},
): { picked: Tool[]; scores: ToolScoreTrace[]; reason: string } {
  const min = opts.minConfidence ?? 0.4;
  const max = opts.max ?? 6;

  const isCount = decision.intents.includes("count");
  const hasSearch = decision.intents.includes("search");
  const countOnly = isCount && !hasSearch;

  const scores: ToolScoreTrace[] = tools.map((t) => {
    const supported = t.supports(decision);
    const score = supported ? t.confidence(decision) : 0;
    return { tool: t.name, score, supported, selected: false };
  });

  // Règle 1 : intent=count → SQLSearchTool est BANNI (sauf si "search" explicite aussi).
  if (countOnly) {
    for (const s of scores) if (s.tool === "SQLSearchTool") {
      s.supported = false;
      s.score = 0;
      s.reason = "banni: intent=count exclut la recherche ILIKE";
    }
  }

  // Sélection standard : supported && score >= min, triés desc.
  let candidates = scores
    .filter((s) => s.supported && s.score >= min)
    .sort((a, b) => b.score - a.score);

  // Règle 2 : intent=count → SQLCountTool doit être en tête, quoi qu'il arrive.
  if (isCount) {
    const countIdx = candidates.findIndex((s) => s.tool === "SQLCountTool");
    if (countIdx > 0) {
      const [c] = candidates.splice(countIdx, 1);
      candidates.unshift(c);
    } else if (countIdx === -1) {
      // Force l'ajout si présent dans le pool total et supporté.
      const forced = scores.find((s) => s.tool === "SQLCountTool" && s.supported);
      if (forced) candidates = [forced, ...candidates];
    }
  }

  const picked = candidates.slice(0, max);
  for (const p of picked) {
    p.selected = true;
    if (!p.reason) {
      p.reason =
        isCount && p.tool === "SQLCountTool"
          ? "prioritaire: intent=count → SQLCountTool imposé"
          : `score ${p.score.toFixed(2)} ≥ min ${min}`;
    }
  }

  const reason = isCount
    ? countOnly
      ? "Intent=count détecté → SQLCountTool prioritaire, SQLSearchTool banni."
      : "Intent=count + search détectés → SQLCountTool prioritaire, SQLSearchTool autorisé."
    : `Aucun intent count. Outils triés par score (min ${min}).`;

  return { picked: picked.map((s) => tools.find((t) => t.name === s.tool)!).filter(Boolean), scores, reason };
}

export const ToolRegistry = {
  register(tool: Tool) {
    if (TOOLS.find((t) => t.name === tool.name)) return;
    TOOLS.push(tool);
  },
  all(): readonly Tool[] { return TOOLS; },
  get(name: string): Tool | undefined { return TOOLS.find((t) => t.name === name); },

  /**
   * API historique : renvoie uniquement les outils sélectionnés.
   */
  pick(decision: RouterDecision, opts: { minConfidence?: number; max?: number } = {}): Tool[] {
    return selectTools(decision, TOOLS, opts).picked;
  },

  /**
   * API v1.2 : renvoie aussi les scores complets + la raison, pour le debug.
   */
  pickWithTrace(decision: RouterDecision, opts: { minConfidence?: number; max?: number } = {}) {
    return selectTools(decision, TOOLS, opts);
  },
};

// Enregistrement par défaut — l'ordre n'a aucune importance.
[
  SQLCountTool, SQLListTool, SQLSearchTool, SQLStatisticsTool,
  CompressionTool, GranulometryTool, MixDesignTool,
  ReportTool, DocumentTool, MaterialTool, CalibrationTool,
  NonConformityTool, MonitoringTool, KnowledgeTool,
].forEach((t) => ToolRegistry.register(t));
