/**
 * ─────────────────────────────────────────────────────────────
 * EN13791_2007_Evaluator — EN 13791:2007
 * ─────────────────────────────────────────────────────────────
 * Encapsule EXCLUSIVEMENT les règles de la version 2007.
 * Aucune formule, aucun seuil, aucune clause de la version 2019
 * n'est référencé ici.
 *
 * § 7.3.2 (Approche 1, n ≥ 15) : fck,is = min(fm(n),is − 1,48·s ; fis,lowest + 4), s ≥ 2 MPa
 * § 7.3.3 (Approche 2, 3 ≤ n ≤ 14) : fck,is = min(fm(n),is − k ; fis,lowest + 4), k = 7/6/5
 * § 8.1 (conformité à une classe) :
 *     fm(n),is     ≥ 0,85 × (fck + M)   avec M = 4 (Approche 1) ou M = k (Approche 2)
 *     fis,lowest   ≥ 0,85 × (fck − 4)
 */
import { buildNiveau1 } from "./shared";
import {
  CLASSES_BETON_EVAL,
  computeStatistiques,
  type CritereNormatif,
  type EvaluationInput,
  type EvaluationResultat,
  type NormativeEvaluator,
  type NormeNormative,
  type VerdictNormatif,
} from "./types";

const NORME_CODE = "EN13791-2007";
const NORME_LABEL = "EN 13791";
const VERSION = "2007";

export const NORME_2007: NormeNormative = {
  code: NORME_CODE,
  nom: "EN 13791:2007 — Évaluation de la résistance à la compression sur site des structures et éléments préfabriqués en béton",
  version: VERSION,
  date: "2007",
  procedures: [
    {
      code: "EN13791-2007-A",
      label: "Approche 1 — au moins 15 carottes (estimation avec écart-type)",
      clause: "§ 7.3.2 + § 8.1",
      nMin: 15,
      objectifs: ["A", "B", "C", "D", "E"],
      critere85: true,
    },
    {
      code: "EN13791-2007-B",
      label: "Approche 2 — de 3 à 14 carottes (marge k forfaitaire)",
      clause: "§ 7.3.3 + § 8.1",
      nMin: 3,
      nMax: 14,
      objectifs: ["A", "B", "C", "D", "E"],
      critere85: true,
    },
  ],
};

/** EN 13791:2007 § 7.3.3 — marge k forfaitaire (Approche 2) */
export function margeK2007(n: number): number | null {
  if (n >= 10 && n <= 14) return 5;
  if (n >= 7 && n <= 9) return 6;
  if (n >= 3 && n <= 6) return 7;
  return null;
}

const critere = (
  libelle: string,
  clause: string,
  formule: string,
  valeurCalculee: number | null,
  valeurExigee: number | null,
  unite: string,
  resultat: CritereNormatif["resultat"],
  commentaire?: string,
): CritereNormatif => ({
  libelle,
  norme: NORME_LABEL,
  version: VERSION,
  clause,
  formule,
  reference: `${NORME_LABEL}:${VERSION} ${clause}`,
  valeurCalculee,
  valeurExigee,
  unite,
  resultat,
  commentaire,
});

