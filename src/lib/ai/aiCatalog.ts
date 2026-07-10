// Catalogue central des fournisseurs, modèles et fonctionnalités IA de LTPC.
// UI uniquement — aucune clé API n'est manipulée ici.
// Sert de source unique pour la page Paramètres → IA & API.

export type AIProviderId =
  | "gemini"
  | "openai"
  | "mistral"
  | "deepseek"
  | "anthropic"
  | "ollama";

export interface AIProviderDef {
  id: AIProviderId;
  name: string;
  description: string;
  website: string;
  local?: boolean;
  /** Fournisseur pris en charge nativement par le backend actuel (Lovable AI Gateway). */
  managed?: boolean;
}

export interface AIModelDef {
  id: string;
  provider: AIProviderId;
  label: string;
  family?: string;
  contextTokens?: number;
  notes?: string;
}

export interface AIFeatureDef {
  id: string;
  label: string;
  description: string;
  /** Modèle par défaut proposé pour cette fonctionnalité. */
  defaultModelId: string;
  /** Statut fonctionnel actuel dans l'application. */
  status: "connected" | "planned";
}

export const AI_PROVIDERS: AIProviderDef[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    description: "Famille Gemini via Lovable AI Gateway.",
    website: "https://ai.google.dev",
    managed: true,
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-5 et variantes via Lovable AI Gateway.",
    website: "https://platform.openai.com",
    managed: true,
  },
  {
    id: "mistral",
    name: "Mistral AI",
    description: "Modèles Mistral (large / medium).",
    website: "https://mistral.ai",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    description: "DeepSeek Chat et Reasoner.",
    website: "https://deepseek.com",
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    description: "Claude Sonnet / Opus.",
    website: "https://anthropic.com",
  },
  {
    id: "ollama",
    name: "Ollama (local)",
    description: "Modèles ouverts exécutés en local.",
    website: "https://ollama.com",
    local: true,
  },
];

export const AI_MODELS: AIModelDef[] = [
  // Gemini
  { id: "google/gemini-2.5-flash", provider: "gemini", label: "Gemini 2.5 Flash", family: "Flash" },
  { id: "google/gemini-2.5-pro", provider: "gemini", label: "Gemini 2.5 Pro", family: "Pro" },
  { id: "google/gemini-3-flash-preview", provider: "gemini", label: "Gemini 3 Flash (preview)", family: "Flash" },
  // OpenAI
  { id: "openai/gpt-5", provider: "openai", label: "GPT-5" },
  { id: "openai/gpt-5-mini", provider: "openai", label: "GPT-5 mini" },
  { id: "openai/gpt-5-nano", provider: "openai", label: "GPT-5 nano" },
  // Mistral
  { id: "mistral/large", provider: "mistral", label: "Mistral Large" },
  { id: "mistral/medium", provider: "mistral", label: "Mistral Medium" },
  // DeepSeek
  { id: "deepseek/chat", provider: "deepseek", label: "DeepSeek Chat" },
  { id: "deepseek/reasoner", provider: "deepseek", label: "DeepSeek Reasoner" },
  // Anthropic
  { id: "anthropic/claude-sonnet", provider: "anthropic", label: "Claude Sonnet" },
  { id: "anthropic/claude-opus", provider: "anthropic", label: "Claude Opus" },
  // Ollama (local)
  { id: "ollama/llama3", provider: "ollama", label: "Llama 3" },
  { id: "ollama/mistral", provider: "ollama", label: "Mistral (local)" },
  { id: "ollama/deepseek", provider: "ollama", label: "DeepSeek (local)" },
];

export const AI_FEATURES: AIFeatureDef[] = [
  { id: "ltpc-chat", label: "LTPC AI Chat", description: "Assistant conversationnel principal.", defaultModelId: "google/gemini-2.5-flash", status: "connected" },
  { id: "analyse-technique", label: "Analyse technique", description: "Analyse d'un problème / rapport.", defaultModelId: "google/gemini-2.5-pro", status: "connected" },
  { id: "redaction-rapport", label: "Rédaction de rapports", description: "Génération de brouillons de rapports.", defaultModelId: "google/gemini-2.5-pro", status: "connected" },
  { id: "revue-ia", label: "Revue IA", description: "Relecture critique d'un rapport.", defaultModelId: "google/gemini-2.5-flash", status: "connected" },
  { id: "suggestions-ia", label: "Suggestions IA", description: "Reformulation et amélioration de texte.", defaultModelId: "google/gemini-2.5-flash", status: "connected" },
  { id: "resume-auto", label: "Résumé automatique", description: "Résumé de pièces jointes / longs textes.", defaultModelId: "google/gemini-2.5-flash", status: "planned" },
  { id: "classification", label: "Classification", description: "Classification automatique de problèmes.", defaultModelId: "google/gemini-2.5-flash-lite", status: "planned" },
  { id: "ocr", label: "OCR (à venir)", description: "Extraction de texte depuis images / PDF.", defaultModelId: "google/gemini-2.5-pro", status: "planned" },
  { id: "traduction", label: "Traduction (à venir)", description: "Traduction automatique de contenus.", defaultModelId: "google/gemini-2.5-flash", status: "planned" },
];

export const getModel = (id: string) => AI_MODELS.find((m) => m.id === id);
export const getProvider = (id: AIProviderId) => AI_PROVIDERS.find((p) => p.id === id);
export const getModelsByProvider = (id: AIProviderId) => AI_MODELS.filter((m) => m.provider === id);
