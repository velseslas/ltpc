// Hooks agrégateurs pour les widgets du tableau de bord (Phase 11).
// Aucune modification métier : lecture seule des tables existantes.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from "date-fns";

// ---------- AI Widget ----------
export interface DashboardAIStats {
  rapportsAnalysesAujourdhui: number;
  rapportsAValider: number;
  alertesOuvertes: number;
  anomaliesDetectees: number;
  formulationsAVerifier: number;
  documentsAnalyses: number;
  isEmpty: boolean;
}

export function useDashboardAIStats() {
  return useQuery({
    queryKey: ["dashboard-ai-stats"],
    queryFn: async (): Promise<DashboardAIStats> => {
      const today = new Date();
      const startToday = startOfDay(today).toISOString();
      const endToday = endOfDay(today).toISOString();

      const [aiCallsToday, rapportsToValidate, alerts, anomalies, formulations, docsArchives] = await Promise.all([
        supabase.from("rapport_ai_calls").select("id", { count: "exact", head: true }).gte("created_at", startToday).lte("created_at", endToday),
        supabase.from("rapports_techniques").select("id", { count: "exact", head: true }).eq("statut", "en_revue"),
        supabase.from("ai_alerts").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("ai_alerts").select("id", { count: "exact", head: true }).eq("status", "open").in("severity", ["high", "critical"]),
        supabase.from("formulations").select("id", { count: "exact", head: true }).eq("statut", "brouillon"),
        supabase.from("document_archives").select("id", { count: "exact", head: true }).gte("created_at", startToday).lte("created_at", endToday),
      ]);

      const stats = {
        rapportsAnalysesAujourdhui: aiCallsToday.count || 0,
        rapportsAValider: rapportsToValidate.count || 0,
        alertesOuvertes: alerts.count || 0,
        anomaliesDetectees: anomalies.count || 0,
        formulationsAVerifier: formulations.count || 0,
        documentsAnalyses: docsArchives.count || 0,
      };

      const total = Object.values(stats).reduce((a, b) => a + b, 0);
      return { ...stats, isEmpty: total === 0 };
    },
    staleTime: 60_000,
  });
}

// ---------- Family distribution ----------
export interface FamilyDistribution {
  famille: string;
  count: number;
  percentage: number;
  color: string;
}

const GRANULAT_TABLES = [
  "echantillons_granulometrie", "echantillons_los_angeles", "echantillons_micro_deval",
  "echantillons_equivalent_sable", "echantillons_bleu_methylene", "echantillons_masse_volumique",
  "echantillons_teneur_eau", "echantillons_friabilite", "echantillons_ecrasement",
  "echantillons_forme_granulats", "echantillons_matiere_organique",
];
const BETON_TABLES = [
  "echantillons_compression", "echantillons_affaissement", "echantillons_temperature",
  "echantillons_temps_prise", "echantillons_teneur_air", "echantillons_traction_fendage",
  "echantillons_permeabilite", "echantillons_module_elasticite",
];
const GEO_TABLES = [
  "echantillons_cbr", "echantillons_cisaillement", "echantillons_classification_sol",
  "echantillons_compression_simple", "echantillons_densite_place", "echantillons_densitometre",
  "echantillons_granulometrie_sol", "echantillons_limites_atterberg", "echantillons_oedometrique",
  "echantillons_penetrometre", "echantillons_plaque", "echantillons_pressiometre",
  "echantillons_proctor_modifie", "echantillons_proctor_normal", "echantillons_sondage",
  "echantillons_teneur_eau_sol", "echantillons_triaxial",
];
const CONTROLE_TABLES = [
  "echantillons_carottage", "echantillons_sclerometre", "echantillons_ultrason",
];

async function countTable(name: string): Promise<number> {
  const { count } = await supabase.from(name as any).select("id", { count: "exact", head: true });
  return count || 0;
}
async function sumTables(tables: string[]): Promise<number> {
  const res = await Promise.all(tables.map(countTable));
  return res.reduce((a, b) => a + b, 0);
}

export function useFamilyDistribution() {
  return useQuery({
    queryKey: ["dashboard-family-distribution"],
    queryFn: async (): Promise<FamilyDistribution[]> => {
      const [beton, granulats, geo, controles, formulations, autres] = await Promise.all([
        sumTables(BETON_TABLES),
        sumTables(GRANULAT_TABLES),
        sumTables(GEO_TABLES),
        sumTables(CONTROLE_TABLES),
        countTable("formulations"),
        countTable("essais"),
      ]);
      const raw = [
        { famille: "Béton", count: beton, color: "hsl(185, 100%, 50%)" },
        { famille: "Granulats", count: granulats, color: "hsl(43, 96%, 56%)" },
        { famille: "Géotechnique", count: geo, color: "hsl(27, 98%, 54%)" },
        { famille: "Formulations", count: formulations, color: "hsl(262, 83%, 58%)" },
        { famille: "Contrôles chantier", count: controles, color: "hsl(142, 71%, 45%)" },
        { famille: "Autres", count: autres, color: "hsl(220, 15%, 55%)" },
      ];
      const total = raw.reduce((a, b) => a + b.count, 0) || 1;
      return raw.map((r) => ({ ...r, percentage: Math.round((r.count / total) * 100) }));
    },
    staleTime: 5 * 60_000,
  });
}

// ---------- Planning ----------
export type PlanningRange = "today" | "week" | "month";
export interface PlanningItem {
  id: string;
  type: "essai" | "intervention" | "labo_mobile" | "etalonnage" | "echeance";
  titre: string;
  date: string;
  heure?: string | null;
  chantier?: string | null;
  responsable?: string | null;
}

