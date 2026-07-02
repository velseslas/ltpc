// Provider IA découplé — permet de basculer plus tard vers OpenAI, Claude, Ollama...
// Toute fonctionnalité IA du logiciel doit passer par ce module.

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
  durationMs: number;
  tokensInput?: number;
  tokensOutput?: number;
  tokensTotal?: number;
}

export interface AIProvider {
  name: string;
  call(opts: AICallOptions): Promise<AICallResult>;
}

// -------- Lovable AI Gateway (Gemini par défaut) --------
const DEFAULT_MODEL = "google/gemini-2.5-flash";
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export function createLovableProvider(apiKey: string): AIProvider {
  return {
    name: "lovable-ai",
    async call({ messages, model = DEFAULT_MODEL, responseFormat = "text", temperature }: AICallOptions) {
      const body: Record<string, unknown> = { model, messages };
      if (responseFormat === "json") body.response_format = { type: "json_object" };
      if (temperature !== undefined) body.temperature = temperature;

      const t0 = Date.now();
      const res = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });
      const durationMs = Date.now() - t0;

      if (!res.ok) {
        const errText = await res.text();
        if (res.status === 429) throw new Error("AI_RATE_LIMIT: " + errText);
        if (res.status === 402) throw new Error("AI_CREDITS_EXHAUSTED: " + errText);
        throw new Error(`AI_ERROR_${res.status}: ${errText}`);
      }

      const data = await res.json();
      const raw = data?.choices?.[0]?.message?.content ?? "";
      let parsed: unknown | undefined;
      if (responseFormat === "json") {
        try { parsed = JSON.parse(raw); } catch { parsed = tryExtractJson(raw); }
      }
      return {
        raw,
        parsed,
        model,
        durationMs,
        tokensInput: data?.usage?.prompt_tokens,
        tokensOutput: data?.usage?.completion_tokens,
        tokensTotal: data?.usage?.total_tokens,
      };
    },
  };
}

function tryExtractJson(s: string): unknown | undefined {
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) return undefined;
  try { return JSON.parse(m[0]); } catch { return undefined; }
}

export function getDefaultProvider(): AIProvider {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY manquant");
  return createLovableProvider(key);
}
