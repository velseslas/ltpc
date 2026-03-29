import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { Json } from "@/integrations/supabase/types";

export type EchantillonChantier = Tables<"echantillons_compression"> & {
  clients: { id: string; nom: string } | null;
  chantiers: { id: string; nom: string } | null;
  centrales_beton: { id: string; nom: string } | null;
  formulations: { id: string; nom: string } | null;
};

export function useChantierEchantillons(chantierId: string) {
  return useQuery({
    queryKey: ["echantillons-chantier", chantierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("echantillons_compression")
        .select(`
          *,
          clients(id, nom),
          chantiers(id, nom),
          centrales_beton(id, nom),
          formulations(id, nom)
        `)
        .eq("chantier_id", chantierId)
        .order("numero_chantier", { ascending: true });

      if (error) throw error;
      return data as EchantillonChantier[];
    },
    enabled: !!chantierId,
  });
}

export function useCreateChantierEchantillon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (echantillon: {
      chantier_id: string;
      client_id?: string | null;
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
      observations?: string | null;
      essai_convenance?: boolean;
      essai_convenance_details?: string | null;
      classe_consistance?: string | null;
      mode_coulage?: string | null;
      temperature_air?: number | null;
      temperature_beton?: number | null;
      date_essai?: string | null;
      etuvage?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("echantillons_compression")
        .insert({ ...echantillon, is_laboratoire_chantier: true })
        .select(`
          *,
          clients(id, nom),
          chantiers(id, nom)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["echantillons-chantier", variables.chantier_id] });
      queryClient.invalidateQueries({ queryKey: ["echantillons-compression"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteChantierEchantillon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, chantierId }: { id: string; chantierId: string }) => {
      const { error } = await supabase
        .from("echantillons_compression")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return chantierId;
    },
    onSuccess: (chantierId) => {
      queryClient.invalidateQueries({ queryKey: ["echantillons-chantier", chantierId] });
      queryClient.invalidateQueries({ queryKey: ["echantillons-compression"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
