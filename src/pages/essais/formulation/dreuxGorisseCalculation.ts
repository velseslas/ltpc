/**
 * Dreux-Gorisse automatic concrete mix design calculation engine (v3 — Phase 4).
 *
 * CONFORMITÉ STRICTE — cf. .lovable/plan.md (Phase 4).
 *
 * Flux imposé :
 *   1. Eau (kg/m³)      → donnée, jamais recalculée.
 *   2. Ciment (kg/m³)   → donné, jamais recalculé.
 *   3. Volumes          : Ve = eau/1000, Vc = ciment/ρc, Vair = airOcclus/1000,
 *                         Vgranulats = 1 − (Ve + Vc + Vair).
 *   4. G/S imposé       → Vsable = Vgranulats / (1 + G/S), Vgravier = Vgranulats − Vsable.
 *                         G/S JAMAIS modifié, jamais optimisé, jamais recalculé.
 *   5. Sable composé    : 1 sable = 100 %, 2 sables = formule module de finesse
 *                         s1 = (MFc − MF2) / (MF1 − MF2). ≥3 sables = ERREUR
 *                         bloquante (non couvert par la méthode).
 *   6. Gravillons       : méthode graphique 95/5 exclusivement, via le module
 *                         `engine/gravelSplit/` (splitGravels). AUCUN solveur
 *                         numérique dans le chemin de production.
 *
 * Point A — bascule par Dmax (décision métier utilisateur, cf. plan Phase 4) :
 *   Dmax ≤ 20 mm : pA = 50 − √Dmax + K              (formule canonique)
 *   Dmax >  20 mm : pA = 38 + 12·G' + 4·(MF − 2)   (variante linéaire bornée)
 *   Convention K = G' (documentée comme AMBIGUÏTÉ MÉTIER dans l'audit — la
 *   littérature Dreux définit K comme correction vibration/serrage/forme qui
 *   n'est pas saisie dans l'UI ; on utilise G' faute de donnée dédiée).
 *
 * Suppressions Phase 4 :
 *   - Boucle de convergence MF (5 itérations) : remplacée par un unique passage.
 * Suppressions Phase 6 :
 *   - `solveSimplexLeastSquares`, `projectOntoSimplex`, `enforceMinimumProportions`, `sieveWeight`, `optimizeMix` : code mort définitivement retiré.
 */

import { splitGravels, GravelSplitError, type GravillonInput as SplitGravillonInput } from "./engine/gravelSplit";
import { calculateXA } from "./engine/pointAxAbscissa";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Standard sieve openings (mm) used across the engine. */
const TAMIS_OPENINGS = [0.063, 0.125, 0.25, 0.5, 1, 2, 4, 6.3, 8, 10, 12.5, 16, 20, 25, 31.5, 40];

/** Reference sieves used for module-de-finesse computation (mm). */
const MF_SIEVES = [0.125, 0.25, 0.5, 1, 2, 4];

/** Default cement absolute density (kg/m³) when not provided by user. */
const DENSITE_CIMENT_DEFAULT = 3110;

/** Minimum proportion enforced for any active fraction to avoid silent drops. */
const MIN_FRACTION = 0.02;

// Phase finale : plafond 70/30 sur sable correcteur SUPPRIMÉ.
// La méthode Dreux-Gorisse pure (95/5 graphique + formule MF) est l'unique autorité.

// Phase 6 : SIEVE_WEIGHTS et sieveWeight supprimés — plus aucun solveur numérique.

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface GranulatInput {
  key: string;
  label: string;
  active: boolean;
  densite: number; // kg/m³ (densité effective issue des rapports)
  curve: { ouverture: number; pourcentageTamisat: number }[];
  isSable: boolean;
  isSableCorrecteur?: boolean; // true for correction sands (e.g. 0/1)
  moduleFinesse?: number; // Module de finesse importé (for sands)
  dMax?: number; // Maximum grain size (mm)
}

export interface CalculationInputs {
  eau: number;        // kg/m³
  ciment: number;     // kg/m³
  ratioGS: number;    // G/S ratio (MANUAL - never modified by engine)
  coeffGranulaire: number;  // G'
  coeffCompacite: number;   // γ
  airOcclus: number;  // L (litres, not %)
  granulats: GranulatInput[];
  mfCible?: number;   // MF cible (idéal) for sand proportion calculation
  /** Optional real cement density (kg/m³). Defaults to 3110. */
  densiteCiment?: number;
  /** Optional adjuvant volume (L/m³) used only in physical diagnostics. */
  volumeAdjuvant?: number;
  /** Phase 6 : Dmax imposé par l'utilisateur (étape 4). Priorité absolue sur determineDmax(). */
  dMaxUser?: number;
}

