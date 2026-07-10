// Calculs pour l'essai de temps de prise du béton
// Méthode par résistance à la pénétration - ASTM C403/C403M
//
// Principe :
// - Le mortier est extrait du béton frais par tamisage à 4,75 mm
// - Les mesures sont réalisées avec un pénétromètre équipé d'aiguilles de différentes surfaces
// - La résistance de pénétration R (MPa) = Force (N) / Surface aiguille (mm²)
// - Début de prise : R = 3,5 MPa
// - Fin de prise   : R = 27,6 MPa
// Les temps sont obtenus par interpolation linéaire entre les deux mesures qui encadrent le seuil.

export interface MesurePenetration {
  temps_min: number;     // Temps écoulé depuis le contact eau-ciment, en minutes
  force_N: number;       // Force appliquée en Newtons
  aiguille_mm2: number;  // Surface de l'aiguille en mm²
}

export const AIGUILLES_STANDARD_MM2 = [645, 323, 161, 65, 32, 16] as const;

export const SEUIL_PRISE_INITIALE_MPA = 3.5;
export const SEUIL_PRISE_FINALE_MPA = 27.6;

export function calculerResistance(mesure: Partial<MesurePenetration>): number | null {
  const f = Number(mesure.force_N);
  const s = Number(mesure.aiguille_mm2);
  if (!f || !s || s <= 0) return null;
  return f / s; // N/mm² = MPa
}

export interface MesureCalculee extends MesurePenetration {
  resistance_MPa: number;
}

export function preparerMesures(mesures: Partial<MesurePenetration>[]): MesureCalculee[] {
  return mesures
    .filter((m) => m.temps_min != null && m.force_N != null && m.aiguille_mm2)
    .map((m) => ({
      temps_min: Number(m.temps_min),
      force_N: Number(m.force_N),
      aiguille_mm2: Number(m.aiguille_mm2),
      resistance_MPa: Number(m.force_N) / Number(m.aiguille_mm2),
    }))
    .sort((a, b) => a.temps_min - b.temps_min);
}

/**
 * Interpolation linéaire pour trouver le temps auquel la résistance atteint `seuil`.
 * Retourne null si les mesures n'encadrent pas le seuil.
 */
export function interpolerTemps(mesures: MesureCalculee[], seuil: number): number | null {
  if (mesures.length < 2) return null;
  for (let i = 1; i < mesures.length; i++) {
    const a = mesures[i - 1];
    const b = mesures[i];
    if ((a.resistance_MPa <= seuil && b.resistance_MPa >= seuil) ||
        (a.resistance_MPa >= seuil && b.resistance_MPa <= seuil)) {
      if (b.resistance_MPa === a.resistance_MPa) return a.temps_min;
      const ratio = (seuil - a.resistance_MPa) / (b.resistance_MPa - a.resistance_MPa);
      return a.temps_min + ratio * (b.temps_min - a.temps_min);
    }
  }
  return null;
}

export interface TempsPriseCalcule {
  temps_prise_initial: number | null;
  temps_prise_final: number | null;
}

export function calculerTempsPrise(mesures: Partial<MesurePenetration>[]): TempsPriseCalcule {
  const m = preparerMesures(mesures);
  return {
    temps_prise_initial: interpolerTemps(m, SEUIL_PRISE_INITIALE_MPA),
    temps_prise_final: interpolerTemps(m, SEUIL_PRISE_FINALE_MPA),
  };
}

export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null || !isFinite(minutes)) return "-";
  const total = Math.round(minutes);
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${hours}h ${String(mins).padStart(2, "0")}min`;
}
