import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useClientMaitresOeuvre(clientId: string) {
  return useQuery({
    queryKey: ["client-maitres-oeuvre", clientId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("client_maitres_oeuvre")
        .select("*, maitres_oeuvre(*)")
        .eq("client_id", clientId);
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
}

export function useAddClientMaitreOeuvre() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, maitreOeuvreId }: { clientId: string; maitreOeuvreId: string }) => {
      const { data, error } = await (supabase as any)
        .from("client_maitres_oeuvre")
        .insert({ client_id: clientId, maitre_oeuvre_id: maitreOeuvreId })
        .select("*, maitres_oeuvre(*)")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["client-maitres-oeuvre", vars.clientId] }),
  });
}

export function useRemoveClientMaitreOeuvre() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }) => {
      const { error } = await (supabase as any)
        .from("client_maitres_oeuvre")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["client-maitres-oeuvre", vars.clientId] }),
  });
}
