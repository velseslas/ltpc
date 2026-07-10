import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";

export interface ClientCentrale {
  id: string;
  client_id: string;
  centrale_id: string;
  chantier_id?: string | null;
  created_at: string;
  centrales_beton?: {
    id: string;
    nom: string;
    ville: string | null;
    contact: string | null;
    telephone: string | null;
    capacite: string | null;
  };
  chantiers?: {
    id: string;
    nom: string;
  } | null;
}

const SELECT = `*, centrales_beton ( id, nom, ville, contact, telephone, capacite ), chantiers ( id, nom )`;
const repo = getRepositoryForTable<ClientCentrale>("client_centrales", {
  defaultSelect: SELECT,
  defaultOrder: { column: "created_at", ascending: false },
});

export function useClientCentrales(clientId: string) {
  return useQuery({
    queryKey: ["client_centrales", clientId],
    queryFn: async () => (await repo.list({ filters: { client_id: clientId } })).data,
    enabled: !!clientId,
  });
}

export function useAddClientCentrale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, centraleId, chantierId }: { clientId: string; centraleId: string; chantierId?: string }) => {
      const { data, error } = await repo.insert({
        client_id: clientId,
        centrale_id: centraleId,
        chantier_id: chantierId || null,
      } as Partial<ClientCentrale>);
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ["client_centrales", variables.clientId] }),
  });
}

export function useUpdateClientCentrale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, clientId: _clientId, centraleId, chantierId }: { id: string; clientId: string; centraleId: string; chantierId?: string }) => {
      const { data, error } = await repo.update(
        { centrale_id: centraleId, chantier_id: chantierId || null } as Partial<ClientCentrale>,
        { id },
      );
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ["client_centrales", variables.clientId] }),
  });
}

export function useRemoveClientCentrale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; clientId: string }) => {
      const { error } = await repo.delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ["client_centrales", variables.clientId] }),
  });
}
