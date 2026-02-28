import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DocumentAdministratif {
  id: string;
  client_id: string | null;
  titre: string;
  document_url: string | null;
  document_nom: string | null;
  created_at: string;
  updated_at: string;
}

export function useDocumentsAdministratifsByClient(clientId: string) {
  return useQuery({
    queryKey: ["documents_administratifs", "client", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents_administratifs")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as DocumentAdministratif[];
    },
    enabled: !!clientId,
  });
}

export function useCreateDocumentAdministratif() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (doc: { client_id: string; titre: string; document_url: string | null; document_nom: string | null }) => {
      const { data, error } = await supabase
        .from("documents_administratifs")
        .insert(doc)
        .select()
        .single();
      
      if (error) throw error;
      return data as DocumentAdministratif;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["documents_administratifs", "client", data.client_id] });
    },
  });
}

export function useUpdateDocumentAdministratif() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; titre?: string; document_url?: string | null; document_nom?: string | null }) => {
      const { data: result, error } = await supabase
        .from("documents_administratifs")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return result as DocumentAdministratif;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["documents_administratifs", "client", data.client_id] });
    },
  });
}

export function useDeleteDocumentAdministratif() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("documents_administratifs")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents_administratifs"] });
    },
  });
}
