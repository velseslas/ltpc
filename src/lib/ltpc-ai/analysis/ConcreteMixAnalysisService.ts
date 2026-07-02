// Analyse et comparaison de formulations Dreux-Gorisse.
// Détecte changement de ciment / sable / adjuvant / graviers entre 2 formulations.
import { supabase } from "@/integrations/supabase/client";
import type { AnalysisReport, AnalysisFinding, AnalysisSource } from "./types";

interface Formulation {
  id: string; nom: string | null;
  ciment_produit_id: string | null; ciment_producteur_id: string | null; ciment_quantite: number | null;
  sable_concasse_produit_id: string | null; sable_concasse_quantite: number | null;
  sable_fin_produit_id: string | null; sable_fin_quantite: number | null;
  gravillons1_produit_id: string | null; gravillons1_quantite: number | null;
  gravier2_produit_id: string | null; gravier2_quantite: number | null;
  gravier3_produit_id: string | null; gravier3_quantite: number | null;
  adjuvant_produit_id: string | null; adjuvant_producteur_id: string | null; adjuvant_quantite: number | null;
  eau_quantite: number | null; eau_calculee: number | null; ciment_calcule: number | null;
  resistance_28j: number | null; classe_exposition: string | null;
}

const FIELDS = "id, nom, ciment_produit_id, ciment_producteur_id, ciment_quantite, sable_concasse_produit_id, sable_concasse_quantite, sable_fin_produit_id, sable_fin_quantite, gravillons1_produit_id, gravillons1_quantite, gravier2_produit_id, gravier2_quantite, gravier3_produit_id, gravier3_quantite, adjuvant_produit_id, adjuvant_producteur_id, adjuvant_quantite, eau_quantite, eau_calculee, ciment_calcule, resistance_28j, classe_exposition";

function src(f: Formulation): AnalysisSource {
  return { source_type: "formulation", source_id: f.id, label: `Formulation ${f.nom ?? f.id.slice(0, 8)}`, url: `/essais/formulation/${f.id}` };
}

function rapportEC(f: Formulation): number | null {
  const eau = f.eau_calculee ?? f.eau_quantite;
  const ciment = f.ciment_calcule ?? f.ciment_quantite;
  if (!eau || !ciment) return null;
  return eau / ciment;
}

export const ConcreteMixAnalysisService = {
  async analyse(formulationId: string): Promise<AnalysisReport> {
    const { data, error } = await supabase.from("formulations").select(FIELDS).eq("id", formulationId).maybeSingle();
    if (error) throw error;
    const f = data as unknown as Formulation | null;
    if (!f) throw new Error("Formulation introuvable");

    const findings: AnalysisFinding[] = [];
    const s = [src(f)];
    const ec = rapportEC(f);
    if (ec != null) {
      if (ec > 0.65) findings.push({ code: "MIX_EC_HIGH", severity: "warning", message: `E/C=${ec.toFixed(2)} élevé — impact résistance et durabilité.`, sources: s });
      if (ec < 0.35) findings.push({ code: "MIX_EC_LOW", severity: "info", message: `E/C=${ec.toFixed(2)} très faible — vérifier ouvrabilité.`, sources: s });
    }
    const cim = f.ciment_calcule ?? f.ciment_quantite;
    if (cim != null && (cim < 280 || cim > 450)) {
      findings.push({ code: "MIX_CEMENT_DOSAGE_OUT", severity: "warning", message: `Dosage ciment ${cim} kg/m³ hors plage usuelle 280–450.`, sources: s });
    }

    return {
      domain: "formulation",
      summary: `Formulation ${f.nom ?? ""} — E/C=${ec != null ? ec.toFixed(2) : "?"}, ciment ${cim ?? "?"} kg/m³, R28=${f.resistance_28j ?? "?"} MPa.`,
      findings, recommendations: [],
      stats: { rapport_ec: ec, ciment_dosage: cim, r28: f.resistance_28j },
      confidence: 75, sources: s, generated_at: new Date().toISOString(),
    };
  },

  async compare(idA: string, idB: string): Promise<AnalysisReport> {
    const { data, error } = await supabase.from("formulations").select(FIELDS).in("id", [idA, idB]);
    if (error) throw error;
    const list = (data ?? []) as unknown as Formulation[];
    const a = list.find((x) => x.id === idA); const b = list.find((x) => x.id === idB);
    if (!a || !b) throw new Error("Formulations introuvables");
    const sources = [src(a), src(b)];
    const findings: AnalysisFinding[] = [];
    const cmp = (label: string, va: unknown, vb: unknown, code: string, sev: "warning" | "info" = "warning") => {
      if (va !== vb && va != null && vb != null) {
        findings.push({ code, severity: sev, message: `${label} différent entre les deux formulations.`, sources });
      }
    };
    cmp("Ciment (produit)", a.ciment_produit_id, b.ciment_produit_id, "MIX_CHANGE_CEMENT");
    cmp("Sable concassé", a.sable_concasse_produit_id, b.sable_concasse_produit_id, "MIX_CHANGE_SAND");
    cmp("Sable fin", a.sable_fin_produit_id, b.sable_fin_produit_id, "MIX_CHANGE_SAND");
    cmp("Gravillons 1", a.gravillons1_produit_id, b.gravillons1_produit_id, "MIX_CHANGE_GRAVEL");
    cmp("Gravier 2", a.gravier2_produit_id, b.gravier2_produit_id, "MIX_CHANGE_GRAVEL");
    cmp("Gravier 3", a.gravier3_produit_id, b.gravier3_produit_id, "MIX_CHANGE_GRAVEL");
    cmp("Adjuvant", a.adjuvant_produit_id, b.adjuvant_produit_id, "MIX_CHANGE_ADMIXTURE");

    const ea = rapportEC(a), eb = rapportEC(b);
    const dEc = (eb ?? 0) - (ea ?? 0);
    if (ea != null && eb != null && Math.abs(dEc) >= 0.03) {
      findings.push({ code: "MIX_EC_DELTA", severity: "warning", message: `Variation E/C = ${dEc >= 0 ? "+" : ""}${dEc.toFixed(2)}.`, metric: { delta_ec: dEc }, sources });
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
