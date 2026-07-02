// MonitoringTool — alertes IA proactives + dernier résumé quotidien.
import type { Tool } from "./types";
import { sb } from "./sbAny";
import { runTool } from "./runTool";

export const MonitoringTool: Tool = {
  name: "MonitoringTool",
  description: "Alertes IA proactives actives et dernier résumé quotidien du laboratoire.",
  supports: (d) => d.domains.includes("monitoring") || d.intents.includes("summarize"),
  confidence: (d) => (d.domains.includes("monitoring") ? 0.95 : 0.35),
  execute: (d) => runTool(MonitoringTool, async () => {
    const [alerts, summary] = await Promise.all([
      sb.from("ai_alerts").select("id, severity, title, message, source_type, source_id, created_at, resolved_at")
        .is("resolved_at", null).order("severity", { ascending: false }).order("created_at", { ascending: false }).limit(20),
      sb.from("ai_daily_summaries").select("date, summary, metrics").order("date", { ascending: false }).limit(1),
    ]);
    const alertRows = (alerts.data ?? []) as Array<Record<string, unknown>>;
    const s = (summary.data ?? [])[0] as { date?: string; summary?: string; metrics?: unknown } | undefined;
    const bySeverity: Record<string, number> = {};
    for (const a of alertRows) { const k = String(a.severity ?? "?"); bySeverity[k] = (bySeverity[k] ?? 0) + 1; }
    return {
      ok: true,
      summary: `${alertRows.length} alertes actives · sévérités : ${Object.entries(bySeverity).map(([k, v]) => `${k}(${v})`).join(", ") || "aucune"}`,
      data: {
        alerts_active: alertRows,
        counts_by_severity: bySeverity,
        last_daily_summary: s ?? null,
      },
      citations: [],
      confidence: 0.9,
      rows: alertRows.length,
    };
  }),
};
