// Store léger (localStorage) pour la configuration UI du centre IA & API.
// N'affecte pas encore le comportement runtime — sert d'assise pour AIProviderFactory.

import { AI_FEATURES, AI_PROVIDERS, type AIProviderId } from "./aiCatalog";

const ROUTING_KEY = "ltpc.ai.routing.v1";
const PROVIDERS_KEY = "ltpc.ai.providers.v1";
const ACTIVE_PROVIDER_KEY = "ltpc.ai.activeProvider.v1";
const LAST_TEST_KEY = "ltpc.ai.lastTest.v1";

export interface ProviderState {
  configured: boolean;
  activeModelId?: string;
  disabled?: boolean;
}

export type RoutingMap = Record<string, string>; // featureId -> modelId
export type ProvidersState = Record<AIProviderId, ProviderState>;

export interface LastTest {
  at: string;
  providerId: AIProviderId;
  modelId: string;
  ok: boolean;
  durationMs: number;
}

const safeParse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
};

export const loadRouting = (): RoutingMap => {
  const stored = safeParse<RoutingMap>(localStorage.getItem(ROUTING_KEY), {});
  const out: RoutingMap = {};
  for (const f of AI_FEATURES) out[f.id] = stored[f.id] ?? f.defaultModelId;
  return out;
};

export const saveRouting = (routing: RoutingMap) => {
  localStorage.setItem(ROUTING_KEY, JSON.stringify(routing));
};

export const loadProviders = (): ProvidersState => {
  const stored = safeParse<Partial<ProvidersState>>(localStorage.getItem(PROVIDERS_KEY), {});
  const out = {} as ProvidersState;
  for (const p of AI_PROVIDERS) {
    out[p.id] = stored[p.id] ?? {
      // Les fournisseurs managés (Gemini / OpenAI via Lovable AI Gateway) sont considérés
      // comme opérationnels par défaut — la clé est gérée côté backend.
      configured: !!p.managed,
    };
  }
  return out;
};

export const saveProviders = (state: ProvidersState) => {
  localStorage.setItem(PROVIDERS_KEY, JSON.stringify(state));
};

export const loadActiveProvider = (): AIProviderId => {
  const raw = localStorage.getItem(ACTIVE_PROVIDER_KEY);
  if (raw && AI_PROVIDERS.some((p) => p.id === raw)) return raw as AIProviderId;
  return "gemini";
};

export const saveActiveProvider = (id: AIProviderId) => {
  localStorage.setItem(ACTIVE_PROVIDER_KEY, id);
};

export const loadLastTest = (): LastTest | null =>
  safeParse<LastTest | null>(localStorage.getItem(LAST_TEST_KEY), null);

export const saveLastTest = (t: LastTest) => {
  localStorage.setItem(LAST_TEST_KEY, JSON.stringify(t));
};
