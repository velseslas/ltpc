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
      const [client, chantier, moa, moe, essai] = await Promise.all([
        clientId
          ? supabase.from("clients").select("nom").eq("id", clientId).maybeSingle()
          : Promise.resolve({ data: null }),
        chantierId
          ? supabase
              .from("chantiers")
              .select("nom, adresse, ville")
              .eq("id", chantierId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        maitreOuvrageId
          ? supabase
              .from("maitres_ouvrage")
              .select("nom")
              .eq("id", maitreOuvrageId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        maitreOeuvreId
          ? supabase
              .from("maitres_oeuvre")
              .select("nom")
              .eq("id", maitreOeuvreId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        essaiCompressionId
          ? supabase
              .from("echantillons_compression")
              .select("numero, date_coulage, classe_resistance, ouvrage")
              .eq("id", essaiCompressionId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      return {
        client_nom: (client.data as any)?.nom || null,
        chantier_nom: (chantier.data as any)?.nom || null,
        chantier_adresse: (chantier.data as any)?.adresse || null,
        chantier_ville: (chantier.data as any)?.ville || null,
        maitre_ouvrage_nom: (moa.data as any)?.nom || null,
        maitre_oeuvre_nom: (moe.data as any)?.nom || null,
        essai_compression: essai.data
          ? {
              numero: (essai.data as any).numero,
              date_coulage: (essai.data as any).date_coulage,
              classe_resistance: (essai.data as any).classe_resistance,
              ouvrage: (essai.data as any).ouvrage,
            }
          : null,
      };
    },
    enabled: !!(clientId || chantierId || maitreOuvrageId || maitreOeuvreId || essaiCompressionId),
  });
}
