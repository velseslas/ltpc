/**
 * Classification GTR des sols (NF P 11-300)
 * Guide des Terrassements Routiers
 */

export interface GTRClassificationResult {
  classe: string;
  sousClasse: string;
  label: string;
  description: string;
  color: string;
}

export interface ClassificationInput {
  passant_80mm: number;   // % passant 80 mm
  passant_2mm: number;    // % passant 2 mm
  passant_80um: number;   // % passant 80 µm (0.08 mm)
  wl: number;             // Limite de liquidité
  ip: number;             // Indice de plasticité
  vbs: number;            // Valeur au bleu de méthylène (g/100g)
  matiere_organique: number; // % matière organique
  caco3: number;          // % CaCO3
}

export interface USCSClassificationResult {
  code: string;
  label: string;
  description: string;
  color: string;
}

/**
 * Classification GTR (NF P 11-300)
 */
export function classifyGTR(input: ClassificationInput): GTRClassificationResult | null {
  const { passant_80um, passant_2mm, wl, ip, vbs, matiere_organique, caco3 } = input;

  // Class F: Sols organiques
  if (matiere_organique > 10) {
    return {
      classe: "F",
      sousClasse: matiere_organique > 30 ? "F3" : matiere_organique > 10 ? "F2" : "F1",
      label: "Sol organique",
      description: matiere_organique > 30
        ? "Tourbes et sols très organiques"
        : "Sol à forte teneur en matière organique",
      color: "text-emerald-700",
    };
  }

  // Class A: Sols fins (passant 80µm > 35%)
  if (passant_80um > 35) {
    if (ip <= 12) {
      return { classe: "A", sousClasse: "A1", label: "Sol fin peu plastique", description: "Limons peu plastiques, loess, silts", color: "text-sky-600" };
    }
    if (ip <= 25) {
      return { classe: "A", sousClasse: "A2", label: "Sol fin moyennement plastique", description: "Sables fins argileux, limons, argiles peu plastiques", color: "text-amber-600" };
    }
    if (ip <= 40) {
      return { classe: "A", sousClasse: "A3", label: "Sol fin plastique", description: "Argiles et marnes peu plastiques, limons très plastiques", color: "text-orange-600" };
    }
    return { classe: "A", sousClasse: "A4", label: "Sol fin très plastique", description: "Argiles et argiles marneuses très plastiques", color: "text-red-600" };
  }

  // Class B: Sols sableux et graveleux avec fines (passant 80µm ≤ 35%)
  if (passant_80um <= 35) {
    // B5: sols graveleux (passant 2mm ≤ 70%)
    if (passant_2mm <= 70) {
      if (passant_80um <= 12) {
        return { classe: "B", sousClasse: "B5", label: "Grave propre", description: "Graves propres à fines peu plastiques", color: "text-teal-600" };
      }
      return { classe: "B", sousClasse: "B6", label: "Grave argileuse", description: "Graves argileuses ou marneuses", color: "text-indigo-600" };
    }

    // Sols sableux (passant 2mm > 70%)
    if (vbs > 0) {
      if (vbs <= 0.1) {
        return { classe: "B", sousClasse: "B1", label: "Sable propre", description: "Sables et graves très sableux, peu ou pas pollués", color: "text-cyan-600" };
      }
      if (vbs <= 0.2) {
        return { classe: "B", sousClasse: "B2", label: "Sable peu argileux", description: "Sables et graves très sableux, peu argileux", color: "text-blue-600" };
      }
      if (vbs <= 1.5) {
        return { classe: "B", sousClasse: "B3", label: "Sable argileux", description: "Sables et graves très sableux, argileux", color: "text-purple-600" };
      }
      return { classe: "B", sousClasse: "B4", label: "Sable très argileux", description: "Sables et graves très sableux, très argileux", color: "text-rose-600" };
    }

    // Fallback par Ip si VBS non disponible
    if (ip <= 6) {
      return { classe: "B", sousClasse: "B1", label: "Sable propre", description: "Sables propres", color: "text-cyan-600" };
    }
    if (ip <= 10) {
      return { classe: "B", sousClasse: "B2", label: "Sable peu argileux", description: "Sables peu argileux", color: "text-blue-600" };
    }
    if (ip <= 20) {
      return { classe: "B", sousClasse: "B3", label: "Sable argileux", description: "Sables argileux", color: "text-purple-600" };
    }
    return { classe: "B", sousClasse: "B4", label: "Sable très argileux", description: "Sables très argileux", color: "text-rose-600" };
  }

  return null;
}

