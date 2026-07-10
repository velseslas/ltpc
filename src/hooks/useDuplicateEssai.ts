import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getRepositoryForTable } from "@/lib/repositories";

/**
 * Lit `?duplicateFrom={id}` dans l'URL et charge la ligne source depuis
 * `tableName`. Utilisé par les formulaires d'échantillon pour pré-remplir
 * les champs d'identification quand l'utilisateur clique "Dupliquer" dans
 * la liste. Aucune insertion automatique.
 */
export function useDuplicateSource<T = Record<string, any>>(tableName: string) {
  const [searchParams] = useSearchParams();
  const duplicateFromId = searchParams.get("duplicateFrom") || "";
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!duplicateFromId) {
      setData(null);
      return;
    }
    setIsLoading(true);
    (async () => {
      const repo = getRepositoryForTable<T>(tableName, { defaultSelect: "*" });
      const { data: row } = await repo.getById(duplicateFromId);
      if (cancelled) return;
      setData((row as T) ?? null);
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [duplicateFromId, tableName]);

  return { duplicateFromId, duplicateSource: data, isDuplicateLoading: isLoading };
}
