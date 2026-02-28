import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type HistoriqueEchantillon = {
  id: string;
  echantillon_id: string;
  action: string;
  utilisateur: string | null;
  details: Json | null;
  created_at: string;
};

export type HistoriqueEchantillonInsert = {
  echantillon_id: string;
  action: string;
  utilisateur?: string | null;
  details?: Json | null;
};

export function useHistoriqueEchantillons(echantillonId: string | undefined) {
  return useQuery({
    queryKey: ["historique-echantillons", echantillonId],
    queryFn: async () => {
      if (!echantillonId) return [];
      const { data, error } = await (supabase as any)
        .from("historique_echantillons_compression")
        .select("*")
        .eq("echantillon_id", echantillonId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as HistoriqueEchantillon[];
    },
    enabled: !!echantillonId,
  });
}

export function useCreateHistoriqueEchantillon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (historique: HistoriqueEchantillonInsert) => {
      const { data, error } = await (supabase as any)
        .from("historique_echantillons_compression")
        .insert(historique)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["historique-echantillons", variables.echantillon_id] 
      });
    },
  });
}

// Helper function to create a history entry
export async function logEchantillonHistory(
  echantillonId: string,
  action: "creation" | "modification" | "suppression",
  utilisateur: string,
  details?: Record<string, unknown>
) {
  const { error } = await (supabase as any)
    .from("historique_echantillons_compression")
    .insert({
      echantillon_id: echantillonId,
      action,
      utilisateur,
      details: details || null,
    });

  if (error) {
    console.error("Error logging history:", error);
  }
}

// Helper to get changes between old and new values
export function getChangedFields(
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>
): Record<string, { ancien: unknown; nouveau: unknown }> {
  const changes: Record<string, { ancien: unknown; nouveau: unknown }> = {};

  const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

  allKeys.forEach((key) => {
    const oldVal = oldValues[key];
    const newVal = newValues[key];

    // Compare stringified values for complex types
    const oldStr = JSON.stringify(oldVal);
    const newStr = JSON.stringify(newVal);

    if (oldStr !== newStr) {
      changes[key] = {
        ancien: oldVal,
        nouveau: newVal,
      };
    }
  });

  return changes;
}
