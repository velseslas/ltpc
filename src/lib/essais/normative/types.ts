/**
 * ─────────────────────────────────────────────────────────────
 * MODE B — Types partagés du moteur d'évaluation normative
 * ─────────────────────────────────────────────────────────────
 * RÈGLE ABSOLUE : aucun recalcul physique ici (section, fcore,
 * L/D, K, fcorr). Seul fcorr 16×32 produit par le Mode A est
 * consommé.
 *
 * RÈGLE DE NON-MÉLANGE : une évaluation utilise UN SEUL
 * évaluateur (2007 OU 2019). Les formules, seuils, coefficients
 * et clauses sont encapsulés dans l'évaluateur correspondant.
 */

export type ObjectifCode = "A" | "B" | "C" | "D" | "E";

/**
 * Deux natures d'analyse strictement distinctes (A-1) :
 *  - "conformite" : comparaison à une classe spécifiée → verdict CONFORME / NON CONFORME
 *  - "estimation" : estimation de la résistance caractéristique in situ → verdict ESTIMATION
 * Le verdict de conformité n'est jamais produit sans valeur de référence applicable.
 */
export type ModeAnalyse = "conformite" | "estimation";

export const OBJECTIFS: {
  code: ObjectifCode;
  label: string;
  description: string;
  mode: ModeAnalyse;
  /** La classe de béton spécifiée est-elle une donnée obligatoire ? */
  classeObligatoire: boolean;
}[] = [
  {
    code: "A",
    label: "Vérification de conformité d'un béton neuf / ouvrage en construction",
    description: "Le béton est récent et la classe spécifiée est connue. Analyse de CONFORMITÉ — la classe spécifiée est obligatoire.",
    mode: "conformite",
    classeObligatoire: true,
  },
  {
    code: "B",
    label: "Évaluation de la résistance du béton en place",
    description: "Analyse d'ESTIMATION de la résistance caractéristique in situ. La conformité n'est évaluée que si une classe spécifiée est renseignée.",
    mode: "estimation",
    classeObligatoire: false,
  },
  {
    code: "C",
    label: "Évaluation d'un ouvrage existant",
    description: "Ouvrage ancien, classe spécifiée souvent inconnue. Analyse d'ESTIMATION — un fck,is exploitable est produit même sans classe.",
    mode: "estimation",
    classeObligatoire: false,
  },
  {
    code: "D",
    label: "Investigation suite à un doute sur la résistance",
    description: "Doute sur la conformité d'une zone identifiée. Analyse de CONFORMITÉ — la classe spécifiée est obligatoire.",
    mode: "conformite",
    classeObligatoire: true,
  },
  {
    code: "E",
    label: "Diagnostic / expertise",
    description: "Contexte d'expertise. Analyse d'ESTIMATION — conclusions argumentées, verdict de conformité uniquement si une classe est renseignée.",
    mode: "estimation",
    classeObligatoire: false,
  },
];

export const getObjectif = (code: ObjectifCode | "" | null | undefined) =>
  OBJECTIFS.find((o) => o.code === code) ?? null;

export interface ProcedureNormative {
  code: string;
  label: string;
  clause: string;
  nMin: number;
  nMax?: number;
  objectifs: ObjectifCode[];
  critere85: boolean;
}

export interface NormeNormative {
  code: string;
  nom: string;
  version: string;
  date: string;
  /** Résistance attendue en entrée par le référentiel (traçabilité A-2) */
  entreeAttendue: string;
  procedures: ProcedureNormative[];
}

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

export type StatutCarotte = "valide" | "a_examiner" | "exclue" | "hors_domaine";

export const STATUT_LABELS: Record<StatutCarotte, { label: string; emoji: string; className: string }> = {
  valide: { label: "Valide", emoji: "🟢", className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/40" },
  a_examiner: { label: "À examiner", emoji: "🟠", className: "bg-amber-500/15 text-amber-500 border-amber-500/40" },
  hors_domaine: { label: "Hors domaine", emoji: "🔴", className: "bg-destructive/15 text-destructive border-destructive/40" },
  exclue: { label: "Exclue", emoji: "⚪", className: "bg-muted text-muted-foreground border-border" },
};

export const MOTIFS_EXCLUSION = [
  "Carotte endommagée",
  "Présence d'armature",
  "Défaut important",
  "Rupture anormale",
  "Problème de préparation",
  "Résultat non représentatif",
  "Diamètre insuffisant",
  "Dmax incompatible",
  "L/D hors domaine",
  "Données manquantes",
  "Autre",
];

/** Traçabilité complète d'une carotte (priorité 6). */
export interface CarotteEvaluee {
  /** Identifiant permanent issu du Mode A (jamais un index de tableau) */
  id: string;
  reference: string;
  emplacement: string;
  diametre: number | null;
  longueur: number | null;
  ld: number | null;
  /** Section mm² */
  section: number | null;
  /** Charge de rupture kN */
  charge: number | null;
  fcore: number | null;
  k: number | null;
  /** Méthode de correction d'élancement appliquée par le Mode A */
  k_methode?: string | null;
  k_methode_version?: string | null;
  fcorr: number | null;
  masse_volumique: number | null;
  date_essai?: string | null;
  /** Dmax du granulat (mm) — saisi au niveau de la campagne */
  dmax?: number | null;
  /** Présence d'armature détectée dans la carotte */
  armature?: boolean;
  statut: StatutCarotte;
  motif_exclusion?: string;
  /** Motifs issus du contrôle automatique du domaine d'application */
  motifs_domaine?: string[];
}


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

export type CritereResultat = "ok" | "ko" | "na";

/** Critère normatif entièrement tracé : norme + version + clause + formule. */
export interface CritereNormatif {
  /** Nom du critère */
  libelle: string;
  norme: string;
  version: string;
  clause: string;
  /** Formule littérale appliquée */
  formule: string;
  /** Référence compacte "EN 13791:2007 § 8.1" */
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
  /** Code de référentiel : "EN13791-2007" ou "EN13791-2019" */
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
  fckIs: number | null;
  fckIsDetail: string | null;
  /** Seuil de conformité principal (MPa) de la version sélectionnée */
  seuil85: number | null;
  seuil85Detail: string | null;
  criteres: CritereNormatif[];
  niveau1: { reference: string; statut: string; commentaire: string }[];
  verdict: VerdictNormatif;
  conclusion: string;
  donneesManquantes: string[];
}

/** Contrat que chaque évaluateur de version doit respecter. */
export interface NormativeEvaluator {
  norme: NormeNormative;
  evaluate(input: EvaluationInput): EvaluationResultat;
}

export const VERDICT_LABELS: Record<VerdictNormatif, { label: string; emoji: string; className: string }> = {
  conforme: { label: "CONFORME", emoji: "🟢", className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/40" },
  non_concluant: { label: "NON CONCLUANT / DONNÉES INSUFFISANTES", emoji: "🟠", className: "bg-amber-500/15 text-amber-500 border-amber-500/40" },
  non_conforme: { label: "NON CONFORME", emoji: "🔴", className: "bg-destructive/15 text-destructive border-destructive/40" },
  a_approfondir: { label: "ÉVALUATION À APPROFONDIR", emoji: "🔵", className: "bg-sky-500/15 text-sky-500 border-sky-500/40" },
};
