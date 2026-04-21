import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

      const { data: utilisateur } = await supabase
        .from("utilisateurs")
        .select("intervenant_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!utilisateur?.intervenant_id) return null;

      const { data: intervenant } = await supabase
        .from("intervenants")
        .select("id, nom, prenom")
        .eq("id", utilisateur.intervenant_id)
        .maybeSingle();

      return intervenant;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}
