// SQLStatisticsTool — statistiques descriptives (moyenne, min, max, écart-type)
// pour les domaines numériques (compression → résistance).
import { supabase } from "@/integrations/supabase/client";
import type { Tool, RouterDecision } from "./types";
import { runTool } from "./runTool";
import { stats } from "../analysis/types";

function extractResistance(r: Record<string, unknown> | null): number | null {
  if (!r) return null;
  const keys = ["resistance_moyenne", "resistance", "fc_moyenne", "fc", "moyenne"];
  for (const k of keys) {
    const v = r[k];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string" && v && !isNaN(Number(v))) return Number(v);
  }
  return null;
}

export const SQLStatisticsTool: Tool = {
  name: "SQLStatisticsTool",
  description: "Statistiques descriptives (n, moyenne, écart-type, min, max, CV) sur les essais numériques.",
  supports: (d) =>
    (d.intents.includes("statistics") || d.intents.includes("trend") || d.intents.includes("summarize")) &&
    (d.domains.includes("compression") || d.domains.includes("essais")),
  confidence: (d) => (d.intents.includes("statistics") ? 0.95 : d.intents.includes("trend") ? 0.7 : 0.4),
  execute: (d) => runTool(SQLStatisticsTool, async () => {
    const { data, error } = await supabase
      .from("echantillons_compression")
      .select("id, resultats, classe_resistance, date_coulage")
      .order("date_coulage", { ascending: false, nullsFirst: false })
      .limit(500);
    if (error) throw error;
    const rows = (data ?? []) as Array<{ resultats: Record<string, unknown> | null; classe_resistance: string | null }>;
    const values = rows.map((r) => extractResistance(r.resultats)).filter((v): v is number => v != null);
    if (!values.length) {
      return {
        ok: true, summary: "Aucune valeur de résistance exploitable.",
        data: { n: 0 }, citations: [], confidence: 0.3,
      };
    }
    const mean = stats.mean(values), sd = stats.stddev(values), cv = stats.cv(values);
    const min = Math.min(...values), max = Math.max(...values);
    return {
      ok: true,
      summary: `n=${values.length} · moyenne=${mean.toFixed(1)} MPa · σ=${sd.toFixed(1)} · CV=${cv.toFixed(1)}%`,
      data: { domain: "compression", n: values.length, mean_MPa: +mean.toFixed(2), stddev: +sd.toFixed(2), cv_pct: +cv.toFixed(2), min, max, slope_recent_MPa_per_step: +stats.slope(values.slice(0, 30)).toFixed(3) },
      citations: [],
      confidence: 0.95,
      rows: values.length,
    };
  }),
};
