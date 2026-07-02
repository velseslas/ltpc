// MixDesignTool — analyse d'une formulation ou comparaison entre deux formulations.
import type { Tool } from "./types";
import { runTool } from "./runTool";
import { ConcreteMixAnalysisService } from "../analysis/ConcreteMixAnalysisService";
import { sb } from "./sbAny";
import type { AICitation } from "../types";

export const MixDesignTool: Tool = {
  name: "MixDesignTool",
  description: "Analyse d'une formulation béton (E/C, cohérence Dreux) ou comparaison entre deux formulations.",
  supports: (d) => d.domains.includes("formulations") && (d.intents.includes("analyse") || d.intents.includes("compare") || d.intents.includes("summarize")),
  confidence: (d) => (d.intents.includes("compare") ? 0.9 : d.intents.includes("analyse") ? 0.85 : 0.5),
  execute: (d) => runTool(MixDesignTool, async () => {
    // On récupère les 2 dernières formulations si l'utilisateur ne cible pas.
    const focusId = d.entity_context?.entity_type === "formulation" ? d.entity_context.entity_id : undefined;
    let idA: string | undefined = focusId;
    let idB: string | undefined;
    if (!idA || d.intents.includes("compare")) {
      const { data } = await sb.from("formulations").select("id").order("created_at", { ascending: false }).limit(2);
      const list = (data ?? []) as Array<{ id: string }>;
      idA = idA ?? list[0]?.id;
      idB = list[1]?.id;
    }
    if (!idA) return { ok: true, summary: "Aucune formulation disponible.", data: {}, citations: [], confidence: 0.2 };

    const report = d.intents.includes("compare") && idB
      ? await ConcreteMixAnalysisService.compare(idA, idB)
      : await ConcreteMixAnalysisService.analyse(idA);

    const citations: AICitation[] = report.sources.map((s) => ({
      source_type: s.source_type, source_id: s.source_id, label: s.label,
      reference: s.reference ?? null, url: s.url ?? null, snippet: null,
    }));
    return {
      ok: true, summary: report.summary,
      data: {
        mode: d.intents.includes("compare") && idB ? "compare" : "analyse",
        formulation_ids: [idA, idB].filter(Boolean),
        findings: report.findings.map((f) => ({ code: f.code, severity: f.severity, message: f.message, metric: f.metric })),
        recommendations: report.recommendations.map((r) => ({ title: r.title, detail: r.detail, priority: r.priority })),
        stats: report.stats,
      },
      citations, confidence: report.confidence / 100, rows: report.sources.length,
    };
  }),
};
