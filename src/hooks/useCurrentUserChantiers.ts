import { useQuery } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";
import { useAuth } from "@/hooks/useAuth";

const utilisateursRepo = getRepositoryForTable<{ intervenant_id: string | null }>("utilisateurs", { defaultSelect: "intervenant_id" });
const labosRepo = getRepositoryForTable<{ chantier_id: string | null }>("laboratoires_mobiles", { defaultSelect: "chantier_id" });

/**
 * Returns the chantier IDs assigned to the current logged-in technician.
 * Links: auth.user → utilisateurs.user_id → intervenant_id → laboratoires_mobiles.responsable_id
 */
export function useCurrentUserChantiers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["current-user-chantiers", user?.id],
    queryFn: async () => {
      if (!user?.id) return { intervenantId: null, chantierIds: [] as string[] };

      const { data: users } = await utilisateursRepo.list({ filters: { user_id: user.id }, limit: 1 });
      const utilisateur = users[0];
      if (!utilisateur?.intervenant_id) {
        return { intervenantId: null, chantierIds: [] as string[] };
      }

      const intervenantId = utilisateur.intervenant_id;

      // Source of truth: laboratoires_mobiles.responsable_id
      const { data: labos } = await labosRepo.list({
        select: "chantier_id",
        filters: {
          responsable_id: intervenantId,
          chantier_id: { op: "is", value: null } as any, // placeholder to allow next filter
        },
      });
      // Re-filter locally because Repository can't express "not is null" cleanly here.
      const chantierIdSet = new Set<string>();
      (labos as Array<{ chantier_id: string | null }>).forEach((l) => {
        if (l.chantier_id) chantierIdSet.add(l.chantier_id);
      });

      return { intervenantId, chantierIds: Array.from(chantierIdSet) };
    },
    enabled: !!user?.id,
  });
}
