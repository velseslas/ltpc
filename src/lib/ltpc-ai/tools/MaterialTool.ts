// MaterialTool — état du parc matériel (statuts, catégories).
import type { Tool } from "./types";
import { sb } from "./sbAny";
import { runTool } from "./runTool";
import type { AICitation } from "../types";

export const MaterialTool: Tool = {
  name: "MaterialTool",
  description: "État du parc matériel de laboratoire (statut courant, catégories).",
  supports: (d) => d.domains.includes("materiels"),
  confidence: () => 0.85,
  execute: (d) => runTool(MaterialTool, async () => {
    const { data, error } = await sb.from("materiel_laboratoire")
      .select("id, nom, reference, marque, modele, statut_courant, categorie")
      .order("created_at", { ascending: false }).limit(20);
    if (error) throw error;
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const byStatut: Record<string, number> = {};
    const byCat: Record<string, number> = {};
    for (const r of rows) {
      const s = String(r.statut_courant ?? "?"); byStatut[s] = (byStatut[s] ?? 0) + 1;
      const c = String(r.categorie ?? "?"); byCat[c] = (byCat[c] ?? 0) + 1;
    }
    const citations: AICitation[] = rows.map((r) => ({
      source_type: "materiel", source_id: String(r.id),
      label: `${r.reference ?? ""} ${r.nom ?? ""}`.trim(),
      reference: (r.reference as string | null) ?? null,
      url: `/materiel/liste`,
      snippet: `${r.marque ?? ""} ${r.modele ?? ""} · ${r.statut_courant ?? ""}`,
    }));
    return {
      ok: true,
      summary: `${rows.length} matériels · statuts : ${Object.entries(byStatut).map(([k, v]) => `${k}(${v})`).join(", ")}`,
      data: { recent: rows, counts_by_statut: byStatut, counts_by_categorie: byCat },
      citations, confidence: 0.9, rows: rows.length,
    };
  }),
};
