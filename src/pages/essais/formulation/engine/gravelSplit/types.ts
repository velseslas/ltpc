/**
 * Types I/O et erreurs métier pour le module de répartition des gravillons
 * (méthode graphique Dreux-Gorisse — ligne de partage 95/5).
 *
 * Cf. spécification dans .lovable/plan.md (§3).
 */

export interface TamisPoint {
  ouverture_mm: number;
  passant_pct: number;
}

export interface GravillonInput {
  nom: string;
  dmax_mm: number;
  tamis: TamisPoint[];
}

export interface SplitGravelsInput {
  /** Dmax global du mélange (mm). */
  dmax_mm: number;
  /** Correction K = G' + MF utilisée pour le calcul du Point A. */
  K: number;
  /** 2 à 4 gravillons, triés par dmax_mm strictement croissant. */
  gravillons: GravillonInput[];
}

export interface Point2D {
  x: number; // log10(d_mm)
  y: number; // passant %
}

export interface CutoffPoint {
  y_pct: number;
  x_log10d: number;
}

export interface PartitionLine {
  from: Point2D; // P95
  to: Point2D;   // P05
  /** Nom de la paire ("G_fin → G_suivant"). */
  pair: string;
}

export interface GravelProportion {
  nom: string;
  pct: number;
}

export interface SplitGravelsOutput {
  proportions: GravelProportion[];
  cutoffs: CutoffPoint[];
  partition_lines: PartitionLine[];
  reference_curve: Point2D[];
  warnings: string[];
}

/**
 * Erreur métier explicite levée par le module gravelSplit.
 * Jamais corrigée silencieusement (cf. spec §7, §9).
 */
export class GravelSplitError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "GravelSplitError";
    this.code = code;
    this.details = details;
  }
}
