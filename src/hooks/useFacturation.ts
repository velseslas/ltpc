import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ---- Chèques ----
export function usePaiementsCheque() {
  return useQuery({
    queryKey: ["paiements-cheque"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paiements_cheque")
        .select("*, clients(id, nom)")
        .order("date_emission", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePaiementCheque() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await supabase.from("paiements_cheque").insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["paiements-cheque"] }),
  });
}

export function useDeletePaiementCheque() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("paiements_cheque").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["paiements-cheque"] }),
  });
}

// ---- Espèces ----
export function usePaiementsEspece() {
  return useQuery({
    queryKey: ["paiements-espece"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paiements_espece")
        .select("*, clients(id, nom)")
        .order("date_paiement", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePaiementEspece() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await supabase.from("paiements_espece").insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["paiements-espece"] }),
  });
}

export function useDeletePaiementEspece() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("paiements_espece").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["paiements-espece"] }),
  });
}
