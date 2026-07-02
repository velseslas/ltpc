// NonConformityTool — combine anomalies compression + rapports NC ouverts.
import type { Tool } from "./types";
import { sb } from "./sbAny";
import { runTool } from "./runTool";
import { AnomalyDetectionService } from "../analysis/AnomalyDetectionService";
import type { AICitation } from "../types";

export const NonConformityTool: Tool = {
  name: "NonConformityTool",
  description: "Recense les non-conformités : anomalies statistiques + rapports techniques NC.",
  supports: (d) => d.domains.includes("non_conformites") || (d.intents.includes("analyse") && d.domains.includes("compression")),
  confidence: () => 0.85,
  execute: (d) => runTool(NonConformityTool, async () => {
    const [anomalies, ncRows] = await Promise.all([
      // Détection d'anomalies via service dédié (retourne AnalysisFinding[])
      (async () => {
        try {
          // Détecte automatiquement les outliers sur les 200 derniers essais
          const findings = await AnomalyDetectionService.scan?.({ limit: 200 }).catch(() => []);
          return Array.isArray(findings) ? findings : [];
        } catch { return []; }
      })(),
      sb.from("rapports_techniques")
        .select("id, numero, titre, statut, description_probleme, created_at")
        .in("statut", ["brouillon", "en_revue", "valide"])
        .order("created_at", { ascending: false }).limit(20),
    ]);
    const rows = ((ncRows.data ?? []) as Array<Record<string, unknown>>);
    const citations: AICitation[] = rows.map((r) => ({
      source_type: "rapport_technique", source_id: String(r.id),
      label: String(r.titre ?? r.numero ?? "NC"),
      reference: (r.numero as string | null) ?? null,
      url: `/essais/rapports-techniques/${r.id}`,
      snippet: String(r.description_probleme ?? "").slice(0, 160),
    }));
    return {
      ok: true,
      summary: `${anomalies.length} anomalies détectées · ${rows.length} rapports NC récents`,
      data: {
        anomalies: anomalies.slice(0, 20),
        reports_nc: rows.map((r) => ({ id: r.id, numero: r.numero, titre: r.titre, statut: r.statut })),
      },
      citations, confidence: 0.85, rows: rows.length,
    };
  }),
};
