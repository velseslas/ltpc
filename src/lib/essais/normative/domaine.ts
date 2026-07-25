/**
 * ─────────────────────────────────────────────────────────────
 * CONTRÔLE DU DOMAINE D'APPLICATION DES CAROTTES (A-3)
 * ─────────────────────────────────────────────────────────────
 * Vérifie, AVANT toute exploitation normative, qu'une carotte
 * appartient au domaine d'application de la procédure choisie.
 *
 * Règles appliquées (communes EN 13791:2007 et EN 13791:2019) :
 *   - diamètre nominal minimal absolu : 50 mm ;
 *   - diamètre recommandé : ≥ 100 mm ;
 *   - relation granulat : Ø ≥ 3 × Dmax ;
 *   - élancement exploitable : 1,00 ≤ L/D ≤ 2,00 ;
 *   - présence d'armature : carotte à examiner (résultat non
 *     représentatif de la résistance du béton) ;
 *   - données manquantes : carotte non exploitable.
 *
 * AUCUNE règle n'est inventée : les carottes qui sortent du
 * domaine ne sont pas « corrigées », elles sont signalées et
 * retirées du calcul normatif.
 */
import type { CarotteEvaluee, StatutCarotte } from "./types";

export const D_MIN_ABSOLU = 50;
export const D_RECOMMANDE = 100;
export const LD_MIN = 1.0;
export const LD_MAX = 2.0;

export interface DomaineVerdict {
  /** Statut imposé par le domaine d'application */
  statut: Extract<StatutCarotte, "valide" | "a_examiner" | "hors_domaine">;
  motifs: string[];
}

/**
 * @param dmax Dmax du granulat (mm) — null si non renseigné
 */
export function verifierDomaine(c: CarotteEvaluee, dmax: number | null): DomaineVerdict {
  const motifs: string[] = [];
  let hors = false;
  let examiner = false;

  // ── Données indispensables ──
  if (c.diametre === null || !isFinite(c.diametre) || c.diametre <= 0) {
    motifs.push("Diamètre non renseigné");
    hors = true;
  }
  if (c.longueur === null || !isFinite(c.longueur) || c.longueur <= 0) {
    motifs.push("Longueur non renseignée");
    hors = true;
  }
  if (c.fcorr === null || !isFinite(c.fcorr) || c.fcorr <= 0) {
    motifs.push("Résistance de référence (fcorr 16×32) non disponible");
    hors = true;
  }

  // ── Diamètre ──
  if (c.diametre !== null && isFinite(c.diametre) && c.diametre > 0) {
    if (c.diametre < D_MIN_ABSOLU) {
      motifs.push(`Diamètre insuffisant : Ø${c.diametre} mm < ${D_MIN_ABSOLU} mm`);
      hors = true;
    } else if (c.diametre < D_RECOMMANDE) {
      motifs.push(`Diamètre Ø${c.diametre} mm inférieur au diamètre recommandé de ${D_RECOMMANDE} mm — admissible sous condition Ø ≥ 3·Dmax`);
      examiner = true;
    }

    // ── Relation avec le Dmax du granulat ──
    if (dmax === null || !isFinite(dmax) || dmax <= 0) {
      motifs.push("Dmax du granulat non renseigné — condition Ø ≥ 3·Dmax non vérifiable");
      examiner = true;
    } else if (c.diametre < 3 * dmax) {
      motifs.push(`Dmax incompatible : Ø${c.diametre} mm < 3 × Dmax (${(3 * dmax).toFixed(0)} mm)`);
      hors = true;
    }
  }

  // ── Élancement ──
  if (c.ld !== null && isFinite(c.ld) && c.ld > 0) {
    if (c.ld < LD_MIN - 1e-9) {
      motifs.push(`L/D hors domaine : ${c.ld.toFixed(3)} < ${LD_MIN.toFixed(2)}`);
      hors = true;
    } else if (c.ld > LD_MAX + 1e-9) {
      motifs.push(`L/D hors domaine : ${c.ld.toFixed(3)} > ${LD_MAX.toFixed(2)} — la méthode de correction d'élancement ne couvre pas ce domaine`);
      hors = true;
    }
  } else if (c.diametre !== null && c.longueur !== null) {
    motifs.push("Élancement L/D non calculable");
    hors = true;
  }

  // ── Armature ──
  if (c.armature) {
    motifs.push("Présence d'armature — résultat potentiellement non représentatif");
    examiner = true;
  }

  if (hors) return { statut: "hors_domaine", motifs };
  if (examiner) return { statut: "a_examiner", motifs };
  return { statut: "valide", motifs: [] };
}
