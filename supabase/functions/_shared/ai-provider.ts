// ============================================================================
// AIProviderFactory — couche d'abstraction unique pour toute l'IA du logiciel.
// Aucun module métier ne doit appeler un fournisseur directement.
// Fournisseurs supportés : lovable (Gemini/OpenAI via gateway), mistral,
// deepseek, anthropic, ollama. Les clés sont lues dans l'env ; un fournisseur
// dont la clé n'est pas présente est simplement absent du fallback.
// ============================================================================

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICallOptions {
  messages: AIMessage[];
  model?: string;
  responseFormat?: "json" | "text";
  temperature?: number;
}

export interface AICallResult {
  raw: string;
  parsed?: unknown;
  model: string;
  provider: string;
  durationMs: number;
  tokensInput?: number;
  tokensOutput?: number;
  tokensTotal?: number;
}

export interface AIProvider {
  name: string;
  defaultModel: string;
  available(): boolean;
  call(opts: AICallOptions): Promise<AICallResult>;
}

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------
function tryExtractJson(s: string): unknown | undefined {
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) return undefined;
  try { return JSON.parse(m[0]); } catch { return undefined; }
}

function classifyStatus(status: number, text: string): string {
  if (status === 429) return "AI_RATE_LIMIT: " + text;
  if (status === 402) return "AI_CREDITS_EXHAUSTED: " + text;
  if (status === 401 || status === 403) return "AI_AUTH: " + text;
  return `AI_ERROR_${status}: ${text}`;
}

async function postJson(url: string, headers: Record<string, string>, body: unknown) {
  const t0 = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const durationMs = Date.now() - t0;
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(classifyStatus(res.status, errText));
  }
  return { data: await res.json(), durationMs };
}

// ---------------------------------------------------------------------------
// Adaptateur OpenAI-compatible générique (Lovable Gateway, OpenAI, DeepSeek,
// Mistral, Ollama exposent tous /v1/chat/completions).
// ---------------------------------------------------------------------------
interface OpenAICompatCfg {
  name: string;
  baseUrl: string;
  apiKeyEnv?: string;
  defaultModel: string;
  authHeader?: "bearer" | "lovable";
  alwaysAvailable?: boolean;
}

