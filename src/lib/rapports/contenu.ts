/**
 * Helpers de contenu des rapports techniques.
 *
 * L'IA écrit littéralement « Information non disponible. » quand une donnée
 * manque. Un rapport dont toutes les sections portent ce libellé n'a aucun
 * contenu : il ne doit ni être fabriqué automatiquement, ni s'imprimer comme
 * une suite de sections vides.
 */

export const CONTENU_PLACEHOLDER = "information non disponible.";

/** Vrai si la valeur porte une information réelle (et non le libellé de repli). */
export function hasContenu(value?: string | null): boolean {
  const t = (value ?? "").trim();
  return t.length > 0 && t.toLowerCase() !== CONTENU_PLACEHOLDER;
}

/**
 * Retire d'un HTML enregistré les sections « Information non disponible. ».
 * Renvoie une chaîne vide s'il ne reste plus aucun texte.
 */
export function stripPlaceholderSections(html: string): string {
  const cleaned = (html ?? "").replace(
    /<h([2-3])[^>]*>[\s\S]*?<\/h\1>\s*<p[^>]*>\s*Information non disponible\.?\s*<\/p>/gi,
    "",
  );
  const text = cleaned.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").trim();
  return text.length > 0 ? cleaned : "";
}
