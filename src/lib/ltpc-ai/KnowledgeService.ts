// KnowledgeService — interface stable pour la future indexation RAG.
// Recherche plein-texte française via `content_tsv` (GIN). Sera remplacée par pgvector.
import { supabase } from "@/integrations/supabase/client";

export interface KnowledgeChunk {
  id: string;
  source_type: string;
  source_id: string;
  contenu: string;
  metadata: Record<string, unknown>;
  score?: number;
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

  async upsertChunk(chunk: {
    source_type: string; source_id: string; contenu: string;
    metadata?: Record<string, unknown>; chunk_index?: number;
    embedding?: number[]; embedding_model?: string;
  }) {
    const payload = {
      source_type: chunk.source_type,
      source_id: chunk.source_id,
      chunk_index: chunk.chunk_index ?? 0,
      contenu: chunk.contenu,
      metadata: chunk.metadata ?? {},
      embedding: chunk.embedding ?? null,
      embedding_model: chunk.embedding_model ?? null,
    } as never;
    const { error } = await supabase.from("ai_knowledge_chunks")
      .upsert(payload, { onConflict: "source_type,source_id,chunk_index" });
    if (error) throw error;
  },
};
