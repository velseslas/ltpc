import { useQuery } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";
import type { CentraleBeton } from "./useCentralesBeton";

const clientCentralesRepo = getRepositoryForTable("client_centrales", {
  defaultSelect: "centrale_id, centrales_beton:centrale_id(id, nom, ville)",
});

export function useCentralesByClient(clientId: string) {
  return useQuery({
    queryKey: ["centrales_by_client", clientId],
    queryFn: async () => {
      const { data } = await clientCentralesRepo.list({ filters: { client_id: clientId } });
      const centrales = (data as any[])
        ?.map((row: any) => row.centrales_beton)
        .filter(Boolean) as Pick<CentraleBeton, "id" | "nom" | "ville">[];

      const unique = Array.from(new Map(centrales.map(c => [c.id, c])).values());
      return unique.sort((a, b) => a.nom?.localeCompare(b.nom ?? '') ?? 0);
    },
    enabled: !!clientId,
  });
}
