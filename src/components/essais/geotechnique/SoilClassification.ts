/**
 * Casagrande soil classification based on Atterberg limits.
 * Line A: Ip = 0.73 * (Wl - 20)
 * Line B: Wl = 50
 */

export interface SoilClassificationResult {
  code: string;
  label: string;
  description: string;
  color: string; // tailwind-compatible
}

export function classifySoil(wl: number, ip: number): SoilClassificationResult | null {
  if (wl <= 0 || ip <= 0) return null;

  const lineA = 0.73 * (wl - 20);
  const aboveA = ip >= lineA;

  if (ip < 4) {
    return {
      code: "ML",
      label: "Limon peu plastique",
      description: "Sol à faible plasticité, comportement limoneux",
      color: "text-sky-600",
    };
  }

  if (ip >= 4 && ip <= 7 && wl < 50) {
    // Zone CL-ML
    return {
      code: "CL-ML",
      label: "Argile limoneuse peu plastique",
      description: "Sol intermédiaire entre argile et limon de faible plasticité",
      color: "text-amber-600",
    };
  }

  if (aboveA && wl < 50) {
    return {
      code: "CL",
      label: "Argile peu plastique",
      description: "Argile inorganique de faible à moyenne plasticité",
      color: "text-orange-600",
    };
  }

  if (aboveA && wl >= 50) {
    return {
      code: "CH",
      label: "Argile très plastique",
      description: "Argile inorganique de haute plasticité",
      color: "text-red-600",
    };
  }

  if (!aboveA && wl < 50) {
    return {
      code: "ML",
      label: "Limon peu plastique",
      description: "Limon inorganique de faible plasticité",
      color: "text-sky-600",
    };
  }

  if (!aboveA && wl >= 50) {
    return {
      code: "MH",
      label: "Limon très plastique",
      description: "Limon inorganique de haute plasticité ou argile organique",
      color: "text-violet-600",
    };
  }

  return null;
}