function createOpenAICompatProvider(cfg: OpenAICompatCfg): AIProvider {
  const apiKey = cfg.apiKeyEnv ? Deno.env.get(cfg.apiKeyEnv) : undefined;
  return {
    name: cfg.name,
    defaultModel: cfg.defaultModel,
    available: () => cfg.alwaysAvailable ? true : !!apiKey,
    async call({ messages, model, responseFormat = "text", temperature }: AICallOptions) {
      if (!cfg.alwaysAvailable && !apiKey) throw new Error(`AI_MISSING_KEY: ${cfg.apiKeyEnv}`);
      const usedModel = model ?? cfg.defaultModel;
      const body: Record<string, unknown> = { model: usedModel, messages };
      if (responseFormat === "json") body.response_format = { type: "json_object" };
      if (temperature !== undefined) body.temperature = temperature;
      const headers: Record<string, string> = {};
      if (apiKey) {
        if (cfg.authHeader === "lovable") headers["Authorization"] = `Bearer ${apiKey}`;
        else headers["Authorization"] = `Bearer ${apiKey}`;
      }
      const { data, durationMs } = await postJson(cfg.baseUrl, headers, body);
      const raw = data?.choices?.[0]?.message?.content ?? "";
      let parsed: unknown | undefined;
      if (responseFormat === "json") {
        try { parsed = JSON.parse(raw); } catch { parsed = tryExtractJson(raw); }
      }
      return {
        raw,
        parsed,
        model: usedModel,
        provider: cfg.name,
        durationMs,
        tokensInput: data?.usage?.prompt_tokens,
        tokensOutput: data?.usage?.completion_tokens,
        tokensTotal: data?.usage?.total_tokens,
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Adaptateur Anthropic (schéma /v1/messages différent d'OpenAI)
// ---------------------------------------------------------------------------
function createAnthropicProvider(): AIProvider {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  const defaultModel = "claude-3-5-sonnet-latest";
  return {
    name: "anthropic",
    defaultModel,
    available: () => !!apiKey,
    async call({ messages, model, responseFormat, temperature }: AICallOptions) {
      if (!apiKey) throw new Error("AI_MISSING_KEY: ANTHROPIC_API_KEY");
      const usedModel = model ?? defaultModel;
      const system = messages.find(m => m.role === "system")?.content;
      const convo = messages.filter(m => m.role !== "system").map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));
      const body: Record<string, unknown> = {
        model: usedModel,
        max_tokens: 4096,
        messages: convo,
      };
      if (system) body.system = responseFormat === "json"
        ? `${system}\n\nRéponds uniquement en JSON valide.`
        : system;
      else if (responseFormat === "json") body.system = "Réponds uniquement en JSON valide.";
      if (temperature !== undefined) body.temperature = temperature;

      const { data, durationMs } = await postJson(
        "https://api.anthropic.com/v1/messages",
        {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body,
      );
      const raw = (data?.content ?? []).map((b: { type: string; text?: string }) =>
        b.type === "text" ? (b.text ?? "") : ""
      ).join("");
      let parsed: unknown | undefined;
      if (responseFormat === "json") {
        try { parsed = JSON.parse(raw); } catch { parsed = tryExtractJson(raw); }
      }
      return {
        raw,
        parsed,
        model: usedModel,
        provider: "anthropic",
        durationMs,
        tokensInput: data?.usage?.input_tokens,
        tokensOutput: data?.usage?.output_tokens,
        tokensTotal: (data?.usage?.input_tokens ?? 0) + (data?.usage?.output_tokens ?? 0),
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Registre des fournisseurs
// ---------------------------------------------------------------------------
export type ProviderName =
  | "lovable"
  | "openai"
  | "mistral"
  | "deepseek"
  | "anthropic"
  | "ollama";

let providersCache: Record<ProviderName, AIProvider> | null = null;

export function getProviders(): Record<ProviderName, AIProvider> {
  if (providersCache) return providersCache;
  const ollamaBase = Deno.env.get("OLLAMA_BASE_URL");
  providersCache = {
    lovable: createOpenAICompatProvider({
      name: "lovable",
      baseUrl: "https://ai.gateway.lovable.dev/v1/chat/completions",
      apiKeyEnv: "LOVABLE_API_KEY",
      defaultModel: "google/gemini-2.5-flash",
    }),
    openai: createOpenAICompatProvider({
      // OpenAI est aussi accessible via Lovable Gateway, mais un compte direct
      // reste supporté. Priorité au gateway si LOVABLE_API_KEY présent.
      name: "openai",
      baseUrl: "https://api.openai.com/v1/chat/completions",
      apiKeyEnv: "OPENAI_API_KEY",
      defaultModel: "gpt-4o-mini",
    }),
    mistral: createOpenAICompatProvider({
      name: "mistral",
      baseUrl: "https://api.mistral.ai/v1/chat/completions",
      apiKeyEnv: "MISTRAL_API_KEY",
      defaultModel: "mistral-large-latest",
    }),
    deepseek: createOpenAICompatProvider({
      name: "deepseek",
      baseUrl: "https://api.deepseek.com/v1/chat/completions",
      apiKeyEnv: "DEEPSEEK_API_KEY",
      defaultModel: "deepseek-chat",
    }),
    anthropic: createAnthropicProvider(),
    ollama: createOpenAICompatProvider({
      name: "ollama",
      baseUrl: `${ollamaBase ?? "http://localhost:11434"}/v1/chat/completions`,
      apiKeyEnv: undefined,
      defaultModel: "llama3.1",
      alwaysAvailable: !!ollamaBase,
    }),
  };
  return providersCache;
}

export function getProvider(name: ProviderName): AIProvider {
  const p = getProviders()[name];
  if (!p) throw new Error(`Fournisseur inconnu: ${name}`);
  return p;
}

// ---------------------------------------------------------------------------
// Routage par fonctionnalité — chaque feature a une chaîne primaire → fallback.
// Toute fonction IA de l'app doit appeler callAIFeature(feature, opts).
// ---------------------------------------------------------------------------
export type AIFeature =
  | "chat"          // LTPC AI chat
  | "analysis"      // Analyse IA rapports (JSON)
  | "narrative"     // Rédaction synthèse courte
  | "redaction"     // Génération de rapport long
  | "reformulation" // Amélioration texte
  | "audit"         // Revue / vérification
  | "review"        // Alias review
  | "questions"    // Génération de questions IA
  | "translation"
  | "ocr";

interface RouteStep { provider: ProviderName; model?: string }

export const FEATURE_ROUTING: Record<AIFeature, RouteStep[]> = {
  chat:          [{ provider: "lovable", model: "google/gemini-2.5-flash" }, { provider: "mistral" }, { provider: "deepseek" }, { provider: "anthropic" }],
  analysis:      [{ provider: "lovable", model: "google/gemini-2.5-pro" },   { provider: "anthropic" }, { provider: "mistral" }],
  narrative:     [{ provider: "lovable", model: "google/gemini-2.5-flash" }, { provider: "mistral" }, { provider: "deepseek" }],
  redaction:     [{ provider: "lovable", model: "google/gemini-2.5-pro" },   { provider: "anthropic" }, { provider: "mistral" }],
  reformulation: [{ provider: "lovable", model: "google/gemini-2.5-flash" }, { provider: "mistral" }, { provider: "deepseek" }],
  audit:         [{ provider: "lovable", model: "google/gemini-2.5-pro" },   { provider: "anthropic" }],
  review:        [{ provider: "lovable", model: "google/gemini-2.5-pro" },   { provider: "anthropic" }],
  questions:     [{ provider: "lovable", model: "google/gemini-2.5-flash" }, { provider: "mistral" }],
  translation:   [{ provider: "lovable", model: "google/gemini-2.5-flash" }, { provider: "mistral" }],
  ocr:           [{ provider: "lovable", model: "google/gemini-2.5-flash" }],
};

export interface FeatureCallResult extends AICallResult {
  attempts: Array<{ provider: string; model: string; error?: string }>;
}

export async function callAIFeature(feature: AIFeature, opts: AICallOptions): Promise<FeatureCallResult> {
  const chain = FEATURE_ROUTING[feature];
  if (!chain?.length) throw new Error(`Aucune route configurée pour ${feature}`);
  const attempts: FeatureCallResult["attempts"] = [];
  const providers = getProviders();
  let lastError: Error | null = null;

  for (const step of chain) {
    const p = providers[step.provider];
    if (!p || !p.available()) {
      attempts.push({ provider: step.provider, model: step.model ?? "n/a", error: "unavailable" });
      continue;
    }
    try {
      const result = await p.call({ ...opts, model: step.model ?? opts.model });
      return { ...result, attempts: [...attempts, { provider: p.name, model: result.model }] };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      attempts.push({ provider: step.provider, model: step.model ?? p.defaultModel, error: msg });
      lastError = e instanceof Error ? e : new Error(msg);
      // Erreurs terminales : on tente quand même le fallback (fournisseur suivant)
      continue;
    }
  }
  throw lastError ?? new Error(`Tous les fournisseurs ont échoué pour ${feature}`);
}

// ---------------------------------------------------------------------------
// Rétro-compatibilité : les modules existants peuvent continuer à consommer
// getDefaultProvider(). Nouvelle recommandation : callAIFeature(feature, ...).
// ---------------------------------------------------------------------------
export function createLovableProvider(_apiKey: string): AIProvider {
  return getProviders().lovable;
}

export function getDefaultProvider(): AIProvider {
  const p = getProviders().lovable;
  if (!p.available()) throw new Error("LOVABLE_API_KEY manquant");
  return p;
}
