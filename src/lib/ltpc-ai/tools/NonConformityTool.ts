// NonConformityTool — combine anomalies compression (z-score/IQR) + rapports NC ouverts.
import type { Tool } from "./types";
import { sb } from "./sbAny";
import { runTool } from "./runTool";
import { AnomalyDetectionService } from "../analysis/AnomalyDetectionService";
import type { AICitation } from "../types";

function extractResistance(r: Record<string, unknown> | null): number | null {
  if (!r) return null;
  for (const k of ["resistance_moyenne", "resistance", "fc_moyenne", "fc", "moyenne"]) {
    const v = r[k];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string" && v && !isNaN(Number(v))) return Number(v);
  }
  return null;
}

export const NonConformityTool: Tool = {
  name: "NonConformityTool",
  description: "Recense les non-conformités : anomalies statistiques + rapports techniques NC.",
  supports: (d) => d.domains.includes("non_conformites") || (d.intents.includes("analyse") && d.domains.includes("compression")),
  confidence: () => 0.85,
  execute: (d) => runTool(NonConformityTool, async () => {
    const [compRes, ncRes] = await Promise.all([
      sb.from("echantillons_compression").select("id, resultats").order("date_coulage", { ascending: false, nullsFirst: false }).limit(200),
      sb.from("rapports_techniques")
        .select("id, numero, titre, statut, description_probleme, created_at")
        .in("statut", ["brouillon", "en_revue", "valide"])
        .order("created_at", { ascending: false }).limit(20),
    ]);
    const compRows = (compRes.data ?? []) as Array<{ id: string; resultats: Record<string, unknown> | null }>;
    const values = compRows.map((r) => extractResistance(r.resultats)).filter((v): v is number => v != null);
    const anomalies = values.length >= 5 ? AnomalyDetectionService.zscore(values, 2) : [];
    const drift = values.length >= 5 ? AnomalyDetectionService.drift(values) : null;

    const rows = ((ncRes.data ?? []) as Array<Record<string, unknown>>);
    const citations: AICitation[] = rows.map((r) => ({
      source_type: "rapport_technique", source_id: String(r.id),
      label: String(r.titre ?? r.numero ?? "NC"),
      reference: (r.numero as string | null) ?? null,
      url: `/essais/rapports-techniques/${r.id}`,
      snippet: String(r.description_probleme ?? "").slice(0, 160),
    }));
    return {
      ok: true,
      summary: `${anomalies.length} anomalies statistiques · ${rows.length} rapports NC ouverts`,
      data: {
        anomalies_compression: anomalies.slice(0, 20),
        drift,
        reports_nc: rows.map((r) => ({ id: r.id, numero: r.numero, titre: r.titre, statut: r.statut })),
      },
      citations, confidence: 0.85, rows: rows.length + anomalies.length,
    };
  }),
};

