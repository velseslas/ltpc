/**
 * Courbe de référence OAB (Dreux-Gorisse) dans le repère semi-log
 * (X = log10(d_mm), Y = passant %).
 *
 * O = (log10(0.080), 0)
 * A = (log10(Dmax/2), pA)   avec pA = 50 - sqrt(Dmax) + K
 * B = (log10(Dmax),   100)
 *
 * Cette implémentation se limite à la polyligne OA-AB utilisée par la
 * méthode graphique 95/5. Elle est volontairement isolée du calcul de
 * Point A historique pour ne pas créer de dépendance circulaire.
 */

import type { Point2D } from "./types";
import { GravelSplitError } from "./types";
import { calculateXA } from "../pointAxAbscissa";

const D_MIN_MM = 0.080;

export interface ReferenceCurve {
  dmax_mm: number;
  K: number;
  pA: number;
  /** Polyligne O, A, B en (log10 d, %). */
  polyline: [Point2D, Point2D, Point2D];
}

export function buildReferenceCurve(dmax_mm: number, K: number): ReferenceCurve {
  if (!(dmax_mm > D_MIN_MM)) {
    throw new GravelSplitError(
      "REF_DMAX_INVALID",
      `Dmax invalide pour la courbe OAB : ${dmax_mm} mm (doit être > ${D_MIN_MM}).`
    );
  }

  const pA = 50 - Math.sqrt(dmax_mm) + K;
  if (!(pA > 0 && pA < 100)) {
    throw new GravelSplitError(
      "REF_PA_OUT_OF_RANGE",
      `Point A hors plage (pA = ${pA.toFixed(2)} %). Vérifier K et Dmax.`,
      { dmax_mm, K, pA }
    );
  }

  const O: Point2D = { x: Math.log10(D_MIN_MM), y: 0 };
  const A: Point2D = { x: Math.log10(dmax_mm / 2), y: pA };
  const B: Point2D = { x: Math.log10(dmax_mm), y: 100 };

  return { dmax_mm, K, pA, polyline: [O, A, B] };
}

/**
 * % cumulé OAB à une ouverture donnée (interpolation linéaire en log10 d).
 * Informatif — non utilisé pour construire la ligne de partage (cf. spec §4).
 */
export function passantRef(d_mm: number, curve: ReferenceCurve): number {
  const x = Math.log10(d_mm);
  const [O, A, B] = curve.polyline;
  if (x <= O.x) return 0;
  if (x >= B.x) return 100;
  if (x <= A.x) {
    const t = (x - O.x) / (A.x - O.x);
    return O.y + t * (A.y - O.y);
  }
  const t = (x - A.x) / (B.x - A.x);
  return A.y + t * (B.y - A.y);
}

/** Échantillonnage de la courbe OAB pour affichage (Recharts, etc.). */
export function sampleReferenceCurve(curve: ReferenceCurve, n: number = 50): Point2D[] {
  const [O, , B] = curve.polyline;
  const out: Point2D[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = O.x + t * (B.x - O.x);
    const d = Math.pow(10, x);
    out.push({ x, y: passantRef(d, curve) });
  }
  return out;
}
