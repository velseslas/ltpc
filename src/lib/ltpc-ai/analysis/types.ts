// Types partagés du moteur d'analyse métier LTPC AI (phase 7).
// Chaque analyse porte ses sources : jamais d'affirmation sans citation.

export type AnalysisSeverity = "info" | "warning" | "critique";

export interface AnalysisSource {
  source_type: string;   // ex. "essai_compression" | "formulation" | "granulometrie"
  source_id: string;
  label: string;
  reference?: string | null;
  url?: string | null;
}

export interface AnalysisFinding {
  code: string;                    // ex. "COMP_UNDER_CLASS"
  severity: AnalysisSeverity;
  message: string;                 // phrase courte lisible
  metric?: Record<string, number>; // valeurs numériques associées
  sources: AnalysisSource[];       // toujours renseigné
}

export interface AnalysisRecommendation {
  title: string;
  detail: string;
  priority: "haute" | "moyenne" | "basse";
  sources: AnalysisSource[];
}

export interface AnalysisReport {
  domain: "compression" | "formulation" | "granulometrie" | "generic";
  summary: string;
  findings: AnalysisFinding[];
  recommendations: AnalysisRecommendation[];
  stats?: Record<string, number | string | null>;
  ai_narrative?: string;   // rédaction longue optionnelle (via AIProvider)
  confidence: number;      // 0..100
  sources: AnalysisSource[];
  generated_at: string;
}

/** Petits utilitaires numériques réutilisés par tous les services. */
export const stats = {
  mean(xs: number[]): number { return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0; },
  stddev(xs: number[]): number {
    if (xs.length < 2) return 0;
    const m = stats.mean(xs);
    return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1));
  },
  cv(xs: number[]): number {
    const m = stats.mean(xs);
    return m === 0 ? 0 : (stats.stddev(xs) / m) * 100;
  },
  /** Retourne les indices dont z-score dépasse le seuil. */
  outliers(xs: number[], zThreshold = 2): number[] {
    const m = stats.mean(xs); const sd = stats.stddev(xs);
    if (sd === 0) return [];
    return xs.map((x, i) => (Math.abs((x - m) / sd) >= zThreshold ? i : -1)).filter((i) => i >= 0);
  },
  /** Pente linéaire simple (dérive) via moindres carrés. */
  slope(xs: number[]): number {
    const n = xs.length; if (n < 2) return 0;
    const mx = (n - 1) / 2; const my = stats.mean(xs);
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) { num += (i - mx) * (xs[i] - my); den += (i - mx) ** 2; }
    return den === 0 ? 0 : num / den;
  },
};
