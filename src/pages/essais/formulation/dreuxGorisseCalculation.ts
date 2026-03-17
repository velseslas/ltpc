/**
 * Dreux-Gorisse automatic concrete mix design calculation engine.
 * Computes granulate proportions from input parameters and optimizes
 * the mix curve to match the Dreux-Gorisse reference curve.
 */

// Standard sieve openings (mm)
const TAMIS_OPENINGS = [0.063, 0.125, 0.25, 0.5, 1, 2, 4, 6.3, 8, 10, 12.5, 16, 20, 25, 31.5, 40];

// MF reference sieves (mm)
const MF_SIEVES = [0.125, 0.25, 0.5, 1, 2, 4];

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
}

export interface PointA {
  dA: number;   // mm (Dmax / 2)
  pA: number;   // % (35 + 10*G' + 3*(MF-2)), clamped 38-50
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
}

const DENSITE_CIMENT = 3110; // kg/m³

/**
 * Compute module de finesse from a granulometric curve
 * MF = sum of cumulative retained percentages at 0.125, 0.25, 0.5, 1, 2, 4 mm / 100
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

/**
 * Determine Dmax from active granulats based on their actual curves or labels
 */
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
 * Calculate Point A using the Dreux method
 * dA = Dmax / 2
 * PA = 38 + (12 × G') + (4 × (MF − 2)), clamped to [38, 50]
 */
export function calculatePointA(dMax: number, coeffGranulaire: number, mfMelange: number | null): PointA {
  const dA = dMax / 2;
  const mf = mfMelange ?? 2.5; // default if not available
  const pARaw = 38 + (12 * coeffGranulaire) + (4 * (mf - 2));
  const pA = Math.max(38, Math.min(50, Math.round(pARaw * 100) / 100));
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
 * Generate Dreux-Gorisse reference curve
 * Uses the power law: P(d) = 100 × (d / Dmax)^n
 * where n = 0.5 + (MF / 10) (module de finesse du sable mélange)
 * 
 * The curve passes through Point A by construction
 */
export function generateReferenceCurve(
  dMax: number,
  mfMelange: number,
  pointA: PointA
): { ouverture: number; pourcentage: number }[] {
  const n = 0.5 + (mfMelange / 10);
  
  return TAMIS_OPENINGS
    .filter(ouv => ouv <= dMax * 1.01)
    .map(ouv => {
      let y: number;
      if (ouv <= pointA.dA) {
        // Segment origin (0.063, 0) to Point A (dA, pA) - linear in log space
        const dMin = 0.063;
        const t = (Math.log10(ouv) - Math.log10(dMin)) / (Math.log10(pointA.dA) - Math.log10(dMin));
        y = t * pointA.pA;
      } else {
        // Segment Point A (dA, pA) to (Dmax, 100) - linear in log space
        const t = (Math.log10(ouv) - Math.log10(pointA.dA)) / (Math.log10(dMax) - Math.log10(pointA.dA));
        y = pointA.pA + t * (100 - pointA.pA);
      }
      return { ouverture: ouv, pourcentage: Math.max(0, Math.min(100, y)) };
    });
}

/**
 * Main calculation: compute granulate masses from volumes
 * 
 * CRITICAL RULES:
 * - Ve = Eau / 1000
 * - Vc = Ciment / densité_effective_ciment
 * - Vair = airOcclus / 1000
 * - Vgranulats = 1 - (Ve + Vc + Vair)
 * - Ve + Vc + Vair + Vgranulats = 1.0 m³ always
 * - G/S is MANUAL and NEVER modified
 */
export function calculateMixDesign(
  inputs: CalculationInputs,
  presetMasses?: Record<string, number>
): CalculationResult {
  const { eau, ciment, ratioGS, granulats, airOcclus, coeffGranulaire, coeffCompacite } = inputs;

  // Step 1: Volume calculations (m³)
  const Ve = eau / 1000;
  const Vc = ciment / DENSITE_CIMENT;
  const Vair = airOcclus / 1000;

  // Step 2: Volume available for aggregates
  const Vgranulats = 1 - (Ve + Vc + Vair);
  const volumeCheck = Ve + Vc + Vair + Vgranulats;

  // Step 3: Split into sand and gravel using G/S ratio (MANUAL)
  const Vsable = Vgranulats / (1 + ratioGS);
  const Vgravier = Vgranulats - Vsable;

  // Active granulats by type
  const activeSables = granulats.filter(g => g.active && g.isSable);
  const activeGraviers = granulats.filter(g => g.active && !g.isSable);

  // Step 4: Compute MF for each sand and weighted MF
  const mfPerSand: Record<string, number> = {};
  for (const s of activeSables) {
    if (typeof s.moduleFinesse === "number" && Number.isFinite(s.moduleFinesse) && s.moduleFinesse > 0) {
      mfPerSand[s.key] = s.moduleFinesse;
    }
  }

  // Step 5: Distribute volumes
  const hasPresetMasses = !!presetMasses && Object.keys(presetMasses).length > 0;
  
  let sableMasses: Record<string, number>;
  let gravierMasses: Record<string, number>;
  
  if (hasPresetMasses) {
    sableMasses = Object.fromEntries(activeSables.map(s => [s.key, presetMasses?.[s.key] ?? 0]));
    gravierMasses = Object.fromEntries(activeGraviers.map(g => [g.key, presetMasses?.[g.key] ?? 0]));
  } else {
    sableMasses = distributeSand(Vsable, activeSables);
    gravierMasses = distributeGravel(Vgravier, activeGraviers);
  }

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

  // Compute MF mélange (weighted by real sand proportions only)
  const mfMelange = computeWeightedSandModuleFinesse(
    activeSables.map((s) => ({
      active: true,
      moduleFinesse: mfPerSand[s.key],
      proportion: volumeDetail[s.key] ?? 0,
    }))
  );

  // Calculate Point A
  const dMaxReel = determineDmax(granulats);
  const pointA = calculatePointA(dMaxReel, coeffGranulaire, mfMelange);

  // Volume consistency checks
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
    volumeCheck,
    volumeErrors,
  };
}

/**
 * Distribute sand volume among active sands.
 * Rule: Correction sand (0/1) ≤ 30% of total sand volume.
 * Main sand gets the remainder.
 */
function distributeSand(
  totalVolume: number,
  sables: GranulatInput[]
): Record<string, number> {
  const result: Record<string, number> = {};
  if (sables.length === 0) return result;

  if (sables.length === 1) {
    const s = sables[0];
    result[s.key] = s.densite > 0 ? totalVolume * s.densite : 0;
    return result;
  }

  // Identify correction sands vs main sands
  const correctionSands = sables.filter(s => s.isSableCorrecteur);
  const mainSands = sables.filter(s => !s.isSableCorrecteur);

  // If no explicit correction sand marking, treat the smallest Dmax as correction
  if (correctionSands.length === 0 && mainSands.length > 1) {
    const sorted = [...sables].sort((a, b) => (a.dMax ?? 0) - (b.dMax ?? 0));
    const correction = sorted[0];
    const mains = sorted.slice(1);
    
    const maxCorrectionVolume = 0.30 * totalVolume;
    const correctionVolume = Math.min(maxCorrectionVolume, totalVolume / sables.length);
    const remainingVolume = totalVolume - correctionVolume;
    
    result[correction.key] = correction.densite > 0 ? correctionVolume * correction.densite : 0;
    
    // Distribute remaining among main sands equally
    const volumeEach = remainingVolume / mains.length;
    for (const m of mains) {
      result[m.key] = m.densite > 0 ? volumeEach * m.densite : 0;
    }
    return result;
  }

  // With explicit correction sand marking
  const maxCorrectionVolume = 0.30 * totalVolume;
  let correctionTotalVolume = 0;

  if (correctionSands.length > 0) {
    const corrVolumeEach = Math.min(maxCorrectionVolume / correctionSands.length, totalVolume / sables.length);
    for (const cs of correctionSands) {
      const vol = corrVolumeEach;
      correctionTotalVolume += vol;
      result[cs.key] = cs.densite > 0 ? vol * cs.densite : 0;
    }
  }

  const remainingVolume = totalVolume - correctionTotalVolume;
  if (mainSands.length > 0) {
    const volumeEach = remainingVolume / mainSands.length;
    for (const ms of mainSands) {
      result[ms.key] = ms.densite > 0 ? volumeEach * ms.densite : 0;
    }
  }

  return result;
}

/**
 * Distribute gravel volume for optimal pumpability.
 * Default distribution: 3/8 = 20%, 8/15 = 45%, 15/25 = 35%
 * When exact fraction names don't match, use size-based ordering.
 */
function distributeGravel(
  totalVolume: number,
  graviers: GranulatInput[]
): Record<string, number> {
  const result: Record<string, number> = {};
  if (graviers.length === 0) return result;

  if (graviers.length === 1) {
    const g = graviers[0];
    result[g.key] = g.densite > 0 ? totalVolume * g.densite : 0;
    return result;
  }

  // Sort by Dmax (smallest first)
  const sorted = [...graviers].sort((a, b) => (a.dMax ?? 0) - (b.dMax ?? 0));

  // Distribution ratios for pumpability optimization
  let ratios: number[];
  if (sorted.length === 2) {
    ratios = [0.35, 0.65]; // smaller fraction gets less
  } else if (sorted.length === 3) {
    ratios = [0.20, 0.45, 0.35]; // 3/8=20%, 8/15=45%, 15/25=35%
  } else {
    // General case: equal distribution
    ratios = sorted.map(() => 1 / sorted.length);
  }

  for (let i = 0; i < sorted.length; i++) {
    const g = sorted[i];
    const vol = totalVolume * ratios[i];
    result[g.key] = g.densite > 0 ? vol * g.densite : 0;
  }

  return result;
}

/**
 * Compute mix curve from materials and their quantities (masses)
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
 * Optimize the mix to minimize deviation from Dreux-Gorisse reference curve.
 * 
 * CONSTRAINTS:
 * - Correction sand (0/1) ≤ 30% of total sand volume
 * - Total volumes Vsable and Vgravier remain constant
 * - G/S ratio is NEVER changed
 * - Each material keeps a minimum of 5% of its group total
 */
export function optimizeMix(
  inputs: CalculationInputs,
  dMax: number,
  _classeConsistance: string
): Record<string, number> {
  const { granulats, coeffGranulaire, coeffCompacite } = inputs;
  const baseline = calculateMixDesign(inputs);
  const masses = { ...baseline.masses };

  // Generate reference curve using the new Point A method
  const pointA = baseline.pointA;
  // Use MF mélange for N coefficient; fallback to 2.5 if not available
  const mfForN = (() => {
    const activeSablesLocal = granulats.filter(g => g.active && g.isSable);
    let sumMF = 0, sumMass = 0;
    for (const s of activeSablesLocal) {
      const m = masses[s.key] ?? 0;
      const mf = s.moduleFinesse;
      if (mf !== undefined && mf > 0 && m > 0) {
        sumMF += m * mf;
        sumMass += m;
      }
    }
    return sumMass > 0 ? sumMF / sumMass : 2.5;
  })();
  const referenceCurve = generateReferenceCurve(dMax, mfForN, pointA);
  if (referenceCurve.length === 0) return masses;

  const activeGranulats = granulats.filter(g => g.active);
  if (activeGranulats.length < 2) return masses;

  const activeSables = granulats.filter(g => g.active && g.isSable);
  const activeGraviers = granulats.filter(g => g.active && !g.isSable);
  const totalSableMass = activeSables.reduce((s, g) => s + (masses[g.key] ?? 0), 0);
  const totalGravierMass = activeGraviers.reduce((s, g) => s + (masses[g.key] ?? 0), 0);

  // Compute total sand volume for the 30% constraint
  const totalSableVolume = activeSables.reduce((s, g) => {
    const m = masses[g.key] ?? 0;
    return s + (g.densite > 0 ? m / g.densite : 0);
  }, 0);

  function computeError(m: Record<string, number>): number {
    const mix = computeMixCurveFromMasses(granulats, m);
    let err = 0;
    for (const ref of referenceCurve) {
      const mp = mix.find(p => Math.abs(p.ouverture - ref.ouverture) < 0.001);
      if (mp) {
        err += (mp.pourcentage - ref.pourcentage) ** 2;
      }
    }
    return err;
  }

  function checkCorrectionSandConstraint(m: Record<string, number>): boolean {
    for (const s of activeSables) {
      if (s.isSableCorrecteur || (s.dMax !== undefined && s.dMax <= 2)) {
        const vol = s.densite > 0 ? (m[s.key] ?? 0) / s.densite : 0;
        if (totalSableVolume > 0 && vol / totalSableVolume > 0.31) {
          return false;
        }
      }
    }
    return true;
  }

  function optimizeGroup(group: GranulatInput[], totalMass: number) {
    if (group.length < 2 || totalMass <= 0) return;
    const step = totalMass * 0.01;
    const minMass = totalMass * 0.05;

    for (let iter = 0; iter < 200; iter++) {
      let improved = false;
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const keyI = group[i].key;
          const keyJ = group[j].key;
          const currentErr = computeError(masses);

          // Try shifting mass from i to j
          const testMasses1 = { ...masses };
          const currentI = masses[keyI] ?? 0;
          const maxDeltaI = Math.max(0, currentI - minMass);
          const deltaI = Math.min(step, maxDeltaI);
          if (deltaI > 0) {
            testMasses1[keyI] = currentI - deltaI;
            testMasses1[keyJ] = (masses[keyJ] ?? 0) + deltaI;
          }
          const err1 = (deltaI > 0 && checkCorrectionSandConstraint(testMasses1)) ? computeError(testMasses1) : Infinity;

          // Try shifting mass from j to i
          const testMasses2 = { ...masses };
          const currentJ = masses[keyJ] ?? 0;
          const maxDeltaJ = Math.max(0, currentJ - minMass);
          const deltaJ = Math.min(step, maxDeltaJ);
          if (deltaJ > 0) {
            testMasses2[keyJ] = currentJ - deltaJ;
            testMasses2[keyI] = (masses[keyI] ?? 0) + deltaJ;
          }
          const err2 = (deltaJ > 0 && checkCorrectionSandConstraint(testMasses2)) ? computeError(testMasses2) : Infinity;

          if (err1 < currentErr && err1 <= err2) {
            masses[keyI] = testMasses1[keyI];
            masses[keyJ] = testMasses1[keyJ];
            improved = true;
          } else if (err2 < currentErr) {
            masses[keyI] = testMasses2[keyI];
            masses[keyJ] = testMasses2[keyJ];
            improved = true;
          }
        }
      }
      if (!improved) break;
    }
  }

  optimizeGroup(activeSables, totalSableMass);
  optimizeGroup(activeGraviers, totalGravierMass);

  return masses;
}