/** Ligne de partage 95/5 exportée en coordonnées mm — SOURCE UNIQUE (Phase 6). */
export interface PartitionLineOut {
  pair: string;
  from: { d_mm: number; y_pct: number };   // P95 du gravillon fin
  to: { d_mm: number; y_pct: number };     // P05 du gravillon suivant
  intersection: { d_mm: number; y_pct: number }; // sur OAB
}

export interface GravelSplitReport {
  proportions: Array<{ key: string; label: string; pct: number }>;
  cutoffs: Array<{ d_mm: number; y_pct: number }>;
  partitionLines: PartitionLineOut[];
  warnings: string[];
}

export interface PointA {
  dA: number;   // mm (Dmax / 2)
  pA: number;   // % — bascule Dmax (cf. calculatePointA). Borné [38, 50] côté variante linéaire.
}

/** Optional curve-quality diagnostics. */
export interface CurveQuality {
  rmse: number;
  maxDeviation: number;
  /** Qualitative grade: 'excellent' | 'good' | 'acceptable' | 'poor' */
  grade: "excellent" | "good" | "acceptable" | "poor";
  /** Passant at Point A (mix vs. reference, %). */
  pointACheck: { mix: number; ref: number; deviation: number };
}

/** Optional convergence diagnostics. */
export interface ConvergenceReport {
  iterations: number;
  mfInitial: number;
  mfFinal: number;
  mfDelta: number;
  rmse: number;
  initialCost: number | null;
  finalCost: number | null;
  durationMs: number;
}

/** Optional physical diagnostics on the resulting mix. */
export interface PhysicalChecks {
  masseTotale: number; // kg/m³
  densiteBeton: number; // kg/m³
  volumePate: number; // m³ (Ve + Vc + Vadjuvant)
  ratioPateGranulats: number;
}

export interface CalculationResult {
  masses: Record<string, number>; // key -> kg/m³
  volumes: {
    eau: number;       // m³
    ciment: number;    // m³
    air: number;       // m³
    granulatsTotal: number; // m³
    sable: number;     // m³
    gravier: number;   // m³
    detail: Record<string, number>; // key -> m³ per granulat
  };
  moduleFinesse: {
    perSand: Record<string, number>; // key -> MF
    melange: number | null;
  };
  pointA: PointA;
  dMaxReel: number; // mm
  volumeCheck: number; // should be exactly 1.0
  volumeErrors: string[];
  /** Non-blocking diagnostics (Point A deviation, physical bounds, etc.). */
  warnings?: string[];
  /** Curve quality (RMSE, max deviation, Point A check). */
  curveQuality?: CurveQuality;
  /** Iteration / timing diagnostics from the MF convergence loop. */
  convergenceReport?: ConvergenceReport;
  /** Physical mix diagnostics (density, paste/aggregate ratio). */
  physicalChecks?: PhysicalChecks;
  /** Courbe de référence OAB — SOURCE UNIQUE (Phase 6). Aucun consommateur ne doit la recalculer. */
  referenceCurve: { ouverture: number; pourcentage: number }[];
  /** Courbe granulométrique du mélange final — SOURCE UNIQUE (Phase 6). */
  mixCurve: { ouverture: number; pourcentage: number }[];
  /** Répartition graphique 95/5 exposée par le moteur — SOURCE UNIQUE (Phase 6). */
  gravelSplit: GravelSplitReport;
  /** Dmax final utilisé par le moteur — alias explicite (Phase 6). */
  dMax: number;
}

// ---------------------------------------------------------------------------
// Public helpers (unchanged signatures)
// ---------------------------------------------------------------------------

/**
 * Module de finesse from a granulometric curve.
 * MF = Σ retained at {0.125, 0.25, 0.5, 1, 2, 4} mm / 100
 */
export function computeModuleFinesse(curve: { ouverture: number; pourcentageTamisat: number }[]): number | null {
  if (!curve || curve.length === 0) return null;
  let sumRetained = 0;
  for (const sieve of MF_SIEVES) {
    const point = curve.find(c => Math.abs(c.ouverture - sieve) < 0.001);
    if (point) {
      sumRetained += (100 - point.pourcentageTamisat);
    }
  }
  return Math.round((sumRetained / 100) * 100) / 100;
}

