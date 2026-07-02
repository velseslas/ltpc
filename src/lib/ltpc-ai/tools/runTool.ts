// Petit helper commun aux outils : chrono + wrapping d'erreur → jamais de throw.
import type { Tool, ToolResult } from "./types";

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
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
