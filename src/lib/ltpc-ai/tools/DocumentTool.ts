// DocumentTool — archives officielles (traçabilité SHA-256, vérification publique).
import type { Tool } from "./types";
import { sb } from "./sbAny";
import { runTool } from "./runTool";
import type { AICitation } from "../types";

export const DocumentTool: Tool = {
  name: "DocumentTool",
  description: "Accède aux archives de documents officiels (rapports PDF, hash SHA-256, version).",
  supports: (d) => d.domains.includes("documents") || d.intents.includes("document"),
  confidence: (d) => (d.domains.includes("documents") ? 0.85 : 0.4),
  execute: (d) => runTool(DocumentTool, async () => {
    const { data, error } = await sb.from("document_archives")
      .select("id, numero, document_type, version, created_at")
      .order("created_at", { ascending: false }).limit(15);
    if (error) throw error;
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const byType: Record<string, number> = {};
    for (const r of rows) { const k = String(r.document_type ?? "?"); byType[k] = (byType[k] ?? 0) + 1; }
    const citations: AICitation[] = rows.map((r) => ({
      source_type: "document_archive", source_id: String(r.id),
      label: `${r.numero ?? "Document"} v${r.version ?? 1}`,
      reference: (r.numero as string | null) ?? null, snippet: String(r.document_type ?? ""),
    }));
    return {
      ok: true,
      summary: `${rows.length} archives · types : ${Object.entries(byType).map(([k, v]) => `${k}(${v})`).join(", ")}`,
      data: { recent: rows, counts_by_type: byType },
      citations, confidence: 0.85, rows: rows.length,
    };
  }),
};