/**
 * Classification USCS améliorée (ASTM D2487)
 */
export function classifyUSCS(input: ClassificationInput): USCSClassificationResult | null {
  const { passant_80um, passant_2mm, wl, ip } = input;

  // Sols fins (>50% passant 80µm)
  if (passant_80um > 50) {
    const lineA = 0.73 * (wl - 20);
    const aboveA = ip >= lineA;

    if (ip < 4) {
      return wl < 50
        ? { code: "ML", label: "Limon peu plastique", description: "Limon inorganique de faible plasticité", color: "text-sky-600" }
        : { code: "MH", label: "Limon très plastique", description: "Limon inorganique de haute plasticité", color: "text-violet-600" };
    }

    if (ip >= 4 && ip <= 7 && wl < 50) {
      return { code: "CL-ML", label: "Argile limoneuse", description: "Sol intermédiaire entre argile et limon", color: "text-amber-600" };
    }

    if (aboveA && wl < 50) {
      return { code: "CL", label: "Argile peu plastique", description: "Argile inorganique de faible à moyenne plasticité", color: "text-orange-600" };
    }
    if (aboveA && wl >= 50) {
      return { code: "CH", label: "Argile très plastique", description: "Argile inorganique de haute plasticité", color: "text-red-600" };
    }
    if (!aboveA && wl < 50) {
      return { code: "ML", label: "Limon peu plastique", description: "Limon inorganique de faible plasticité", color: "text-sky-600" };
    }
    if (!aboveA && wl >= 50) {
      return { code: "MH", label: "Limon très plastique", description: "Limon inorganique de haute plasticité", color: "text-violet-600" };
    }
  }

  // Sols grossiers
  const coarse = 100 - passant_80um;
  const gravel = 100 - passant_2mm; // approximation
  const sand = passant_2mm - passant_80um;
  const isGravel = gravel > sand;

  if (passant_80um < 5) {
    // Sols propres
    if (isGravel) {
      return { code: "GW/GP", label: "Grave propre", description: "Grave bien/mal graduée", color: "text-teal-600" };
    }
    return { code: "SW/SP", label: "Sable propre", description: "Sable bien/mal gradué", color: "text-cyan-600" };
  }

  if (passant_80um >= 5 && passant_80um <= 12) {
    // Sols avec fines intermédiaires
    if (isGravel) {
      return ip > 7
        ? { code: "GC", label: "Grave argileuse", description: "Grave avec argile", color: "text-indigo-600" }
        : { code: "GM", label: "Grave limoneuse", description: "Grave avec limon", color: "text-blue-600" };
    }
    return ip > 7
      ? { code: "SC", label: "Sable argileux", description: "Sable avec argile", color: "text-purple-600" }
      : { code: "SM", label: "Sable limoneux", description: "Sable avec limon", color: "text-blue-500" };
  }

  // passant_80um > 12 et <= 50
  if (isGravel) {
    return ip > 7
      ? { code: "GC", label: "Grave argileuse", description: "Grave clayeuse", color: "text-indigo-600" }
      : { code: "GM", label: "Grave limoneuse", description: "Grave silteuse", color: "text-blue-600" };
  }
  return ip > 7
    ? { code: "SC", label: "Sable argileux", description: "Sable argileux", color: "text-purple-600" }
    : { code: "SM", label: "Sable limoneux", description: "Sable silteux", color: "text-blue-500" };
}

/**
 * Standard sieves for soil granulometry
 */
export const SOIL_SIEVES = [
  { label: "80 mm", value: 80 },
  { label: "63 mm", value: 63 },
  { label: "50 mm", value: 50 },
  { label: "31.5 mm", value: 31.5 },
  { label: "20 mm", value: 20 },
  { label: "10 mm", value: 10 },
  { label: "5 mm", value: 5 },
  { label: "2 mm", value: 2 },
  { label: "1 mm", value: 1 },
  { label: "0.5 mm", value: 0.5 },
  { label: "0.25 mm", value: 0.25 },
  { label: "0.125 mm", value: 0.125 },
  { label: "0.08 mm (80 µm)", value: 0.08 },
];
