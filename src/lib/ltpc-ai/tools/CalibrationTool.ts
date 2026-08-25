// CalibrationTool — étalonnages en cours / expirés / à échéance courte.
import type { Tool } from "./types";
import { sb } from "./sbAny";
import { runTool } from "./runTool";
import type { AICitation } from "../types";

const DAYS = 60;

export const CalibrationTool: Tool = {
  name: "CalibrationTool",
  description: "Étalonnages expirés ou arrivant à échéance dans les 60 prochains jours.",
  supports: (d) => d.domains.includes("etalonnages"),
  confidence: () => 0.9,
  execute: (d) => runTool(CalibrationTool, async () => {
    const horizon = new Date(Date.now() + DAYS * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const { data, error } = await sb.from("etalonnage_materiel")
      .select("id, materiel_id, organisme, numero_certificat, date_etalonnage, date_prochain_etalonnage, resultat")
      .lte("date_prochain_etalonnage", horizon)
      .order("date_prochain_etalonnage", { ascending: true }).limit(30);
    if (error) throw error;
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const today = new Date().toISOString().slice(0, 10);
    const expired = rows.filter((r) => String(r.date_prochain_etalonnage ?? "") < today).length;
    const citations: AICitation[] = rows.map((r) => ({
      source_type: "etalonnage", source_id: String(r.id),
      label: `Étalonnage ${r.numero_certificat ?? ""}`,
      reference: (r.numero_certificat as string | null) ?? null,
      url: `/materiel/etalonnage`,
      snippet: `${r.organisme ?? ""} · échéance ${r.date_prochain_etalonnage ?? "?"}`,
    }));
    return {
      ok: true,
      summary: `${rows.length} étalonnages à surveiller (${expired} expirés)`,
      data: { horizon_days: DAYS, expired, upcoming: rows.length - expired, items: rows },
      citations, confidence: 0.92, rows: rows.length,
    };
  }),
};
