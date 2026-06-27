/**
 * Module gravelSplit — répartition graphique des gravillons (Dreux-Gorisse,
 * règle 95/5). API publique : splitGravels(input) → SplitGravelsOutput.
 *
 * Cf. spécification dans .lovable/plan.md.
 *
 * Interprétation A verrouillée : application séquentielle de la règle 95/5
 * sur les courbes brutes de chaque paire (G_k, G_{k+1}). Pour n ≥ 3, il
 * s'agit d'une EXTENSION LOGIQUE de la règle graphique — non démontrée
 * explicitement par le document de référence (cf. spec §8).
 */

import type {
  SplitGravelsInput,
  SplitGravelsOutput,
  GravillonInput,
  CutoffPoint,
  PartitionLine,
} from "./types";
import { GravelSplitError } from "./types";
import { normalizeCurve, dAt, type NormalizedCurve } from "./granuloCurve";
import { buildReferenceCurve, sampleReferenceCurve } from "./referenceCurve";
import { computeCutoffs, cutoffsToProportions, type NamedCurve } from "./pairwiseSplit";

export * from "./types";
export { buildReferenceCurve, sampleReferenceCurve } from "./referenceCurve";

function validateInput(input: SplitGravelsInput): void {
  if (!input || !Array.isArray(input.gravillons)) {
    throw new GravelSplitError("INPUT_INVALID", "Entrée invalide.");
  }
  const n = input.gravillons.length;
  if (n < 2 || n > 4) {
    throw new GravelSplitError(
      "GRAVELS_COUNT_OUT_OF_RANGE",
      `Nombre de gravillons hors méthode Dreux-Gorisse : ${n} (attendu 2 à 4).`
    );
  }
  for (let i = 1; i < n; i++) {
    if (!(input.gravillons[i].dmax_mm > input.gravillons[i - 1].dmax_mm)) {
      throw new GravelSplitError(
        "GRAVELS_DMAX_NOT_STRICTLY_INCREASING",
        `Gravillons mal classés : "${input.gravillons[i - 1].nom}" (Dmax=${input.gravillons[i - 1].dmax_mm}) doit précéder "${input.gravillons[i].nom}" (Dmax=${input.gravillons[i].dmax_mm}).`
      );
    }
  }
}

export function splitGravels(input: SplitGravelsInput): SplitGravelsOutput {
  validateInput(input);

  const warnings: string[] = [];

  // 1. Courbe de référence OAB
  const refCurve = buildReferenceCurve(input.dmax_mm, input.K);

  // 2. Normalisation des courbes granulo brutes
  const named: NamedCurve[] = input.gravillons.map((g: GravillonInput) => ({
    nom: g.nom,
    dmax_mm: g.dmax_mm,
    curve: normalizeCurve(g.tamis, g.nom),
  }));

  // 3. Cas trivial : 1 gravillon → 100 % (non atteignable ici car validé ≥ 2)
  //    Géré en amont par l'appelant si besoin.

  // 4. Avertissement chevauchement granulaire (non bloquant, spec §9.9)
  for (let i = 0; i < named.length - 1; i++) {
    try {
      const d95 = dAt(95, named[i].curve, named[i].nom);
      const d05 = dAt(5, named[i + 1].curve, named[i + 1].nom);
      if (!(d95 < d05)) {
        warnings.push(
          `Chevauchement granulaire entre "${named[i].nom}" et "${named[i + 1].nom}" : d95=${d95.toFixed(2)} mm ≥ d05=${d05.toFixed(2)} mm.`
        );
      }
    } catch {
      // Ignoré ici, l'erreur sera relevée par computeCutoffs si nécessaire.
    }
  }

  // 5. Lignes de partage + intersections OAB
  const { cutoffs, partition_lines } = computeCutoffs(named, refCurve);

  // 6. Conversion en proportions (Σ = 100 % par construction, pas de renorm)
  const propsArr = cutoffsToProportions(cutoffs, named.length);

  // 7. Contrôle strict : chaque proportion > 0 (spec §9.7)
  for (let i = 0; i < propsArr.length; i++) {
    if (!(propsArr[i] > 0)) {
      throw new GravelSplitError(
        "PROPORTION_NOT_POSITIVE",
        `Proportion non strictement positive pour "${named[i].nom}" : ${propsArr[i].toFixed(4)} %.\n` +
        `Cause probable : ordonnée de partage adjacente identique, ou courbes incompatibles.`,
        { proportions: propsArr.map((p, idx) => ({ nom: named[idx].nom, pct: p })) }
      );
    }
  }

  // 8. Avertissement extension logique pour n ≥ 3 (spec §8)
  if (named.length >= 3) {
    warnings.push(
      `Répartition pour ${named.length} gravillons : extension logique de la règle 95/5 (non démontrée explicitement par le document de référence).`
    );
  }

  return {
    proportions: named.map((g, i) => ({ nom: g.nom, pct: propsArr[i] })),
    cutoffs,
    partition_lines,
    reference_curve: sampleReferenceCurve(refCurve, 80),
    warnings,
  };
}

/** Réexport pratique pour les tests. */
export { GravelSplitError };
export type { NormalizedCurve, CutoffPoint, PartitionLine };
