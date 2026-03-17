import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type EchantillonSclerometre = {
  id: string;
  numero: number;
  client_id: string | null;
  chantier_id: string | null;
  operateur_id: string | null;
  element_teste: string | null;
  localisation: string | null;
  orientation: string | null;
  date_essai: string;
  age_beton_jours: number | null;
  classe_resistance: string | null;
  observations: string | null;
  resultats: any;
  statut: string;
  created_at: string;
  updated_at: string;
};

export type EchantillonSclerometreInsert = Omit<EchantillonSclerometre, "id" | "numero" | "created_at" | "updated_at">;

export type EchantillonSclerometreWithRelations = EchantillonSclerometre & {
  clients: { id: string; nom: string } | null;
  chantiers: { id: string; nom: string } | null;
};

export function useEchantillonsSclerometre() {
  return useQuery({
    queryKey: ["echantillons-sclerometre"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("echantillons_sclerometre")
        .select(`*, clients(id, nom), chantiers(id, nom)`)
        .order("numero", { ascending: true });
      if (error) throw error;
      return data as EchantillonSclerometreWithRelations[];
    },
  });
}

export function useEchantillonSclerometre(id: string) {
  return useQuery({
    queryKey: ["echantillons-sclerometre", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("echantillons_sclerometre")
        .select(`*, clients(id, nom), chantiers(id, nom)`)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as EchantillonSclerometreWithRelations | null;
    },
    enabled: !!id,
  });
}

export function useCreateEchantillonSclerometre() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: EchantillonSclerometreInsert) => {
      const { data: result, error } = await supabase.from("echantillons_sclerometre").insert(data).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["echantillons-sclerometre"] }); },
  });
}

export function useUpdateEchantillonSclerometre() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EchantillonSclerometreInsert> & { id: string }) => {
      const { data, error } = await supabase.from("echantillons_sclerometre").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["echantillons-sclerometre"] }); },
  });
}

export function useDeleteEchantillonSclerometre() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("echantillons_sclerometre").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["echantillons-sclerometre"] }); },
  });
}
