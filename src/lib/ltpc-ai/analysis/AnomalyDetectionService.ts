// Détection statistique générique — z-score, IQR, dérive.
// Sert de brique bas-niveau pour les autres services et pour LaboratoryMonitoringService (phase 9).
import { stats } from "./types";

export interface Anomaly {
  index: number;
  value: number;
  zscore: number;
  reason: "outlier_z" | "outlier_iqr" | "drift";
}

export const AnomalyDetectionService = {
  zscore(values: number[], threshold = 2.5): Anomaly[] {
    const m = stats.mean(values); const sd = stats.stddev(values);
    if (sd === 0) return [];
    return values
      .map((v, i) => ({ index: i, value: v, zscore: (v - m) / sd, reason: "outlier_z" as const }))
      .filter((a) => Math.abs(a.zscore) >= threshold);
  },
  iqr(values: number[]): Anomaly[] {
    if (values.length < 4) return [];
    const sorted = [...values].sort((a, b) => a - b);
    const q = (p: number) => sorted[Math.floor(p * (sorted.length - 1))];
    const q1 = q(0.25), q3 = q(0.75); const iqr = q3 - q1;
    const lo = q1 - 1.5 * iqr, hi = q3 + 1.5 * iqr;
    return values
      .map((v, i) => ({ index: i, value: v, zscore: 0, reason: "outlier_iqr" as const }))
      .filter((a) => a.value < lo || a.value > hi);
  },
  drift(values: number[], slopeThreshold = 0.5): Anomaly | null {
    if (values.length < 5) return null;
    const s = stats.slope(values);
    if (Math.abs(s) < slopeThreshold) return null;
    return { index: values.length - 1, value: values[values.length - 1], zscore: s, reason: "drift" };
  },
};
