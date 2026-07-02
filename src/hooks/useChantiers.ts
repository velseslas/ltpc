import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

import { getRepository } from "@/lib/repositories";

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
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chantiers")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data as Chantier;
    },
    enabled: !!id,
  });
}

export function useChantiersByClient(clientId: string) {
  return useQuery({
    queryKey: ["chantiers", "client", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chantiers")
        .select("*")
        .eq("client_id", clientId)
        .order("nom", { ascending: true });
      
      if (error) throw error;
      return data as Chantier[];
    },
    enabled: !!clientId,
  });
}

export function useCreateChantier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (chantier: ChantierInsert) => {
      const { data, error } = await supabase
        .from("chantiers")
        .insert(chantier)
        .select()
        .single();
      
      if (error) throw error;
      return data as Chantier;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chantiers"] });
      if (data.client_id) {
        queryClient.invalidateQueries({ queryKey: ["chantiers", "client", data.client_id] });
      }
    },
  });
}

export function useUpdateChantier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, clientId, data }: { id: string; clientId: string; data: Partial<ChantierInsert> }) => {
      const { data: result, error } = await supabase
        .from("chantiers")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return { ...result, clientId } as Chantier & { clientId: string };
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
      const { error } = await supabase
        .from("chantiers")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
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
