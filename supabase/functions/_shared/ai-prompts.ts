// Prompts système centralisés — jamais dans les composants React.
// Modifier ici pour ajuster le comportement du moteur IA.

export const SYSTEM_INGENIEUR_LABO = `Tu es un ingénieur senior spécialisé dans un laboratoire de contrôle des matériaux de construction (béton, granulats, ciments, adjuvants, aciers, sols, chaussées).
Tu rédiges avec un ton neutre, technique et juridiquement rigoureux.
Règles strictes :
- Ne jamais inventer d'information.
- Si une donnée manque, écrire exactement : "Information non disponible."
- Distinguer clairement Faits / Hypothèses / Analyses / Recommandations / Conclusions.
- Citer des normes uniquement si elles sont pertinentes (EN 206, NF P18, NF EN 12350, NF EN 12390, ASTM, NA...).
- Répondre uniquement dans le format demandé, sans texte libre supplémentaire.`;

export function promptAnalyseProbleme(input: {
  description: string;
  categorie?: string | null;
  modele?: string | null;
  gravite?: string | null;
  chantier?: string | null;
  client?: string | null;
  entreprise?: string | null;
  projet?: string | null;
  materiaux?: string[];
  formulations?: Array<{ nom: string; resistance_28j: number | null }>;
  essais?: Array<{ type: string; count: number }>;
  piecesJointes?: Array<{ type: string; nom: string }>;
  reponsesQuestions?: Array<{ question: string; reponse: string }>;
}): string {
  return `Analyse le problème technique suivant et retourne EXCLUSIVEMENT un JSON valide conforme au schéma ci-dessous. Aucun texte hors JSON.

SCHÉMA JSON:
{
  "typeProbleme": string,
  "niveauConfiance": number (0 à 100),
  "gravite": "Faible" | "Moyenne" | "Élevée" | "Critique",
  "materiauxConcernes": string[],
  "essaisRecommandes": string[],
  "normesApplicables": string[],
  "causesProbables": string[],
  "risques": string[],
  "informationsManquantes": string[]
}

CONTEXTE:
- Catégorie: ${input.categorie ?? "Non précisée"}
- Modèle: ${input.modele ?? "Non précisé"}
- Gravité déclarée: ${input.gravite ?? "Non précisée"}
- Client: ${input.client ?? "N/A"}
- Entreprise: ${input.entreprise ?? "N/A"}
- Chantier: ${input.chantier ?? "N/A"}
- Projet: ${input.projet ?? "N/A"}
- Matériaux détectés: ${(input.materiaux ?? []).join(", ") || "N/A"}
- Formulations: ${(input.formulations ?? []).map(f => `${f.nom}${f.resistance_28j ? ` (Rc28=${f.resistance_28j})` : ""}`).join(" | ") || "N/A"}
- Essais disponibles: ${(input.essais ?? []).map(e => `${e.type}(${e.count})`).join(", ") || "N/A"}
- Pièces jointes: ${(input.piecesJointes ?? []).map(p => `${p.type}:${p.nom}`).join(", ") || "Aucune"}
${input.reponsesQuestions?.length ? `\nRÉPONSES COMPLÉMENTAIRES DU TECHNICIEN:\n${input.reponsesQuestions.map(r => `- Q: ${r.question}\n  R: ${r.reponse}`).join("\n")}` : ""}

DESCRIPTION DU PROBLÈME:
"""
${input.description}
"""

Retourne uniquement le JSON.`;
}

export function promptQuestionsIntelligentes(input: {
  description: string;
  informationsManquantes: string[];
  categorie?: string | null;
}): string {
  return `À partir de l'analyse préliminaire, génère 3 à 8 questions ciblées à poser au technicien pour lever les zones d'ombre.

Retourne EXCLUSIVEMENT un JSON:
{
  "questions": [
    { "question": string, "importance": "haute" | "moyenne" | "basse", "categorie": string }
  ]
}

Contexte catégorie: ${input.categorie ?? "N/A"}
Informations manquantes identifiées:
${input.informationsManquantes.map(i => `- ${i}`).join("\n")}

Description originale:
"""
${input.description}
"""

Questions concrètes, précises, orientées mesure/preuve/traçabilité. Aucun texte hors JSON.`;
}

export function promptGenerationRapport(input: {
  description: string;
  analyse: Record<string, unknown> | null;
  contexte: {
    client?: string | null;
    entreprise?: string | null;
    chantier?: string | null;
    projet?: string | null;
    materiaux?: string[];
  };
  reponsesQuestions?: Array<{ question: string; reponse: string }>;
}): string {
  return `Rédige un rapport technique structuré en 7 sections obligatoires. Retourne EXCLUSIVEMENT un JSON.

SCHÉMA:
{
  "titre": string,
  "sections": {
    "objet": string,
    "contexte": string,
    "constatations": string,
    "analyse_technique": string,
    "consequences": string,
    "recommandations": string,
    "conclusion": string
  },
  "faits": string[],
  "hypotheses": string[],
  "recommandations_synthese": string[]
}

Règles:
- Style ingénieur, ton neutre, aucune invention.
- Si une info manque, écrire "Information non disponible."
- Distinguer faits / hypothèses / recommandations.
- Utiliser des paragraphes clairs (Markdown léger autorisé dans les sections).

CONTEXTE:
- Client: ${input.contexte.client ?? "N/A"} | Entreprise: ${input.contexte.entreprise ?? "N/A"}
- Chantier: ${input.contexte.chantier ?? "N/A"} | Projet: ${input.contexte.projet ?? "N/A"}
- Matériaux: ${(input.contexte.materiaux ?? []).join(", ") || "N/A"}

ANALYSE IA PRÉALABLE:
${input.analyse ? JSON.stringify(input.analyse, null, 2) : "Non disponible"}

DESCRIPTION INITIALE:
"""
${input.description}
"""

${input.reponsesQuestions?.length ? `RÉPONSES AUX QUESTIONS:\n${input.reponsesQuestions.map(r => `Q: ${r.question}\nR: ${r.reponse}`).join("\n\n")}` : ""}

Retourne uniquement le JSON.`;
}

export type ImproveAction =
  | "ameliorer" | "reformuler" | "raccourcir" | "developper"
  | "corriger_style" | "corriger_grammaire" | "plus_technique";

const ACTION_INSTRUCTIONS: Record<ImproveAction, string> = {
  ameliorer: "Améliore la qualité rédactionnelle en gardant le sens exact.",
  reformuler: "Reformule le texte avec une tournure différente, sans en changer le sens.",
  raccourcir: "Raccourcis le texte à l'essentiel, style concis et technique.",
  developper: "Développe le texte avec plus de précisions techniques pertinentes, sans rien inventer.",
  corriger_style: "Corrige le style pour un ton professionnel d'ingénieur laboratoire.",
  corriger_grammaire: "Corrige uniquement les fautes de grammaire, orthographe et ponctuation. Ne change rien d'autre.",
  plus_technique: "Rends le texte plus technique et normatif, en utilisant le vocabulaire du contrôle des matériaux.",
};

export function promptImproveText(input: { texte: string; action: ImproveAction; contexte?: string }): string {
  return `${ACTION_INSTRUCTIONS[input.action]}

Règles :
- Ne pas inventer d'information nouvelle.
- Garder les valeurs numériques et normes exactes.
- Retourner UNIQUEMENT le texte transformé, sans commentaires, sans balises Markdown de code, sans préambule.

${input.contexte ? `Contexte : ${input.contexte}\n` : ""}Texte source :
"""
${input.texte}
"""`;
}
