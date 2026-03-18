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
  mfCible?: number;   // MF cible (idéal) for sand proportion calculation
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

  // Step 5: Generate preliminary reference curve for gravel optimization
  // Use MF cible or estimated MF for reference curve generation
  const prelimMf = inputs.mfCible ?? 2.5;
  const dMaxReel = determineDmax(granulats);
  const prelimPointA = calculatePointA(dMaxReel, coeffGranulaire, prelimMf);
  const referenceCurve = generateReferenceCurve(dMaxReel, prelimMf, prelimPointA);

  // Step 6: Distribute volumes
  const hasPresetMasses = !!presetMasses && Object.keys(presetMasses).length > 0;
  
  let sableMasses: Record<string, number>;
  let gravierMasses: Record<string, number>;
  
  if (hasPresetMasses) {
    sableMasses = Object.fromEntries(activeSables.map(s => [s.key, presetMasses?.[s.key] ?? 0]));
    gravierMasses = Object.fromEntries(activeGraviers.map(g => [g.key, presetMasses?.[g.key] ?? 0]));
  } else {
    sableMasses = distributeSand(Vsable, activeSables, inputs.mfCible, referenceCurve);
    gravierMasses = distributeGravel(Vgravier, activeGraviers, referenceCurve);
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

  // Calculate final Point A (using actual MF mélange)
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
 * Distribute sand volume among active sands using the MF cible formula.
 * 
 * Formula (2 sands):
 *   S1 = (MF_cible - MF2) / (MF1 - MF2)
 *   S2 = 1 - S1
 * 
 * Where:
 *   S1 = proportion of sand 1 (main sand, typically 0/3 or 0/4)
 *   S2 = proportion of sand 2 (correction sand, typically fine sand)
 *   MF1 = module de finesse of sand 1
 *   MF2 = module de finesse of sand 2
 *   MF_cible = target module de finesse (MF idéal from step 6)
 * 
 * Constraints: S1 and S2 must be between 0 and 1, S1 + S2 = 1
 * 
 * Fallback: if MF data is missing or only 1 sand, distribute equally.
 */
function distributeSand(
  totalVolume: number,
  sables: GranulatInput[],
  mfCible?: number
): Record<string, number> {
  const result: Record<string, number> = {};
  if (sables.length === 0) return result;

  if (sables.length === 1) {
    const s = sables[0];
    result[s.key] = s.densite > 0 ? totalVolume * s.densite : 0;
    return result;
  }

  // For exactly 2 sands with MF cible: use the formula S1 = (MFcible - MF2) / (MF1 - MF2)
  if (sables.length === 2 && typeof mfCible === "number" && mfCible > 0) {
    // Identify sand 1 (main, higher MF) and sand 2 (correction, lower MF)
    const sorted = [...sables].sort((a, b) => (b.moduleFinesse ?? 0) - (a.moduleFinesse ?? 0));
    const sand1 = sorted[0]; // Higher MF (main sand)
    const sand2 = sorted[1]; // Lower MF (correction sand)
    
    const mf1 = sand1.moduleFinesse;
    const mf2 = sand2.moduleFinesse;

    console.log('[distributeSand] MF formula inputs:', { mfCible, mf1, mf2, sand1Key: sand1.key, sand2Key: sand2.key, totalVolume });

    if (typeof mf1 === "number" && mf1 > 0 && typeof mf2 === "number" && mf2 > 0 && Math.abs(mf1 - mf2) > 0.001) {
      let s1 = (mfCible - mf2) / (mf1 - mf2);
      let s2 = 1 - s1;

      // Clamp to [0, 1]
      s1 = Math.max(0, Math.min(1, s1));
      s2 = Math.max(0, Math.min(1, s2));

      // Normalize to ensure S1 + S2 = 1
      const total = s1 + s2;
      if (total > 0) {
        s1 = s1 / total;
        s2 = s2 / total;
      }

      const vol1 = totalVolume * s1;
      const vol2 = totalVolume * s2;

      result[sand1.key] = sand1.densite > 0 ? vol1 * sand1.densite : 0;
      result[sand2.key] = sand2.densite > 0 ? vol2 * sand2.densite : 0;
      
      console.log('[distributeSand] MF formula result:', { s1: (s1*100).toFixed(1)+'%', s2: (s2*100).toFixed(1)+'%', mass1: result[sand1.key], mass2: result[sand2.key] });
      return result;
    }
  }

  // Fallback for >2 sands or missing MF data: equal distribution
  const volumeEach = totalVolume / sables.length;
  for (const s of sables) {
    result[s.key] = s.densite > 0 ? volumeEach * s.densite : 0;
  }

  return result;
}

/**
 * Solve least-squares proportions on the simplex for a group of granulats.
 * 
 * Minimizes: Σ (Σ(pi × Pi(d)) - P_ref(d))² 
 * Subject to: Σpi = 1, pi ≥ 0
 * 
 * Uses projected gradient descent on the probability simplex.
 * Works with any number of materials (1, 2, 3, ...).
 * 
 * @param group - Active granulats in this group
 * @param referenceCurve - Target Dreux curve values at each sieve
 * @param sieves - Sieve openings to use for fitting
 * @returns Volumetric proportions (sum = 1) keyed by granulat key
 */
function solveSimplexLeastSquares(
  group: GranulatInput[],
  referenceCurve: { ouverture: number; pourcentage: number }[],
  sieves: number[] = TAMIS_OPENINGS
): Record<string, number> {
  const n = group.length;
  if (n === 0) return {};
  if (n === 1) return { [group[0].key]: 1.0 };

  // Build matrix: A[sieve][material] = passing percentage at that sieve
  // Target vector: b[sieve] = reference curve value at that sieve
  const relevantSieves = sieves.filter(s => {
    // Only use sieves where at least one material has data and reference exists
    const hasRef = referenceCurve.some(r => Math.abs(r.ouverture - s) < 0.001);
    const hasData = group.some(g => g.curve.some(c => Math.abs(c.ouverture - s) < 0.001));
    return hasRef && hasData;
  });

  if (relevantSieves.length === 0) {
    // Fallback: equal distribution
    const eq = 1 / n;
    return Object.fromEntries(group.map(g => [g.key, eq]));
  }

  // Extract passing values for each material at each sieve
  const A: number[][] = relevantSieves.map(sieve => 
    group.map(g => {
      const pt = g.curve.find(c => Math.abs(c.ouverture - sieve) < 0.001);
      if (pt) return pt.pourcentageTamisat;
      // Interpolate: if sieve > max curve point, assume 100; if < min, assume 0
      const sorted = [...g.curve].sort((a, b) => a.ouverture - b.ouverture);
      if (sorted.length === 0) return 0;
      if (sieve <= sorted[0].ouverture) return sorted[0].pourcentageTamisat;
      if (sieve >= sorted[sorted.length - 1].ouverture) return sorted[sorted.length - 1].pourcentageTamisat;
      // Linear interpolation in log space
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sieve >= sorted[i].ouverture && sieve <= sorted[i + 1].ouverture) {
          const t = (Math.log10(sieve) - Math.log10(sorted[i].ouverture)) / 
                    (Math.log10(sorted[i + 1].ouverture) - Math.log10(sorted[i].ouverture));
          return sorted[i].pourcentageTamisat + t * (sorted[i + 1].pourcentageTamisat - sorted[i].pourcentageTamisat);
        }
      }
      return 0;
    })
  );

  const b: number[] = relevantSieves.map(sieve => {
    const pt = referenceCurve.find(r => Math.abs(r.ouverture - sieve) < 0.001);
    return pt ? pt.pourcentage : 0;
  });

  // For 2 materials: analytical 1D sweep (most common case)
  if (n === 2) {
    let bestP = 0.5;
    let bestErr = Infinity;
    for (let p = 0; p <= 1.0; p += 0.001) {
      let err = 0;
      for (let s = 0; s < A.length; s++) {
        const mix = p * A[s][0] + (1 - p) * A[s][1];
        err += (mix - b[s]) ** 2;
      }
      if (err < bestErr) {
        bestErr = err;
        bestP = p;
      }
    }
    return { [group[0].key]: bestP, [group[1].key]: 1 - bestP };
  }

  // For 3+ materials: projected gradient descent on simplex
  // Initialize with equal proportions
  let props = group.map(() => 1 / n);

  const lr = 0.0001; // learning rate
  const maxIter = 5000;

  for (let iter = 0; iter < maxIter; iter++) {
    // Compute gradient: dE/dp_i = 2 * Σ_s (Σ_j p_j*A[s][j] - b[s]) * A[s][i]
    const grad = new Array(n).fill(0);
    for (let s = 0; s < A.length; s++) {
      let mix = 0;
      for (let j = 0; j < n; j++) mix += props[j] * A[s][j];
      const residual = mix - b[s];
      for (let i = 0; i < n; i++) {
        grad[i] += 2 * residual * A[s][i];
      }
    }

    // Gradient step
    const newProps = props.map((p, i) => p - lr * grad[i]);

    // Project onto simplex: clip to ≥ 0, then normalize to sum = 1
    const clipped = newProps.map(p => Math.max(0, p));
    const sum = clipped.reduce((a, b) => a + b, 0);
    if (sum > 0) {
      props = clipped.map(p => p / sum);
    }
  }

  return Object.fromEntries(group.map((g, i) => [g.key, props[i]]));
}

