// Analyse et comparaison de formulations Dreux-Gorisse.
// Détecte changement de ciment / sable / adjuvant entre 2 formulations.
import { supabase } from "@/integrations/supabase/client";
import type { AnalysisReport, AnalysisFinding, AnalysisSource } from "./types";

interface Formulation {
  id: string; nom: string | null;
  ciment_type: string | null; ciment_dosage: number | null;
  eau_dosage: number | null; rapport_ec: number | null;
  sable_nom: string | null; sable_dosage: number | null;
  gravier_nom: string | null;
  adjuvant_type: string | null; adjuvant_dosage: number | null;
  resistance_28j: number | null;
}

const FIELDS = "id, nom, ciment_type, ciment_dosage, eau_dosage, rapport_ec, sable_nom, sable_dosage, gravier_nom, adjuvant_type, adjuvant_dosage, resistance_28j";

function src(f: Formulation): AnalysisSource {
  return { source_type: "formulation", source_id: f.id, label: `Formulation ${f.nom ?? f.id.slice(0, 8)}`, url: `/essais/formulation/${f.id}` };
}

export const ConcreteMixAnalysisService = {
  async analyse(formulationId: string): Promise<AnalysisReport> {
    const { data, error } = await supabase.from("formulations").select(FIELDS).eq("id", formulationId).maybeSingle();
    if (error) throw error;
    const f = data as Formulation | null;
    if (!f) throw new Error("Formulation introuvable");

    const findings: AnalysisFinding[] = [];
    const s = [src(f)];

    if (f.rapport_ec != null) {
      if (f.rapport_ec > 0.65) findings.push({ code: "MIX_EC_HIGH", severity: "warning", message: `E/C=${f.rapport_ec.toFixed(2)} élevé — impact résistance et durabilité.`, sources: s });
      if (f.rapport_ec < 0.35) findings.push({ code: "MIX_EC_LOW", severity: "info", message: `E/C=${f.rapport_ec.toFixed(2)} très faible — vérifier ouvrabilité et hydratation.`, sources: s });
    }
    if (f.ciment_dosage != null && (f.ciment_dosage < 280 || f.ciment_dosage > 450)) {
      findings.push({ code: "MIX_CEMENT_DOSAGE_OUT", severity: "warning", message: `Dosage ciment ${f.ciment_dosage} kg/m³ hors plage usuelle 280–450.`, sources: s });
    }

    return {
      domain: "formulation",
      summary: `Formulation ${f.nom ?? ""} — E/C=${f.rapport_ec ?? "?"}, ciment ${f.ciment_dosage ?? "?"} kg/m³, R28=${f.resistance_28j ?? "?"} MPa.`,
      findings, recommendations: [],
      stats: { rapport_ec: f.rapport_ec, ciment_dosage: f.ciment_dosage, r28: f.resistance_28j },
      confidence: 75, sources: s, generated_at: new Date().toISOString(),
    };
  },

  async compare(idA: string, idB: string): Promise<AnalysisReport> {
    const { data, error } = await supabase.from("formulations").select(FIELDS).in("id", [idA, idB]);
    if (error) throw error;
    const list = (data ?? []) as Formulation[];
    const a = list.find((x) => x.id === idA); const b = list.find((x) => x.id === idB);
    if (!a || !b) throw new Error("Formulations introuvables");
    const sources = [src(a), src(b)];
    const findings: AnalysisFinding[] = [];

    const cmp = (label: string, va: unknown, vb: unknown, code: string, sev: "warning" | "info" = "warning") => {
      if (va !== vb && va != null && vb != null) {
        findings.push({ code, severity: sev, message: `${label} différent : « ${String(va)} » → « ${String(vb)} ».`, sources });
      }
    };
    cmp("Type de ciment", a.ciment_type, b.ciment_type, "MIX_CHANGE_CEMENT");
    cmp("Sable", a.sable_nom, b.sable_nom, "MIX_CHANGE_SAND");
    cmp("Gravier", a.gravier_nom, b.gravier_nom, "MIX_CHANGE_GRAVEL");
    cmp("Adjuvant", a.adjuvant_type, b.adjuvant_type, "MIX_CHANGE_ADMIXTURE");

    const dEc = (b.rapport_ec ?? 0) - (a.rapport_ec ?? 0);
    if (Math.abs(dEc) >= 0.03) {
      findings.push({ code: "MIX_EC_DELTA", severity: "warning", message: `Variation E/C=${dEc >= 0 ? "+" : ""}${dEc.toFixed(2)}.`, metric: { delta_ec: dEc }, sources });
    }
    const dR = (b.resistance_28j ?? 0) - (a.resistance_28j ?? 0);
    if (a.resistance_28j != null && b.resistance_28j != null && Math.abs(dR) >= 3) {
      findings.push({ code: "MIX_R28_DELTA", severity: dR < 0 ? "critique" : "info", message: `Écart R28 : ${dR >= 0 ? "+" : ""}${dR.toFixed(1)} MPa.`, metric: { delta_r28: dR }, sources });
    }

    return {
      domain: "formulation",
      summary: `Comparaison ${a.nom ?? "A"} vs ${b.nom ?? "B"} — ${findings.length} différence(s) notable(s).`,
      findings, recommendations: [], stats: { delta_ec: dEc, delta_r28: dR }, confidence: 80, sources,
      generated_at: new Date().toISOString(),
    };
  },
};