/** Determine Dmax from active granulats (label/curve based). */
export function determineDmax(granulats: GranulatInput[]): number {
  const active = granulats.filter(g => g.active);
  if (active.length === 0) return 25;

  let maxD = 0;
  for (const g of active) {
    if (g.dMax && g.dMax > maxD) {
      maxD = g.dMax;
      continue;
    }
    if (g.curve && g.curve.length > 0) {
      const sorted = [...g.curve].sort((a, b) => b.ouverture - a.ouverture);
      for (const pt of sorted) {
        if (pt.pourcentageTamisat < 100 && pt.ouverture > maxD) {
          maxD = pt.ouverture;
          break;
        }
      }
    }
  }
  return maxD > 0 ? maxD : 25;
}

/**
 * Point A avec bascule par Dmax (décision Phase 4) :
 *   Dmax ≤ 20 mm : pA = 50 − √Dmax + K   (canonique — Dreux & Festa)
 *   Dmax >  20 mm : pA = 38 + 12·G' + 4·(MF − 2), borné [38, 50]  (variante linéaire)
 *
 * AMBIGUÏTÉ MÉTIER : K, historiquement correction (vibration + serrage + forme),
 * n'est pas saisi séparément dans l'UI. On utilise K = G' (coeffGranulaire),
 * seule donnée disponible. À valider par un ingénieur si vibration ≠ normale.
 */
export function calculatePointA(dMax: number, coeffGranulaire: number, mfMelange: number | null): PointA {
  // XA : règle unique Dreux-Gorisse (module AFNOR au-delà de 20 mm).
  // Voir engine/pointAxAbscissa.ts — SEULE source pour XA (UI + moteur).
  const { xA: dA } = calculateXA(dMax);
  const mf = mfMelange ?? 2.5;
  let pA: number;
  if (dMax <= 20) {
    // Formule canonique — bornage soft pour éviter les valeurs aberrantes.
    const K = coeffGranulaire; // AMBIGUÏTÉ MÉTIER — documenté ci-dessus.
    const raw = 50 - Math.sqrt(dMax) + K;
    pA = Math.round(raw * 100) / 100;
  } else {
    // Variante linéaire bornée [38, 50] pour gros granulats.
    const raw = 38 + (12 * coeffGranulaire) + (4 * (mf - 2));
    pA = Math.max(38, Math.min(50, Math.round(raw * 100) / 100));
  }
  return { dA, pA };
}

export function computeWeightedSandModuleFinesse(
  sands: Array<{ active: boolean; moduleFinesse?: number; proportion: number }>
): number | null {
  const validSands = sands.filter(
    (sand) => sand.active && typeof sand.moduleFinesse === "number" && sand.moduleFinesse > 0 && sand.proportion > 0
  );

  if (validSands.length === 0) return null;

  const totalProportion = validSands.reduce((sum, sand) => sum + sand.proportion, 0);
  if (totalProportion <= 0) return null;

  const weightedMf = validSands.reduce(
    (sum, sand) => sum + (sand.moduleFinesse as number) * (sand.proportion / totalProportion),
    0
  );

  return Math.round(weightedMf * 100) / 100;
}

/**
 * Generate the Dreux-Gorisse reference curve passing through Point A.
 * Linear in log space on [0.063, dA] and [dA, Dmax].
 */
export function generateReferenceCurve(
  dMax: number,
  mfMelange: number,
  pointA: PointA
): { ouverture: number; pourcentage: number }[] {
  // n preserved from previous formulation: 0.5 + MF/10 (kept for API compat,
  // not directly used by the two-segment construction).
  void (0.5 + mfMelange / 10);

  return TAMIS_OPENINGS
    .filter(ouv => ouv <= dMax * 1.01)
    .map(ouv => {
      let y: number;
      if (ouv <= pointA.dA) {
        const dMin = 0.063;
        const t = (Math.log10(ouv) - Math.log10(dMin)) / (Math.log10(pointA.dA) - Math.log10(dMin));
        y = t * pointA.pA;
      } else {
        const t = (Math.log10(ouv) - Math.log10(pointA.dA)) / (Math.log10(dMax) - Math.log10(pointA.dA));
        y = pointA.pA + t * (100 - pointA.pA);
      }
      return { ouverture: ouv, pourcentage: Math.max(0, Math.min(100, y)) };
    });
}

// ---------------------------------------------------------------------------
// Internal: mix curve / quality utilities
// ---------------------------------------------------------------------------

/**
 * Compute the mass-weighted mix curve from a set of materials and their masses.
 * Exposed module-internally so we can reuse it across convergence + quality calc.
 */
