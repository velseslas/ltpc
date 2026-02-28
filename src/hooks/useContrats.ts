import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

export function useContrats() {
  return useQuery({
    queryKey: ["contrats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contrats")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Contrat[];
    },
  });
}

export function useContratsByClient(clientId: string) {
  return useQuery({
    queryKey: ["contrats", "client", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contrats")
        .select(`
          *,
          chantiers (
            id,
            nom
          )
        `)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
}

export function useCreateContrat() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contrat: ContratInsert) => {
      const { data, error } = await supabase
        .from("contrats")
        .insert(contrat)
        .select()
        .single();
      
      if (error) throw error;
      return data as Contrat;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["contrats"] });
      if (data.client_id) {
        queryClient.invalidateQueries({ queryKey: ["contrats", "client", data.client_id] });
      }
    },
  });
}

export function useUpdateContrat() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; titre?: string; chantier_id?: string | null; document_url?: string | null; document_nom?: string | null }) => {
      const { data: result, error } = await supabase
        .from("contrats")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return result as Contrat;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["contrats"] });
      if (data.client_id) {
        queryClient.invalidateQueries({ queryKey: ["contrats", "client", data.client_id] });
      }
    },
  });
}

export function useDeleteContrat() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contrats")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contrats"] });
    },
  });
}
