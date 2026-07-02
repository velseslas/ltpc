// Provider IA côté client — SEULE porte d'entrée pour toute fonctionnalité IA.
// Aucun composant React ne doit appeler Gemini/Lovable AI directement.
// Interface stable : demain on peut brancher OpenAI, Claude, Ollama sans toucher aux composants.

import { supabase } from "@/integrations/supabase/client";

export interface AIAnalyse {
  typeProbleme: string;
  niveauConfiance: number;
  gravite: "Faible" | "Moyenne" | "Élevée" | "Critique";
  materiauxConcernes: string[];
  essaisRecommandes: string[];
  normesApplicables?: string[];
  causesProbables: string[];
  risques: string[];
  informationsManquantes: string[];
}

export interface AIQuestion {
  question: string;
  importance?: "haute" | "moyenne" | "basse";
  categorie?: string;
}

export interface AIRapportContenu {
  titre: string;
  sections: {
    objet: string;
    contexte: string;
    constatations: string;
    analyse_technique: string;
    consequences: string;
    recommandations: string;
    conclusion: string;
  };
  faits: string[];
  hypotheses: string[];
  recommandations_synthese: string[];
}

export interface AIMeta {
  model: string;
  durationMs: number;
  tokensTotal?: number;
}

export type ImproveAction =
  | "ameliorer" | "reformuler" | "raccourcir" | "developper"
  | "corriger_style" | "corriger_grammaire" | "plus_technique";

export type AIReviewSeverity = "info" | "warning" | "critique";
export interface AIReviewObservation {
  severity: AIReviewSeverity;
  category: string;
  message: string;
}

export interface AIProvider {
  name: string;
  analyzeProblem(rapportId: string): Promise<{ analyse: AIAnalyse; meta: AIMeta }>;
  generateQuestions(rapportId: string): Promise<{ questions: AIQuestion[] }>;
  generateDraftReport(rapportId: string): Promise<{ contenu: AIRapportContenu; meta: AIMeta }>;
  improveText(input: { texte: string; action: ImproveAction; rapportId?: string; contexte?: string }): Promise<{ texte: string; meta: AIMeta }>;
  reviewReport(rapportId: string): Promise<{ observations: AIReviewObservation[]; score: number | null; meta: AIMeta }>;
  // À implémenter dans les phases suivantes :
  improveReport?(rapportId: string, instructions: string): Promise<{ contenu: AIRapportContenu }>;
  summarizeAttachments?(rapportId: string): Promise<{ resume: string }>;
  classifyProblem?(description: string): Promise<{ categorie: string; confiance: number }>;
}

async function invoke<T>(fn: string, payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(fn, { body: payload });
  if (error) throw new Error(error.message);
  if (data && typeof data === "object" && "error" in data) throw new Error(String((data as { error: unknown }).error));
  return data as T;
}

class LovableAIProvider implements AIProvider {
  name = "lovable-ai";
  analyzeProblem(rapportId: string) {
    return invoke<{ analyse: AIAnalyse; meta: AIMeta }>("rapport-ai-analyser", { rapport_id: rapportId });
  }
  generateQuestions(rapportId: string) {
    return invoke<{ questions: AIQuestion[] }>("rapport-ai-questions", { rapport_id: rapportId });
  }
  generateDraftReport(rapportId: string) {
    return invoke<{ contenu: AIRapportContenu; meta: AIMeta }>("rapport-ai-generer", { rapport_id: rapportId });
  }
  improveText(input: { texte: string; action: ImproveAction; rapportId?: string; contexte?: string }) {
    return invoke<{ texte: string; meta: AIMeta }>("rapport-ai-improve", {
      rapport_id: input.rapportId ?? null,
      texte: input.texte,
      action: input.action,
      contexte: input.contexte,
    });
  }
  reviewReport(rapportId: string) {
    return invoke<{ observations: AIReviewObservation[]; score: number | null; meta: AIMeta }>("rapport-ai-review", { rapport_id: rapportId });
  }
}

let currentProvider: AIProvider = new LovableAIProvider();

export function getAIProvider(): AIProvider { return currentProvider; }
export function setAIProvider(p: AIProvider) { currentProvider = p; }
