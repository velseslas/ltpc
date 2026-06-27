/**
 * Validation contre l'exemple numérique du document de référence Dreux-Gorisse.
 *
 * Conformément à la règle 1 imposée par le métier (cf. message de validation) :
 *   « Avant toute généralisation, le nouveau moteur doit reproduire
 *     fidèlement l'exemple numérique fourni dans le document de référence.
 *     Si ce test échoue, interrompre l'implémentation et signaler l'écart. »
 *
 * ⚠️ ÉTAT ACTUEL : les valeurs numériques attendues n'ont PAS été fournies
 * (seul le graphique du livre a été partagé). Le slot ci-dessous doit être
 * complété manuellement à partir du tableau de l'exemple du livre, puis ce
 * fichier devra s'exécuter sans erreur avant toute mise en production.
 *
 * Tant que `EXPECTED_PROPORTIONS_PCT` n'est pas renseigné, `runDocumentExampleValidation()`
 * renvoie un statut `pending` (et NON `passed`) — c'est intentionnel.
 */

import type { SplitGravelsInput, SplitGravelsOutput } from "./types";
import { splitGravels } from "./index";

export interface DocumentExampleCase {
  /** Référence interne (ex: "Dreux-Gorisse, exemple chapitre X p.Y"). */
  reference: string;
  input: SplitGravelsInput;
  /** Proportions attendues par gravillon, dans l'ordre d'`input.gravillons`. */
  expected_pct: number[];
  /** Tolérance absolue (en points de %) liée aux interpolations graphiques. */
  tolerance_pct: number;
}

/**
 * À COMPLÉTER avec les données réelles du document de référence.
 * Schéma fourni à titre indicatif (1 sable + 2 gravillons, cas standard du livre).
 */
export const DOCUMENT_EXAMPLE: DocumentExampleCase | null = null;
// Exemple de structure attendue (à remplir par le métier) :
// export const DOCUMENT_EXAMPLE: DocumentExampleCase = {
//   reference: "Dreux-Gorisse, exemple p.XX",
//   input: {
//     dmax_mm: 20,
//     K: -2, // G' + correction MF
//     gravillons: [
//       { nom: "Gravillon 5/12", dmax_mm: 12.5, tamis: [
//         { ouverture_mm: 4,    passant_pct:  2 },
//         { ouverture_mm: 5,    passant_pct: 10 },
//         { ouverture_mm: 6.3,  passant_pct: 45 },
//         { ouverture_mm: 8,    passant_pct: 80 },
//         { ouverture_mm: 10,   passant_pct: 95 },
//         { ouverture_mm: 12.5, passant_pct: 100 },
//       ]},
//       { nom: "Gravillon 12/20", dmax_mm: 20, tamis: [
//         { ouverture_mm: 8,    passant_pct:  2 },
//         { ouverture_mm: 10,   passant_pct:  8 },
//         { ouverture_mm: 12.5, passant_pct: 40 },
//         { ouverture_mm: 16,   passant_pct: 80 },
//         { ouverture_mm: 20,   passant_pct: 100 },
//       ]},
//     ],
//   },
//   expected_pct: [42, 58], // À renseigner depuis le tableau du livre
//   tolerance_pct: 1.5,
// };

export type ValidationStatus = "pending" | "passed" | "failed";

export interface ValidationReport {
  status: ValidationStatus;
  message: string;
  case?: DocumentExampleCase;
  actual_pct?: number[];
  deviations_pct?: number[];
  output?: SplitGravelsOutput;
}

export function runDocumentExampleValidation(): ValidationReport {
  if (!DOCUMENT_EXAMPLE) {
    return {
      status: "pending",
      message:
        "Validation document de référence en attente : les valeurs numériques de l'exemple " +
        "(input granulométrique + proportions attendues) n'ont pas été fournies. " +
        "Compléter DOCUMENT_EXAMPLE dans documentExampleValidation.ts avant mise en production.",
    };
  }

  const out = splitGravels(DOCUMENT_EXAMPLE.input);
  const actual = out.proportions.map(p => p.pct);
  const deviations = actual.map((v, i) => Math.abs(v - DOCUMENT_EXAMPLE.expected_pct[i]));
  const maxDev = Math.max(...deviations);

  if (maxDev <= DOCUMENT_EXAMPLE.tolerance_pct) {
    return {
      status: "passed",
      message: `Reproduction de l'exemple "${DOCUMENT_EXAMPLE.reference}" : écart max ${maxDev.toFixed(2)} % ≤ tolérance ${DOCUMENT_EXAMPLE.tolerance_pct} %.`,
      case: DOCUMENT_EXAMPLE,
      actual_pct: actual,
      deviations_pct: deviations,
      output: out,
    };
  }

  return {
    status: "failed",
    message:
      `ÉCHEC reproduction "${DOCUMENT_EXAMPLE.reference}" : écart max ${maxDev.toFixed(2)} % > tolérance ${DOCUMENT_EXAMPLE.tolerance_pct} %.\n` +
      `Attendu : [${DOCUMENT_EXAMPLE.expected_pct.map(v => v.toFixed(2)).join(", ")}]\n` +
      `Obtenu  : [${actual.map(v => v.toFixed(2)).join(", ")}]\n` +
      `IMPLÉMENTATION À INTERROMPRE — investiguer avant toute mise en production.`,
    case: DOCUMENT_EXAMPLE,
    actual_pct: actual,
    deviations_pct: deviations,
    output: out,
  };
}