function computeMixCurveFromMasses(
  granulats: GranulatInput[],
  masses: Record<string, number>
): { ouverture: number; pourcentage: number }[] {
  const active = granulats.filter(g => g.active && (masses[g.key] ?? 0) > 0);
  const totalMass = active.reduce((s, g) => s + (masses[g.key] ?? 0), 0);
  if (totalMass === 0) return [];

  return TAMIS_OPENINGS.map(ouv => {
    let weightedPass = 0;
    for (const g of active) {
      const pt = g.curve.find(c => Math.abs(c.ouverture - ouv) < 0.001);
      const pass = pt ? pt.pourcentageTamisat : (ouv > (g.curve[g.curve.length - 1]?.ouverture || 0) ? 100 : 0);
      weightedPass += (pass * (masses[g.key] ?? 0)) / totalMass;
    }
    return { ouverture: ouv, pourcentage: weightedPass };
  });
}

/**
 * RMSE between two granulometric curves (same sieve set), plus max deviation.
 */
function computeCurveQuality(
  mix: { ouverture: number; pourcentage: number }[],
  ref: { ouverture: number; pourcentage: number }[],
  pointA: PointA
): CurveQuality {
  let sumSq = 0;
  let count = 0;
  let maxDev = 0;
  for (const r of ref) {
    const m = mix.find(p => Math.abs(p.ouverture - r.ouverture) < 0.001);
    if (!m) continue;
    const d = m.pourcentage - r.pourcentage;
    sumSq += d * d;
    maxDev = Math.max(maxDev, Math.abs(d));
    count++;
  }
  const rmse = count > 0 ? Math.sqrt(sumSq / count) : 0;

  // Interpolate mix curve at Point A (log-linear)
  const interpAt = (curve: { ouverture: number; pourcentage: number }[], x: number) => {
    const sorted = [...curve].sort((a, b) => a.ouverture - b.ouverture);
    if (sorted.length === 0) return 0;
    if (x <= sorted[0].ouverture) return sorted[0].pourcentage;
    if (x >= sorted[sorted.length - 1].ouverture) return sorted[sorted.length - 1].pourcentage;
    for (let i = 0; i < sorted.length - 1; i++) {
      if (x >= sorted[i].ouverture && x <= sorted[i + 1].ouverture) {
        const t = (Math.log10(x) - Math.log10(sorted[i].ouverture)) /
                  (Math.log10(sorted[i + 1].ouverture) - Math.log10(sorted[i].ouverture));
        return sorted[i].pourcentage + t * (sorted[i + 1].pourcentage - sorted[i].pourcentage);
      }
    }
    return 0;
  };

  const mixAtA = interpAt(mix, pointA.dA);
  const refAtA = pointA.pA;

  let grade: CurveQuality["grade"];
  if (rmse < 3) grade = "excellent";
  else if (rmse < 6) grade = "good";
  else if (rmse < 10) grade = "acceptable";
  else grade = "poor";

  return {
    rmse: Math.round(rmse * 100) / 100,
    maxDeviation: Math.round(maxDev * 100) / 100,
    grade,
    pointACheck: {
      mix: Math.round(mixAtA * 100) / 100,
      ref: Math.round(refAtA * 100) / 100,
      deviation: Math.round(Math.abs(mixAtA - refAtA) * 100) / 100,
    },
  };
}

// ---------------------------------------------------------------------------
// Main calculation
// ---------------------------------------------------------------------------

/**
 * Main calculation: compute granulate masses from volumes, with an MF/reference
 * curve convergence loop.
 *
 * - Ve = Eau / 1000
 * - Vc = Ciment / densitéCiment (real or default 3110)
 * - Vair = airOcclus / 1000
 * - Vgranulats = 1 - (Ve + Vc + Vair)
 * - G/S is MANUAL and NEVER modified
 */
