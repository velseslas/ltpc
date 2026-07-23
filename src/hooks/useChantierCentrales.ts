import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CentraleBeton } from "./useCentralesBeton";

export type CentraleLite = Pick<CentraleBeton, "id" | "nom" | "ville" | "adresse" | "contact" | "telephone" | "capacite">;

const sortCentrales = <T extends { nom?: string | null }>(list: T[]) =>
  list.sort((a, b) => (a.nom ?? "").localeCompare(b.nom ?? ""));

/** Retourne les centrales à béton affectées à un chantier donné. */
export function useChantierCentrales(chantierId: string) {
  return useQuery({
    queryKey: ["chantier_centrales", chantierId],
    enabled: !!chantierId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chantier_centrales")
        .select("centrale_id, centrales_beton:centrale_id(id, nom, ville, adresse, contact, telephone, capacite)")
        .eq("chantier_id", chantierId);
      if (error) throw error;
      const centrales = (data ?? [])
        .map((row: any) => row.centrales_beton)
        .filter(Boolean) as CentraleLite[];
      return sortCentrales(centrales);
    },
  });
}

/** Affecte une ou plusieurs centrales à un chantier. */
export function useAffectCentralesToChantier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ chantierId, centraleIds }: { chantierId: string; centraleIds: string[] }) => {
      if (!centraleIds.length) return;
      const rows = centraleIds.map((cid) => ({ chantier_id: chantierId, centrale_id: cid }));
      const { error } = await supabase.from("chantier_centrales").insert(rows);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["chantier_centrales", vars.chantierId] });
      qc.invalidateQueries({ queryKey: ["centrales_by_chantier_or_client"] });
      toast.success("Centrale(s) affectée(s) au chantier");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erreur lors de l'affectation"),
  });
}

/** Retire une centrale d'un chantier. */
export function useDetachCentraleFromChantier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ chantierId, centraleId }: { chantierId: string; centraleId: string }) => {
      const { error } = await supabase
        .from("chantier_centrales")
        .delete()
        .eq("chantier_id", chantierId)
        .eq("centrale_id", centraleId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["chantier_centrales", vars.chantierId] });
      qc.invalidateQueries({ queryKey: ["centrales_by_chantier_or_client"] });
      toast.success("Centrale retirée du chantier");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erreur lors du retrait"),
  });
}

/**
 * Retourne les centrales filtrées par chantier affecté ;
 * si un chantier est fourni, la liste reste strictement limitée à ses affectations.
 * Le fallback aux centrales du client ne s'applique que tant qu'aucun chantier n'est sélectionné.
 * Renvoie directement un tableau pour rester compatible avec l'ancien hook useCentralesByClient.
 */
export function useCentralesForSample(clientId: string | null | undefined, chantierId: string | null | undefined) {
  return useQuery({
    queryKey: ["centrales_by_chantier_or_client", clientId ?? null, chantierId ?? null],
    enabled: !!clientId || !!chantierId,
    queryFn: async () => {
      if (chantierId) {
        const { data: chantierLinks, error: chantierError } = await supabase
          .from("chantier_centrales")
          .select("centrales_beton:centrale_id(id, nom, ville)")
          .eq("chantier_id", chantierId);
        if (chantierError) throw chantierError;

        const chantierList = (chantierLinks ?? []).map((r: any) => r.centrales_beton).filter(Boolean);
        if (chantierList.length > 0) {
          return sortCentrales(chantierList);
        }

        const { data: legacyLinks, error: legacyError } = await supabase
          .from("client_centrales")
          .select("centrales_beton:centrale_id(id, nom, ville)")
          .eq("chantier_id", chantierId);
        if (legacyError) throw legacyError;

        const legacyList = (legacyLinks ?? []).map((r: any) => r.centrales_beton).filter(Boolean);
        return sortCentrales(legacyList);
      }
      if (clientId) {
        const { data, error } = await supabase
          .from("client_centrales")
          .select("centrales_beton:centrale_id(id, nom, ville)")
          .eq("client_id", clientId);
        if (error) throw error;
        const list = (data ?? []).map((r: any) => r.centrales_beton).filter(Boolean);
        return sortCentrales(list);
      }
      return [] as any[];
    },
  });
}

// Alias to keep the older name used by the sample forms.
export const useCentralesForSampleWrapper = useCentralesForSample;

