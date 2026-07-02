// GranulometryTool — délègue à GranulometryAnalysisService pour un essai précis.
// Nécessite un entity_context essai_granulometrie:<id> pour être vraiment utile.
import type { Tool } from "./types";
import { runTool } from "./runTool";
import { GranulometryAnalysisService } from "../analysis/GranulometryAnalysisService";
import { sb } from "./sbAny";
import type { AICitation } from "../types";

export const GranulometryTool: Tool = {
  name: "GranulometryTool",
  description: "Analyse un essai de granulométrie : module de finesse, coefficients Cu/Cc, fuseau.",
  supports: (d) => d.domains.includes("granulometrie") && (d.intents.includes("analyse") || d.intents.includes("summarize")),
  confidence: (d) => (d.entity_context?.entity_type === "essai_granulometrie" ? 0.95 : 0.5),
  execute: (d) => runTool(GranulometryTool, async () => {
    let essaiId = d.entity_context?.entity_id;
    if (!essaiId) {
      const { data } = await sb.from("echantillons_granulometrie").select("id").order("created_at", { ascending: false }).limit(1);
      essaiId = (data?.[0] as { id?: string } | undefined)?.id;
    }
    if (!essaiId) {
      return { ok: true, summary: "Aucun essai granulométrie disponible.", data: {}, citations: [], confidence: 0.2 };
    }
    const report = await GranulometryAnalysisService.run(essaiId);
    const citations: AICitation[] = report.sources.map((s) => ({
      source_type: s.source_type, source_id: s.source_id, label: s.label,
      reference: s.reference ?? null, url: s.url ?? null, snippet: null,
    }));
    return {
      ok: true, summary: report.summary,
      data: {
        essai_id: essaiId,
        findings: report.findings.map((f) => ({ code: f.code, severity: f.severity, message: f.message, metric: f.metric })),
        recommendations: report.recommendations.map((r) => ({ title: r.title, detail: r.detail, priority: r.priority })),
        stats: report.stats,
      },
      citations, confidence: report.confidence / 100, rows: 1,
    };
  }),
};
