import type { CarotteEvaluee } from "./types";

/**
 * Niveau 1 — description des essais individuels.
 * PURE INFORMATION : l'EN 13791 (2007 comme 2019) ne définit
 * AUCUN critère de conformité carotte par carotte. Seule la
 * valeur la plus faible de la campagne est soumise à un critère,
 * traité au niveau 2/3 par l'évaluateur de version.
 */
export function buildNiveau1(carottes: CarotteEvaluee[]) {
  const valides = carottes.filter((c) => c.statut === "valide" && c.fcorr !== null && isFinite(c.fcorr));
  const lowest = valides.length ? Math.min(...valides.map((c) => c.fcorr as number)) : null;

  return carottes.map((c) => {
    if (c.statut === "exclue") {
      return { reference: c.reference, statut: "Exclue", commentaire: c.motif_exclusion || "Motif non précisé" };
    }
    if (c.statut === "a_examiner") {
      return { reference: c.reference, statut: "À examiner", commentaire: "Décision requise avant analyse normative" };
    }
    if (c.fcorr === null || !isFinite(c.fcorr)) {
      return { reference: c.reference, statut: "Donnée manquante", commentaire: "fcorr 16×32 non disponible" };
    }
    const isLowest = lowest !== null && c.fcorr === lowest;
    return {
      reference: c.reference,
      statut: isLowest ? "Retenue — valeur la plus faible (fis,lowest)" : "Retenue",
      commentaire: `fcorr 16×32 = ${c.fcorr.toFixed(2)} MPa (résultat individuel, non soumis à un critère normatif)`,
    };
  });
}
