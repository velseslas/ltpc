/**
 * Dreux-Gorisse automatic concrete mix design calculation engine.
 * Computes granulate proportions from input parameters and optimizes
 * the mix curve to match the Dreux-Gorisse reference curve.
 */

// Standard sieve openings (mm)
const TAMIS_OPENINGS = [0.063, 0.125, 0.25, 0.5, 1, 2, 4, 6.3, 8, 10, 12.5, 16, 20, 25, 31.5, 40];

export interface GranulatInput {
  key: string;
  label: string;
  active: boolean;
  densite: number; // kg/m³ (e.g. 2650)
  curve: { ouverture: number; pourcentageTamisat: number }[];
  isSable: boolean;
}

export interface CalculationInputs {
  eau: number;        // kg/m³
  ciment: number;     // kg/m³
  ratioGS: number;    // G/S ratio
  coeffGranulaire: number;
  coeffCompacite: number;
  airOcclus: number;  // % (default 2)
  granulats: GranulatInput[];
}

export interface CalculationResult {
  masses: Record<string, number>; // key -> kg/m³
  volumes: {
    eau: number;
    ciment: number;
    air: number;
    granulatsTotal: number;
    sable: number;
    gravier: number;
  };
}

const DENSITE_CIMENT = 3110; // kg/m³

/**
 * Main calculation: compute granulate masses from volumes
 */
export function calculateMixDesign(inputs: CalculationInputs): CalculationResult {
  const { eau, ciment, ratioGS, coeffCompacite, airOcclus, granulats } = inputs;

  // Step 1-3: Volume calculations
  const Ve = eau / 1000;
  const Vc = ciment / DENSITE_CIMENT;
  const Vair = airOcclus / 100;

  // Step 4: Volume remaining for aggregates
  let Vgranulats = 1 - (Ve + Vc + Vair);

  // Step 7: Apply compacity coefficient correction
  if (coeffCompacite > 0) {
    Vgranulats = Vgranulats * coeffCompacite;
  }

  // Step 5-6: Split into sand and gravel volumes
  const Vsable = Vgranulats / (1 + ratioGS);
  const Vgravier = Vgranulats - Vsable;

  // Active granulats
  const activeSables = granulats.filter(g => g.active && g.isSable);
  const activeGraviers = granulats.filter(g => g.active && !g.isSable);

  // Step 8-9: Distribute volumes among active granulats
  const sableMasses = distributeVolume(Vsable, activeSables);
  const gravierMasses = distributeVolume(Vgravier, activeGraviers);

  const masses: Record<string, number> = {};
  for (const g of granulats) {
    if (!g.active) {
      masses[g.key] = 0;
      continue;
    }
    masses[g.key] = sableMasses[g.key] ?? gravierMasses[g.key] ?? 0;
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
    },
  };
}

/**
 * Distribute a total volume among granulats, converting to mass.
 * Simple equal split when no optimization data is available.
 */
function distributeVolume(
  totalVolume: number,
  granulats: GranulatInput[]
): Record<string, number> {
  const result: Record<string, number> = {};
  if (granulats.length === 0) return result;

  // Equal volume distribution
  const volumeEach = totalVolume / granulats.length;
  for (const g of granulats) {
    const densite = g.densite > 0 ? g.densite : 2650; // default
    result[g.key] = Math.round(volumeEach * densite);
  }
  return result;
}

/**
 * Compute the reference curve for optimization target
 */
function computeReferenceCurve(dMax: number, classeConsistance: string) {
  const dMin = 0.063;
  const kMap: Record<string, number> = { S1: 6, S2: 4, S3: 0, S4: -4, S5: -6 };
  const classeKey = classeConsistance?.split(" ")[0] || "S3";
  const K = kMap[classeKey] ?? 0;
  const xA = dMax / 2;
  const yA = 50 - Math.sqrt(dMax) + K;

  return TAMIS_OPENINGS.filter(ouv => ouv >= dMin && ouv <= dMax * 1.01).map(ouv => {
    let y: number;
    if (ouv <= xA) {
      const t = (Math.log10(ouv) - Math.log10(dMin)) / (Math.log10(xA) - Math.log10(dMin));
      y = t * yA;
    } else {
      const t = (Math.log10(ouv) - Math.log10(xA)) / (Math.log10(dMax) - Math.log10(xA));
      y = yA + t * (100 - yA);
    }
    return { ouverture: ouv, pourcentage: Math.max(0, Math.min(100, y)) };
  });
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
 * Uses iterative gradient-free optimization (simplex-like adjustment).
 */
export function optimizeMix(
  inputs: CalculationInputs,
  dMax: number,
  classeConsistance: string
): Record<string, number> {
  const { granulats } = inputs;
  const baseline = calculateMixDesign(inputs);
  const masses = { ...baseline.masses };

  const referenceCurve = computeReferenceCurve(dMax, classeConsistance);
  if (referenceCurve.length === 0) return masses;

  const activeGranulats = granulats.filter(g => g.active);
  if (activeGranulats.length < 2) return masses;

  // Total mass to preserve
  const activeSables = granulats.filter(g => g.active && g.isSable);
  const activeGraviers = granulats.filter(g => g.active && !g.isSable);
  const totalSableMass = activeSables.reduce((s, g) => s + (masses[g.key] ?? 0), 0);
  const totalGravierMass = activeGraviers.reduce((s, g) => s + (masses[g.key] ?? 0), 0);

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

  // Optimize within each group (sable/gravier) separately
  function optimizeGroup(group: GranulatInput[], totalMass: number) {
    if (group.length < 2) return;
    const step = totalMass * 0.01; // 1% steps

    for (let iter = 0; iter < 200; iter++) {
      let improved = false;
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const currentErr = computeError(masses);

          // Try shifting mass from i to j
          const testMasses1 = { ...masses };
          testMasses1[group[i].key] = Math.max(0, (masses[group[i].key] ?? 0) - step);
          testMasses1[group[j].key] = (masses[group[j].key] ?? 0) + step;
          const err1 = computeError(testMasses1);

          // Try shifting mass from j to i
          const testMasses2 = { ...masses };
          testMasses2[group[j].key] = Math.max(0, (masses[group[j].key] ?? 0) - step);
          testMasses2[group[i].key] = (masses[group[i].key] ?? 0) + step;
          const err2 = computeError(testMasses2);

          if (err1 < currentErr && err1 <= err2) {
            masses[group[i].key] = testMasses1[group[i].key];
            masses[group[j].key] = testMasses1[group[j].key];
            improved = true;
          } else if (err2 < currentErr) {
            masses[group[i].key] = testMasses2[group[i].key];
            masses[group[j].key] = testMasses2[group[j].key];
            improved = true;
          }
        }
      }
      if (!improved) break;
    }
  }

  optimizeGroup(activeSables, totalSableMass);
  optimizeGroup(activeGraviers, totalGravierMass);

  // Round all masses
  for (const key of Object.keys(masses)) {
    masses[key] = Math.round(masses[key]);
  }

  return masses;
}
