import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

export function useClientCentrales(clientId: string) {
  return useQuery({
    queryKey: ["client_centrales", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_centrales")
        .select(`
          *,
          centrales_beton (
            id,
            nom,
            ville,
            contact,
            telephone,
            capacite
          ),
          chantiers (
            id,
            nom
          )
        `)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as ClientCentrale[];
    },
    enabled: !!clientId,
  });
}

export function useAddClientCentrale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ clientId, centraleId, chantierId }: { clientId: string; centraleId: string; chantierId?: string }) => {
      const { data, error } = await supabase
        .from("client_centrales")
        .insert({ 
          client_id: clientId, 
          centrale_id: centraleId,
          chantier_id: chantierId || null
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["client_centrales", variables.clientId] });
    },
  });
}

export function useUpdateClientCentrale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, clientId, centraleId, chantierId }: { id: string; clientId: string; centraleId: string; chantierId?: string }) => {
      const { data, error } = await supabase
        .from("client_centrales")
        .update({ 
          centrale_id: centraleId,
          chantier_id: chantierId || null
        })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["client_centrales", variables.clientId] });
    },
  });
}

export function useRemoveClientCentrale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }) => {
      const { error } = await supabase
        .from("client_centrales")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["client_centrales", variables.clientId] });
    },
  });
}
