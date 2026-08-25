// Petit helper commun aux outils : chrono + wrapping d'erreur → jamais de throw.
import type { Tool, ToolResult } from "./types";

/** Message lisible depuis une Error, une erreur PostgREST ({message, details, hint}) ou autre. */
export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object") {
    const o = e as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    const parts = [o.message, o.details, o.hint].filter((x) => typeof x === "string" && x) as string[];
    if (parts.length) return o.code ? `${parts.join(" — ")} (code ${String(o.code)})` : parts.join(" — ");
    try { return JSON.stringify(e); } catch { return "Erreur inconnue"; }
  }
  return String(e);
}



export async function runTool(
  tool: Tool,
  fn: () => Promise<Omit<ToolResult, "tool" | "duration_ms">>,
): Promise<ToolResult> {
  const t0 = performance.now();
  try {
    const r = await fn();
    return { tool: tool.name, duration_ms: Math.round(performance.now() - t0), ...r };
  } catch (e) {
    return {
      tool: tool.name,
      duration_ms: Math.round(performance.now() - t0),
      ok: false,
      summary: `Erreur outil ${tool.name}`,
      data: {},
      citations: [],
      confidence: 0,
      error: errorMessage(e),
    };
  }
}
