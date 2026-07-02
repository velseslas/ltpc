// Analyse d'une campagne d'essais de compression béton.
// Détection : résultats sous la classe, écart-type élevé, dérive, outliers.
// Toujours cite les échantillons utilisés.
import { supabase } from "@/integrations/supabase/client";
import { stats, type AnalysisReport, type AnalysisFinding, type AnalysisSource } from "./types";

export interface CompressionQuery {
  chantier_id?: string;
  formulation_id?: string;
  classe_resistance?: string;   // ex. "C25/30"
  limit?: number;               // défaut 200
}

interface Row {
  id: string;
  numero: string | null;
  numero_chantier: number | null;
  resistance: number | null;         // fc (MPa)
  classe_resistance: string | null;
  date_essai: string | null;
  chantier_id: string | null;
  formulation: string | null;
  ouvrage: string | null;
}

function classFromLabel(cls: string | null | undefined): number | null {
  if (!cls) return null;
  const m = cls.match(/C(\d+)\s*\/\s*(\d+)/i);
  if (!m) return null;
  // fck cylindre (premier nombre) — critère caractéristique 5%.
  return parseInt(m[1], 10);
}

export const CompressionAnalysisService = {
  async run(q: CompressionQuery): Promise<AnalysisReport> {
    const query = supabase
      .from("echantillons_compression")
      .select("id, numero, numero_chantier, resistance, classe_resistance, date_essai, chantier_id, formulation, ouvrage")
      .order("date_essai", { ascending: true })
      .limit(q.limit ?? 200);
    if (q.chantier_id) query.eq("chantier_id", q.chantier_id);
    if (q.classe_resistance) query.eq("classe_resistance", q.classe_resistance);
    const { data, error } = await query;
    if (error) throw error;

    const rows = (data ?? []) as Row[];
    const withResult = rows.filter((r) => typeof r.resistance === "number" && !Number.isNaN(r.resistance));
    const values = withResult.map((r) => r.resistance as number);

    const sources: AnalysisSource[] = withResult.map((r) => ({
      source_type: "essai_compression",
      source_id: r.id,
      label: `Essai ${r.numero ?? r.numero_chantier ?? "?"}${r.ouvrage ? " — " + r.ouvrage : ""}`,
      reference: r.numero ?? null,
      url: `/essais/compression/${r.id}`,
    }));

    const findings: AnalysisFinding[] = [];
    const mean = stats.mean(values);
    const sd = stats.stddev(values);
    const cv = stats.cv(values);
    const slope = stats.slope(values);

    // Classe cible
    const fck = classFromLabel(q.classe_resistance ?? withResult[0]?.classe_resistance ?? null);
    if (fck != null) {
      // Critère de conformité EN 206 simplifié : fcm >= fck + 4 (n >= 15).
      const target = fck + (withResult.length >= 15 ? 4 : 1.48 * sd);
      if (mean < target) {
        findings.push({
          code: "COMP_MEAN_BELOW_TARGET",
          severity: "critique",
          message: `Moyenne ${mean.toFixed(1)} MPa < cible ${target.toFixed(1)} MPa (fck=${fck}).`,
          metric: { mean, target, fck, n: withResult.length },
          sources,
        });
      }
      const under = withResult.filter((r) => (r.resistance as number) < fck - 4);
      if (under.length) {
        findings.push({
          code: "COMP_UNDER_CLASS",
          severity: "critique",
          message: `${under.length} essai(s) sous fck-4 (${(fck - 4)} MPa).`,
          metric: { count: under.length, threshold: fck - 4 },
          sources: under.map((r) => sources.find((s) => s.source_id === r.id)!).filter(Boolean),
        });
      }
    }

    if (cv > 15) {
      findings.push({
        code: "COMP_HIGH_DISPERSION",
        severity: "warning",
        message: `Dispersion élevée (CV=${cv.toFixed(1)}%). Vérifier constance de mise en œuvre.`,
        metric: { cv, sd },
        sources,
      });
    }

    if (withResult.length >= 5 && slope < -0.5) {
      findings.push({
        code: "COMP_NEGATIVE_DRIFT",
        severity: "warning",
        message: `Dérive baissière détectée (${slope.toFixed(2)} MPa/essai). Contrôler matériaux et formulation.`,
        metric: { slope },
        sources,
      });
    }

    const outlierIdx = stats.outliers(values, 2.5);
    if (outlierIdx.length) {
      findings.push({
        code: "COMP_OUTLIERS",
        severity: "info",
        message: `${outlierIdx.length} valeur(s) aberrante(s) (|z|≥2.5).`,
        sources: outlierIdx.map((i) => sources[i]),
      });
    }

    return {
      domain: "compression",
      summary: `${withResult.length} essais analysés — moyenne ${mean.toFixed(1)} MPa, écart-type ${sd.toFixed(2)} MPa, CV ${cv.toFixed(1)}%.`,
      findings,
      recommendations: [],
      stats: { n: withResult.length, mean, stddev: sd, cv, slope, fck: fck ?? null },
      confidence: withResult.length >= 15 ? 85 : withResult.length >= 6 ? 65 : 40,
      sources,
      generated_at: new Date().toISOString(),
    };
  },
};
