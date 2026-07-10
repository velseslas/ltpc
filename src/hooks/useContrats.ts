import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";

export interface Contrat {
  id: string;
  client_id: string | null;
  chantier_id: string | null;
  titre: string;
  document_url: string | null;
  document_nom: string | null;
  statut: string;
  date_signature: string | null;
  date_expiration: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContratInsert {
  client_id?: string | null;
  chantier_id?: string | null;
  titre: string;
  document_url?: string | null;
  document_nom?: string | null;
  statut?: string;
  date_signature?: string | null;
  date_expiration?: string | null;
}

const repo = getRepositoryForTable<Contrat>("contrats", {
  defaultOrder: { column: "created_at", ascending: false },
});
const byClientRepo = getRepositoryForTable<Contrat>("contrats", {
  defaultSelect: `*, chantiers ( id, nom )`,
  defaultOrder: { column: "created_at", ascending: false },
});

export function useContrats() {
  return useQuery({
    queryKey: ["contrats"],
    queryFn: async () => (await repo.list()).data,
  });
}

export function useContratsByClient(clientId: string) {
  return useQuery({
    queryKey: ["contrats", "client", clientId],
    queryFn: async () => (await byClientRepo.list({ filters: { client_id: clientId } })).data,
    enabled: !!clientId,
  });
}

export function useCreateContrat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contrat: ContratInsert) => {
      const { data, error } = await repo.insert(contrat as Partial<Contrat>);
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["contrats"] });
      if (data?.client_id) {
        queryClient.invalidateQueries({ queryKey: ["contrats", "client", data.client_id] });
      }
    },
  });
}

export function useUpdateContrat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; titre?: string; chantier_id?: string | null; document_url?: string | null; document_nom?: string | null }) => {
      const { data: result, error } = await repo.update(data as Partial<Contrat>, { id });
      if (error) throw new Error(error);
      return result[0];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["contrats"] });
      if (data?.client_id) {
        queryClient.invalidateQueries({ queryKey: ["contrats", "client", data.client_id] });
      }
    },
  });
}

export function useDeleteContrat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await repo.delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contrats"] }),
  });
}