export function calculateMixDesign(
  inputs: CalculationInputs,
  presetMasses?: Record<string, number>
): CalculationResult {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();

  const { eau, ciment, ratioGS, granulats, airOcclus, coeffGranulaire } = inputs;
  const densiteCiment = inputs.densiteCiment && inputs.densiteCiment > 0
    ? inputs.densiteCiment
    : DENSITE_CIMENT_DEFAULT;

  // Step 1: Volume calculations (m³)
  const Ve = eau / 1000;
  const Vc = ciment / densiteCiment;
  const Vair = airOcclus / 1000;

  const Vgranulats = 1 - (Ve + Vc + Vair);
  const volumeCheck = Ve + Vc + Vair + Vgranulats;

  // Split into sand and gravel using G/S ratio (MANUAL)
  const Vsable = Vgranulats / (1 + ratioGS);
  const Vgravier = Vgranulats - Vsable;

  const activeSables = granulats.filter(g => g.active && g.isSable);
  const activeGraviers = granulats.filter(g => g.active && !g.isSable);

  // Per-sand MF lookup
  const mfPerSand: Record<string, number> = {};
  for (const s of activeSables) {
    if (typeof s.moduleFinesse === "number" && Number.isFinite(s.moduleFinesse) && s.moduleFinesse > 0) {
      mfPerSand[s.key] = s.moduleFinesse;
    }
  }

  const dMaxAuto = determineDmax(granulats);
  const dMaxReel = (typeof inputs.dMaxUser === "number" && Number.isFinite(inputs.dMaxUser) && inputs.dMaxUser > 0)
    ? inputs.dMaxUser
    : dMaxAuto;
  const hasPresetMasses = !!presetMasses && Object.keys(presetMasses).length > 0;

  // ----- Distribution en UNE SEULE PASSE (Phase 4 : boucle MF supprimée) -----
  // Dreux-Gorisse ne prescrit pas de recalcul rétroactif du MF : MF cible → distribution figée.
  const mfInitial = inputs.mfCible ?? 2.5;
  const mfCurrent = mfInitial;
  const iterations = 1;
  let sableMasses: Record<string, number> = {};
  let gravierMasses: Record<string, number> = {};
  let pointA = calculatePointA(dMaxReel, coeffGranulaire, mfCurrent);
  let referenceCurve: { ouverture: number; pourcentage: number }[] =
    generateReferenceCurve(dMaxReel, mfCurrent, pointA);
  let mfMelange: number | null = null;

  if (hasPresetMasses) {
    sableMasses = Object.fromEntries(activeSables.map(s => [s.key, presetMasses?.[s.key] ?? 0]));
    gravierMasses = Object.fromEntries(activeGraviers.map(g => [g.key, presetMasses?.[g.key] ?? 0]));
  } else {
    sableMasses = distributeSand(Vsable, activeSables, mfCurrent);
    gravierMasses = distributeGravel(Vgravier, activeGraviers, dMaxReel, coeffGranulaire);
  }

  // MF mélange calculé A POSTERIORI (informatif uniquement — n'entre pas dans le calcul).
  {
    const localVolumes: Record<string, number> = {};
    for (const s of activeSables) {
      const m = sableMasses[s.key] ?? 0;
      localVolumes[s.key] = s.densite > 0 ? m / s.densite : 0;
    }
    mfMelange = computeWeightedSandModuleFinesse(
      activeSables.map((s) => ({
        active: true,
        moduleFinesse: mfPerSand[s.key],
        proportion: localVolumes[s.key] ?? 0,
      }))
    );
  }
  // mfPrev conservé pour compatibilité du ConvergenceReport en aval.
  const mfPrev = mfInitial;


  // Phase finale : plus aucun plafond artificiel sur le sable correcteur.
  // Les proportions issues de distributeSand() (formule MF Dreux-Gorisse) sont
  // désormais définitives — la méthode graphique 95/5 est l'unique autorité.

  // Final volumes / masses
  const masses: Record<string, number> = {};
  const volumeDetail: Record<string, number> = {};
  for (const g of granulats) {
    if (!g.active) {
      masses[g.key] = 0;
      volumeDetail[g.key] = 0;
      continue;
    }
    masses[g.key] = sableMasses[g.key] ?? gravierMasses[g.key] ?? 0;
    const densite = g.densite;
    volumeDetail[g.key] = densite > 0 ? masses[g.key] / densite : 0;
  }

  // Final MF mélange (after cap)
  if (!hasPresetMasses) {
    mfMelange = computeWeightedSandModuleFinesse(
      activeSables.map((s) => ({
        active: true,
        moduleFinesse: mfPerSand[s.key],
        proportion: volumeDetail[s.key] ?? 0,
      }))
    );
    pointA = calculatePointA(dMaxReel, coeffGranulaire, mfMelange);
    referenceCurve = generateReferenceCurve(dMaxReel, mfMelange ?? mfCurrent, pointA);
  } else {
    mfMelange = computeWeightedSandModuleFinesse(
      activeSables.map((s) => ({
        active: true,
        moduleFinesse: mfPerSand[s.key],
        proportion: volumeDetail[s.key] ?? 0,
      }))
    );
  }

  // ----- Volume / consistency checks ------------------------------------
  const volumeErrors: string[] = [];
  if (Math.abs(volumeCheck - 1.0) > 0.001) {
    volumeErrors.push("Erreur de cohérence volumique : Ve + Vc + Vair + Vgranulats ≠ 1000 L");
  }
  if (Math.abs((Vsable + Vgravier) - Vgranulats) > 0.001) {
    volumeErrors.push("Erreur de cohérence volumique : Vsable + Vgravier ≠ Vgranulats");
  }
  const sumFractionVolumes = Object.values(volumeDetail).reduce((s, v) => s + v, 0);
  if (Vgranulats > 0 && Math.abs(sumFractionVolumes - Vgranulats) > 0.01) {
    volumeErrors.push("Erreur de cohérence volumique : Σ volumes fractions ≠ Vgranulats");
  }

  const sumSableVol = activeSables.reduce((s, g) => s + (volumeDetail[g.key] ?? 0), 0);
  const sumGravierVol = activeGraviers.reduce((s, g) => s + (volumeDetail[g.key] ?? 0), 0);
  if (Vsable > 0 && Math.abs(sumSableVol - Vsable) > 0.01) {
    volumeErrors.push("Σ volumes fractions sable ≠ Vsable");
  }
  if (Vgravier > 0 && Math.abs(sumGravierVol - Vgravier) > 0.01) {
    volumeErrors.push("Σ volumes fractions gravier ≠ Vgravier");
  }
  for (const key of Object.keys(masses)) {
    if (masses[key] < 0) volumeErrors.push(`Masse négative détectée : ${key}`);
  }
  // Monotonicity (light) — passing percentage should never strictly decrease with sieve opening
  const finalMixCurve = computeMixCurveFromMasses(granulats, masses);
  for (let i = 1; i < finalMixCurve.length; i++) {
    if (finalMixCurve[i].pourcentage + 0.01 < finalMixCurve[i - 1].pourcentage) {
      volumeErrors.push("Courbe granulométrique non monotone");
      break;
    }
  }

  // ----- Curve quality + Point A check ----------------------------------
  const curveQuality = computeCurveQuality(finalMixCurve, referenceCurve, pointA);

  const warnings: string[] = [];
  if (curveQuality.pointACheck.deviation > 2) {
    warnings.push(
      `Écart au Point A élevé : mélange = ${curveQuality.pointACheck.mix}% vs référence = ${curveQuality.pointACheck.ref}% (Δ = ${curveQuality.pointACheck.deviation}%)`
    );
  }

  // ----- Physical checks -------------------------------------------------
  const masseTotale = eau + ciment + Object.values(masses).reduce((s, v) => s + v, 0);
  const densiteBeton = masseTotale; // per m³ basis
  const volumeAdjuvantM3 = (inputs.volumeAdjuvant ?? 0) / 1000;
  const volumePate = Ve + Vc + volumeAdjuvantM3;
  const ratioPateGranulats = Vgranulats > 0 ? volumePate / Vgranulats : 0;

  if (masseTotale < 1800 || masseTotale > 2900) {
    warnings.push(`Densité béton hors plage usuelle : ${masseTotale.toFixed(0)} kg/m³ (attendu 1800–2900)`);
  }

  // ----- Convergence report ---------------------------------------------
  const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const convergenceReport: ConvergenceReport = {
    iterations,
    mfInitial,
    mfFinal: mfMelange ?? mfCurrent,
    mfDelta: Math.abs((mfMelange ?? mfCurrent) - mfPrev),
    rmse: curveQuality.rmse,
    initialCost: null,
    finalCost: null,
    durationMs: Math.round((t1 - t0) * 100) / 100,
  };

  // ----- Gravel split (méthode graphique 95/5) — exposé pour toute l'UI -----
  const gravelSplit = buildGravelSplitReport(activeGraviers, dMaxReel, coeffGranulaire);

  return {
    masses,
    volumes: {
      eau: Ve,
      ciment: Vc,
      air: Vair,
      granulatsTotal: Vgranulats,
      sable: Vsable,
      gravier: Vgravier,
      detail: volumeDetail,
    },
    moduleFinesse: {
      perSand: mfPerSand,
      melange: mfMelange,
    },
    pointA,
    dMaxReel,
    dMax: dMaxReel,
    volumeCheck,
    volumeErrors,
    warnings,
    curveQuality,
    convergenceReport,
    physicalChecks: {
      masseTotale: Math.round(masseTotale * 10) / 10,
      densiteBeton: Math.round(densiteBeton * 10) / 10,
      volumePate: Math.round(volumePate * 1000) / 1000,
      ratioPateGranulats: Math.round(ratioPateGranulats * 1000) / 1000,
    },
    referenceCurve,
    mixCurve: finalMixCurve,
    gravelSplit,
  };
}

