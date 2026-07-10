import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getRepositoryForTable } from "@/lib/repositories";

export interface DocumentRH {
  id: string;
  intervenant_id: string;
  type_document: string;
  nom_fichier: string | null;
  url_fichier: string | null;
  created_at: string;
  updated_at: string;
  intervenant?: {
    id: string;
    nom: string;
    prenom: string;
  };
}

const repo = getRepositoryForTable<DocumentRH>("documents_rh", {
  defaultSelect: `*, intervenant:intervenants(id, nom, prenom)`,
  defaultOrder: { column: "created_at", ascending: false },
});

export function useDocumentsRH() {
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ["documents_rh"],
    queryFn: async () => (await repo.list()).data,
  });

  const createDocument = useMutation({
    mutationFn: async (document: {
      intervenant_id: string;
      type_document: string;
      nom_fichier?: string;
      url_fichier?: string;
    }) => {
      const { data, error: err } = await repo.insert(document as Partial<DocumentRH>);
      if (err) throw new Error(err);
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents_rh"] });
      toast.success("Document créé avec succès");
    },
    onError: (err) => {
      toast.error("Erreur lors de la création du document");
      console.error(err);
    },
  });

  const updateDocument = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      intervenant_id?: string;
      type_document?: string;
      nom_fichier?: string;
      url_fichier?: string;
    }) => {
      const { data, error: err } = await repo.update(updates as Partial<DocumentRH>, { id });
      if (err) throw new Error(err);
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents_rh"] });
      toast.success("Document mis à jour avec succès");
    },
    onError: (err) => {
      toast.error("Erreur lors de la mise à jour du document");
      console.error(err);
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      const { error: err } = await repo.delete({ id });
      if (err) throw new Error(err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents_rh"] });
      toast.success("Document supprimé avec succès");
    },
    onError: (err) => {
      toast.error("Erreur lors de la suppression du document");
      console.error(err);
    },
  });

  return { documents, isLoading, error, createDocument, updateDocument, deleteDocument };
}
