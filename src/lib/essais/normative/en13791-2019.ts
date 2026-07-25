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
 *
 * ⚠ POINT A-2 EN ATTENTE DE VALIDATION HUMAINE :
 *   la chaîne d'entrée de cette version reste, à ce stade, celle
 *   du Mode A (fcorr 16×32 corrigée NF P18-418). Aucun calcul
 *   n'a été modifié ; l'hypothèse est signalée à l'utilisateur
 *   via `entreeAttendue` et un avertissement d'évaluation.
 *   Voir .lovable/audit-a2-nf-p18-418-en13791-2019.md
 */
import { avertissementPetitEchantillon, buildNiveau1, prepareCampagne, resolveAnalyse } from "./shared";
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
  entreeAttendue:
    "Résistance de carotte in situ (domaine 1,0 ≤ L/D ≤ 2,0). L'applicabilité de la correction d'élancement NF P18-418 en amont de cette version est en attente de validation normative (A-2) — la valeur actuellement consommée est fcorr 16×32 du Mode A.",
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
  const fckCyl = cls?.cyl ?? null;
  const fckCube = cls?.cube ?? null;

  const campagne = prepareCampagne(input);
  const { valides: carottesValides, exclues: carottesExclues, aExaminer: carottesAExaminer, horsDomaine: carottesHorsDomaine } = campagne;
  const avertissements = [...campagne.avertissements];

  const { mode, classeObligatoire, evaluerConformite, estimationSeule } = resolveAnalyse(input.objectif, fckCyl);

  const valeurs = carottesValides.map((c) => c.fcorr ?? NaN).filter((v) => isFinite(v) && v > 0);
  const statistiques = computeStatistiques(valeurs);

  const donneesManquantes: string[] = [];
  if (!procedure) donneesManquantes.push("Procédure normative non sélectionnée");
  if (!statistiques) donneesManquantes.push("Aucune carotte valide avec une résistance de référence exploitable");
  if (classeObligatoire && fckCyl === null) {
    donneesManquantes.push("Classe de béton spécifiée (fck cylindre) obligatoire pour l'objectif de conformité sélectionné");
  }
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

  if (statistiques) {
    const petit = avertissementPetitEchantillon(statistiques.n);
    if (petit) avertissements.push(petit);
  }
  avertissements.push(
    "A-2 (en attente de validation) — la résistance consommée est fcorr 16×32 corrigée NF P18-418 par le Mode A. L'applicabilité de cette correction en amont d'EN 13791:2019 n'est pas tranchée ; aucun calcul n'a été modifié.",
  );
  if (estimationSeule) {
    avertissements.push(
      "Aucune classe de béton spécifiée : analyse limitée à l'ESTIMATION de fck,is (§ 8). Les critères de conformité § 9 ne sont pas applicables.",
    );
  }

  // ── ESTIMATION — fck,is (§ 8) : indépendante de toute classe spécifiée ──
  let fckIs: number | null = null;
  let fckIsDetail: string | null = null;
  const bloquantEstimation = donneesManquantes.filter((d) => !d.startsWith("Classe de béton spécifiée"));
  if (procedure && statistiques && bloquantEstimation.length === 0) {
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

  // ── CONFORMITÉ — seuils § 9 (2019), uniquement si fck disponible ──
  const applique85 = !!procedure?.critere85 && evaluerConformite && fckCyl !== null;
  const seuil85 = applique85 && fckCyl !== null ? 0.85 * fckCyl : null;
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

  if (fckIs !== null && statistiques && evaluerConformite) {
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

  if (fckIs !== null && !evaluerConformite) {
    criteres.push(
      critere(
        "Résistance caractéristique in situ estimée fck,is (information)",
        procedure?.code === "EN13791-2019-A" ? "§ 8.1" : "§ 8.2",
        procedure?.code === "EN13791-2019-A" ? "fck,is = min(fm − 1,48·s ; fis,lowest + 4)" : "fck,is = min(fm − kn ; fis,lowest + 4)",
        fckIs,
        null,
        "MPa",
        "na",
        fckIsDetail ?? undefined,
      ),
    );
  }

  if (statistiques) {
    criteres.push(critere("Résistance moyenne in situ fm(n),is (information)", "§ 8", "fm(n),is = Σ fcorr / n", statistiques.moyenne, null, "MPa", "na"));
    criteres.push(critere("Dispersion — coefficient de variation (information)", "§ 8", "CV = s / fm × 100", statistiques.coefVariation, null, "%", "na"));
  }

  const niveau1 = buildNiveau1(campagne.carottes);

  let verdict: VerdictNormatif;
  let conclusion: string;
  const evaluables = criteres.filter((c) => c.resultat !== "na");
  const echecs = evaluables.filter((c) => c.resultat === "ko");

  const base = {
    norme: NORME_2019,
    procedure,
    typeAnalyse: mode,
    estimationSeule,
    fckCyl,
    fckCube,
    carottesValides,
    carottesExclues,
    carottesAExaminer,
    carottesHorsDomaine,
    statistiques,
    fckIs,
    fckIsDetail,
    seuil85,
    seuil85Detail,
    criteres,
    niveau1,
    donneesManquantes,
    avertissements,
  };

  // ── CAS 1 — Données insuffisantes ──
  if (donneesManquantes.length > 0 || fckIs === null) {
    verdict = "non_concluant";
    conclusion =
      "Évaluation impossible / données insuffisantes selon EN 13791:2019 : " +
      (donneesManquantes.length ? donneesManquantes.join(" ; ") : "fck,is non calculable") +
      ".";
    return { ...base, verdict, conclusion };
  }

  // ── CAS 2 — ESTIMATION SEULE ──
  if (estimationSeule) {
    verdict = "estimation";
    conclusion =
      `Résistance caractéristique in situ estimée : ${fckIs.toFixed(2)} MPa (EN 13791:2019 ${procedure?.code === "EN13791-2019-A" ? "§ 8.1" : "§ 8.2"}), ` +
      `à partir de ${statistiques?.n} carotte(s) retenue(s) — fm(n),is = ${statistiques?.moyenne.toFixed(2)} MPa, fis,lowest = ${statistiques?.min.toFixed(2)} MPa, ` +
      `s = ${statistiques?.ecartType.toFixed(2)} MPa (CV = ${statistiques?.coefVariation.toFixed(1)} %). ` +
      "Aucune classe de béton spécifiée n'ayant été fournie, AUCUNE évaluation de conformité n'est prononcée : ce résultat est une ESTIMATION de résistance et non un verdict de conformité." +
      (carottesAExaminer.length ? ` ${carottesAExaminer.length} carotte(s) restent au statut « à examiner ».` : "");
    return { ...base, verdict, conclusion };
  }

  // ── CAS 3 — ÉVALUATION DE CONFORMITÉ ──
  if (seuil85 === null) {
    verdict = "non_concluant";
    conclusion = "Seuils de conformité § 9 non calculables — évaluation de conformité impossible.";
    return { ...base, verdict, conclusion };
  }

  if (echecs.length === 0) {
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

  return { ...base, verdict, conclusion };
}

export const EN13791_2019_Evaluator: NormativeEvaluator = { norme: NORME_2019, evaluate };
