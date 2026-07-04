/**
 * Calcul de l'abscisse XA du Point A (Dreux-Gorisse).
 *
 * Règle métier unique (Phase 5) :
 *   Dmax ≤ 20 mm  → XA = Dmax / 2
 *   Dmax >  20 mm → Module(XA) = (Module(Dmax) + 38) / 2 ; XA = moduleToSieve(Module(XA))
 *
 * Cette fonction est LA référence unique. Elle est utilisée à la fois par
 * l'UI (PointAEStep) et par le moteur de calcul (dreuxGorisseCalculation +
 * engine/gravelSplit/referenceCurve), afin qu'il ne puisse plus exister
 * deux XA différents.
 */

const MODULE_TO_SIEVE: { module: number; ouverture: number }[] = [
  { module: 20, ouverture: 0.08 },
  { module: 22, ouverture: 0.1 },
  { module: 23, ouverture: 0.125 },
  { module: 24, ouverture: 0.16 },
  { module: 25, ouverture: 0.2 },
  { module: 26, ouverture: 0.25 },
  { module: 27, ouverture: 0.315 },
  { module: 28, ouverture: 0.4 },
  { module: 29, ouverture: 0.5 },
  { module: 30, ouverture: 0.63 },
  { module: 31, ouverture: 0.8 },
  { module: 32, ouverture: 1 },
  { module: 33, ouverture: 1.25 },
  { module: 34, ouverture: 1.6 },
  { module: 35, ouverture: 2 },
  { module: 36, ouverture: 2.5 },
  { module: 37, ouverture: 3.15 },
  { module: 38, ouverture: 4 },
  { module: 39, ouverture: 5 },
  { module: 40, ouverture: 6.3 },
  { module: 41, ouverture: 8 },
  { module: 42, ouverture: 10 },
  { module: 43, ouverture: 12.5 },
  { module: 44, ouverture: 16 },
  { module: 45, ouverture: 20 },
  { module: 46, ouverture: 25 },
  { module: 47, ouverture: 31.5 },
  { module: 48, ouverture: 40 },
  { module: 49, ouverture: 50 },
  { module: 50, ouverture: 63 },
  { module: 51, ouverture: 80 },
];

export function sieveToModule(d: number): number {
  if (d <= MODULE_TO_SIEVE[0].ouverture) return MODULE_TO_SIEVE[0].module;
  if (d >= MODULE_TO_SIEVE[MODULE_TO_SIEVE.length - 1].ouverture)
    return MODULE_TO_SIEVE[MODULE_TO_SIEVE.length - 1].module;
  for (let i = 0; i < MODULE_TO_SIEVE.length - 1; i++) {
    if (d >= MODULE_TO_SIEVE[i].ouverture && d <= MODULE_TO_SIEVE[i + 1].ouverture) {
      const ratio =
        (Math.log10(d) - Math.log10(MODULE_TO_SIEVE[i].ouverture)) /
        (Math.log10(MODULE_TO_SIEVE[i + 1].ouverture) - Math.log10(MODULE_TO_SIEVE[i].ouverture));
      return MODULE_TO_SIEVE[i].module + ratio * (MODULE_TO_SIEVE[i + 1].module - MODULE_TO_SIEVE[i].module);
    }
  }
  return 38;
}

export function moduleToSieve(m: number): number {
  if (m <= MODULE_TO_SIEVE[0].module) return MODULE_TO_SIEVE[0].ouverture;
  if (m >= MODULE_TO_SIEVE[MODULE_TO_SIEVE.length - 1].module)
    return MODULE_TO_SIEVE[MODULE_TO_SIEVE.length - 1].ouverture;
  for (let i = 0; i < MODULE_TO_SIEVE.length - 1; i++) {
    if (m >= MODULE_TO_SIEVE[i].module && m <= MODULE_TO_SIEVE[i + 1].module) {
      const ratio =
        (m - MODULE_TO_SIEVE[i].module) /
        (MODULE_TO_SIEVE[i + 1].module - MODULE_TO_SIEVE[i].module);
      return MODULE_TO_SIEVE[i].ouverture *
        Math.pow(MODULE_TO_SIEVE[i + 1].ouverture / MODULE_TO_SIEVE[i].ouverture, ratio);
    }
  }
  return 4;
}

export interface XAResult {
  xA: number;
  method: string;
  moduleDmax: number;
  moduleXA: number;
}

/** Calcul unique de XA (Dreux-Gorisse). Doit être la SEULE source. */
export function calculateXA(dmax: number): XAResult {
  const moduleDmax = sieveToModule(dmax);
  if (dmax <= 20) {
    const xA = dmax / 2;
    return {
      xA,
      moduleDmax,
      moduleXA: sieveToModule(xA),
      method: `Dmax ≤ 20 mm → XA = Dmax / 2 = ${xA.toFixed(2)} mm`,
    };
  }
  const moduleXA = (moduleDmax + 38) / 2;
  const raw = moduleToSieve(moduleXA);
  const xA = Math.round(raw * 10) / 10;
  return {
    xA,
    moduleDmax,
    moduleXA,
    method: `Dmax > 20 mm → Module(XA) = (Module(Dmax) + 38) / 2 = (${moduleDmax.toFixed(1)} + 38) / 2 = ${moduleXA.toFixed(1)} → XA = ${xA.toFixed(2)} mm`,
  };
}
