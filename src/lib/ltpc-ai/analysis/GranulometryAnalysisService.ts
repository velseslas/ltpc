// Analyse d'un essai de granulométrie — exploite `resultats` (jsonb).
import { supabase } from "@/integrations/supabase/client";
import type { AnalysisReport, AnalysisFinding, AnalysisSource } from "./types";

interface Row {
  id: string; numero: string | null;
  produit: string | null; resultats: Record<string, unknown> | null;
}

function num(v: unknown): number | null {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string" && v && !isNaN(Number(v))) return Number(v);
  return null;
}
function pick(o: Record<string, unknown> | null, ...keys: string[]): number | null {
  if (!o) return null;
  for (const k of keys) { const v = num(o[k]); if (v != null) return v; }
  return null;
}

export const GranulometryAnalysisService = {
  async run(essaiId: string): Promise<AnalysisReport> {
    const { data, error } = await supabase
      .from("echantillons_granulometrie")
      .select("id, numero, produit, resultats")
      .eq("id", essaiId).maybeSingle();
    if (error) throw error;
    const r = data as unknown as Row | null;
    if (!r) throw new Error("Essai introuvable");

    const s: AnalysisSource[] = [{ source_type: "essai_granulometrie", source_id: r.id, label: `Granulo ${r.numero ?? r.id.slice(0, 8)}`, url: `/essais/granulat/granulometrie/${r.id}` }];
    const findings: AnalysisFinding[] = [];
    const isSable = (r.produit ?? "").toLowerCase().includes("sable");
    const mf = pick(r.resultats, "module_finesse", "mf");
    const d10 = pick(r.resultats, "d10");
    const d30 = pick(r.resultats, "d30");
    const d60 = pick(r.resultats, "d60");
    const fines = pick(r.resultats, "fines_pct", "passant_63um", "passant_80um");

    if (isSable && mf != null) {
      if (mf < 1.8 || mf > 3.2) findings.push({ code: "GRAN_MF_OUT", severity: "warning", message: `Module de finesse ${mf.toFixed(2)} hors [1.8 ; 3.2].`, metric: { mf }, sources: s });
      else if (mf < 2.2 || mf > 2.8) findings.push({ code: "GRAN_MF_SUBOPT", severity: "info", message: `MF ${mf.toFixed(2)} hors plage béton optimale 2.2–2.8.`, sources: s });
    }
    let cu: number | null = null, cc: number | null = null;
    if (d10 && d60) cu = d60 / d10;
    if (d10 && d30 && d60) cc = (d30 * d30) / (d10 * d60);
    if (cu != null && cu < 4) findings.push({ code: "GRAN_CU_LOW", severity: "info", message: `Cu=${cu.toFixed(2)} — granulométrie serrée.`, sources: s });
    if (cc != null && (cc < 1 || cc > 3)) findings.push({ code: "GRAN_CC_OUT", severity: "warning", message: `Cc=${cc.toFixed(2)} hors [1 ; 3].`, sources: s });
    if (isSable && fines != null && fines > 12) findings.push({ code: "GRAN_FINES_HIGH", severity: "warning", message: `Fines ${fines.toFixed(1)}% > 12% — vérifier propreté.`, sources: s });

    return {
      domain: "granulometrie",
      summary: `Granulo ${r.produit ?? ""} — ${findings.length} observation(s).`,
      findings, recommendations: [], stats: { mf, cu, cc, fines_pct: fines },
      confidence: 70, sources: s, generated_at: new Date().toISOString(),
    };
  },
};
