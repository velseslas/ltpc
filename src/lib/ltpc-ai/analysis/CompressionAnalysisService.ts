// Analyse d'une campagne d'essais de compression béton.
// La résistance provient de `resultats` (jsonb) — on essaie plusieurs clés usuelles.
import { supabase } from "@/integrations/supabase/client";
import { stats, type AnalysisReport, type AnalysisFinding, type AnalysisSource } from "./types";

export interface CompressionQuery {
  chantier_id?: string;
  formulation_id?: string;
  classe_resistance?: string;
  limit?: number;
}

interface Row {
  id: string;
  numero: string | null;
  numero_chantier: number | null;
  resultats: Record<string, unknown> | null;
  classe_resistance: string | null;
  date_essai: string | null;
  date_coulage: string | null;
  chantier_id: string | null;
  formulation_id: string | null;
  ouvrage: string | null;
}

function extractResistance(r: Record<string, unknown> | null): number | null {
  if (!r) return null;
  const keys = ["resistance_moyenne", "resistance", "fc_moyenne", "fc", "moyenne"];
  for (const k of keys) {
    const v = r[k];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string" && v && !isNaN(Number(v))) return Number(v);
  }
  // Recherche imbriquée niveau 1
  for (const v of Object.values(r)) {
    if (v && typeof v === "object") {
      const found = extractResistance(v as Record<string, unknown>);
      if (found != null) return found;
    }
  }
  return null;
}

function classFromLabel(cls: string | null | undefined): number | null {
  if (!cls) return null;
  const m = cls.match(/C(\d+)\s*\/\s*(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

export const CompressionAnalysisService = {
  async run(q: CompressionQuery): Promise<AnalysisReport> {
    let query = supabase
      .from("echantillons_compression")
      .select("id, numero, numero_chantier, resultats, classe_resistance, date_essai, date_coulage, chantier_id, formulation_id, ouvrage")
      .order("date_essai", { ascending: true, nullsFirst: false })
      .limit(q.limit ?? 200);
    if (q.chantier_id) query = query.eq("chantier_id", q.chantier_id);
    if (q.formulation_id) query = query.eq("formulation_id", q.formulation_id);
    if (q.classe_resistance) query = query.eq("classe_resistance", q.classe_resistance);
    const { data, error } = await query;
    if (error) throw error;

    const rows = (data ?? []) as unknown as Row[];
    const withResult = rows
      .map((r) => ({ row: r, fc: extractResistance(r.resultats) }))
      .filter((x): x is { row: Row; fc: number } => x.fc != null);
    const values = withResult.map((x) => x.fc);

    const sources: AnalysisSource[] = withResult.map(({ row }) => ({
      source_type: "essai_compression",
      source_id: row.id,
      label: `Essai ${row.numero ?? row.numero_chantier ?? "?"}${row.ouvrage ? " — " + row.ouvrage : ""}`,
      reference: row.numero ?? null,
      url: `/essais/compression/${row.id}`,
    }));

    const findings: AnalysisFinding[] = [];
    const mean = stats.mean(values);
    const sd = stats.stddev(values);
    const cv = stats.cv(values);
    const slope = stats.slope(values);

    const fck = classFromLabel(q.classe_resistance ?? withResult[0]?.row.classe_resistance ?? null);
    if (fck != null && values.length) {
      const target = fck + (values.length >= 15 ? 4 : 1.48 * sd);
      if (mean < target) {
        findings.push({
          code: "COMP_MEAN_BELOW_TARGET", severity: "critique",
          message: `Moyenne ${mean.toFixed(1)} MPa < cible ${target.toFixed(1)} MPa (fck=${fck}).`,
          metric: { mean, target, fck, n: values.length }, sources,
        });
      }
      const under = withResult.filter((x) => x.fc < fck - 4);
      if (under.length) {
        findings.push({
          code: "COMP_UNDER_CLASS", severity: "critique",
          message: `${under.length} essai(s) sous fck-4 (${fck - 4} MPa).`,
          metric: { count: under.length, threshold: fck - 4 },
          sources: under.map((x) => sources.find((s) => s.source_id === x.row.id)!).filter(Boolean),
        });
      }
    }
    if (cv > 15) findings.push({ code: "COMP_HIGH_DISPERSION", severity: "warning", message: `Dispersion élevée (CV=${cv.toFixed(1)}%).`, metric: { cv, sd }, sources });
    if (values.length >= 5 && slope < -0.5) findings.push({ code: "COMP_NEGATIVE_DRIFT", severity: "warning", message: `Dérive baissière (${slope.toFixed(2)} MPa/essai).`, metric: { slope }, sources });

    const outIdx = stats.outliers(values, 2.5);
    if (outIdx.length) findings.push({ code: "COMP_OUTLIERS", severity: "info", message: `${outIdx.length} valeur(s) aberrante(s).`, sources: outIdx.map((i) => sources[i]) });

    return {
      domain: "compression",
      summary: `${values.length} essais analysés — moyenne ${mean.toFixed(1)} MPa, σ ${sd.toFixed(2)}, CV ${cv.toFixed(1)}%.`,
      findings, recommendations: [],
      stats: { n: values.length, mean, stddev: sd, cv, slope, fck: fck ?? null },
      confidence: values.length >= 15 ? 85 : values.length >= 6 ? 65 : 40,
      sources, generated_at: new Date().toISOString(),
    };
  },
};
