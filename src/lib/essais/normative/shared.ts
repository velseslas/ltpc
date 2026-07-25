import { verifierDomaine } from "./domaine";
import { getObjectif, type CarotteEvaluee, type EvaluationInput, type ModeAnalyse } from "./types";

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
    if (c.statut === "hors_domaine") {
      return {
        reference: c.reference,
        statut: "Hors domaine d'application",
        commentaire: (c.motifs_domaine && c.motifs_domaine.length ? c.motifs_domaine.join(" ; ") : c.motif_exclusion) || "Carotte hors du domaine d'application de la procédure",
      };
    }
    if (c.statut === "a_examiner") {
      return {
        reference: c.reference,
        statut: "À examiner",
        commentaire: c.motifs_domaine?.length
          ? `Décision requise — ${c.motifs_domaine.join(" ; ")}`
          : "Décision requise avant analyse normative",
      };
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

export interface CampagnePreparee {
  carottes: CarotteEvaluee[];
  valides: CarotteEvaluee[];
  exclues: CarotteEvaluee[];
  aExaminer: CarotteEvaluee[];
  horsDomaine: CarotteEvaluee[];
  avertissements: string[];
}

/**
 * Contrôle du domaine d'application (A-3) appliqué AVANT tout calcul,
 * quelle que soit la version normative.
 *  - "hors_domaine" est toujours prioritaire sur le choix de l'utilisateur ;
 *  - un doute de domaine dégrade une carotte non explicitement validée en "à examiner" ;
 *  - une carotte explicitement validée conserve ses motifs sous forme d'avertissement.
 */
export function prepareCampagne(input: EvaluationInput): CampagnePreparee {
  const dmax = input.dmax ?? null;
  const avertissements: string[] = [];

  const carottes = input.carottes.map((c) => {
    if (c.statut === "exclue") return { ...c, motifs_domaine: [] };
    const d = verifierDomaine({ ...c, dmax }, dmax);
    if (d.statut === "hors_domaine") {
      return { ...c, statut: "hors_domaine" as const, motifs_domaine: d.motifs };
    }
    if (d.statut === "a_examiner" && c.statut !== "valide") {
      return { ...c, statut: "a_examiner" as const, motifs_domaine: d.motifs };
    }
    if (d.statut === "a_examiner" && c.statut === "valide") {
      avertissements.push(`Carotte ${c.reference} retenue malgré une réserve de domaine : ${d.motifs.join(" ; ")}`);
      return { ...c, motifs_domaine: d.motifs };
    }
    return { ...c, motifs_domaine: [] };
  });

  const valides = carottes.filter((c) => c.statut === "valide");
  const exclues = carottes.filter((c) => c.statut === "exclue");
  const aExaminer = carottes.filter((c) => c.statut === "a_examiner");
  const horsDomaine = carottes.filter((c) => c.statut === "hors_domaine");

  if (horsDomaine.length) {
    avertissements.push(
      `${horsDomaine.length} carotte(s) écartée(s) du calcul normatif car hors du domaine d'application : ${horsDomaine
        .map((c) => `${c.reference} (${c.motifs_domaine?.join(" ; ") || "motif non précisé"})`)
        .join(" | ")}`,
    );
  }
  if (aExaminer.length) {
    avertissements.push(
      `${aExaminer.length} carotte(s) au statut « à examiner » ne sont pas intégrées au calcul tant qu'elles n'ont pas été explicitement validées.`,
    );
  }
  if (dmax === null) {
    avertissements.push("Dmax du granulat non renseigné — la condition Ø ≥ 3·Dmax n'a pas pu être vérifiée.");
  }

  return { carottes, valides, exclues, aExaminer, horsDomaine, avertissements };
}

/** Avertissement petit échantillon (priorité 9) — non bloquant, jamais transformé en non-conformité. */
export function avertissementPetitEchantillon(n: number): string | null {
  if (n <= 0) return null;
  if (n <= 5) {
    return `ATTENTION — Évaluation basée sur seulement ${n} carotte(s). La dispersion statistique et la représentativité du résultat doivent être examinées avec prudence.`;
  }
  if (n < 8) {
    return `ATTENTION — Échantillon réduit (${n} carottes). La représentativité statistique du résultat doit être examinée avec prudence.`;
  }
  return null;
}

/**
 * Nature de l'analyse (A-1) :
 *  - objectif de conformité (A, D) → analyse de conformité, classe obligatoire ;
 *  - objectif d'estimation (B, C, E) → estimation de fck,is ; la conformité n'est
 *    évaluée que si une valeur de référence (fck) est effectivement disponible.
 */
export function resolveAnalyse(objectif: EvaluationInput["objectif"], fckCyl: number | null) {
  const obj = getObjectif(objectif);
  const mode: ModeAnalyse = obj?.mode ?? "conformite";
  const classeObligatoire = obj?.classeObligatoire ?? true;
  const evaluerConformite = fckCyl !== null;
  return { objectifDef: obj, mode, classeObligatoire, evaluerConformite, estimationSeule: !evaluerConformite };
}
