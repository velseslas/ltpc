import { useQuery } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";
import { useAuth } from "@/hooks/useAuth";

const utilisateursRepo = getRepositoryForTable<{ intervenant_id: string | null }>("utilisateurs", { defaultSelect: "intervenant_id" });
const labosRepo = getRepositoryForTable<{ chantier_id: string | null }>("laboratoires_mobiles", { defaultSelect: "chantier_id" });
const affectationsRepo = getRepositoryForTable<{ chantier_id: string | null; statut: string | null; date_fin: string | null }>(
  "affectations",
  { defaultSelect: "chantier_id, statut, date_fin" }
);

/**
 * Returns the chantier IDs assigned to the current logged-in technician.
 * Sources: laboratoires_mobiles.responsable_id (technicien affecté au labo)
 * AND the RH `affectations` table (technicien affecté au chantier).
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
      const chantierIdSet = new Set<string>();

      const { data: labos } = await labosRepo.list({
        select: "chantier_id",
        filters: { responsable_id: intervenantId },
      });
      (labos as Array<{ chantier_id: string | null }>).forEach((l) => {
        if (l.chantier_id) chantierIdSet.add(l.chantier_id);
      });

      // Affectations RH (technicien ↔ chantier, plusieurs par chantier possibles)
      const { data: affectations } = await affectationsRepo.list({
        select: "chantier_id, statut, date_fin",
        filters: { intervenant_id: intervenantId },
      });
      (affectations as Array<{ chantier_id: string | null; statut: string | null; date_fin: string | null }>).forEach((a) => {
        const statut = (a.statut || "").toLowerCase();
        if (statut === "inactif" || statut === "termine" || statut === "terminé") return;
        if (a.date_fin && new Date(a.date_fin) < new Date()) return;
        if (a.chantier_id) chantierIdSet.add(a.chantier_id);
      });

      return { intervenantId, chantierIds: Array.from(chantierIdSet) };
    },
    enabled: !!user?.id,
  });
}
