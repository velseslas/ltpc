// ToolRegistry — catalogue des outils disponibles + sélection par décision Router.
// Ajouter un outil = 1 ligne dans register(). Le router n'a jamais besoin d'être modifié.
import type { Tool, RouterDecision } from "./types";

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

export const ToolRegistry = {
  register(tool: Tool) {
    if (TOOLS.find((t) => t.name === tool.name)) return;
    TOOLS.push(tool);
  },
  all(): readonly Tool[] { return TOOLS; },
  get(name: string): Tool | undefined { return TOOLS.find((t) => t.name === name); },

  /**
   * Sélectionne les outils pertinents pour une décision.
   * - Seuls les outils qui `supports()` la décision sont candidats.
   * - Score = `confidence(decision)`.
   * - On garde tous ceux ≥ `minConfidence` (0.4 par défaut), triés par score.
   * - `max` protège contre la sur-invocation.
   */
  pick(decision: RouterDecision, opts: { minConfidence?: number; max?: number } = {}): Tool[] {
    const min = opts.minConfidence ?? 0.4;
    const max = opts.max ?? 6;
    const scored = TOOLS
      .filter((t) => t.supports(decision))
      .map((t) => ({ tool: t, score: t.confidence(decision) }))
      .filter((x) => x.score >= min)
      .sort((a, b) => b.score - a.score)
      .slice(0, max);
    return scored.map((s) => s.tool);
  },
};

// Enregistrement par défaut — l'ordre n'a aucune importance.
[
  SQLCountTool, SQLListTool, SQLSearchTool, SQLStatisticsTool,
  CompressionTool, GranulometryTool, MixDesignTool,
  ReportTool, DocumentTool, MaterialTool, CalibrationTool,
  NonConformityTool, MonitoringTool, KnowledgeTool,
].forEach((t) => ToolRegistry.register(t));
