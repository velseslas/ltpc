// KnowledgeTool — recherche RAG hybride (FTS + embeddings) via KnowledgeService.
import type { Tool } from "./types";
import { runTool } from "./runTool";
import { KnowledgeService } from "../KnowledgeService";
import type { AICitation } from "../types";

export const KnowledgeTool: Tool = {
  name: "KnowledgeTool",
  description: "Recherche sémantique (RAG) dans la base de connaissances indexée.",
  supports: (d) =>
    d.domains.includes("knowledge") ||
    d.intents.includes("analyse") || d.intents.includes("recommend") || d.intents.includes("summarize"),
  confidence: (d) => {
    // Le RAG n'a d'intérêt que pour du raisonnement, pas pour un simple "combien".
    if (d.intents.includes("count") || d.intents.includes("list")) return 0;
    if (d.domains.includes("knowledge")) return 0.9;
    return d.keywords.length ? 0.55 : 0.2;
  },
  execute: (d) => runTool(KnowledgeTool, async () => {
    const query = d.original_query || d.keywords.join(" ");
    const chunks = await KnowledgeService.hybridSearch(query, { topK: 6 });
    const citations: AICitation[] = chunks.map((c) => ({
      source_type: c.source_type, source_id: c.source_id,
      label: (c.metadata as { label?: string })?.label ?? c.source_type,
      snippet: c.contenu.slice(0, 220),
      reference: null,
    }));
    return {
      ok: true,
      summary: `${chunks.length} chunks pertinents (RAG)`,
      data: {
        chunks: chunks.map((c) => ({
          source_type: c.source_type, source_id: c.source_id,
          score: c.score, excerpt: c.contenu.slice(0, 400),
        })),
      },
      citations,
      confidence: chunks.length ? 0.8 : 0.3,
      chunks: chunks.length,
    };
  }),
};
