// KnowledgeService — recherche hybride FTS (français) + re-ranking cosinus via embeddings.
// Ingestion déléguée à l'edge function `ltpc-ai-rag-index` (service role).
import { supabase } from "@/integrations/supabase/client";

export interface KnowledgeChunk {
  id: string;
  source_type: string;
  source_id: string;
  contenu: string;
  metadata: Record<string, unknown>;
  embedding?: number[] | null;
  score?: number;
}

export type IndexableSource = "rapport_technique" | "formulation" | "essai_compression" | "note";

function cosine(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
}

async function embedQuery(text: string): Promise<number[] | null> {
  const { data, error } = await supabase.functions.invoke("ltpc-ai-embed", { body: { texts: [text] } });
  if (error) { console.warn("[KnowledgeService] embed failed:", error.message); return null; }
  const e = (data as { embeddings?: number[][] } | null)?.embeddings?.[0];
  return e ?? null;
}

export const KnowledgeService = {
  async search(query: string, limit = 8): Promise<KnowledgeChunk[]> {
    const q = query.trim();
    if (!q) return [];
    const { data } = await supabase
      .from("ai_knowledge_chunks")
      .select("id, source_type, source_id, contenu, metadata")
      .textSearch("content_tsv", q, { config: "french", type: "websearch" })
      .limit(limit);
    return (data ?? []) as unknown as KnowledgeChunk[];
  },

  /** Hybrid: FTS pré-filtre (top-K), embeddings re-rangent par cosinus. */
  async hybridSearch(query: string, opts: { ftsLimit?: number; topK?: number; source_types?: string[] } = {}): Promise<KnowledgeChunk[]> {
    const q = query.trim();
    if (!q) return [];
    const fts = opts.ftsLimit ?? 30;
    const topK = opts.topK ?? 8;

    let qb = supabase
      .from("ai_knowledge_chunks")
      .select("id, source_type, source_id, contenu, metadata, embedding")
      .textSearch("content_tsv", q, { config: "french", type: "websearch" })
      .limit(fts);
    if (opts.source_types?.length) qb = qb.in("source_type", opts.source_types);
    const { data, error } = await qb;
    if (error) throw error;
    const candidates = (data ?? []) as unknown as KnowledgeChunk[];
    if (candidates.length === 0) return [];

    const qv = await embedQuery(q);
    if (!qv) return candidates.slice(0, topK);

    const scored = candidates
      .map((c) => ({ ...c, score: Array.isArray(c.embedding) ? cosine(qv, c.embedding as number[]) : 0 }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, topK);
    return scored;
  },

  /** Compte les chunks indexés par source. */
  async stats(): Promise<Array<{ source_type: string; chunks: number; sources: number }>> {
    const { data } = await supabase.from("ai_knowledge_chunks").select("source_type, source_id");
    const rows = (data ?? []) as Array<{ source_type: string; source_id: string }>;
    const map = new Map<string, { chunks: number; sources: Set<string> }>();
    for (const r of rows) {
      const e = map.get(r.source_type) ?? { chunks: 0, sources: new Set() };
      e.chunks++; e.sources.add(r.source_id);
      map.set(r.source_type, e);
    }
    return Array.from(map.entries()).map(([source_type, v]) => ({ source_type, chunks: v.chunks, sources: v.sources.size }));
  },

  /**
   * Lance l'indexation d'une source (edge function service role).
   * Les sources volumineuses sont découpées en lots : une indexation complète
   * en un seul appel dépasse le délai maximal d'une fonction serveur.
   */
  async reindex(source_type: IndexableSource, opts: { source_ids?: string[]; full?: boolean; note?: { id?: string; titre?: string; contenu: string; metadata?: Record<string, unknown> } } = {}) {
    const call = async (body: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke("ltpc-ai-rag-index", { body: { source_type, ...body } });
      if (error) throw new Error(error.message);
      const d = data as { indexed: number; chunks: number; skipped: number; error?: string };
      if (d?.error) throw new Error(d.error);
      return d;
    };

    if (source_type === "note" || opts.source_ids?.length) return call(opts);

    // Découpage en lots d'identifiants pour éviter les dépassements de délai.
    const table = { rapport_technique: "rapports_techniques", formulation: "formulations", essai_compression: "echantillons_compression" }[source_type];
    const { data: idRows } = await supabase.from(table as never).select("id").limit(500);
    const ids = ((idRows ?? []) as Array<{ id: string }>).map((r) => r.id);
    if (!ids.length) return call({ ...opts, full: true });

    const BATCH = 15;
    let indexed = 0, chunks = 0, skipped = 0;
    for (let i = 0; i < ids.length; i += BATCH) {
      const r = await call({ source_ids: ids.slice(i, i + BATCH), full: true });
      indexed += r.indexed; chunks += r.chunks; skipped += r.skipped;
    }
    return { indexed, chunks, skipped, source_type };
  },
};

