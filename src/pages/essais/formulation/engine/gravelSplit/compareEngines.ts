/**
 * Mode de comparaison entre :
 *   - le moteur historique (solveur par moindres carrés pondérés Dreux),
 *   - le nouveau moteur graphique (règle 95/5).
 *
 * Conformément à la règle 2 imposée par le métier (migration progressive) :
 *   le moteur historique reste présent pendant la phase de validation
 *   et peut être supprimé uniquement après recette sur des formulations
 *   réelles du laboratoire.
 *
 * Ce module est un comparateur PURE : il n'écrit rien, ne déclenche pas
 * d'erreur, et collecte les écarts entre les deux moteurs sur la part
 * gravillon. Il est destiné à être appelé depuis la UI (panneau debug)
 * ou un script de recette.
 */

import type { SplitGravelsInput, SplitGravelsOutput, GravelProportion } from "./types";
import { splitGravels, GravelSplitError } from "./index";

export type EngineMode = "legacy" | "graphical" | "compare";

export interface LegacyProportionsProvider {
  /**
   * Renvoie les proportions volumiques (en %) du moteur historique,
   * dans le même ordre que `input.gravillons`. Le caller (ex:
   * `dreuxGorisseCalculation.distributeGravel`) est responsable de la
   * conversion depuis ses masses internes.
   */
  (input: SplitGravelsInput): { proportions: GravelProportion[] } | null;
}

export interface CompareResult {
  graphical: SplitGravelsOutput | null;
  graphicalError?: { code: string; message: string };
  legacy: { proportions: GravelProportion[] } | null;
  /** Écarts absolus (points de %) gravillon par gravillon, indexés par nom. */
  deviations_pct: Record<string, number>;
  /** Écart maximum (points de %). */
  max_deviation_pct: number;
}

export function compareEngines(
  input: SplitGravelsInput,
  legacyProvider: LegacyProportionsProvider
): CompareResult {
  let graphical: SplitGravelsOutput | null = null;
  let graphicalError: CompareResult["graphicalError"];
  try {
    graphical = splitGravels(input);
  } catch (e) {
    if (e instanceof GravelSplitError) {
      graphicalError = { code: e.code, message: e.message };
    } else {
      graphicalError = { code: "UNKNOWN", message: (e as Error).message };
    }
  }

  const legacy = legacyProvider(input);
  const deviations: Record<string, number> = {};
  let maxDev = 0;

  if (graphical && legacy) {
    const legacyMap = new Map(legacy.proportions.map(p => [p.nom, p.pct]));
    for (const g of graphical.proportions) {
      const l = legacyMap.get(g.nom) ?? 0;
      const d = Math.abs(g.pct - l);
      deviations[g.nom] = d;
      if (d > maxDev) maxDev = d;
    }
  }

  return {
    graphical,
    graphicalError,
    legacy,
    deviations_pct: deviations,
    max_deviation_pct: maxDev,
  };
}
