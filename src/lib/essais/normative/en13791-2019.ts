/**
 * ─────────────────────────────────────────────────────────────
 * EN13791_2019_Evaluator — EN 13791:2019
 * ─────────────────────────────────────────────────────────────
 * Encapsule EXCLUSIVEMENT les règles de la version 2019.
 * Aucune formule, aucun seuil, aucune clause de la version 2007
 * n'est référencé ici.
 *
 * § 8.1 (Approche A, n ≥ 15) : fck,is = min(fm(n),is − k2·s ; fis,lowest + 4)
 *        k2 = 1,48 ; s ≥ 3 MPa (valeur plancher 2019)
 * § 8.2 (Approche B, 8 ≤ n ≤ 14) : fck,is = min(fm(n),is − kn ; fis,lowest + 4)
 *        kn = 7 (n = 8-9) ; kn = 6 (n = 10-14)
 * § 9   (conformité à une classe) :
 *        fck,is     ≥ 0,85 × fck
 *        fis,lowest ≥ fck,is − 4
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

const NORME_CODE = "EN13791-2019";
const NORME_LABEL = "EN 13791";
const VERSION = "2019";

export const NORME_2019: NormeNormative = {
  code: NORME_CODE,
  nom: "EN 13791:2019 — Évaluation de la résistance à la compression sur site des structures et éléments préfabriqués en béton",
  version: VERSION,
  date: "2019",
  procedures: [
    {
      code: "EN13791-2019-A",
      label: "Approche A — au moins 15 carottes (estimation avec écart-type)",
      clause: "§ 8.1 + § 9",
      nMin: 15,
      objectifs: ["A", "B", "C", "D", "E"],
      critere85: true,
    },
    {
      code: "EN13791-2019-B",
      label: "Approche B — de 8 à 14 carottes (marge kn tabulée)",
      clause: "§ 8.2 + § 9",
      nMin: 8,
      nMax: 14,
      objectifs: ["A", "B", "C", "D", "E"],
      critere85: true,
    },
  ],
};

/** EN 13791:2019 § 8.2 — marge kn tabulée (Approche B) */
export function margeKn2019(n: number): number | null {
  if (n >= 10 && n <= 14) return 6;
  if (n >= 8 && n <= 9) return 7;
  return null;
}