function rangeBounds(range: PlanningRange) {
  const now = new Date();
  if (range === "today") return { start: startOfDay(now), end: endOfDay(now) };
  if (range === "week") return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
  return { start: startOfMonth(now), end: endOfMonth(now) };
}

export function usePlanning(range: PlanningRange) {
  return useQuery({
    queryKey: ["dashboard-planning", range],
    queryFn: async (): Promise<PlanningItem[]> => {
      const { start, end } = rangeBounds(range);
      const startISO = start.toISOString();
      const endISO = end.toISOString();
      const startDate = start.toISOString().slice(0, 10);
      const endDate = end.toISOString().slice(0, 10);
      const in30 = addDays(new Date(), 30).toISOString().slice(0, 10);

      const [essaisRes, affectRes, mouvRes, etalRes] = await Promise.all([
        supabase.from("essais").select("id, type_essai, date_reception, chantiers(nom), intervenants(nom, prenom)")
          .gte("date_reception", startDate).lte("date_reception", endDate).limit(50),
        supabase.from("affectations").select("id, date_debut, date_fin, statut, chantiers(nom), intervenants(nom, prenom)")
          .gte("date_debut", startDate).lte("date_debut", endDate).limit(50),
        supabase.from("materiel_movements").select("id, type, numero, date_mouvement, heure_mouvement, chantiers(nom)")
          .gte("date_mouvement", startDate).lte("date_mouvement", endDate).limit(50),
        supabase.from("etalonnage_materiel").select("id, date_prochain_etalonnage, organisme, materiel_laboratoire(designation)")
          .gte("date_prochain_etalonnage", startDate).lte("date_prochain_etalonnage", range === "today" ? endDate : in30).limit(50),
      ]);

      const items: PlanningItem[] = [];
      (essaisRes.data || []).forEach((e: any) => items.push({
        id: `essai-${e.id}`, type: "essai", titre: e.type_essai || "Essai",
        date: e.date_reception, chantier: e.chantiers?.nom || null,
        responsable: e.intervenants ? `${e.intervenants.prenom || ""} ${e.intervenants.nom || ""}`.trim() : null,
      }));
      (affectRes.data || []).forEach((a: any) => items.push({
        id: `aff-${a.id}`, type: "intervention", titre: "Affectation",
        date: a.date_debut, chantier: a.chantiers?.nom || null,
        responsable: a.intervenants ? `${a.intervenants.prenom || ""} ${a.intervenants.nom || ""}`.trim() : null,
      }));
      (mouvRes.data || []).forEach((m: any) => items.push({
        id: `mvt-${m.id}`, type: "labo_mobile", titre: `${m.type} — ${m.numero}`,
        date: m.date_mouvement, heure: m.heure_mouvement, chantier: m.chantiers?.nom || null,
      }));
      (etalRes.data || []).forEach((et: any) => items.push({
        id: `etal-${et.id}`, type: "etalonnage",
        titre: `Étalonnage — ${et.materiel_laboratoire?.designation || et.organisme || "Matériel"}`,
        date: et.date_prochain_etalonnage, chantier: null,
      }));

      // Suppress unused vars (startISO/endISO reserved for future timestamp filters)
      void startISO; void endISO;

      return items.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    },
    staleTime: 60_000,
  });
}

// ---------- Résumé intelligent ----------
export interface DashboardSummary {
  text: string;
  points: string[];
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async (): Promise<DashboardSummary> => {
      const startToday = startOfDay(new Date()).toISOString();
      const in30 = addDays(new Date(), 30).toISOString().slice(0, 10);
      const todayDate = new Date().toISOString().slice(0, 10);

      const [essaisTodayRes, rapportsRes, etalRes, alertsRes, nonConfRes] = await Promise.all([
        supabase.from("essais").select("id", { count: "exact", head: true }).gte("created_at", startToday),
        supabase.from("rapports_techniques").select("id", { count: "exact", head: true }).eq("statut", "en_revue"),
        supabase.from("etalonnage_materiel").select("id", { count: "exact", head: true })
          .gte("date_prochain_etalonnage", todayDate).lte("date_prochain_etalonnage", in30),
        supabase.from("ai_alerts").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("echantillons_compression").select("id", { count: "exact", head: true }).eq("statut", "non-conforme"),
      ]);

      const essais = essaisTodayRes.count || 0;
      const rapports = rapportsRes.count || 0;
      const etal = etalRes.count || 0;
      const alerts = alertsRes.count || 0;
      const nonConf = nonConfRes.count || 0;

      const points: string[] = [];
      points.push(essais > 0
        ? `Aujourd'hui, ${essais} essai${essais > 1 ? "s" : ""} ${essais > 1 ? "sont enregistrés" : "est enregistré"}.`
        : "Aucun nouvel essai n'a été enregistré aujourd'hui.");
      points.push(nonConf > 0
        ? `${nonConf} résultat${nonConf > 1 ? "s" : ""} non conforme${nonConf > 1 ? "s ont" : " a"} été détecté${nonConf > 1 ? "s" : ""}.`
        : "Aucun résultat non conforme n'a été détecté.");
      if (rapports > 0) points.push(`${rapports} rapport${rapports > 1 ? "s attendent" : " attend"} une validation.`);
      if (etal > 0) points.push(`${etal} certificat${etal > 1 ? "s" : ""} d'étalonnage expire${etal > 1 ? "nt" : ""} dans moins de 30 jours.`);
      if (alerts > 0) points.push(`${alerts} alerte${alerts > 1 ? "s IA sont ouvertes" : " IA est ouverte"}.`);

      return { text: points.join(" "), points };
    },
    staleTime: 2 * 60_000,
  });
}
