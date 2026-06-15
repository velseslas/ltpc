import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Lit `?duplicateFrom={id}` dans l'URL et charge la ligne source depuis
 * `tableName`. Utilisé par les formulaires d'échantillon pour pré-remplir
 * les champs d'identification quand l'utilisateur clique "Dupliquer" dans
 * la liste. Aucune insertion automatique : le formulaire reste en mode
 * création et l'utilisateur clique "Enregistrer" pour persister.
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
      const { data: row, error } = await (supabase as any)
        .from(tableName)
        .select("*")
        .eq("id", duplicateFromId)
        .single();
      if (cancelled) return;
      if (error) {
        console.error("[useDuplicateSource]", error);
        setData(null);
      } else {
        setData(row as T);
      }
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [duplicateFromId, tableName]);

  return { duplicateFromId, duplicateSource: data, isDuplicateLoading: isLoading };
}
