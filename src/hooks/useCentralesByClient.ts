import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CentraleBeton } from "./useCentralesBeton";

export function useCentralesByClient(clientId: string) {
  return useQuery({
    queryKey: ["centrales_by_client", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_centrales")
        .select("centrale_id, centrales_beton:centrale_id(id, nom, ville)")
        .eq("client_id", clientId);

      if (error) throw error;

      const centrales = data
        ?.map((row: any) => row.centrales_beton)
        .filter(Boolean) as Pick<CentraleBeton, "id" | "nom" | "ville">[];

      // Deduplicate by id
      const unique = Array.from(new Map(centrales.map(c => [c.id, c])).values());
      return unique.sort((a, b) => a.nom?.localeCompare(b.nom ?? '') ?? 0);
    },
    enabled: !!clientId,
  });
}
