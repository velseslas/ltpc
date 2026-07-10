import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const repo = getRepositoryForTable<any>("client_maitres_ouvrage", {
  defaultSelect: "*, maitres_ouvrage(*)",
});

export function useClientMaitresOuvrage(clientId: string) {
  return useQuery({
    queryKey: ["client-maitres-ouvrage", clientId],
    queryFn: async () => (await repo.list({ filters: { client_id: clientId } })).data,
    enabled: !!clientId,
  });
}

export function useAddClientMaitreOuvrage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, maitreOuvrageId }: { clientId: string; maitreOuvrageId: string }) => {
      const { data, error } = await repo.insert(
        { client_id: clientId, maitre_ouvrage_id: maitreOuvrageId },
        { select: "*, maitres_ouvrage(*)" },
      );
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["client-maitres-ouvrage", vars.clientId] }),
  });
}

export function useRemoveClientMaitreOuvrage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; clientId: string }) => {
      const { error } = await repo.delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["client-maitres-ouvrage", vars.clientId] }),
  });
}
