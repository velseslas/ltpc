import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FormulationContext {
  client_nom: string | null;
  chantier_nom: string | null;
  chantier_adresse: string | null;
  chantier_ville: string | null;
  maitre_ouvrage_nom: string | null;
  maitre_oeuvre_nom: string | null;
  essai_compression: {
    numero: number;
    date_coulage: string | null;
    classe_resistance: string | null;
    ouvrage: string | null;
  } | null;
}

/**
 * Récupère les libellés des entités liées à une formulation
 * (client, chantier, MOA, MOE, essai de convenance) à partir des IDs stockés.
 *
 * Fallback: si la formulation ne référence pas directement client/chantier/MOA/MOE,
 * on déduit ces informations via l'essai de compression de convenance lié, puis
 * via les tables de liaison client_maitres_ouvrage / client_maitres_oeuvre.
 */
export function useFormulationContext(
  clientId: string | null | undefined,
  chantierId: string | null | undefined,
  maitreOuvrageId: string | null | undefined,
  maitreOeuvreId: string | null | undefined,
  essaiCompressionId: string | null | undefined
) {
  return useQuery({
    queryKey: [
      "formulation-context",
      clientId,
      chantierId,
      maitreOuvrageId,
      maitreOeuvreId,
      essaiCompressionId,
    ],
    queryFn: async (): Promise<FormulationContext> => {
      // 1) Charger l'essai de compression (sert aussi de fallback pour client/chantier)
      const essaiRes = essaiCompressionId
        ? await supabase
            .from("echantillons_compression")
            .select("numero, date_coulage, classe_resistance, ouvrage, client_id, chantier_id")
            .eq("id", essaiCompressionId)
            .maybeSingle()
        : { data: null as any };

      const essaiData: any = essaiRes.data || null;

      // 2) Résoudre client_id / chantier_id avec fallback via l'essai
      const effectiveClientId = clientId || essaiData?.client_id || null;
      const effectiveChantierId = chantierId || essaiData?.chantier_id || null;

      // 3) Récupérer client + chantier
      const [client, chantier] = await Promise.all([
        effectiveClientId
          ? supabase.from("clients").select("nom").eq("id", effectiveClientId).maybeSingle()
          : Promise.resolve({ data: null as any }),
        effectiveChantierId
          ? supabase
              .from("chantiers")
              .select("nom, adresse, ville")
              .eq("id", effectiveChantierId)
              .maybeSingle()
          : Promise.resolve({ data: null as any }),
      ]);

      // 4) MOA / MOE : direct ou fallback via tables de liaison du client
      let moaNom: string | null = null;
      let moeNom: string | null = null;

      if (maitreOuvrageId) {
        const { data } = await supabase
          .from("maitres_ouvrage")
          .select("nom")
          .eq("id", maitreOuvrageId)
          .maybeSingle();
        moaNom = (data as any)?.nom || null;
      } else if (effectiveClientId) {
        const { data } = await supabase
          .from("client_maitres_ouvrage")
          .select("maitres_ouvrage(nom)")
          .eq("client_id", effectiveClientId)
          .limit(1)
          .maybeSingle();
        moaNom = (data as any)?.maitres_ouvrage?.nom || null;
      }

      if (maitreOeuvreId) {
        const { data } = await supabase
          .from("maitres_oeuvre")
          .select("nom")
          .eq("id", maitreOeuvreId)
          .maybeSingle();
        moeNom = (data as any)?.nom || null;
      } else if (effectiveClientId) {
        const { data } = await supabase
          .from("client_maitres_oeuvre")
          .select("maitres_oeuvre(nom)")
          .eq("client_id", effectiveClientId)
          .limit(1)
          .maybeSingle();
        moeNom = (data as any)?.maitres_oeuvre?.nom || null;
      }

      return {
        client_nom: (client.data as any)?.nom || null,
        chantier_nom: (chantier.data as any)?.nom || null,
        chantier_adresse: (chantier.data as any)?.adresse || null,
        chantier_ville: (chantier.data as any)?.ville || null,
        maitre_ouvrage_nom: moaNom,
        maitre_oeuvre_nom: moeNom,
        essai_compression: essaiData
          ? {
              numero: essaiData.numero,
              date_coulage: essaiData.date_coulage,
              classe_resistance: essaiData.classe_resistance,
              ouvrage: essaiData.ouvrage,
            }
          : null,
      };
    },
    enabled: !!(clientId || chantierId || maitreOuvrageId || maitreOeuvreId || essaiCompressionId),
  });
}
