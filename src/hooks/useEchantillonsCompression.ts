import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type EchantillonCompression = {
  id: string;
  numero: number;
  client_id: string | null;
  chantier_id: string | null;
  centrale_id: string | null;
  formulation_id: string | null;
  operateur_id: string | null;
  ouvrage: string | null;
  destination_beton: string | null;
  condition_cure: string | null;
  type_eprouvette: string | null;
  dimension_eprouvette: string | null;
  nombre_eprouvettes: number | null;
  jours_essai: Json | null;
  usage: string | null;
  date_coulage: string | null;
  date_essai: string | null;
  etuvage: string | null;
  statut: string;
  observations: string | null;
  resultats: Json | null;
  created_at: string;
  updated_at: string;
};

export type EchantillonCompressionInsert = {
  client_id?: string | null;
  chantier_id?: string | null;
  centrale_id?: string | null;
  formulation_id?: string | null;
  operateur_id?: string | null;
  ouvrage?: string | null;
  destination_beton?: string | null;
  condition_cure?: string | null;
  type_eprouvette?: string | null;
  dimension_eprouvette?: string | null;
  nombre_eprouvettes?: number | null;
  jours_essai?: Json | null;
  usage?: string | null;
  date_coulage?: string | null;
  date_essai?: string | null;
  etuvage?: string | null;
  statut?: string;
  observations?: string | null;
  resultats?: Json | null;
};

export type EchantillonWithRelations = EchantillonCompression & {
  clients: { id: string; nom: string } | null;
  chantiers: { id: string; nom: string } | null;
};

export function useEchantillonsCompression() {
  return useQuery({
    queryKey: ["echantillons-compression"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("echantillons_compression")
        .select(`
          *,
          clients(id, nom),
          chantiers(id, nom)
        `)
        .is("numero_chantier", null)
        .order("numero", { ascending: true });

      if (error) throw error;
      return data as EchantillonWithRelations[];
    },
  });
}

export function useCreateEchantillonCompression() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (echantillon: EchantillonCompressionInsert) => {
      const { data, error } = await supabase
        .from("echantillons_compression")
        .insert(echantillon)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["echantillons-compression"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUpdateEchantillonCompression() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: EchantillonCompressionInsert & { id: string }) => {
      const { data, error } = await supabase
        .from("echantillons_compression")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["echantillons-compression"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteEchantillonCompression() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("echantillons_compression")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["echantillons-compression"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