/**
 * Distribute gravel volume using least-squares optimization against
 * the Dreux reference curve, using actual granulometric curves.
 * 
 * NO fixed percentages — proportions are computed mathematically.
 */
function distributeGravel(
  totalVolume: number,
  graviers: GranulatInput[],
  referenceCurve?: { ouverture: number; pourcentage: number }[]
): Record<string, number> {
  const result: Record<string, number> = {};
  if (graviers.length === 0) return result;

  if (graviers.length === 1) {
    const g = graviers[0];
    result[g.key] = g.densite > 0 ? totalVolume * g.densite : 0;
    return result;
  }

  // If we have a reference curve, use least-squares optimization
  if (referenceCurve && referenceCurve.length > 0) {
    const proportions = solveSimplexLeastSquares(graviers, referenceCurve);
    
    console.log('[distributeGravel] Optimized proportions:', 
      Object.entries(proportions).map(([k, v]) => `${k}: ${(v * 100).toFixed(1)}%`).join(', ')
    );

    for (const g of graviers) {
      const vol = totalVolume * (proportions[g.key] ?? 0);
      result[g.key] = g.densite > 0 ? vol * g.densite : 0;
    }
    return result;
  }

  // Fallback: equal distribution (only when no reference curve available)
  const volumeEach = totalVolume / graviers.length;
  for (const g of graviers) {
    result[g.key] = g.densite > 0 ? volumeEach * g.densite : 0;
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
  // Use MF mélange pondéré par les proportions réelles des sables; fallback to 2.5 if not available
  const mfForN = computeWeightedSandModuleFinesse(
    granulats
      .filter(g => g.active && g.isSable)
      .map((s) => ({
        active: true,
        moduleFinesse: s.moduleFinesse,
        proportion: s.densite > 0 ? (masses[s.key] ?? 0) / s.densite : 0,
      }))
  ) ?? 2.5;
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
