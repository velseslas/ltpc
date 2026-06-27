/**
 * Ligne de partage 95/5 entre deux gravillons voisins et intersection
 * avec la courbe de référence OAB.
 *
 * Conformément à la spécification §4 :
 *   P95 = (log10(d95), 95)
 *   P05 = (log10(d05),  5)
 * Les ordonnées sont les valeurs LITTÉRALES 95 et 5, jamais des passants
 * projetés sur OAB.
 */

import type { Point2D, PartitionLine } from "./types";
import { GravelSplitError } from "./types";
import { dAt, type NormalizedCurve } from "./granuloCurve";
import type { ReferenceCurve } from "./referenceCurve";

export interface BuildPartitionLineInput {
  gFinNom: string;
  gFin: NormalizedCurve;
  gSuivantNom: string;
  gSuivant: NormalizedCurve;
}

export function buildPartitionLine(input: BuildPartitionLineInput): PartitionLine {
  const { gFinNom, gFin, gSuivantNom, gSuivant } = input;
  const d95 = dAt(95, gFin, gFinNom);
  const d05 = dAt(5, gSuivant, gSuivantNom);

  const P95: Point2D = { x: Math.log10(d95), y: 95 };
  const P05: Point2D = { x: Math.log10(d05), y: 5 };

  return {
    from: P95,
    to: P05,
    pair: `${gFinNom} → ${gSuivantNom}`,
  };
}

/**
 * Intersection paramétrique segment/segment.
 * Renvoie null si non sécants (ou parallèles).
 */
function intersectSegments(
  p1: Point2D, p2: Point2D,
  p3: Point2D, p4: Point2D
): Point2D | null {
  const r = { x: p2.x - p1.x, y: p2.y - p1.y };
  const s = { x: p4.x - p3.x, y: p4.y - p3.y };
  const denom = r.x * s.y - r.y * s.x;
  if (Math.abs(denom) < 1e-12) return null; // parallèles

  const qp = { x: p3.x - p1.x, y: p3.y - p1.y };
  const t = (qp.x * s.y - qp.y * s.x) / denom;
  const u = (qp.x * r.y - qp.y * r.x) / denom;

  const EPS = 1e-9;
  if (t < -EPS || t > 1 + EPS) return null;
  if (u < -EPS || u > 1 + EPS) return null;

  return { x: p1.x + t * r.x, y: p1.y + t * r.y };
}

/**
 * Intersection de la ligne de partage avec la polyligne OAB.
 * Erreur métier explicite si non sécante (cf. spec §7).
 */
export function intersectWithReference(
  line: PartitionLine,
  refCurve: ReferenceCurve
): Point2D {
  const [O, A, B] = refCurve.polyline;
  const seg1 = intersectSegments(line.from, line.to, O, A);
  const seg2 = intersectSegments(line.from, line.to, A, B);

  // Préfère seg1 s'il existe (cas standard : intersection sous Point A),
  // sinon seg2. Si les deux existent (cas dégénéré), on garde celui dont la
  // ligne est "régulière" (ordonnée comprise entre 5 et 95).
  const candidates = [seg1, seg2].filter((p): p is Point2D => p !== null);

  if (candidates.length === 0) {
    throw new GravelSplitError(
      "PARTITION_NO_INTERSECTION",
      `Ligne de partage non sécante avec la courbe de référence OAB.\n` +
      `Paire : ${line.pair}.\n` +
      `Cause probable :\n` +
      `  • Courbes granulométriques incompatibles avec la courbe de référence (Dmax/K).\n` +
      `  • Fractions mal classées par Dmax croissant.\n` +
      `  • Données granulométriques incohérentes (passants non monotones, tamis manquants).\n` +
      `Aucune valeur n'est inventée. Corrigez les données d'entrée puis relancez le calcul.`,
      { pair: line.pair, from: line.from, to: line.to, refCurve: refCurve.polyline }
    );
  }

  // Cas standard : une seule intersection
  if (candidates.length === 1) return candidates[0];

  // Deux intersections : on retient celle dont l'ordonnée est la plus
  // "centrale" (entre 5 et 95). Si toutes deux le sont, on garde la plus
  // proche du Point A — comportement déterministe.
  candidates.sort((a, b) => Math.abs(a.y - A.y) - Math.abs(b.y - A.y));
  return candidates[0];
}
