import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Generic duplication hook for any "echantillons_*" or "formulations" table.
 * Copies the full row (including the JSONB `resultats` analysis payload),
 * minus auto-generated columns. Applies user overrides on identification
 * fields, inserts a new row, and navigates to the new report.
 */
export type DuplicateEssaiOptions = {
  tableName: string;
  /** Builds the URL of the new report given the freshly created record id. */
  reportRoute: (id: string) => string;
  /** Optional cache keys to invalidate after duplication (e.g. ["echantillons-compression"]) */
  invalidateKeys?: string[];
};

const STRIPPED_COLUMNS = new Set([
  "id",
  "numero",
  "numero_chantier",
  "created_at",
  "updated_at",
]);

export function useDuplicateEssai({ tableName, reportRoute, invalidateKeys = [] }: DuplicateEssaiOptions) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDuplicating, setIsDuplicating] = useState(false);

  const duplicate = async (sourceId: string, overrides: Record<string, unknown> = {}) => {
    setIsDuplicating(true);
    try {
      // 1) Fetch source row (all columns)
      const { data: source, error: fetchErr } = await (supabase as any)
        .from(tableName)
        .select("*")
        .eq("id", sourceId)
        .single();
      if (fetchErr) throw fetchErr;
      if (!source) throw new Error("Échantillon source introuvable");

      // 2) Strip auto-generated columns, then apply overrides
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(source)) {
        if (STRIPPED_COLUMNS.has(k)) continue;
        payload[k] = v;
      }
      for (const [k, v] of Object.entries(overrides)) {
        if (v !== undefined) payload[k] = v;
      }

      // 3) Insert new row
      const { data: created, error: insertErr } = await (supabase as any)
        .from(tableName)
        .insert(payload)
        .select("id")
        .single();
      if (insertErr) throw insertErr;
      if (!created) throw new Error("Création échouée");

      // 4) Invalidate caches
      for (const key of invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }

      toast({
        title: "Rapport dupliqué",
        description: "Le nouvel échantillon a été créé avec succès.",
      });

      // 5) Navigate to the new report
      navigate(reportRoute(created.id));
      return created.id as string;
    } catch (e: any) {
      console.error("[useDuplicateEssai]", e);
      toast({
        title: "Erreur lors de la duplication",
        description: e?.message ?? "Une erreur est survenue",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsDuplicating(false);
    }
  };

  return { duplicate, isDuplicating };
}
