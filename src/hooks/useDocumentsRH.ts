import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";


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

export function useDocumentsRH() {
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ["documents_rh"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents_rh")
        .select(`
          *,
          intervenant:intervenants(id, nom, prenom)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DocumentRH[];
    },
  });

  const createDocument = useMutation({
    mutationFn: async (document: {
      intervenant_id: string;
      type_document: string;
      nom_fichier?: string;
      url_fichier?: string;
    }) => {
      const { data, error } = await supabase
        .from("documents_rh")
        .insert(document)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents_rh"] });
      toast.success("Document créé avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors de la création du document");
      console.error(error);
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
      const { data, error } = await supabase
        .from("documents_rh")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents_rh"] });
      toast.success("Document mis à jour avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour du document");
      console.error(error);
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("documents_rh")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents_rh"] });
      toast.success("Document supprimé avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression du document");
      console.error(error);
    },
  });

  return {
    documents,
    isLoading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
  };
}
