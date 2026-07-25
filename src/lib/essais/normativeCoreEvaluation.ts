/**
 * ─────────────────────────────────────────────────────────────
 * MODE B — NormativeCoreEvaluationEngine
 * ─────────────────────────────────────────────────────────────
 * Moteur d'ÉVALUATION NORMATIVE de la résistance du béton en place
 * à partir des résultats de carottage DÉJÀ CALCULÉS par le Mode A.
 *
 * RÈGLE ABSOLUE : ce moteur ne recalcule JAMAIS la résistance
 * physique d'une carotte (section, fcore, L/D, K, fcorr).
 * Il exploite uniquement la valeur corrigée fcorr 16×32 produite
 * par le Mode A (CarottageDataEntry / computeCarotte).
 *
 * Toute formule ou seuil est explicitement rattaché à :
 *   norme + version + clause.
 */

// ─────────────── Objectifs d'évaluation ───────────────
export type ObjectifCode = "A" | "B" | "C" | "D" | "E";

export const OBJECTIFS: { code: ObjectifCode; label: string; description: string }[] = [
  { code: "A", label: "Vérification de conformité d'un béton neuf / ouvrage en construction", description: "Le béton est récent et la classe spécifiée est connue." },
  { code: "B", label: "Évaluation de la résistance du béton en place", description: "Estimation de la résistance caractéristique in situ." },
  { code: "C", label: "Évaluation d'un ouvrage existant", description: "Ouvrage ancien, classe spécifiée parfois inconnue." },
  { code: "D", label: "Investigation suite à un doute sur la résistance", description: "Doute sur la conformité d'une zone identifiée." },
  { code: "E", label: "Diagnostic / expertise", description: "Contexte d'expertise, conclusions à argumenter." },
];

// ─────────────── Référentiel normatif ───────────────
export interface ProcedureNormative {
  code: string;
  label: string;
  clause: string;
  /** Nombre minimal de résultats valides exigé par la procédure */
  nMin: number;
  nMax?: number;
  /** L'objectif détermine les procédures proposées */
  objectifs: ObjectifCode[];
  /** Le critère des 85 % (fck,is ≥ 0,85·fck) est-il applicable ? */
  critere85: boolean;
}

export interface NormeNormative {
  code: string;
  nom: string;
  version: string;
  date: string;
  procedures: ProcedureNormative[];
}

/**
 * Référentiel extensible. Ajouter ici les normes nationales ou
 * les procédures internes du laboratoire — sans jamais mélanger
 * automatiquement les critères de deux normes différentes.
 */
export const NORMES: NormeNormative[] = [
  {
    code: "EN13791",
    nom: "EN 13791 — Évaluation de la résistance à la compression sur site des structures et éléments préfabriqués en béton",
    version: "2007",
    date: "2007",
    procedures: [
      {
        code: "EN13791-A",
        label: "Approche 1 — au moins 15 carottes (estimation avec écart-type)",
        clause: "§ 7.3.2 (Approche 1) + § 8.1 (comparaison à la classe)",
        nMin: 15,
        objectifs: ["A", "B", "C", "D", "E"],
        critere85: true,
      },
      {
        code: "EN13791-B",
        label: "Approche 2 — de 3 à 14 carottes (marge k forfaitaire)",
        clause: "§ 7.3.3 (Approche 2) + § 8.1 (comparaison à la classe)",
        nMin: 3,
        nMax: 14,
        objectifs: ["A", "B", "C", "D", "E"],
        critere85: true,
      },
    ],
  },
];

export const getNorme = (code: string) => NORMES.find((n) => n.code === code) ?? null;
export const getProcedure = (normeCode: string, procCode: string) =>
  getNorme(normeCode)?.procedures.find((p) => p.code === procCode) ?? null;

// ─────────────── Classes de béton (EN 206) ───────────────
export const CLASSES_BETON_EVAL: Record<string, { cyl: number; cube: number }> = {
  "C12/15": { cyl: 12, cube: 15 },
  "C16/20": { cyl: 16, cube: 20 },
  "C20/25": { cyl: 20, cube: 25 },
  "C25/30": { cyl: 25, cube: 30 },
  "C30/37": { cyl: 30, cube: 37 },
  "C35/45": { cyl: 35, cube: 45 },
  "C40/50": { cyl: 40, cube: 50 },
  "C45/55": { cyl: 45, cube: 55 },
  "C50/60": { cyl: 50, cube: 60 },
};

