// KnowledgeService — interface stable pour la future indexation RAG.
// Implémentation actuelle : recherche plein-texte français via `content_tsv` (GIN).
// Prochaine étape : remplacer `search()` par une recherche vectorielle pgvector
// sans changer les composants qui appellent ce service.
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
  /** Recherche plein-texte. Sera remplacée par une recherche sémantique. */
  async search(query: string, limit = 8): Promise<KnowledgeChunk[]> {
    const q = query.trim();
    if (!q) return [];
    const { data } = await supabase
      .from("ai_knowledge_chunks")
      .select("id, source_type, source_id, contenu, metadata")
      .textSearch("content_tsv", q, { config: "french", type: "websearch" })
      .limit(limit);
    return (data ?? []) as KnowledgeChunk[];
  },

  /** Point d'entrée d'ingestion — appelé plus tard par des workers/edge functions. */
  async upsertChunk(chunk: Omit<KnowledgeChunk, "id" | "score"> & { chunk_index?: number; embedding?: number[]; embedding_model?: string }) {
    const { error } = await supabase.from("ai_knowledge_chunks").upsert({
      source_type: chunk.source_type,
      source_id: chunk.source_id,
      chunk_index: chunk.chunk_index ?? 0,
      contenu: chunk.contenu,
      metadata: chunk.metadata,
      embedding: chunk.embedding ?? null,
      embedding_model: chunk.embedding_model ?? null,
    }, { onConflict: "source_type,source_id,chunk_index" });
    if (error) throw error;
  },
};
