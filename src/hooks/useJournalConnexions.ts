import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface JournalConnexion {
  id: string;
  user_id: string;
  utilisateur_nom: string | null;
  utilisateur_email: string | null;
  connexion_at: string;
  deconnexion_at: string | null;
  duree_secondes: number | null;
  user_agent: string | null;
}

export function useJournalConnexions() {
  return useQuery({
    queryKey: ["journal-connexions"],
    queryFn: async (): Promise<JournalConnexion[]> => {
      const { data, error } = await supabase
        .from("journal_connexions")
        .select("*")
        .order("connexion_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as JournalConnexion[];
    },
  });
}

export function formatDuree(seconds: number | null): string {
  if (seconds == null) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}min`;
  if (m > 0) return `${m}min ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}