// ─────────────── Carottes en entrée ───────────────
export type StatutCarotte = "valide" | "a_examiner" | "exclue";

export const MOTIFS_EXCLUSION = [
  "Carotte endommagée",
  "Présence d'armature",
  "Défaut important",
  "Rupture anormale",
  "Problème de préparation",
  "Résultat non représentatif",
  "Autre",
];

export interface CarotteEvaluee {
  id: string;
  reference: string;
  emplacement: string;
  diametre: number | null;
  longueur: number | null;
  ld: number | null;
  fcore: number | null;
  k: number | null;
  fcorr: number | null;
  statut: StatutCarotte;
  motif_exclusion?: string;
}

// ─────────────── Statistiques ───────────────
export interface StatistiquesCampagne {
  n: number;
  moyenne: number;
  min: number;
  max: number;
  mediane: number;
  ecartType: number;
  coefVariation: number;
  etendue: number;
}

export function computeStatistiques(values: number[]): StatistiquesCampagne | null {
  const v = values.filter((x) => typeof x === "number" && isFinite(x) && x > 0).sort((a, b) => a - b);
  if (v.length === 0) return null;
  const n = v.length;
  const moyenne = v.reduce((a, b) => a + b, 0) / n;
  const mediane = n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2;
  // Écart-type d'échantillon (n-1) — nul si n < 2
  const ecartType = n > 1 ? Math.sqrt(v.reduce((a, b) => a + (b - moyenne) ** 2, 0) / (n - 1)) : 0;
  return {
    n,
    moyenne,
    min: v[0],
    max: v[n - 1],
    mediane,
    ecartType,
    coefVariation: moyenne > 0 ? (ecartType / moyenne) * 100 : 0,
    etendue: v[n - 1] - v[0],
  };
}

// ─────────────── Critères ───────────────
export type CritereResultat = "ok" | "ko" | "na";

export interface CritereNormatif {
  libelle: string;
  reference: string;
  valeurCalculee: number | null;
  valeurExigee: number | null;
  unite: string;
  resultat: CritereResultat;
  commentaire?: string;
}

export type VerdictNormatif = "conforme" | "non_conforme" | "non_concluant" | "a_approfondir";

export interface EvaluationInput {
  objectif: ObjectifCode;
  normeCode: string;
  procedureCode: string;
  classeBeton: string | null;
  carottes: CarotteEvaluee[];
}

export interface EvaluationResultat {
  norme: NormeNormative | null;
  procedure: ProcedureNormative | null;
  fckCyl: number | null;
  fckCube: number | null;
  carottesValides: CarotteEvaluee[];
  carottesExclues: CarotteEvaluee[];
  carottesAExaminer: CarotteEvaluee[];
  statistiques: StatistiquesCampagne | null;
  /** Résistance caractéristique in situ estimée (MPa) */
  fckIs: number | null;
  fckIsDetail: string | null;
  seuil85: number | null;
  criteres: CritereNormatif[];
  niveau1: { reference: string; statut: string; commentaire: string }[];
  verdict: VerdictNormatif;
  conclusion: string;
  donneesManquantes: string[];
}

/** EN 13791:2007 § 7.3.3 — marge k selon le nombre de résultats (Approche 2) */
function margeK(n: number): number | null {
  if (n >= 10 && n <= 14) return 5;
  if (n >= 7 && n <= 9) return 6;
  if (n >= 3 && n <= 6) return 7;
  return null;
}

/**
 * Moteur d'évaluation normative.
 * N'effectue aucun calcul de résistance physique.
 */
