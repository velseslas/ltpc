import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, subMonths, format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export interface MonthlyTestData {
  month: string;
  monthLabel: string;
  count: number;
}

export interface TestTypeDistribution {
  type: string;
  count: number;
  percentage: number;
}

export interface ConformityData {
  conforme: number;
  nonConforme: number;
  enAttente: number;
  total: number;
  tauxConformite: number;
}

export interface DashboardStats {
  monthlyTests: MonthlyTestData[];
  testTypeDistribution: TestTypeDistribution[];
  conformity: ConformityData;
  totalClients: number;
  totalChantiers: number;
  totalIntervenants: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch all essais with their dates and types
      const { data: essais, error: essaisError } = await supabase
        .from("essais")
        .select("id, type_essai, statut, date_reception, created_at");

      if (essaisError) throw essaisError;

      // Fetch all echantillons compression
      const { data: compressionSamples, error: compressionError } = await supabase
        .from("echantillons_compression")
        .select("id, statut, date_coulage, created_at");

      if (compressionError) throw compressionError;

      // Fetch granulat samples from various tables
      const tables = [
        "echantillons_granulometrie",
        "echantillons_los_angeles",
        "echantillons_micro_deval",
        "echantillons_equivalent_sable",
        "echantillons_bleu_methylene",
        "echantillons_masse_volumique",
        "echantillons_teneur_eau",
        "echantillons_friabilite",
        "echantillons_ecrasement",
        "echantillons_forme_granulats",
        "echantillons_matiere_organique",
      ];

      const granulatResults = await Promise.all(
        tables.map(async (table) => {
          const { data, error } = await supabase
            .from(table as any)
            .select("id, statut, date_reception, created_at");
          if (error) return [];
          return (data || []).map((d: any) => ({ ...d, type: table }));
        })
      );

      const allGranulatSamples = granulatResults.flat();

      // Fetch counts
      const [clientsRes, chantiersRes, intervenantsRes] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("chantiers").select("id", { count: "exact", head: true }),
        supabase.from("intervenants").select("id", { count: "exact", head: true }),
      ]);

      // Calculate monthly tests for the last 12 months
      const now = new Date();
      const monthlyData: MonthlyTestData[] = [];

      for (let i = 11; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthKey = format(monthStart, "yyyy-MM");
        const monthLabel = format(monthStart, "MMM", { locale: fr });

        // Count essais created in this month
        const essaisCount = essais?.filter((e) => {
          const date = e.date_reception || e.created_at;
          if (!date) return false;
          return format(parseISO(date), "yyyy-MM") === monthKey;
        }).length || 0;

        // Count compression samples
        const compressionCount = compressionSamples?.filter((e) => {
          const date = e.date_coulage || e.created_at;
          if (!date) return false;
          return format(parseISO(date), "yyyy-MM") === monthKey;
        }).length || 0;

        // Count granulat samples
        const granulatCount = allGranulatSamples.filter((e) => {
          const date = e.date_reception || e.created_at;
          if (!date) return false;
          return format(parseISO(date), "yyyy-MM") === monthKey;
        }).length || 0;

        monthlyData.push({
          month: monthKey,
          monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
          count: essaisCount + compressionCount + granulatCount,
        });
      }

      // Calculate test type distribution
      const typeMap: Record<string, number> = {};

      // From essais table
      essais?.forEach((e) => {
        const type = e.type_essai || "Autre";
        typeMap[type] = (typeMap[type] || 0) + 1;
      });

      // Add compression tests
      if (compressionSamples && compressionSamples.length > 0) {
        typeMap["Compression Béton"] = (typeMap["Compression Béton"] || 0) + compressionSamples.length;
      }

      // Add granulat tests by type
      allGranulatSamples.forEach((s) => {
        const typeLabels: Record<string, string> = {
          echantillons_granulometrie: "Granulométrie",
          echantillons_los_angeles: "Los Angeles",
          echantillons_micro_deval: "Micro-Deval",
          echantillons_equivalent_sable: "Équivalent Sable",
          echantillons_bleu_methylene: "Bleu Méthylène",
          echantillons_masse_volumique: "Masse Volumique",
          echantillons_teneur_eau: "Teneur en Eau",
          echantillons_friabilite: "Friabilité",
          echantillons_ecrasement: "Écrasement",
          echantillons_forme_granulats: "Forme Granulats",
          echantillons_matiere_organique: "Matière Organique",
        };
        const label = typeLabels[s.type] || s.type;
        typeMap[label] = (typeMap[label] || 0) + 1;
      });

      const totalTests = Object.values(typeMap).reduce((sum, count) => sum + count, 0);
      const testTypeDistribution: TestTypeDistribution[] = Object.entries(typeMap)
        .map(([type, count]) => ({
          type,
          count,
          percentage: totalTests > 0 ? Math.round((count / totalTests) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8); // Top 8 types

      // Calculate conformity
      let conforme = 0;
      let nonConforme = 0;
      let enAttente = 0;

      // From essais
      essais?.forEach((e) => {
        if (e.statut === "completed") conforme++;
        else if (e.statut === "cancelled") nonConforme++;
        else enAttente++;
      });

      // From compression samples
      compressionSamples?.forEach((s) => {
        if (s.statut === "termine") conforme++;
        else if (s.statut === "non-conforme") nonConforme++;
        else enAttente++;
      });

      // From granulat samples
      allGranulatSamples.forEach((s) => {
        if (s.statut === "termine") conforme++;
        else if (s.statut === "non-conforme") nonConforme++;
        else enAttente++;
      });

      const totalConformity = conforme + nonConforme + enAttente;
      const tauxConformite = totalConformity > 0 
        ? Math.round((conforme / (conforme + nonConforme)) * 100) || 0
        : 0;

      return {
        monthlyTests: monthlyData,
        testTypeDistribution,
        conformity: {
          conforme,
          nonConforme,
          enAttente,
          total: totalConformity,
          tauxConformite,
        },
        totalClients: clientsRes.count || 0,
        totalChantiers: chantiersRes.count || 0,
        totalIntervenants: intervenantsRes.count || 0,
      };
    },
  });
}
