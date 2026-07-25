/**
 * NormativeCoreEvaluationEngine — sélecteur de référentiel.
 *
 *   NormativeCoreEvaluationEngine
 *        ├── EN13791_2007_Evaluator
 *        └── EN13791_2019_Evaluator
 *
 * Le moteur ne contient AUCUNE règle normative : il se contente
 * de router l'évaluation vers l'évaluateur de la version choisie.
 * Une évaluation utilise donc TOUJOURS une seule version.
 */
import { EN13791_2007_Evaluator, NORME_2007 } from "./en13791-2007";
import { EN13791_2019_Evaluator, NORME_2019 } from "./en13791-2019";
import type { EvaluationInput, EvaluationResultat, NormativeEvaluator, NormeNormative } from "./types";

export * from "./types";
export * from "./domaine";
export { prepareCampagne, avertissementPetitEchantillon, resolveAnalyse } from "./shared";
export { EN13791_2007_Evaluator, NORME_2007, margeK2007 } from "./en13791-2007";
export { EN13791_2019_Evaluator, NORME_2019, margeKn2019, S_MIN_2019 } from "./en13791-2019";

export const EVALUATORS: Record<string, NormativeEvaluator> = {
  [NORME_2007.code]: EN13791_2007_Evaluator,
  [NORME_2019.code]: EN13791_2019_Evaluator,
};

/** Référentiels proposés (un seul est utilisable par évaluation). */
export const NORMES: NormeNormative[] = [NORME_2007, NORME_2019];

export const getNorme = (code: string): NormeNormative | null =>
  NORMES.find((n) => n.code === code) ?? null;

export const getProcedure = (normeCode: string, procCode: string) =>
  getNorme(normeCode)?.procedures.find((p) => p.code === procCode) ?? null;

export const getEvaluator = (normeCode: string): NormativeEvaluator | null =>
  EVALUATORS[normeCode] ?? null;

export function evaluateNormative(input: EvaluationInput): EvaluationResultat {
  const evaluator = getEvaluator(input.normeCode);
  if (!evaluator) {
    return {
      norme: null,
      procedure: null,
      fckCyl: null,
      fckCube: null,
      carottesValides: [],
      carottesExclues: [],
      carottesAExaminer: [],
      statistiques: null,
      fckIs: null,
      fckIsDetail: null,
      seuil85: null,
      seuil85Detail: null,
      criteres: [],
      niveau1: [],
      verdict: "non_concluant",
      conclusion: "Référentiel normatif non sélectionné ou inconnu. Choisir EN 13791:2007 ou EN 13791:2019.",
      donneesManquantes: ["Référentiel normatif (version) non sélectionné"],
    };
  }
  // Garde-fou anti-mélange : la procédure doit appartenir au référentiel choisi.
  const procedureValide = evaluator.norme.procedures.some((p) => p.code === input.procedureCode);
  if (input.procedureCode && !procedureValide) {
    return {
      ...evaluator.evaluate({ ...input, procedureCode: "" }),
      conclusion: `Procédure « ${input.procedureCode} » incompatible avec le référentiel ${evaluator.norme.nom}. Mélange de versions interdit.`,
      donneesManquantes: [`Procédure incompatible avec ${evaluator.norme.code}`],
      verdict: "non_concluant",
    };
  }
  return evaluator.evaluate(input);
}
