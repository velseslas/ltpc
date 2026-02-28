import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export interface EchantillonBetonFraisBase {
  id: string;
  numero: number;
  client_id: string | null;
  chantier_id: string | null;
  centrale_id: string | null;
  formulation_id: string | null;
  operateur_id: string | null;
  date_prelevement: string;
  heure_prelevement: string | null;
  temperature_beton?: number | null;
  temperature_air?: number | null;
  temperature_ambiante?: number | null;
  classe_consistance?: string | null;
  classe_resistance?: string | null;
  resultats: Json | null;
  statut: string;
  observations: string | null;
  created_at: string;
  updated_at: string;
  clients?: { id: string; nom: string } | null;
  chantiers?: { id: string; nom: string } | null;
  centrales_beton?: { id: string; nom: string } | null;
  formulations?: { id: string; nom: string } | null;
  intervenants?: { id: string; nom: string; prenom: string } | null;
}

const essaiTypeToTable: Record<string, string> = {
  "affaissement": "echantillons_affaissement",
  "temperature": "echantillons_temperature",
  "temps-prise": "echantillons_temps_prise",
  "teneur-air": "echantillons_teneur_air",
};

const essaiTypeToPrefix: Record<string, string> = {
  "affaissement": "AFF",
  "temperature": "TMP",
  "temps-prise": "TPS",
  "teneur-air": "TAR",
};

export function getTableName(essaiType: string): string {
  return essaiTypeToTable[essaiType] || essaiTypeToTable["affaissement"];
}

export function getPrefix(essaiType: string): string {
  return essaiTypeToPrefix[essaiType] || "BF";
}

export function formatNumero(numero: number, essaiType?: string): string {
  const prefix = essaiType ? getPrefix(essaiType) : "BF";
  return `${prefix}-${String(numero).padStart(3, "0")}`;
}

export function useEchantillonsBetonFraisByType(essaiType: string) {
  const tableName = getTableName(essaiType);
  
  return useQuery({
    queryKey: ["echantillons-beton-frais", essaiType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName as any)
        .select(`
          *,
          clients(id, nom),
          chantiers(id, nom),
          centrales_beton(id, nom),
          formulations(id, nom),
          intervenants(id, nom, prenom)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as unknown as EchantillonBetonFraisBase[];
    },
  });
}

export function useEchantillonBetonFraisById(essaiType: string, id: string | undefined) {
  const tableName = getTableName(essaiType);
  
  return useQuery({
    queryKey: ["echantillons-beton-frais", essaiType, id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from(tableName as any)
        .select(`
          *,
          clients(id, nom),
          chantiers(id, nom),
          centrales_beton(id, nom),
          formulations(id, nom),
          intervenants(id, nom, prenom)
        `)
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data as unknown as EchantillonBetonFraisBase | null;
    },
    enabled: !!id,
  });
}

export function useCreateEchantillonBetonFraisByType(essaiType: string) {
  const queryClient = useQueryClient();
  const tableName = getTableName(essaiType);
  
  return useMutation({
    mutationFn: async (data: Partial<EchantillonBetonFraisBase>) => {
      const { data: result, error } = await supabase
        .from(tableName as any)
        .insert(data as any)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["echantillons-beton-frais", essaiType] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUpdateEchantillonBetonFraisByType(essaiType: string) {
  const queryClient = useQueryClient();
  const tableName = getTableName(essaiType);
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<EchantillonBetonFraisBase>) => {
      const { data, error } = await supabase
        .from(tableName as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["echantillons-beton-frais", essaiType] });
      queryClient.invalidateQueries({ queryKey: ["echantillons-beton-frais", essaiType, variables.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteEchantillonBetonFraisByType(essaiType: string) {
  const queryClient = useQueryClient();
  const tableName = getTableName(essaiType);
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(tableName as any)
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["echantillons-beton-frais", essaiType] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
