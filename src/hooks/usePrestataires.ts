import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePrestataires() {
  return useQuery({
    queryKey: ["prestataires"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("prestataires")
        .select("*")
        .order("nom", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function usePrestataire(id?: string) {
  return useQuery({
    queryKey: ["prestataires", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("prestataires")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreatePrestataire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await (supabase as any).from("prestataires").insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prestataires"] }),
  });
}

export function useUpdatePrestataire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...item }: any) => {
      const { data, error } = await (supabase as any).from("prestataires").update(item).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prestataires"] }),
  });
}

export function useDeletePrestataire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("prestataires").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prestataires"] }),
  });
}

// Bons de commande prestataire
export function useBonsCommandePrestataire() {
  return useQuery({
    queryKey: ["bons-commande-prestataire"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("bons_commande_prestataire")
        .select("*, prestataires(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateBonCommandePrestataire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await (supabase as any).from("bons_commande_prestataire").insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bons-commande-prestataire"] }),
  });
}

export function useDeleteBonCommandePrestataire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("bons_commande_prestataire").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bons-commande-prestataire"] }),
  });
}
