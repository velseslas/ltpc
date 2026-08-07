import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";
import type { Tables } from "@/integrations/supabase/types";
import type { Json } from "@/integrations/supabase/types";
import { purgeDerivedNotifications } from "@/lib/notifications/purgeDerived";
import { dispatchNotificationEvent } from "@/lib/notifications/dispatch";

export type EchantillonChantier = Tables<"echantillons_compression"> & {
  clients: { id: string; nom: string } | null;
  chantiers: { id: string; nom: string } | null;
  centrales_beton: { id: string; nom: string } | null;
  formulations: { id: string; nom: string } | null;
};

const listSelect = `
  *,
  clients:client_id(id, nom),
  chantiers:chantier_id(id, nom),
  centrales_beton:centrale_id(id, nom),
  formulations:formulation_id(id, nom)
`;
const insertSelect = `
  *,
  clients:client_id(id, nom),
  chantiers:chantier_id(id, nom)
`;

const echantillonsRepo = getRepositoryForTable<EchantillonChantier>("echantillons_compression", {
  defaultSelect: listSelect,
  defaultOrder: { column: "numero_chantier", ascending: true },
});

export function useChantierEchantillons(chantierId: string) {
  return useQuery({
    queryKey: ["echantillons-chantier", chantierId],
    queryFn: async () => {
      const { data } = await echantillonsRepo.list({ filters: { chantier_id: chantierId } });
      return data;
    },
    enabled: !!chantierId,
  });
}

export function useCreateChantierEchantillon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (echantillon: {
      chantier_id: string;
      client_id?: string | null;
      centrale_id?: string | null;
      formulation_id?: string | null;
      operateur_id?: string | null;
      ouvrage?: string | null;
      destination_beton?: string | null;
      condition_cure?: string | null;
      type_eprouvette?: string | null;
      dimension_eprouvette?: string | null;
      nombre_eprouvettes?: number | null;
      jours_essai?: Json | null;
      usage?: string | null;
      date_coulage?: string | null;
      observations?: string | null;
      essai_convenance?: boolean;
      essai_convenance_details?: string | null;
      classe_consistance?: string | null;
      mode_coulage?: string | null;
      temperature_air?: number | null;
      temperature_beton?: number | null;
      date_essai?: string | null;
      etuvage?: string | null;
    }) => {
      const res = await echantillonsRepo.insert(
        { ...echantillon, is_laboratoire_chantier: true } as any,
        { select: insertSelect },
      );
      if (res.error) throw new Error(res.error);
      return res.data[0];
    },
    onSuccess: (created, variables) => {
      // Événement métier → notification persistante + Push (jamais bloquant).
      if (created?.id) void dispatchNotificationEvent("echantillon_cree", created.id);
      queryClient.invalidateQueries({ queryKey: ["echantillons-chantier", variables.chantier_id] });
      queryClient.invalidateQueries({ queryKey: ["echantillons-compression"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notif-center"] });
      queryClient.invalidateQueries({ queryKey: ["notif-center-unread"] });
    },
  });
}

export function useDeleteChantierEchantillon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, chantierId }: { id: string; chantierId: string }) => {
      const res = await echantillonsRepo.delete({ id });
      if (res.error) throw new Error(res.error);
      return { id, chantierId };
    },
    onSuccess: ({ id, chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ["echantillons-chantier", chantierId] });
      queryClient.invalidateQueries({ queryKey: ["echantillons-compression"] });
      purgeDerivedNotifications(queryClient, id);
    },
  });
}

