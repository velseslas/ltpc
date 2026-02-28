import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EssaiStats {
  total: number;
  aFaire: number;
  enCours: number;
  termine: number;
}

interface BetonFraisStats {
  affaissement: EssaiStats;
  temperature: EssaiStats;
  tempsPrise: EssaiStats;
  teneurAir: EssaiStats;
  global: EssaiStats;
}

async function fetchTableStats(tableName: string): Promise<EssaiStats> {
  const { data, error } = await supabase
    .from(tableName as any)
    .select("statut");
  
  if (error) throw error;
  
  const stats: EssaiStats = {
    total: 0,
    aFaire: 0,
    enCours: 0,
    termine: 0,
  };
  
  if (data && Array.isArray(data)) {
    stats.total = data.length;
    data.forEach((item: any) => {
      switch (item.statut) {
        case "a-faire":
          stats.aFaire++;
          break;
        case "en-cours":
          stats.enCours++;
          break;
        case "termine":
          stats.termine++;
          break;
      }
    });
  }
  
  return stats;
}

export function useBetonFraisStats() {
  return useQuery({
    queryKey: ["beton-frais-stats"],
    queryFn: async (): Promise<BetonFraisStats> => {
      const [affaissement, temperature, tempsPrise, teneurAir] = await Promise.all([
        fetchTableStats("echantillons_affaissement"),
        fetchTableStats("echantillons_temperature"),
        fetchTableStats("echantillons_temps_prise"),
        fetchTableStats("echantillons_teneur_air"),
      ]);
      
      const global: EssaiStats = {
        total: affaissement.total + temperature.total + tempsPrise.total + teneurAir.total,
        aFaire: affaissement.aFaire + temperature.aFaire + tempsPrise.aFaire + teneurAir.aFaire,
        enCours: affaissement.enCours + temperature.enCours + tempsPrise.enCours + teneurAir.enCours,
        termine: affaissement.termine + temperature.termine + tempsPrise.termine + teneurAir.termine,
      };
      
      return {
        affaissement,
        temperature,
        tempsPrise,
        teneurAir,
        global,
      };
    },
  });
}
