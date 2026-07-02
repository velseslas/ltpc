// Génère des recommandations à partir des findings + narratif IA optionnel via AIProvider.
// N'appelle JAMAIS Gemini directement — passe par la edge function `ltpc-ai-narrative`.
import { supabase } from "@/integrations/supabase/client";
import type { AnalysisReport, AnalysisRecommendation } from "./types";

const RULES: Record<string, Omit<AnalysisRecommendation, "sources">> = {
  COMP_MEAN_BELOW_TARGET: { title: "Renforcer la formulation", priority: "haute", detail: "Réduire E/C, augmenter dosage ciment ou revoir courbe granulaire. Refaire une gâchée témoin en labo." },
  COMP_UNDER_CLASS: { title: "Investiguer les essais non conformes", priority: "haute", detail: "Contrôler conservation, géométrie, mise en place. Recouper avec les bons de livraison de la centrale." },
  COMP_HIGH_DISPERSION: { title: "Réduire la variabilité", priority: "moyenne", detail: "Standardiser cure, vibration et prélèvements. Vérifier étalonnage presse et moules." },
  COMP_NEGATIVE_DRIFT: { title: "Rechercher une dérive matériaux", priority: "haute", detail: "Comparer lots de ciment, humidité sables, dosage réel adjuvant sur la période." },
  MIX_EC_HIGH: { title: "Réduire l'eau efficace", priority: "moyenne", detail: "Envisager un plastifiant ou revoir absorption des granulats pour baisser E/C." },
  MIX_CHANGE_CEMENT: { title: "Recaler la formulation", priority: "haute", detail: "Changement de type de ciment : refaire essai R7/R28 avant validation." },
  MIX_CHANGE_SAND: { title: "Vérifier module de finesse", priority: "moyenne", detail: "Nouveau sable : contrôler MF, ES/MB, teneur en fines." },
  MIX_R28_DELTA: { title: "Analyser l'écart R28", priority: "haute", detail: "Comparer courbes granulaires, dosages et conditions d'essais entre les deux gâchées." },
  GRAN_FINES_HIGH: { title: "Lavage ou changement de source", priority: "moyenne", detail: "Fines élevées : envisager lavage du sable ou changer de source." },
  GRAN_MF_OUT: { title: "Corriger le fuseau", priority: "moyenne", detail: "MF hors plage : mélanger avec un correctif granulaire pour recadrer la courbe." },
};

export const TechnicalRecommendationService = {
  fromReport(report: AnalysisReport): AnalysisRecommendation[] {
    const seen = new Set<string>();
    const out: AnalysisRecommendation[] = [];
    for (const f of report.findings) {
      const tmpl = RULES[f.code]; if (!tmpl || seen.has(f.code)) continue;
      seen.add(f.code);
      out.push({ ...tmpl, sources: f.sources });
    }
    return out;
  },

  /** Étoffe le rapport avec des recommandations puis (optionnel) un narratif rédigé par l'IA. */
  async enrich(report: AnalysisReport, opts: { narrative?: boolean } = {}): Promise<AnalysisReport> {
    const recommendations = this.fromReport(report);
    let ai_narrative = report.ai_narrative;
    if (opts.narrative) {
      const { data, error } = await supabase.functions.invoke("ltpc-ai-narrative", {
        body: { domain: report.domain, summary: report.summary, findings: report.findings, recommendations, stats: report.stats },
      });
      if (!error && data?.narrative) ai_narrative = String(data.narrative);
    }
    return { ...report, recommendations, ai_narrative };
  },
};
