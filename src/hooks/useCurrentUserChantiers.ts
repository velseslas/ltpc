import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Returns the chantier IDs assigned to the current logged-in technician.
 * Links: auth.user → utilisateurs.user_id → intervenant_id → affectations / laboratoires_mobiles
 */
export function useCurrentUserChantiers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["current-user-chantiers", user?.id],
    queryFn: async () => {
      if (!user?.id) return { intervenantId: null, chantierIds: [] as string[] };

      // 1. Get intervenant_id from utilisateurs
      const { data: utilisateur } = await supabase
        .from("utilisateurs")
        .select("intervenant_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!utilisateur?.intervenant_id) {
        return { intervenantId: null, chantierIds: [] as string[] };
      }

      const intervenantId = utilisateur.intervenant_id;

      // 2. Get chantier IDs from affectations (active)
      const { data: affectations } = await supabase
        .from("affectations")
        .select("chantier_id")
        .eq("intervenant_id", intervenantId)
        .in("statut", ["en_cours", "active", "actif"]);

      // 3. Get chantier IDs from laboratoires_mobiles (as responsable)
      const { data: labos } = await supabase
        .from("laboratoires_mobiles")
        .select("chantier_id")
        .eq("responsable_id", intervenantId)
        .not("chantier_id", "is", null);

      const chantierIdSet = new Set<string>();
      affectations?.forEach(a => { if (a.chantier_id) chantierIdSet.add(a.chantier_id); });
      labos?.forEach(l => { if (l.chantier_id) chantierIdSet.add(l.chantier_id as string); });

      return { intervenantId, chantierIds: Array.from(chantierIdSet) };
    },
    enabled: !!user?.id,
  });
}
