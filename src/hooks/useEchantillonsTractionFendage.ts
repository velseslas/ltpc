import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type EchantillonTractionFendage = {
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
  date_coulage: string | null;
  temperature_beton: number | null;
  temperature_air: number | null;
  classe_consistance: string | null;
  essai_convenance: boolean;
  essai_convenance_details: string | null;
  statut: string;
  observations: string | null;
  resultats: Json | null;
  created_at: string;
  updated_at: string;
};

export type EchantillonTractionFendageInsert = {
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
  date_coulage?: string | null;
  temperature_beton?: number | null;
  temperature_air?: number | null;
  classe_consistance?: string | null;
  essai_convenance?: boolean;
  essai_convenance_details?: string | null;
  statut?: string;
  observations?: string | null;
  resultats?: Json | null;
};

export type EchantillonWithRelations = EchantillonTractionFendage & {
  clients: { id: string; nom: string } | null;
  chantiers: { id: string; nom: string } | null;
  centrales_beton: { id: string; nom: string } | null;
  formulations: { id: string; nom: string } | null;
  intervenants: { id: string; nom: string; prenom: string } | null;
};

export function useEchantillonsTractionFendage() {
  return useQuery({
    queryKey: ["echantillons-traction-fendage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("echantillons_traction_fendage")
        .select(`
          *,
          clients(id, nom),
          chantiers(id, nom),
          centrales_beton(id, nom),
          formulations(id, nom),
          intervenants(id, nom, prenom)
        `)
        .order("numero", { ascending: true });

      if (error) throw error;
      return data as EchantillonWithRelations[];
    },
  });
}

export function useEchantillonTractionFendageById(id: string | undefined) {
  return useQuery({
    queryKey: ["echantillon-traction-fendage", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("echantillons_traction_fendage")
        .select(`
          *,
          clients(id, nom),
          chantiers(id, nom),
          centrales_beton(id, nom),
          formulations(id, nom),
          intervenants(id, nom, prenom)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as EchantillonWithRelations;
    },
    enabled: !!id,
  });
}

export function useCreateEchantillonTractionFendage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (echantillon: EchantillonTractionFendageInsert) => {
      const { data, error } = await supabase
        .from("echantillons_traction_fendage")
        .insert(echantillon)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["echantillons-traction-fendage"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUpdateEchantillonTractionFendage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: EchantillonTractionFendageInsert & { id: string }) => {
      const { data, error } = await supabase
        .from("echantillons_traction_fendage")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["echantillons-traction-fendage"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteEchantillonTractionFendage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("echantillons_traction_fendage")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["echantillons-traction-fendage"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
