import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";

export interface DocumentAdministratif {
  id: string;
  client_id: string | null;
  titre: string;
  document_url: string | null;
  document_nom: string | null;
  created_at: string;
  updated_at: string;
}

const repo = getRepositoryForTable<DocumentAdministratif>("documents_administratifs", {
  defaultOrder: { column: "created_at", ascending: false },
});

export function useDocumentsAdministratifsByClient(clientId: string) {
  return useQuery({
    queryKey: ["documents_administratifs", "client", clientId],
    queryFn: async () => (await repo.list({ filters: { client_id: clientId } })).data,
    enabled: !!clientId,
  });
}

export function useCreateDocumentAdministratif() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: { client_id: string; titre: string; document_url: string | null; document_nom: string | null }) => {
      const { data, error } = await repo.insert(doc as Partial<DocumentAdministratif>);
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: (data) => {
      if (data?.client_id) qc.invalidateQueries({ queryKey: ["documents_administratifs", "client", data.client_id] });
    },
  });
}

export function useUpdateDocumentAdministratif() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; titre?: string; document_url?: string | null; document_nom?: string | null }) => {
      const { data: result, error } = await repo.update(data as Partial<DocumentAdministratif>, { id });
      if (error) throw new Error(error);
      return result[0];
    },
    onSuccess: (data) => {
      if (data?.client_id) qc.invalidateQueries({ queryKey: ["documents_administratifs", "client", data.client_id] });
    },
  });
}

export function useDeleteDocumentAdministratif() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await repo.delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents_administratifs"] }),
  });
}
