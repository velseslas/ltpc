// ReportTool — recherche/liste ciblée des rapports techniques (workflow, statut).
import type { Tool } from "./types";
import { sb } from "./sbAny";
import { runTool } from "./runTool";
import type { AICitation } from "../types";

export const ReportTool: Tool = {
  name: "ReportTool",
  description: "Récupère les rapports techniques par statut ou mots-clés (brouillon, valide, publie).",
  supports: (d) => d.domains.includes("rapports") || d.intents.includes("workflow"),
  confidence: (d) => (d.domains.includes("rapports") ? (d.intents.includes("workflow") ? 0.9 : 0.75) : 0.4),
  execute: (d) => runTool(ReportTool, async () => {
    const { data, error } = await sb.from("rapports_techniques")
      .select("id, numero, titre, statut, entreprise, projet, created_at, valide_at")
      .order("created_at", { ascending: false }).limit(15);
    if (error) throw error;
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const byStatut: Record<string, number> = {};
    for (const r of rows) { const k = String(r.statut ?? "?"); byStatut[k] = (byStatut[k] ?? 0) + 1; }
    const citations: AICitation[] = rows.map((r) => ({
      source_type: "rapport_technique", source_id: String(r.id),
      label: String(r.titre ?? r.numero ?? "Rapport"),
      reference: (r.numero as string | null) ?? null,
      url: `/essais/rapports-techniques/${r.id}`,
      snippet: `${r.statut ?? ""} — ${r.entreprise ?? r.projet ?? ""}`,
    }));
    return {
      ok: true,
      summary: `${rows.length} rapports · statuts : ${Object.entries(byStatut).map(([k, v]) => `${k}(${v})`).join(", ")}`,
      data: {
        recent: rows.map((r) => ({ id: r.id, numero: r.numero, titre: r.titre, statut: r.statut, valide_at: r.valide_at })),
        counts_by_statut: byStatut,
      },
      citations, confidence: 0.85, rows: rows.length,
    };
  }),
};
