// ToolRegistry — catalogue des outils disponibles + sélection par décision Router.
// Ajouter un outil = 1 ligne dans register(). Le router n'a jamais besoin d'être modifié.
import type { Tool, RouterDecision } from "./types";
import { selectTools } from "./selectTools";

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
  pick(decision: RouterDecision, opts: { minConfidence?: number; max?: number } = {}): Tool[] {
    return selectTools(decision, TOOLS, opts).picked;
  },
  pickWithTrace(decision: RouterDecision, opts: { minConfidence?: number; max?: number } = {}) {
    return selectTools(decision, TOOLS, opts);
  },
};

export { selectTools };

// Enregistrement par défaut — l'ordre n'a aucune importance.
[
  SQLCountTool, SQLListTool, SQLSearchTool, SQLStatisticsTool,
  CompressionTool, GranulometryTool, MixDesignTool,
  ReportTool, DocumentTool, MaterialTool, CalibrationTool,
  NonConformityTool, MonitoringTool, KnowledgeTool,
].forEach((t) => ToolRegistry.register(t));
