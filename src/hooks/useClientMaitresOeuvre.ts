import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const repo = getRepositoryForTable<any>("client_maitres_oeuvre", {
  defaultSelect: "*, maitres_oeuvre(*)",
});

export function useClientMaitresOeuvre(clientId: string) {
  return useQuery({
    queryKey: ["client-maitres-oeuvre", clientId],
    queryFn: async () => (await repo.list({ filters: { client_id: clientId } })).data,
    enabled: !!clientId,
  });
}

export function useAddClientMaitreOeuvre() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, maitreOeuvreId }: { clientId: string; maitreOeuvreId: string }) => {
      const { data, error } = await repo.insert(
        { client_id: clientId, maitre_oeuvre_id: maitreOeuvreId },
        { select: "*, maitres_oeuvre(*)" },
      );
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["client-maitres-oeuvre", vars.clientId] }),
  });
}

export function useRemoveClientMaitreOeuvre() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; clientId: string }) => {
      const { error } = await repo.delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["client-maitres-oeuvre", vars.clientId] }),
  });
}
