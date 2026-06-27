/**
 * Application séquentielle de la règle 95/5 à toutes les paires de
 * gravillons voisins (interprétation A, cf. spec §0 et §8).
 */

import type { CutoffPoint, PartitionLine } from "./types";
import { GravelSplitError } from "./types";
import { buildPartitionLine, intersectWithReference } from "./partitionLine";
import type { NormalizedCurve } from "./granuloCurve";
import type { ReferenceCurve } from "./referenceCurve";

export interface NamedCurve {
  nom: string;
  dmax_mm: number;
  curve: NormalizedCurve;
}

export interface ComputeCutoffsResult {
  cutoffs: CutoffPoint[];      // n-1 points (y_1 < y_2 < ... < y_{n-1})
  partition_lines: PartitionLine[];
}

export function computeCutoffs(
  gravillons: NamedCurve[],
  refCurve: ReferenceCurve
): ComputeCutoffsResult {
  if (gravillons.length < 2) {
    throw new GravelSplitError(
      "PAIRWISE_NEEDS_TWO",
      "computeCutoffs requiert au moins 2 gravillons."
    );
  }

  const cutoffs: CutoffPoint[] = [];
  const partition_lines: PartitionLine[] = [];

  for (let i = 0; i < gravillons.length - 1; i++) {
    const gFin = gravillons[i];
    const gSuivant = gravillons[i + 1];

    const line = buildPartitionLine({
      gFinNom: gFin.nom,
      gFin: gFin.curve,
      gSuivantNom: gSuivant.nom,
      gSuivant: gSuivant.curve,
    });
    partition_lines.push(line);

    const pt = intersectWithReference(line, refCurve);
    cutoffs.push({ y_pct: pt.y, x_log10d: pt.x });
  }

  // Monotonie stricte (cf. spec §9.6).
  for (let i = 1; i < cutoffs.length; i++) {
    if (!(cutoffs[i].y_pct > cutoffs[i - 1].y_pct + 1e-9)) {
      throw new GravelSplitError(
        "CUTOFFS_NOT_MONOTONIC",
        `Ordonnées de partage non strictement croissantes : ` +
        `y_${i} = ${cutoffs[i].y_pct.toFixed(3)} % ≤ y_${i - 1} = ${cutoffs[i - 1].y_pct.toFixed(3)} %.\n` +
        `Cause probable : gravillons mal classés par Dmax ou courbes incompatibles.`,
        { cutoffs }
      );
    }
  }

  return { cutoffs, partition_lines };
}

/**
 * Transforme n-1 ordonnées de partage en n proportions par différences
 * successives. Σ = 100 % par construction (cf. spec §6).
 */
export function cutoffsToProportions(
  cutoffs: CutoffPoint[],
  n: number
): number[] {
  if (cutoffs.length !== n - 1) {
    throw new GravelSplitError(
      "CUTOFFS_COUNT_MISMATCH",
      `cutoffsToProportions : reçu ${cutoffs.length} ordonnées pour ${n} gravillons (attendu ${n - 1}).`
    );
  }

  const props: number[] = [];
  let prev = 0;
  for (let i = 0; i < cutoffs.length; i++) {
    props.push(cutoffs[i].y_pct - prev);
    prev = cutoffs[i].y_pct;
  }
  props.push(100 - prev);

  // Contrôle interne (cf. spec §9.8) — par construction Σ = 100.
  const sum = props.reduce((s, p) => s + p, 0);
  if (Math.abs(sum - 100) > 1e-6) {
    throw new GravelSplitError(
      "PROPORTIONS_SUM_INVALID",
      `Σ proportions = ${sum.toFixed(6)} % ≠ 100 (bug interne).`,
      { props }
    );
  }

  return props;
}
