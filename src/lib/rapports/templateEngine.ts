// Moteur de template — remplace les variables dynamiques dans un texte.
// {{chantier}}, {{client}}, {{date}}, {{ingenieur}}, {{numero_rapport}}, {{entreprise}}, {{projet}}, {{titre}}
// Utilisé pour l'éditeur (aperçu variables), la génération PDF (Phase 5).

export interface TemplateVariables {
  chantier?: string | null;
  client?: string | null;
  entreprise?: string | null;
  projet?: string | null;
  ingenieur?: string | null;
  numero_rapport?: string | null;
  titre?: string | null;
  date?: string | null;
}

export function renderTemplate(text: string, vars: TemplateVariables): string {
  if (!text) return text;
  const map: Record<string, string> = {
    chantier: vars.chantier ?? "",
    client: vars.client ?? "",
    entreprise: vars.entreprise ?? "",
    projet: vars.projet ?? "",
    ingenieur: vars.ingenieur ?? "",
    numero_rapport: vars.numero_rapport ?? "",
    titre: vars.titre ?? "",
    date: vars.date ?? new Date().toLocaleDateString("fr-FR"),
  };
  return text.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, k: string) =>
    Object.prototype.hasOwnProperty.call(map, k) ? map[k] : `{{${k}}}`
  );
}

export const AVAILABLE_VARIABLES: Array<{ key: keyof TemplateVariables; label: string }> = [
  { key: "chantier", label: "Chantier" },
  { key: "client", label: "Client" },
  { key: "entreprise", label: "Entreprise" },
  { key: "projet", label: "Projet" },
  { key: "ingenieur", label: "Ingénieur" },
  { key: "numero_rapport", label: "N° Rapport" },
  { key: "titre", label: "Titre" },
  { key: "date", label: "Date" },
];
