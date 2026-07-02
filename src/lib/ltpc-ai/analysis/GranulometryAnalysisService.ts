// Analyse d'un essai de granulométrie (granulat) — cohérence de courbe, Cu/Cc, module de finesse.
import { supabase } from "@/integrations/supabase/client";
import type { AnalysisReport, AnalysisFinding, AnalysisSource } from "./types";

interface Row {
  id: string; numero: string | null;
  materiau: string | null; type_granulat: string | null;
  module_finesse: number | null; d10: number | null; d30: number | null; d60: number | null;
  fines_pct: number | null;
}

export const GranulometryAnalysisService = {
  async run(essaiId: string): Promise<AnalysisReport> {
    const { data, error } = await supabase
      .from("echantillons_granulometrie")
      .select("id, numero, materiau, type_granulat, module_finesse, d10, d30, d60, fines_pct")
      .eq("id", essaiId).maybeSingle();
    if (error) throw error;
    const r = data as Row | null;
    if (!r) throw new Error("Essai introuvable");

    const s: AnalysisSource[] = [{ source_type: "essai_granulometrie", source_id: r.id, label: `Granulo ${r.numero ?? r.id.slice(0, 8)}`, url: `/essais/granulat/granulometrie/${r.id}` }];
    const findings: AnalysisFinding[] = [];
    const isSable = (r.type_granulat ?? "").toLowerCase().includes("sable");

    if (isSable && r.module_finesse != null) {
      if (r.module_finesse < 1.8 || r.module_finesse > 3.2) {
        findings.push({ code: "GRAN_MF_OUT", severity: "warning", message: `Module de finesse ${r.module_finesse.toFixed(2)} hors [1.8 ; 3.2].`, metric: { mf: r.module_finesse }, sources: s });
      } else if (r.module_finesse < 2.2 || r.module_finesse > 2.8) {
        findings.push({ code: "GRAN_MF_SUBOPT", severity: "info", message: `MF ${r.module_finesse.toFixed(2)} en dehors de la plage béton optimale 2.2–2.8.`, sources: s });
      }
    }

    let cu: number | null = null, cc: number | null = null;
    if (r.d10 && r.d60) cu = r.d60 / r.d10;
    if (r.d10 && r.d30 && r.d60) cc = (r.d30 * r.d30) / (r.d10 * r.d60);
    if (cu != null && cu < 4) findings.push({ code: "GRAN_CU_LOW", severity: "info", message: `Cu=${cu.toFixed(2)} — granulométrie serrée.`, sources: s });
    if (cc != null && (cc < 1 || cc > 3)) findings.push({ code: "GRAN_CC_OUT", severity: "warning", message: `Cc=${cc.toFixed(2)} hors [1 ; 3] — courbe mal graduée.`, sources: s });

    if (r.fines_pct != null && isSable && r.fines_pct > 12) {
      findings.push({ code: "GRAN_FINES_HIGH", severity: "warning", message: `Fines ${r.fines_pct.toFixed(1)}% > 12% — vérifier propreté (ES, MB).`, sources: s });
    }

    return {
      domain: "granulometrie",
      summary: `Granulo ${r.materiau ?? r.type_granulat ?? ""} — ${findings.length} observation(s).`,
      findings, recommendations: [],
      stats: { mf: r.module_finesse, cu, cc, fines_pct: r.fines_pct },
      confidence: 70, sources: s, generated_at: new Date().toISOString(),
    };
  },
};