/**
 * Construit un GravelSplitReport (proportions + lignes de partage + intersections)
 * à partir des gravillons actifs. Source unique consommée par l'UI (chart, récap, debug).
 */
function buildGravelSplitReport(
  graviers: GranulatInput[],
  dMax: number,
  coeffGranulaire: number
): GravelSplitReport {
  if (graviers.length === 0) {
    return { proportions: [], cutoffs: [], partitionLines: [], warnings: [] };
  }
  if (graviers.length === 1) {
    const g = graviers[0];
    return {
      proportions: [{ key: g.key, label: g.label, pct: 100 }],
      cutoffs: [],
      partitionLines: [],
      warnings: [],
    };
  }
  const sorted = [...graviers].sort((a, b) => {
    const da = a.dMax ?? maxOpeningFromCurve(a);
    const db = b.dMax ?? maxOpeningFromCurve(b);
    return da - db;
  });
  try {
    const out = splitGravels({
      dmax_mm: dMax,
      K: coeffGranulaire,
      gravillons: sorted.map<SplitGravillonInput>((g) => ({
        nom: g.label,
        dmax_mm: g.dMax ?? maxOpeningFromCurve(g),
        tamis: g.curve.map((c) => ({ ouverture_mm: c.ouverture, passant_pct: c.pourcentageTamisat })),
      })),
    });
    const proportions = sorted.map((g, i) => ({
      key: g.key,
      label: g.label,
      pct: out.proportions[i]?.pct ?? 0,
    }));
    const partitionLines: PartitionLineOut[] = out.partition_lines.map((line, i) => {
      const cut = out.cutoffs[i];
      return {
        pair: line.pair,
        from: { d_mm: Math.pow(10, line.from.x), y_pct: line.from.y },
        to: { d_mm: Math.pow(10, line.to.x), y_pct: line.to.y },
        intersection: { d_mm: Math.pow(10, cut.x_log10d), y_pct: cut.y_pct },
      };
    });
    const cutoffs = out.cutoffs.map((c) => ({
      d_mm: Math.pow(10, c.x_log10d),
      y_pct: c.y_pct,
    }));
    return { proportions, cutoffs, partitionLines, warnings: out.warnings };
  } catch (e) {
    if (e instanceof GravelSplitError) {
      throw new Error(`Méthode graphique 95/5 : ${e.message}`);
    }
    throw e;
  }
}

