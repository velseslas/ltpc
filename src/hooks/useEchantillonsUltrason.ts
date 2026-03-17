import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type EchantillonUltrason = {
  id: string;
  numero: number;
  client_id: string | null;
  chantier_id: string | null;
  operateur_id: string | null;
  element_teste: string | null;
  localisation: string | null;
  mode_transmission: string | null;
  frequence_khz: number | null;
  date_essai: string;
  age_beton_jours: number | null;
  classe_resistance: string | null;
  observations: string | null;
  resultats: any;
  statut: string;
  created_at: string;
  updated_at: string;
};

export type EchantillonUltrasonInsert = Omit<EchantillonUltrason, "id" | "numero" | "created_at" | "updated_at">;

export type EchantillonUltrasonWithRelations = EchantillonUltrason & {
  clients: { id: string; nom: string } | null;
  chantiers: { id: string; nom: string } | null;
};

export function useEchantillonsUltrason() {
  return useQuery({
    queryKey: ["echantillons-ultrason"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("echantillons_ultrason")
        .select(`*, clients(id, nom), chantiers(id, nom)`)
        .order("numero", { ascending: true });
      if (error) throw error;
      return data as EchantillonUltrasonWithRelations[];
    },
  });
}

export function useEchantillonUltrason(id: string) {
  return useQuery({
    queryKey: ["echantillons-ultrason", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("echantillons_ultrason")
        .select(`*, clients(id, nom), chantiers(id, nom)`)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as EchantillonUltrasonWithRelations | null;
    },
    enabled: !!id,
  });
}

export function useCreateEchantillonUltrason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: EchantillonUltrasonInsert) => {
      const { data: result, error } = await supabase.from("echantillons_ultrason").insert(data).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["echantillons-ultrason"] }); },
  });
}

export function useUpdateEchantillonUltrason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EchantillonUltrasonInsert> & { id: string }) => {
      const { data, error } = await supabase.from("echantillons_ultrason").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["echantillons-ultrason"] }); },
  });
}

export function useDeleteEchantillonUltrason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("echantillons_ultrason").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["echantillons-ultrason"] }); },
  });
}
