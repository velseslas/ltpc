import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type EchantillonModuleElasticite = {
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

export type EchantillonModuleElasticiteInsert = {
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

export type EchantillonWithRelations = EchantillonModuleElasticite & {
  clients: { id: string; nom: string } | null;
  chantiers: { id: string; nom: string } | null;
  centrales_beton: { id: string; nom: string } | null;
  formulations: { id: string; nom: string } | null;
  intervenants: { id: string; nom: string; prenom: string } | null;
};

export function useEchantillonsModuleElasticite() {
  return useQuery({
    queryKey: ["echantillons-module-elasticite"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("echantillons_module_elasticite")
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

export function useEchantillonModuleElasticiteById(id: string | undefined) {
  return useQuery({
    queryKey: ["echantillon-module-elasticite", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("echantillons_module_elasticite")
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

export function useCreateEchantillonModuleElasticite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (echantillon: EchantillonModuleElasticiteInsert) => {
      const { data, error } = await supabase
        .from("echantillons_module_elasticite")
        .insert(echantillon)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["echantillons-module-elasticite"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUpdateEchantillonModuleElasticite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: EchantillonModuleElasticiteInsert & { id: string }) => {
      const { data, error } = await supabase
        .from("echantillons_module_elasticite")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["echantillons-module-elasticite"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteEchantillonModuleElasticite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("echantillons_module_elasticite")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["echantillons-module-elasticite"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