export function evaluateNormative(input: EvaluationInput): EvaluationResultat {
  const norme = getNorme(input.normeCode);
  const procedure = getProcedure(input.normeCode, input.procedureCode);
  const cls = input.classeBeton ? CLASSES_BETON_EVAL[input.classeBeton] ?? null : null;
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
      `Nombre de résultats insuffisant : ${statistiques.n} carotte(s) valide(s) pour un minimum de ${procedure.nMin} exigé par ${norme?.code} ${procedure.clause}`,
    );
  }
  if (procedure?.nMax && statistiques && statistiques.n > procedure.nMax) {
    donneesManquantes.push(
      `Nombre de résultats (${statistiques.n}) supérieur au domaine d'application de la procédure (max ${procedure.nMax}) — utiliser l'Approche 1`,
    );
  }

  // ── Valeur caractéristique in situ estimée (fck,is) ──
  let fckIs: number | null = null;
  let fckIsDetail: string | null = null;
  if (procedure && statistiques && donneesManquantes.length === 0) {
    if (procedure.code === "EN13791-A") {
      // EN 13791:2007 § 7.3.2 : fck,is = min( fm(n),is − 1,48·s ; f is,lowest + 4 ), s ≥ 2 MPa
      const s = Math.max(statistiques.ecartType, 2);
      const a = statistiques.moyenne - 1.48 * s;
      const b = statistiques.min + 4;
      fckIs = Math.min(a, b);
      fckIsDetail = `min(fm − 1,48·s ; fmin + 4) = min(${a.toFixed(2)} ; ${b.toFixed(2)}) avec s = ${s.toFixed(2)} MPa (s ≥ 2 MPa)`;
    } else if (procedure.code === "EN13791-B") {
      // EN 13791:2007 § 7.3.3 : fck,is = min( fm(n),is − k ; f is,lowest + 4 )
      const k = margeK(statistiques.n);
      if (k === null) {
        donneesManquantes.push("Nombre de résultats hors du domaine de la marge k (3 à 14)");
      } else {
        const a = statistiques.moyenne - k;
        const b = statistiques.min + 4;
        fckIs = Math.min(a, b);
        fckIsDetail = `min(fm − k ; fmin + 4) = min(${a.toFixed(2)} ; ${b.toFixed(2)}) avec k = ${k} MPa (n = ${statistiques.n})`;
      }
    }
  }

  // ── Seuil 85 % ──
  const seuil85 = procedure?.critere85 && fckCyl !== null ? 0.85 * fckCyl : null;

  // ── Critères ──
  const criteres: CritereNormatif[] = [];
  const ref = norme && procedure ? `${norme.code}:${norme.version} ${procedure.clause}` : "—";

  if (statistiques) {
    criteres.push({
      libelle: `Nombre de résultats valides (n ≥ ${procedure?.nMin ?? "—"})`,
      reference: ref,
      valeurCalculee: statistiques.n,
      valeurExigee: procedure?.nMin ?? null,
      unite: "carottes",
      resultat: procedure ? (statistiques.n >= procedure.nMin ? "ok" : "ko") : "na",
    });
  }

  if (fckIs !== null && seuil85 !== null) {
    criteres.push({
      libelle: "Résistance caractéristique in situ estimée fck,is ≥ 0,85 · fck,cyl",
      reference: `${norme?.code}:${norme?.version} § 8.1 (critère des 85 %)`,
      valeurCalculee: fckIs,
      valeurExigee: seuil85,
      unite: "MPa",
      resultat: fckIs >= seuil85 ? "ok" : "ko",
      commentaire: fckIsDetail ?? undefined,
    });
  }

  if (statistiques && fckCyl !== null && procedure) {
    // EN 13791:2007 § 8.1 — critère complémentaire sur la valeur individuelle la plus faible
    const exige = 0.85 * fckCyl - 4;
    criteres.push({
      libelle: "Valeur individuelle minimale ≥ 0,85 · fck,cyl − 4",
      reference: `${norme?.code}:${norme?.version} § 8.1`,
      valeurCalculee: statistiques.min,
      valeurExigee: exige,
      unite: "MPa",
      resultat: statistiques.min >= exige ? "ok" : "ko",
    });
    criteres.push({
      libelle: "Moyenne des résultats fm,is (information)",
      reference: `${norme?.code}:${norme?.version} § 7.1`,
      valeurCalculee: statistiques.moyenne,
      valeurExigee: null,
      unite: "MPa",
      resultat: "na",
    });
    criteres.push({
      libelle: "Dispersion — coefficient de variation (information)",
      reference: `${norme?.code}:${norme?.version} § 7.1`,
      valeurCalculee: statistiques.coefVariation,
      valeurExigee: null,
      unite: "%",
      resultat: "na",
    });
  }

  // ── Niveau 1 — essais individuels ──
  const niveau1 = input.carottes.map((c) => {
    if (c.statut === "exclue") {
      return { reference: c.reference, statut: "Exclue", commentaire: c.motif_exclusion || "Motif non précisé" };
    }
    if (c.statut === "a_examiner") {
      return { reference: c.reference, statut: "À examiner", commentaire: "Décision requise avant analyse normative" };
    }
    if (c.fcorr === null || !isFinite(c.fcorr)) {
      return { reference: c.reference, statut: "Donnée manquante", commentaire: "fcorr 16×32 non disponible" };
    }
    if (fckCyl === null) {
      return { reference: c.reference, statut: "Non évaluable", commentaire: "Classe de béton non renseignée" };
    }
    const seuilInd = 0.85 * fckCyl - 4;
    return c.fcorr >= seuilInd
      ? { reference: c.reference, statut: "Conforme au critère individuel", commentaire: `fcorr = ${c.fcorr.toFixed(2)} MPa ≥ ${seuilInd.toFixed(2)} MPa` }
      : { reference: c.reference, statut: "Non conforme au critère individuel", commentaire: `fcorr = ${c.fcorr.toFixed(2)} MPa < ${seuilInd.toFixed(2)} MPa` };
  });

  // ── Verdict niveau 3 ──
  let verdict: VerdictNormatif;
  let conclusion: string;

  if (donneesManquantes.length > 0 || fckIs === null) {
    verdict = "non_concluant";
    conclusion =
      "Évaluation impossible / données insuffisantes. Les critères de la procédure sélectionnée ne peuvent pas être appliqués : " +
      donneesManquantes.join(" ; ") + ".";
  } else {
    const evalues = criteres.filter((c) => c.resultat !== "na");
    const echecs = evalues.filter((c) => c.resultat === "ko");
    if (echecs.length === 0) {
      if (carottesAExaminer.length > 0) {
        verdict = "a_approfondir";
        conclusion = `Tous les critères applicables de ${norme?.code}:${norme?.version} (${procedure?.clause}) sont satisfaits sur les ${statistiques?.n} carottes retenues, mais ${carottesAExaminer.length} carotte(s) restent au statut « à examiner ». Une investigation complémentaire est recommandée avant conclusion définitive.`;
      } else {
        verdict = "conforme";
        conclusion = `Tous les critères applicables de ${norme?.code}:${norme?.version} (${procedure?.clause}) sont satisfaits. La résistance caractéristique in situ estimée est fck,is = ${fckIs.toFixed(2)} MPa, supérieure ou égale au seuil de 0,85 · fck,cyl = ${seuil85?.toFixed(2)} MPa.`;
      }
    } else {
      verdict = "non_conforme";
      conclusion = `Le ou les critères suivants ne sont pas satisfaits : ${echecs
        .map((c) => `${c.libelle} (calculé ${c.valeurCalculee?.toFixed(2)} / exigé ${c.valeurExigee?.toFixed(2)})`)
        .join(" ; ")}. Selon ${norme?.code}:${norme?.version} (${procedure?.clause}), le béton en place ne satisfait pas la classe spécifiée ${input.classeBeton ?? ""}.`;
    }
  }

  return {
    norme,
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
    criteres,
    niveau1,
    verdict,
    conclusion,
    donneesManquantes,
  };
}

export const VERDICT_LABELS: Record<VerdictNormatif, { label: string; emoji: string; className: string }> = {
  conforme: { label: "CONFORME", emoji: "🟢", className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/40" },
  non_concluant: { label: "NON CONCLUANT / DONNÉES INSUFFISANTES", emoji: "🟠", className: "bg-amber-500/15 text-amber-500 border-amber-500/40" },
  non_conforme: { label: "NON CONFORME", emoji: "🔴", className: "bg-destructive/15 text-destructive border-destructive/40" },
  a_approfondir: { label: "ÉVALUATION À APPROFONDIR", emoji: "🔵", className: "bg-sky-500/15 text-sky-500 border-sky-500/40" },
};
