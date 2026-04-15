import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

export function usePaiementCheque(id: string | undefined) {
  return useQuery({
    queryKey: ["paiements-cheque", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paiements_cheque")
        .select("*, clients(id, nom)")
        .eq("id", id!)
        .single();
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

export function useUpdatePaiementCheque() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...item }: any) => {
      const { data, error } = await supabase.from("paiements_cheque").update(item).eq("id", id).select().single();
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