/** EN 13791:2019 — écart-type plancher */
export const S_MIN_2019 = 3;

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
  const procedure = NORME_2019.procedures.find((p) => p.code === input.procedureCode) ?? null;
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
      `Nombre de résultats (${statistiques.n}) supérieur au domaine d'application de la procédure (max ${procedure.nMax}) — utiliser l'Approche A`,
    );
  }

  // ── Estimation fck,is (§ 8) ──
  let fckIs: number | null = null;
  let fckIsDetail: string | null = null;
  if (procedure && statistiques && donneesManquantes.length === 0) {
    if (procedure.code === "EN13791-2019-A") {
      const s = Math.max(statistiques.ecartType, S_MIN_2019);
      const a = statistiques.moyenne - 1.48 * s;
      const b = statistiques.min + 4;
      fckIs = Math.min(a, b);
      fckIsDetail = `§ 8.1 : min(fm − 1,48·s ; fis,lowest + 4) = min(${a.toFixed(2)} ; ${b.toFixed(2)}) avec s = ${s.toFixed(2)} MPa (s ≥ ${S_MIN_2019} MPa)`;
    } else {
      const kn = margeKn2019(statistiques.n);
      if (kn === null) {
        donneesManquantes.push("Nombre de résultats hors du domaine de la marge kn (8 à 14)");
      } else {
        const a = statistiques.moyenne - kn;
        const b = statistiques.min + 4;
        fckIs = Math.min(a, b);
        fckIsDetail = `§ 8.2 : min(fm − kn ; fis,lowest + 4) = min(${a.toFixed(2)} ; ${b.toFixed(2)}) avec kn = ${kn} MPa (n = ${statistiques.n})`;
      }
    }
  }

  // ── Seuils § 9 (2019) ──
  const applique85 = !!procedure?.critere85 && fckCyl !== null;
  const seuil85 = applique85 ? 0.85 * fckCyl : null;
  const seuil85Detail = seuil85 !== null ? `0,85 × fck = 0,85 × ${fckCyl} = ${seuil85.toFixed(2)} MPa` : null;

  const criteres: CritereNormatif[] = [];

  if (statistiques) {
    criteres.push(
      critere(
        `Nombre de résultats valides (n ≥ ${procedure?.nMin ?? "—"})`,
        procedure?.clause ?? "§ 8",
        `n ≥ ${procedure?.nMin ?? "—"}`,
        statistiques.n,
        procedure?.nMin ?? null,
        "carottes",
        procedure ? (statistiques.n >= procedure.nMin ? "ok" : "ko") : "na",
      ),
    );
  }

  if (fckIs !== null && seuil85 !== null) {
    criteres.push(
      critere(
        "Résistance caractéristique in situ fck,is ≥ 0,85 × fck",
        "§ 9",
        "fck,is ≥ 0,85 × fck",
        fckIs,
        seuil85,
        "MPa",
        fckIs >= seuil85 ? "ok" : "ko",
        fckIsDetail ?? undefined,
      ),
    );
  }

  if (fckIs !== null && statistiques) {
    const exige = fckIs - 4;
    criteres.push(
      critere(
        "Valeur individuelle la plus faible fis,lowest ≥ fck,is − 4",
        "§ 9",
        "fis,lowest ≥ fck,is − 4",
        statistiques.min,
        exige,
        "MPa",
        statistiques.min >= exige ? "ok" : "ko",
      ),
    );
  }

  if (statistiques) {
    criteres.push(critere("Résistance moyenne in situ fm(n),is (information)", "§ 8", "fm(n),is = Σ fcorr / n", statistiques.moyenne, null, "MPa", "na"));
    criteres.push(critere("Dispersion — coefficient de variation (information)", "§ 8", "CV = s / fm × 100", statistiques.coefVariation, null, "%", "na"));
  }

  const niveau1 = buildNiveau1(input.carottes);

  let verdict: VerdictNormatif;
  let conclusion: string;
  const evaluables = criteres.filter((c) => c.resultat !== "na");
  const echecs = evaluables.filter((c) => c.resultat === "ko");

  if (donneesManquantes.length > 0 || fckIs === null || seuil85 === null) {
    verdict = "non_concluant";
    conclusion =
      "Évaluation impossible / données insuffisantes selon EN 13791:2019. Les critères de la procédure sélectionnée ne peuvent pas être appliqués : " +
      (donneesManquantes.length ? donneesManquantes.join(" ; ") : "seuils de conformité § 9 non calculables") +
      ".";
  } else if (echecs.length === 0) {
    if (carottesAExaminer.length > 0) {
      verdict = "a_approfondir";
      conclusion = `Tous les critères applicables d'EN 13791:2019 (${procedure?.clause}) sont satisfaits sur les ${statistiques?.n} carottes retenues, mais ${carottesAExaminer.length} carotte(s) restent au statut « à examiner ». Une investigation complémentaire est recommandée avant conclusion définitive.`;
    } else {
      verdict = "conforme";
      conclusion = `Tous les critères d'EN 13791:2019 § 9 sont satisfaits : fck,is = ${fckIs.toFixed(2)} MPa ≥ 0,85 × fck = ${seuil85.toFixed(2)} MPa et fis,lowest = ${statistiques?.min.toFixed(2)} MPa ≥ fck,is − 4 = ${(fckIs - 4).toFixed(2)} MPa.`;
    }
  } else {
    verdict = "non_conforme";
    conclusion = `Le ou les critères suivants d'EN 13791:2019 (${procedure?.clause}) ne sont pas satisfaits : ${echecs
      .map((c) => `${c.libelle} — ${c.formule} (calculé ${c.valeurCalculee?.toFixed(2)} / exigé ${c.valeurExigee?.toFixed(2)})`)
      .join(" ; ")}. Le béton en place ne satisfait pas la classe spécifiée ${input.classeBeton ?? ""}.`;
  }

  return {
    norme: NORME_2019,
    procedure,
    fckCyl,
    fckCube,
    carottesValides,
    carottesExclues,
    carottesAExaminer,
    statistiques,
    fckIs,
    fckIsDetail,
    seuil85,
    seuil85Detail,
    criteres,
    niveau1,
    verdict,
    conclusion,
    donneesManquantes,
  };
}

export const EN13791_2019_Evaluator: NormativeEvaluator = { norme: NORME_2019, evaluate };
