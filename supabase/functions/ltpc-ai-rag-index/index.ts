// Indexation RAG : construit ou rafraîchit la base de connaissance interne du copilote.
// Sources supportées :
//   - rapport_technique  (rapports_techniques)
//   - formulation        (formulations)
//   - essai_compression  (echantillons_compression)
//   - note               (contenu libre saisi par l'utilisateur)
//
// Entrée : { source_type: string, source_ids?: string[], full?: boolean, note?: {id?,titre,contenu,metadata?} }
// Sortie : { indexed: number, chunks: number, skipped: number }
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CHUNK_SIZE = 900;   // caractères
const CHUNK_OVERLAP = 120;

function chunkText(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  if (clean.length <= CHUNK_SIZE) return [clean];
  const parts: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(i + CHUNK_SIZE, clean.length);
    let cut = end;
    if (end < clean.length) {
      const dot = clean.lastIndexOf(". ", end);
      if (dot > i + CHUNK_SIZE / 2) cut = dot + 1;
    }
    parts.push(clean.slice(i, cut).trim());
    if (cut >= clean.length) break;
    i = Math.max(cut - CHUNK_OVERLAP, i + 1);
  }
  return parts.filter(Boolean);
}

async function embedBatch(apiKey: string, texts: string[]): Promise<number[][]> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "google/gemini-embedding-001", input: texts }),
  });
  if (!res.ok) throw new Error(`Gateway embeddings ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return (data?.data ?? []).map((d: { embedding: number[] }) => d.embedding);
}

type Row = { id: string; text: string; metadata: Record<string, unknown> };

function buildText(sourceType: string, row: Record<string, unknown>): Row {
  const g = (k: string) => (row[k] == null ? "" : String(row[k]));
  const meta: Record<string, unknown> = { id: row.id };
  let text = "";
  if (sourceType === "rapport_technique") {
    meta.numero = row.numero; meta.titre = row.titre; meta.statut = row.statut;
    text = [g("numero"), g("titre"), g("entreprise"), g("projet"), g("description_probleme"), g("contexte"), g("contenu_html")].join("\n");
  } else if (sourceType === "formulation") {
    meta.nom = row.nom;
    text = `Formulation ${g("nom")} — R28j ${g("resistance_28j")} MPa, classe ${g("classe_exposition")}, slump ${g("slump_souhaite")}. Ciment ${g("ciment_quantite")} kg, eau ${g("eau_quantite")} kg, ratio G/S ${g("ratio_gs")}.`;
  } else if (sourceType === "essai_compression") {
    meta.numero = row.numero; meta.ouvrage = row.ouvrage;
    text = `Essai compression ${g("numero")} — ouvrage ${g("ouvrage")}, classe ${g("classe_resistance")}, coulage ${g("date_coulage")}. Résultats : ${JSON.stringify(row.resultats ?? {})}`;
  }
  return { id: String(row.id), text, metadata: meta };
}

const TABLE_FOR: Record<string, { table: string; cols: string }> = {
  rapport_technique: { table: "rapports_techniques", cols: "id, numero, titre, statut, entreprise, projet, description_probleme, contexte, contenu_html" },
  formulation: { table: "formulations", cols: "id, nom, resistance_28j, classe_exposition, slump_souhaite, ciment_quantite, eau_quantite, ratio_gs" },
  essai_compression: { table: "echantillons_compression", cols: "id, numero, ouvrage, classe_resistance, date_coulage, resultats" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    const supaUrl = Deno.env.get("SUPABASE_URL");
    const svcKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!apiKey || !supaUrl || !svcKey) throw new Error("Secrets manquants");
    const admin = createClient(supaUrl, svcKey);
    const body = await req.json().catch(() => ({}));
    const source_type: string = body?.source_type;
    if (!source_type) return new Response(JSON.stringify({ error: "source_type requis" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    let rows: Row[] = [];
    if (source_type === "note") {
      const note = body?.note;
      if (!note?.contenu) return new Response(JSON.stringify({ error: "note.contenu requis" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const id = note.id ?? crypto.randomUUID();
      rows = [{ id, text: `${note.titre ?? ""}\n${note.contenu}`.trim(), metadata: { titre: note.titre ?? null, ...(note.metadata ?? {}) } }];
    } else {
      const cfg = TABLE_FOR[source_type];
      if (!cfg) return new Response(JSON.stringify({ error: "source_type inconnu" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      let q = admin.from(cfg.table).select(cfg.cols).limit(body?.full ? 500 : 100);
      if (Array.isArray(body?.source_ids) && body.source_ids.length) q = q.in("id", body.source_ids);
      const { data, error } = await q;
      if (error) throw error;
      rows = (data ?? []).map((r) => buildText(source_type, r as Record<string, unknown>)).filter((r) => r.text.trim().length > 20);
    }

    let indexed = 0, chunks = 0, skipped = 0;
    for (const row of rows) {
      const parts = chunkText(row.text);
      if (!parts.length) { skipped++; continue; }
      // Purge anciens chunks pour cette source
      await admin.from("ai_knowledge_chunks").delete().eq("source_type", source_type).eq("source_id", row.id);
      // Embeddings par lots de 32
      const embeddings: number[][] = [];
      for (let i = 0; i < parts.length; i += 32) {
        const batch = parts.slice(i, i + 32);
        const e = await embedBatch(apiKey, batch);
        embeddings.push(...e);
      }
      const payload = parts.map((contenu, idx) => ({
        source_type, source_id: row.id, chunk_index: idx, contenu,
        metadata: row.metadata, embedding: embeddings[idx] ?? null,
        embedding_model: "google/gemini-embedding-001",
      }));
      const { error: upErr } = await admin.from("ai_knowledge_chunks").insert(payload);
      if (upErr) throw upErr;
      indexed++; chunks += parts.length;
    }

    return new Response(JSON.stringify({ indexed, chunks, skipped, source_type }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
