/**
 * Courbe granulométrique brute d'un gravillon.
 *
 * - passantAt(d) : interpolation linéaire en log10(d) entre tamis adjacents.
 * - dAt(p)       : inverse par dichotomie sur passantAt.
 *
 * Cf. spécification §6.
 */

import type { TamisPoint } from "./types";
import { GravelSplitError } from "./types";

export interface NormalizedCurve {
  /** Trié par ouverture croissante, passants strictement monotones croissants. */
  points: TamisPoint[];
  dMin: number;
  dMax: number;
}

export function normalizeCurve(tamis: TamisPoint[], nom: string): NormalizedCurve {
  if (!tamis || tamis.length < 3) {
    throw new GravelSplitError(
      "CURVE_TOO_FEW_POINTS",
      `Courbe granulométrique de "${nom}" : au moins 3 tamis requis (reçu ${tamis?.length ?? 0}).`
    );
  }

  const seen = new Set<number>();
  const cleaned: TamisPoint[] = [];
  for (const p of tamis) {
    if (!(p.ouverture_mm > 0) || !Number.isFinite(p.passant_pct)) continue;
    if (seen.has(p.ouverture_mm)) continue;
    seen.add(p.ouverture_mm);
    cleaned.push({
      ouverture_mm: p.ouverture_mm,
      passant_pct: Math.max(0, Math.min(100, p.passant_pct)),
    });
  }

  cleaned.sort((a, b) => a.ouverture_mm - b.ouverture_mm);

  // Le passant doit croître (ou rester égal) avec l'ouverture.
  for (let i = 1; i < cleaned.length; i++) {
    if (cleaned[i].passant_pct + 1e-6 < cleaned[i - 1].passant_pct) {
      throw new GravelSplitError(
        "CURVE_NOT_MONOTONIC",
        `Courbe "${nom}" non monotone : passant décroît entre ${cleaned[i - 1].ouverture_mm} mm (${cleaned[i - 1].passant_pct}%) et ${cleaned[i].ouverture_mm} mm (${cleaned[i].passant_pct}%).`
      );
    }
  }

  return {
    points: cleaned,
    dMin: cleaned[0].ouverture_mm,
    dMax: cleaned[cleaned.length - 1].ouverture_mm,
  };
}

/** Passant (%) à l'ouverture d, interpolation linéaire en log10(d). */
export function passantAt(d_mm: number, curve: NormalizedCurve): number {
  if (!(d_mm > 0)) {
    throw new GravelSplitError("CURVE_BAD_D", `passantAt: d_mm doit être > 0 (reçu ${d_mm}).`);
  }
  const pts = curve.points;
  if (d_mm <= pts[0].ouverture_mm) return pts[0].passant_pct;
  if (d_mm >= pts[pts.length - 1].ouverture_mm) return pts[pts.length - 1].passant_pct;

  const x = Math.log10(d_mm);
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (d_mm >= a.ouverture_mm && d_mm <= b.ouverture_mm) {
      const xa = Math.log10(a.ouverture_mm);
      const xb = Math.log10(b.ouverture_mm);
      const t = (x - xa) / (xb - xa);
      return a.passant_pct + t * (b.passant_pct - a.passant_pct);
    }
  }
  // Inaccessible
  return pts[pts.length - 1].passant_pct;
}

/**
 * Inverse : ouverture (mm) à laquelle la courbe passe à p %.
 * Dichotomie sur log10(d), 60 itérations max → précision ~1e-4 mm.
 */
export function dAt(p_pct: number, curve: NormalizedCurve, nom: string = ""): number {
  const pts = curve.points;
  const pMin = pts[0].passant_pct;
  const pMax = pts[pts.length - 1].passant_pct;

  if (p_pct < pMin - 1e-6 || p_pct > pMax + 1e-6) {
    throw new GravelSplitError(
      "CURVE_P_OUT_OF_RANGE",
      `dAt(${p_pct}%) hors bornes pour "${nom}" : la courbe couvre [${pMin}, ${pMax}] %.`,
      { p_pct, pMin, pMax }
    );
  }

  // Cas d'égalité bornes
  if (Math.abs(p_pct - pMin) < 1e-9) return curve.dMin;
  if (Math.abs(p_pct - pMax) < 1e-9) return curve.dMax;

  let lo = Math.log10(curve.dMin);
  let hi = Math.log10(curve.dMax);
  for (let i = 0; i < 60; i++) {
    const mid = 0.5 * (lo + hi);
    const d = Math.pow(10, mid);
    const pv = passantAt(d, curve);
    if (Math.abs(pv - p_pct) < 1e-4) return d;
    if (pv < p_pct) lo = mid;
    else hi = mid;
  }
  return Math.pow(10, 0.5 * (lo + hi));
}
