import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches a single record by ID and returns it merged into a base list,
 * so that previously-saved foreign-key values stay visible inside Select dropdowns
 * even when the filtered list (by client / centrale) no longer contains them.
 */
export function useMergedById<T = any>(
  table: "centrales_beton" | "formulations" | "chantiers" | "intervenants",
  id: string | null | undefined,
  baseList: T[] | undefined,
  selectColumns = "id, nom"
): T[] {
  const { data: existing } = useQuery({
    queryKey: [`${table}-by-id`, id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await supabase.from(table as any).select(selectColumns).eq("id", id).maybeSingle();
      return data as any;
    },
    enabled: !!id,
  });

  return useMemo(() => {
    const list = [...((baseList as any[]) || [])];
    if (existing && !list.some((x: any) => x.id === existing.id)) list.push(existing);
    return list as T[];
  }, [baseList, existing]);
}
