import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";

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
      const repo = getRepositoryForTable<any>(table, { defaultSelect: selectColumns });
      const { data } = await repo.getById(id, selectColumns);
      return data;
    },
    enabled: !!id,
  });

  return useMemo(() => {
    const list = [...((baseList as any[]) || [])];
    if (existing && !list.some((x: any) => x.id === (existing as any).id)) list.push(existing);
    return list as T[];
  }, [baseList, existing]);
}