// ---------------------------------------------------------------------------
// Sand / gravel distribution
// ---------------------------------------------------------------------------

/**
 * Distribute sand volume among active sands.
 * - 2 sands + MF cible: closed-form S1 = (MFcible − MF2) / (MF1 − MF2)
 * - otherwise: least-squares optimization against reference curve
 * - fallback: equal distribution
 * Phase finale : plus aucun post-traitement (plafond 30% supprimé).
 */
function distributeSand(
  totalVolume: number,
  sables: GranulatInput[],
  mfCible?: number,
): Record<string, number> {
  const result: Record<string, number> = {};
  if (sables.length === 0) return result;

  if (sables.length === 1) {
    const s = sables[0];
    result[s.key] = s.densite > 0 ? totalVolume * s.densite : 0;
    return result;
  }

  if (sables.length === 2) {
    if (typeof mfCible !== "number" || mfCible <= 0) {
      throw new Error(
        "Répartition des sables impossible : MF cible manquant ou invalide. " +
        "Renseignez le MF cible dans l'étape précédente."
      );
    }
    const sorted = [...sables].sort((a, b) => (b.moduleFinesse ?? 0) - (a.moduleFinesse ?? 0));
    const sand1 = sorted[0];
    const sand2 = sorted[1];
    const mf1 = sand1.moduleFinesse;
    const mf2 = sand2.moduleFinesse;

    if (typeof mf1 !== "number" || mf1 <= 0 || typeof mf2 !== "number" || mf2 <= 0) {
      throw new Error(
        `Modules de finesse manquants ou invalides pour "${sand1.label}" (MF=${mf1}) et/ou "${sand2.label}" (MF=${mf2}).`
      );
    }
    if (Math.abs(mf1 - mf2) < 0.001) {
      throw new Error(
        `Les deux sables ont un module de finesse quasi-identique (MF1=${mf1}, MF2=${mf2}). ` +
        "La formule Dreux-Gorisse s1 = (MFc − MF2)/(MF1 − MF2) est indéterminée."
      );
    }
    let s1 = (mfCible - mf2) / (mf1 - mf2);
    s1 = Math.max(MIN_FRACTION, Math.min(1 - MIN_FRACTION, s1));
    const s2 = 1 - s1;
    result[sand1.key] = sand1.densite > 0 ? totalVolume * s1 * sand1.densite : 0;
    result[sand2.key] = sand2.densite > 0 ? totalVolume * s2 * sand2.densite : 0;
    return result;
  }

  // ≥3 sables → NON COUVERT par Dreux-Gorisse. Erreur bloquante (Phase 4).
  throw new Error(
    `Dreux-Gorisse ne couvre que 1 ou 2 sables. Vous en avez sélectionné ${sables.length}. ` +
    "Réduisez la sélection à 1 ou 2 sables dans l'étape matériaux."
  );
}

