import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";
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

const historiqueRepo = getRepositoryForTable<HistoriqueEchantillon>("historique_echantillons_compression", {
  defaultSelect: "*",
  defaultOrder: { column: "created_at", ascending: false },
});

export function useHistoriqueEchantillons(echantillonId: string | undefined) {
  return useQuery({
    queryKey: ["historique-echantillons", echantillonId],
    queryFn: async () => {
      if (!echantillonId) return [];
      const { data } = await historiqueRepo.list({ filters: { echantillon_id: echantillonId } });
      return data;
    },
    enabled: !!echantillonId,
  });
}

export function useCreateHistoriqueEchantillon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (historique: HistoriqueEchantillonInsert) => {
      const res = await historiqueRepo.insert(historique as any);
      if (res.error) throw new Error(res.error);
      return res.data[0];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["historique-echantillons", variables.echantillon_id],
      });
    },
  });
}

export async function logEchantillonHistory(
  echantillonId: string,
  action: "creation" | "modification" | "suppression",
  utilisateur: string,
  details?: Record<string, unknown>
) {
  const res = await historiqueRepo.insert({
    echantillon_id: echantillonId,
    action,
    utilisateur,
    details: (details || null) as Json | null,
  } as any);
  if (res.error) console.error("Error logging history:", res.error);
}

export function getChangedFields(
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>
): Record<string, { ancien: unknown; nouveau: unknown }> {
  const changes: Record<string, { ancien: unknown; nouveau: unknown }> = {};
  const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
  allKeys.forEach((key) => {
    const oldVal = oldValues[key];
    const newVal = newValues[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes[key] = { ancien: oldVal, nouveau: newVal };
    }
  });
  return changes;
}
