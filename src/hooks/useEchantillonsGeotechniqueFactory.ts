import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export interface EchantillonGeotechniqueBase {
  id: string;
  numero: number;
  chantier_id: string | null;
  client_id: string | null;
  type_sol: string;
  profondeur: string | null;
  date_prelevement: string;
  statut: "termine" | "en-cours" | "a-faire";
  resultats: Json | null;
  observations: string | null;
  operateur_id: string | null;
  created_at: string;
  updated_at: string;
  chantiers?: {
    id: string;
    nom: string;
    ville: string | null;
  } | null;
  clients?: {
    id: string;
    nom: string;
  } | null;
  intervenants?: {
    id: string;
    nom: string;
    prenom: string;
    signature_url?: string | null;
  } | null;
}

const essaiTypeToTable: Record<string, string> = {
  "limites-atterberg": "echantillons_limites_atterberg",
  "granulometrie-sol": "echantillons_granulometrie_sol",
  "teneur-eau-sol": "echantillons_teneur_eau_sol",
  "classification-sol": "echantillons_classification_sol",
  "proctor-normal": "echantillons_proctor_normal",
  "proctor-modifie": "echantillons_proctor_modifie",
  "cbr": "echantillons_cbr",
  "densite-place": "echantillons_densite_place",
  "cisaillement": "echantillons_cisaillement",
  "compression-simple": "echantillons_compression_simple",
  "triaxial": "echantillons_triaxial",
  "oedometrique": "echantillons_oedometrique",
  "penetrometre": "echantillons_penetrometre",
  "pressiometre": "echantillons_pressiometre",
  "plaque": "echantillons_plaque",
  "sondage": "echantillons_sondage",
};

const essaiTypeToPrefix: Record<string, string> = {
  "limites-atterberg": "LA",
  "granulometrie-sol": "GS",
  "teneur-eau-sol": "TS",
  "classification-sol": "CS",
  "proctor-normal": "PN",
  "proctor-modifie": "PM",
  "cbr": "CBR",
  "densite-place": "DP",
  "cisaillement": "CD",
  "compression-simple": "CPS",
  "triaxial": "TX",
  "oedometrique": "OD",
  "penetrometre": "PD",
  "pressiometre": "PR",
  "plaque": "PL",
  "sondage": "SC",
};

export function getGeoTableName(essaiType: string): string {
  return essaiTypeToTable[essaiType] || "echantillons_geotechnique";
}

export function getGeoPrefix(essaiType: string): string {
  return essaiTypeToPrefix[essaiType] || "GEO";
}

export function formatGeoNumero(numero: number, essaiType?: string): string {
  const numStr = String(numero).padStart(3, "0");
  if (essaiType) {
    return `${getGeoPrefix(essaiType)}-${numStr}`;
  }
  return numStr;
}

export function useEchantillonsGeotechniqueByType(essaiType: string) {
  const tableName = getGeoTableName(essaiType);

  return useQuery({
    queryKey: ["echantillons-geo", tableName],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from(tableName)
        .select(`
          *,
          chantiers (id, nom, ville),
          clients (id, nom),
          intervenants (id, nom, prenom)
        `)
        .order("numero", { ascending: false });

      if (error) throw error;
      return data as EchantillonGeotechniqueBase[];
    },
  });
}

export function useEchantillonGeotechniqueById(essaiType: string, id: string | undefined) {
  const tableName = getGeoTableName(essaiType);

  return useQuery({
    queryKey: ["echantillon-geo", tableName, id],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from(tableName)
        .select(`
          *,
          chantiers (id, nom, ville),
          clients (id, nom),
          intervenants (id, nom, prenom, signature_url)
        `)
        .eq("id", id!)
        .maybeSingle();

      if (error) throw error;
      return data as EchantillonGeotechniqueBase | null;
    },
    enabled: !!id,
  });
}

export function useCreateEchantillonGeotechniqueByType(essaiType: string) {
  const queryClient = useQueryClient();
  const tableName = getGeoTableName(essaiType);

  return useMutation({
    mutationFn: async (echantillon: {
      chantier_id?: string;
      client_id?: string;
      type_sol: string;
      profondeur?: string;
      date_prelevement: string;
      statut?: string;
      observations?: string;
      operateur_id?: string;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from(tableName)
        .insert(echantillon)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["echantillons-geo", tableName] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUpdateEchantillonGeotechniqueByType(essaiType: string) {
  const queryClient = useQueryClient();
  const tableName = getGeoTableName(essaiType);

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      chantier_id?: string;
      client_id?: string;
      type_sol?: string;
      profondeur?: string;
      date_prelevement?: string;
      statut?: string;
      observations?: string;
      operateur_id?: string;
      resultats?: Json;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from(tableName)
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["echantillons-geo", tableName] });
      queryClient.invalidateQueries({ queryKey: ["echantillon-geo", tableName, variables.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteEchantillonGeotechniqueByType(essaiType: string) {
  const queryClient = useQueryClient();
  const tableName = getGeoTableName(essaiType);

  return useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from(tableName)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["echantillons-geo", tableName] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
