import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepository, getRepositoryForTable } from "@/lib/repositories";

export interface Chantier {
  id: string;
  client_id: string | null;
  nom: string;
  adresse: string | null;
  ville: string | null;
  contact: string | null;
  telephone: string | null;
  description: string | null;
  statut: string;
  date_debut: string | null;
  date_fin: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChantierInsert {
  client_id?: string | null;
  nom: string;
  adresse?: string | null;
  ville?: string | null;
  contact?: string | null;
  telephone?: string | null;
  description?: string | null;
  statut?: string;
  date_debut?: string | null;
  date_fin?: string | null;
}

const repo = getRepositoryForTable<Chantier>("chantiers", {
  defaultOrder: { column: "nom", ascending: true },
});

// Utilise la couche Repository partagée avec LTPC AI.
export function useChantiers() {
  return useQuery({
    queryKey: ["chantiers"],
    queryFn: async () => {
      const { data } = await getRepository("chantiers").list();
      return data as unknown as Chantier[];
    },
  });
}

export function useChantier(id: string) {
  return useQuery({
    queryKey: ["chantiers", id],
    queryFn: async () => (await repo.getById(id)).data,
    enabled: !!id,
  });
}

export function useChantiersByClient(clientId: string) {
  return useQuery({
    queryKey: ["chantiers", "client", clientId],
    queryFn: async () => (await repo.list({ filters: { client_id: clientId } })).data,
    enabled: !!clientId,
  });
}

export function useCreateChantier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (chantier: ChantierInsert) => {
      const { data, error } = await repo.insert(chantier as Partial<Chantier>);
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chantiers"] });
      if (data?.client_id) {
        queryClient.invalidateQueries({ queryKey: ["chantiers", "client", data.client_id] });
      }
    },
  });
}

export function useUpdateChantier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, clientId, data }: { id: string; clientId: string; data: Partial<ChantierInsert> }) => {
      const { data: result, error } = await repo.update(data as Partial<Chantier>, { id });
      if (error) throw new Error(error);
      return { ...(result[0] as Chantier), clientId } as Chantier & { clientId: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chantiers"] });
      queryClient.invalidateQueries({ queryKey: ["chantiers", data.id] });
      if (data.clientId) {
        queryClient.invalidateQueries({ queryKey: ["chantiers", "client", data.clientId] });
      }
    },
  });
}

export function useDeleteChantier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId?: string }) => {
      const { error } = await repo.delete({ id });
      if (error) throw new Error(error);
      return { id, clientId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chantiers"] });
      if (data.clientId) {
        queryClient.invalidateQueries({ queryKey: ["chantiers", "client", data.clientId] });
      }
    },
  });
}
