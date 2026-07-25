// P1/7-8-9-12 — Récupération RAG côté serveur pour les fonctions `rapport-ai-*`.
//
// Principes :
//  - on n'injecte JAMAIS toute la base : recherche ciblée (FTS français) +
//    re-ranking cosinus par embeddings, top-K borné et extraits tronqués ;
//  - chaque extrait porte un identifiant de source traçable (source_type/source_id)
//    afin qu'aucune citation normative ne soit produite sans source ;
//  - le contenu récupéré est traité comme DONNÉE, jamais comme instruction
//    (voir `wrapUntrusted` dans ai-prompts.ts).
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export interface RagChunk {
  id: string;
  source_type: string;
  source_id: string;
  contenu: string;
  metadata: Record<string, unknown>;
  score: number;
}

const EMBED_MODEL = "google/gemini-embedding-001";

function cosine(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
}

async function embedQuery(apiKey: string, text: string): Promise<number[] | null> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: EMBED_MODEL, input: [text.slice(0, 4000)] }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

/** Réduit une requête libre à des mots-clés exploitables par la recherche plein texte. */
function toSearchQuery(raw: string): string {
  return raw
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 12)
    .join(" ")
    .trim();
}

/**
 * Recherche les extraits documentaires pertinents. Retourne [] silencieusement
 * si la base de connaissance est vide ou si la recherche échoue : l'absence de
 * RAG ne doit jamais bloquer la rédaction, elle doit être signalée au modèle.
 */
export async function retrieveKnowledge(
  admin: SupabaseClient,
  query: string,
  opts: { topK?: number; ftsLimit?: number; sourceTypes?: string[]; excludeSourceId?: string } = {},
): Promise<RagChunk[]> {
  const q = toSearchQuery(query);
  if (!q) return [];
  const topK = opts.topK ?? 6;
  const ftsLimit = opts.ftsLimit ?? 30;

  let qb = admin
    .from("ai_knowledge_chunks")
    .select("id, source_type, source_id, contenu, metadata, embedding")
    .textSearch("content_tsv", q, { config: "french", type: "websearch" })
    .limit(ftsLimit);
  if (opts.sourceTypes?.length) qb = qb.in("source_type", opts.sourceTypes);

  const { data, error } = await qb;
  if (error || !data?.length) return [];

  let candidates = data as unknown as Array<RagChunk & { embedding?: number[] | null }>;
  if (opts.excludeSourceId) candidates = candidates.filter((c) => c.source_id !== opts.excludeSourceId);
  if (!candidates.length) return [];

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  const qv = apiKey ? await embedQuery(apiKey, q) : null;
  if (!qv) return candidates.slice(0, topK).map((c) => ({ ...c, score: 0, embedding: undefined }));

  return candidates
    .map((c) => ({ ...c, score: Array.isArray(c.embedding) ? cosine(qv, c.embedding) : 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ embedding: _e, ...rest }) => rest as RagChunk);
}

/** Bloc documentaire traçable injecté dans le prompt (données, pas instructions). */
export function formatKnowledgeBlock(chunks: RagChunk[]): string {
  if (!chunks.length) {
    return `AUCUN document pertinent trouvé dans la base documentaire interne.
En conséquence : ne citer AUCUNE norme, clause ou référence normative comme sourcée.
Si une référence normative est nécessaire, écrire exactement :
"Source normative non disponible dans la base documentaire. Vérification humaine requise."`;
  }
  return chunks
    .map((c, i) => {
      const label = (c.metadata?.label as string) ?? (c.metadata?.numero as string) ?? c.source_type;
      return `[SRC-${i + 1}] source_type=${c.source_type} source_id=${c.source_id} label=${label}\n${c.contenu.slice(0, 900)}`;
    })
    .join("\n---\n");
}

/**
 * P3/5 — Métadonnées de traçabilité des sources RÉELLEMENT transmises au modèle.
 * N'invente rien : ne contient que ce qui est présent dans `ai_knowledge_chunks`.
 */
export function ragSourcesMeta(chunks: RagChunk[]) {
  return chunks.map((c, i) => {
    const m = (c.metadata ?? {}) as Record<string, unknown>;
    return {
      ref: `SRC-${i + 1}`,
      chunk_id: c.id,
      source_type: c.source_type,
      source_id: c.source_id,
      label: (m.label as string) ?? (m.numero as string) ?? null,
      norme: (m.norme as string) ?? null,
      version: (m.version as string) ?? null,
      clause: (m.clause as string) ?? null,
      date: (m.date as string) ?? (m.created_at as string) ?? null,
      score: Number.isFinite(c.score) ? Number(c.score.toFixed(4)) : null,
    };
  });
}
