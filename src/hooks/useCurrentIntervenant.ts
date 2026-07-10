import { useQuery } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";
import { useAuth } from "@/hooks/useAuth";

const utilisateursRepo = getRepositoryForTable<{ intervenant_id: string | null }>("utilisateurs", { defaultSelect: "intervenant_id" });
const intervenantsRepo = getRepositoryForTable<{ id: string; nom: string; prenom: string }>("intervenants", { defaultSelect: "id, nom, prenom" });

/**
 * Returns the intervenant linked to the current logged-in user.
 * Used to auto-fill / lock the "Technicien" field for technician users.
 */
export function useCurrentIntervenant() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["current-intervenant", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data: users } = await utilisateursRepo.list({ filters: { user_id: user.id }, limit: 1 });
      const utilisateur = users[0];
      if (!utilisateur?.intervenant_id) return null;
      const { data } = await intervenantsRepo.getById(utilisateur.intervenant_id, "id, nom, prenom");
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}
