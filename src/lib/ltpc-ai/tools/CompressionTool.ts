// CompressionTool — analyse d'une campagne d'essais de compression via
// CompressionAnalysisService. Retourne findings + recommandations pour l'IA.
import type { Tool, RouterDecision } from "./types";
import { runTool } from "./runTool";
import { CompressionAnalysisService } from "../analysis/CompressionAnalysisService";
import type { AICitation } from "../types";

export const CompressionTool: Tool = {
  name: "CompressionTool",
  description: "Analyse la campagne d'essais de compression : conformité EN 206, outliers, dérive.",
  supports: (d) =>
    d.domains.includes("compression") &&
    (d.intents.includes("analyse") || d.intents.includes("summarize") || d.intents.includes("compare") || d.intents.includes("trend") || d.intents.includes("recommend")),
  confidence: (d) => (d.intents.includes("analyse") ? 0.9 : 0.6),
  execute: (d) => runTool(CompressionTool, async () => {
    const report = await CompressionAnalysisService.run({
      chantier_id: d.entity_context?.entity_type === "chantier" ? d.entity_context.entity_id : undefined,
      formulation_id: d.entity_context?.entity_type === "formulation" ? d.entity_context.entity_id : undefined,
      limit: 200,
    });
    const citations: AICitation[] = report.sources.map((s) => ({
      source_type: s.source_type, source_id: s.source_id,
      label: s.label, reference: s.reference ?? null, url: s.url ?? null, snippet: null,
    }));
    return {
      ok: true,
      summary: report.summary,
      data: {
        findings: report.findings.map((f) => ({ code: f.code, severity: f.severity, message: f.message, metric: f.metric })),
        recommendations: report.recommendations.map((r) => ({ title: r.title, detail: r.detail, priority: r.priority })),
        stats: report.stats,
      },
      citations,
      confidence: report.confidence / 100,
      rows: report.sources.length,
    };
  }),
};