// Phase finale : enforceCorrectionSandCap() SUPPRIMÉ.
// Le plafond 70/30 (MAX_CORRECTION_SAND_FRACTION = 0.30) et la redistribution
// automatique du sable correcteur ne font pas partie de la méthode Dreux-Gorisse
// pure — la formule MF (s1 = (MFc − MF2)/(MF1 − MF2)) et la méthode graphique
// 95/5 sont désormais les seules autorités.

// Phase 6 : projectOntoSimplex, enforceMinimumProportions, solveSimplexLeastSquares
// définitivement supprimés (code mort — solveur numérique retiré en Phase 4).


/**
 * Répartition des gravillons — méthode graphique Dreux-Gorisse 95/5 (Phase 4).
 *
 * Délègue au module `engine/gravelSplit/splitGravels()` :
 *   - Trace des lignes P95(G_k) → P05(G_{k+1}) dans le repère (log10 d, %) ;
 *   - Calcule les intersections avec la courbe de référence OAB ;
 *   - Déduit les proportions par différences successives (Σ = 100 % par construction).
 *
 * AUCUN solveur numérique. AUCUNE optimisation.
 */
function distributeGravel(
  totalVolume: number,
  graviers: GranulatInput[],
  dMax: number,
  coeffGranulaire: number,
): Record<string, number> {
  const result: Record<string, number> = {};
  if (graviers.length === 0) return result;

  if (graviers.length === 1) {
    const g = graviers[0];
    result[g.key] = g.densite > 0 ? totalVolume * g.densite : 0;
    return result;
  }

  // Construction de l'entrée splitGravels — tri par Dmax strictement croissant.
  const sorted = [...graviers].sort((a, b) => {
    const da = a.dMax ?? maxOpeningFromCurve(a);
    const db = b.dMax ?? maxOpeningFromCurve(b);
    return da - db;
  });

  const input = {
    dmax_mm: dMax,
    K: coeffGranulaire, // Convention Phase 4 (cf. calculatePointA).
    gravillons: sorted.map<SplitGravillonInput>((g) => ({
      nom: g.label,
      dmax_mm: g.dMax ?? maxOpeningFromCurve(g),
      tamis: g.curve.map((c) => ({ ouverture_mm: c.ouverture, passant_pct: c.pourcentageTamisat })),
    })),
  };

  let proportions: Record<string, number>;
  try {
    const out = splitGravels(input);
    proportions = {};
    for (let i = 0; i < sorted.length; i++) {
      proportions[sorted[i].key] = (out.proportions[i]?.pct ?? 0) / 100;
    }
  } catch (e) {
    if (e instanceof GravelSplitError) {
      throw new Error(`Méthode graphique 95/5 : ${e.message}`);
    }
    throw e;
  }

  for (const g of graviers) {
    const vol = totalVolume * (proportions[g.key] ?? 0);
    result[g.key] = g.densite > 0 ? vol * g.densite : 0;
  }
  return result;
}

/** Récupère le Dmax effectif d'un granulat à partir de sa courbe (dernier tamis > 0 % passant < 100 %). */
function maxOpeningFromCurve(g: GranulatInput): number {
  if (!g.curve || g.curve.length === 0) return 0;
  const sorted = [...g.curve].sort((a, b) => b.ouverture - a.ouverture);
  for (const pt of sorted) {
    if (pt.pourcentageTamisat < 100) return pt.ouverture;
  }
  return sorted[0].ouverture;
}

// Phase 6 : optimizeMix supprimé (code mort).


