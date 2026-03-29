import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useClientMaitresOuvrage(clientId: string) {
  return useQuery({
    queryKey: ["client-maitres-ouvrage", clientId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("client_maitres_ouvrage")
        .select("*, maitres_ouvrage(*)")
        .eq("client_id", clientId);
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
}

export function useAddClientMaitreOuvrage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, maitreOuvrageId }: { clientId: string; maitreOuvrageId: string }) => {
      const { data, error } = await (supabase as any)
        .from("client_maitres_ouvrage")
        .insert({ client_id: clientId, maitre_ouvrage_id: maitreOuvrageId })
        .select("*, maitres_ouvrage(*)")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["client-maitres-ouvrage", vars.clientId] }),
  });
}

export function useRemoveClientMaitreOuvrage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }) => {
      const { error } = await (supabase as any)
        .from("client_maitres_ouvrage")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["client-maitres-ouvrage", vars.clientId] }),
  });
}