function evaluate(input: EvaluationInput): EvaluationResultat {
  const procedure = NORME_2007.procedures.find((p) => p.code === input.procedureCode) ?? null;
  const cls = input.classeBeton ? CLASSES_BETON_EVAL[input.classeBeton] ?? null : null;
  // Carottes cylindriques 16×32 → grandeur de référence = fck,cylindre
  const fckCyl = cls?.cyl ?? null;
  const fckCube = cls?.cube ?? null;

  const carottesValides = input.carottes.filter((c) => c.statut === "valide");
  const carottesExclues = input.carottes.filter((c) => c.statut === "exclue");
  const carottesAExaminer = input.carottes.filter((c) => c.statut === "a_examiner");

  const valeurs = carottesValides.map((c) => c.fcorr ?? NaN).filter((v) => isFinite(v) && v > 0);
  const statistiques = computeStatistiques(valeurs);

  const donneesManquantes: string[] = [];
  if (!procedure) donneesManquantes.push("Procédure normative non sélectionnée");
  if (!statistiques) donneesManquantes.push("Aucune carotte valide avec une résistance corrigée fcorr 16×32");
  if (fckCyl === null) donneesManquantes.push("Classe de béton spécifiée (fck cylindre) non renseignée");
  if (procedure && statistiques && statistiques.n < procedure.nMin) {
    donneesManquantes.push(
      `Nombre de résultats insuffisant : ${statistiques.n} carotte(s) valide(s) pour un minimum de ${procedure.nMin} exigé par ${NORME_LABEL}:${VERSION} ${procedure.clause}`,
    );
  }
  if (procedure?.nMax && statistiques && statistiques.n > procedure.nMax) {
    donneesManquantes.push(
      `Nombre de résultats (${statistiques.n}) supérieur au domaine d'application de la procédure (max ${procedure.nMax}) — utiliser l'Approche 1`,
    );
  }

  // ── Marge M de la clause § 8.1 (dépend de la procédure) ──
  let margeM: number | null = null;
  let margeMDetail = "";
  if (procedure && statistiques) {
    if (procedure.code === "EN13791-2007-A") {
      margeM = 4;
      margeMDetail = "M = 4 MPa (Approche 1, n ≥ 15)";
    } else {
      margeM = margeK2007(statistiques.n);
      margeMDetail = margeM === null ? "" : `M = k = ${margeM} MPa (n = ${statistiques.n})`;
    }
  }

  // ── Estimation fck,is (§ 7.3) ──
  let fckIs: number | null = null;
  let fckIsDetail: string | null = null;
  if (procedure && statistiques && donneesManquantes.length === 0) {
    if (procedure.code === "EN13791-2007-A") {
      const s = Math.max(statistiques.ecartType, 2);
      const a = statistiques.moyenne - 1.48 * s;
      const b = statistiques.min + 4;
      fckIs = Math.min(a, b);
      fckIsDetail = `§ 7.3.2 : min(fm − 1,48·s ; fis,lowest + 4) = min(${a.toFixed(2)} ; ${b.toFixed(2)}) avec s = ${s.toFixed(2)} MPa (s ≥ 2 MPa)`;
    } else {
      const k = margeK2007(statistiques.n);
      if (k === null) {
        donneesManquantes.push("Nombre de résultats hors du domaine de la marge k (3 à 14)");
      } else {
        const a = statistiques.moyenne - k;
        const b = statistiques.min + 4;
        fckIs = Math.min(a, b);
        fckIsDetail = `§ 7.3.3 : min(fm − k ; fis,lowest + 4) = min(${a.toFixed(2)} ; ${b.toFixed(2)}) avec k = ${k} MPa (n = ${statistiques.n})`;
      }
    }
  }

  // ── Seuils § 8.1 (2007) ──
  const applique85 = !!procedure?.critere85 && fckCyl !== null;
  const seuilMoyenne = applique85 && margeM !== null ? 0.85 * (fckCyl + margeM) : null;
  const seuilLowest = applique85 ? 0.85 * (fckCyl - 4) : null;
  const seuil85Detail =
    seuilMoyenne !== null
      ? `0,85 × (fck + M) = 0,85 × (${fckCyl} + ${margeM}) = ${seuilMoyenne.toFixed(2)} MPa — ${margeMDetail}`
      : null;

  const criteres: CritereNormatif[] = [];

  if (statistiques) {
    criteres.push(
      critere(
        `Nombre de résultats valides (n ≥ ${procedure?.nMin ?? "—"})`,
        procedure?.clause ?? "§ 7.3",
        `n ≥ ${procedure?.nMin ?? "—"}`,
        statistiques.n,
        procedure?.nMin ?? null,
        "carottes",
        procedure ? (statistiques.n >= procedure.nMin ? "ok" : "ko") : "na",
      ),
    );
  }

  if (statistiques && seuilMoyenne !== null) {
    criteres.push(
      critere(
        "Résistance moyenne in situ fm(n),is ≥ 0,85 × (fck + M)",
        "§ 8.1",
        "fm(n),is ≥ 0,85 × (fck + M)",
        statistiques.moyenne,
        seuilMoyenne,
        "MPa",
        statistiques.moyenne >= seuilMoyenne ? "ok" : "ko",
        margeMDetail,
      ),
    );
  }

  if (statistiques && seuilLowest !== null) {
    criteres.push(
      critere(
        "Valeur individuelle la plus faible fis,lowest ≥ 0,85 × (fck − 4)",
        "§ 8.1",
        "fis,lowest ≥ 0,85 × (fck − 4)",
        statistiques.min,
        seuilLowest,
        "MPa",
        statistiques.min >= seuilLowest ? "ok" : "ko",
      ),
    );
  }

  if (fckIs !== null) {
    criteres.push(
      critere(
        "Résistance caractéristique in situ estimée fck,is (information)",
        procedure?.code === "EN13791-2007-A" ? "§ 7.3.2" : "§ 7.3.3",
        procedure?.code === "EN13791-2007-A"
          ? "fck,is = min(fm − 1,48·s ; fis,lowest + 4)"
          : "fck,is = min(fm − k ; fis,lowest + 4)",
        fckIs,
        null,
        "MPa",
        "na",
        fckIsDetail ?? undefined,
      ),
    );
  }

  if (statistiques) {
    criteres.push(
      critere("Dispersion — coefficient de variation (information)", "§ 7.1", "CV = s / fm × 100", statistiques.coefVariation, null, "%", "na"),
    );
  }

  const niveau1 = buildNiveau1(input.carottes);

  let verdict: VerdictNormatif;
  let conclusion: string;
  const evaluables = criteres.filter((c) => c.resultat !== "na");
  const echecs = evaluables.filter((c) => c.resultat === "ko");

  if (donneesManquantes.length > 0 || seuilMoyenne === null || seuilLowest === null) {
    verdict = "non_concluant";
    conclusion =
      "Évaluation impossible / données insuffisantes selon EN 13791:2007. Les critères de la procédure sélectionnée ne peuvent pas être appliqués : " +
      (donneesManquantes.length ? donneesManquantes.join(" ; ") : "seuils de conformité § 8.1 non calculables") +
      ".";
  } else if (echecs.length === 0) {
    if (carottesAExaminer.length > 0) {
      verdict = "a_approfondir";
      conclusion = `Tous les critères applicables d'EN 13791:2007 (${procedure?.clause}) sont satisfaits sur les ${statistiques?.n} carottes retenues, mais ${carottesAExaminer.length} carotte(s) restent au statut « à examiner ». Une investigation complémentaire est recommandée avant conclusion définitive.`;
    } else {
      verdict = "conforme";
      conclusion = `Tous les critères d'EN 13791:2007 § 8.1 sont satisfaits : fm(n),is = ${statistiques?.moyenne.toFixed(2)} MPa ≥ 0,85 × (fck + M) = ${seuilMoyenne.toFixed(2)} MPa et fis,lowest = ${statistiques?.min.toFixed(2)} MPa ≥ 0,85 × (fck − 4) = ${seuilLowest.toFixed(2)} MPa. La résistance caractéristique in situ estimée est fck,is = ${fckIs?.toFixed(2)} MPa (§ 7.3).`;
    }
  } else {
    verdict = "non_conforme";
    conclusion = `Le ou les critères suivants d'EN 13791:2007 (${procedure?.clause}) ne sont pas satisfaits : ${echecs
      .map((c) => `${c.libelle} — ${c.formule} (calculé ${c.valeurCalculee?.toFixed(2)} / exigé ${c.valeurExigee?.toFixed(2)})`)
      .join(" ; ")}. Le béton en place ne satisfait pas la classe spécifiée ${input.classeBeton ?? ""}.`;
  }

  return {
    norme: NORME_2007,
    procedure,
    fckCyl,
    fckCube,
    carottesValides,
    carottesExclues,
    carottesAExaminer,
    statistiques,
    fckIs,
    fckIsDetail,
    seuil85: seuilMoyenne,
    seuil85Detail,
    criteres,
    niveau1,
    verdict,
    conclusion,
    donneesManquantes,
  };
}

export const EN13791_2007_Evaluator: NormativeEvaluator = { norme: NORME_2007, evaluate };
