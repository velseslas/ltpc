import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DmaxCandidat {
  valeur: number;
  source: string;
}

export interface DmaxContexte {
  candidats: DmaxCandidat[];
  /** Valeur retenue automatiquement (unique candidat) — null si absence ou ambiguïté */
  valeur: number | null;
  source: string | null;
  ambigu: boolean;
}

/**
 * Source de vérité du Dmax : la formulation béton (formulations.dmax_utilisateur),
 * rattachée au chantier / client de la campagne de carottage.
 * Aucune duplication : la valeur n'est copiée que dans l'évaluation figée (traçabilité).
 */
export function useDmaxContexte(clientId: string | null | undefined, chantierId: string | null | undefined) {
  return useQuery({
    queryKey: ["carottage-dmax-contexte", clientId, chantierId],
    queryFn: async (): Promise<DmaxContexte> => {
      let query = supabase
        .from("formulations")
        .select("id, nom, dmax_utilisateur, chantier_id, client_id")
        .not("dmax_utilisateur", "is", null);

      if (chantierId) query = query.eq("chantier_id", chantierId);
      else if (clientId) query = query.eq("client_id", clientId);
      else return { candidats: [], valeur: null, source: null, ambigu: false };

      const { data, error } = await query;
      if (error) throw error;

      const map = new Map<number, string>();
      (data ?? []).forEach((f) => {
        const v = Number((f as { dmax_utilisateur: number | null }).dmax_utilisateur);
        if (!isFinite(v) || v <= 0) return;
        const label = `Formulation « ${(f as { nom?: string }).nom ?? "sans nom"} »`;
        map.set(v, map.has(v) ? `${map.get(v)} ; ${label}` : label);
      });

      const candidats = [...map.entries()].map(([valeur, source]) => ({ valeur, source }));
      const unique = candidats.length === 1;
      return {
        candidats,
        valeur: unique ? candidats[0].valeur : null,
        source: unique ? candidats[0].source : null,
        ambigu: candidats.length > 1,
      };
    },
    enabled: !!(clientId || chantierId),
    staleTime: 5 * 60 * 1000,
  });
}
