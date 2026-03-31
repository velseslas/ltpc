import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type EchantillonCarottage = {
  id: string;
  numero: number;
  client_id: string | null;
  chantier_id: string | null;
  operateur_id: string | null;
  date_prelevement: string;
  date_essai: string | null;
  ouvrage: string | null;
  partie_ouvrage: string | null;
  localisation: string | null;
  diametre_carotte: string | null;
  longueur_carotte: number | null;
  direction_carottage: string | null;
  presence_armatures: boolean;
  etat_surface: string | null;
  classe_resistance: string | null;
  observations: string | null;
  resultats: Json | null;
  statut: string;
  created_at: string;
  updated_at: string;
};

export type EchantillonCarottageInsert = {
  client_id?: string | null;
  chantier_id?: string | null;
  operateur_id?: string | null;
  date_prelevement?: string;
  date_essai?: string | null;
  ouvrage?: string | null;
  partie_ouvrage?: string | null;
  localisation?: string | null;
  diametre_carotte?: string | null;
  longueur_carotte?: number | null;
  direction_carottage?: string | null;
  presence_armatures?: boolean;
  etat_surface?: string | null;
  classe_resistance?: string | null;
  observations?: string | null;
  resultats?: Json | null;
  statut?: string;
};

export type CarottageWithRelations = EchantillonCarottage & {
  clients: { id: string; nom: string } | null;
  chantiers: { id: string; nom: string } | null;
  intervenants: { id: string; nom: string; prenom: string | null } | null;
};

export function useEchantillonsCarottage() {
  return useQuery({
    queryKey: ["echantillons-carottage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("echantillons_carottage")
        .select(`
          *,
          clients(id, nom),
          chantiers(id, nom),
          intervenants(id, nom, prenom)
        `)
        .order("numero", { ascending: true });

      if (error) throw error;
      return data as CarottageWithRelations[];
    },
  });
}

export function useEchantillonCarottage(id: string) {
  return useQuery({
    queryKey: ["echantillons-carottage", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("echantillons_carottage")
        .select(`
          *,
          clients(id, nom),
          chantiers(id, nom),
          intervenants(id, nom, prenom)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as CarottageWithRelations | null;
    },
    enabled: !!id,
  });
}

export function useCreateEchantillonCarottage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (echantillon: EchantillonCarottageInsert) => {
      const { data, error } = await supabase
        .from("echantillons_carottage")
        .insert(echantillon)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["echantillons-carottage"] });
    },
  });
}

export function useUpdateEchantillonCarottage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: EchantillonCarottageInsert & { id: string }) => {
      const { data, error } = await supabase
        .from("echantillons_carottage")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["echantillons-carottage"] });
    },
  });
}

export function useDeleteEchantillonCarottage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("echantillons_carottage")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["echantillons-carottage"] });
    },
  });
}
