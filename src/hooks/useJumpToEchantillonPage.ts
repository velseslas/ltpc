import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Ouvre automatiquement la page de pagination contenant l'échantillon ciblé
 * via le paramètre d'URL ?echantillon=<id>, puis nettoie l'URL.
 */
export function useJumpToEchantillonPage<T extends { id: string }>(
  filteredData: T[],
  setCurrentPage: (page: number) => void,
  itemsPerPage = 10,
  paramName = "echantillon",
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const jumpedRef = useRef(false);
  const targetId = searchParams.get(paramName);

  useEffect(() => {
    if (jumpedRef.current || !targetId || filteredData.length === 0) return;
    const index = filteredData.findIndex((item) => item.id === targetId);
    if (index === -1) return;
    jumpedRef.current = true;
    setCurrentPage(Math.floor(index / itemsPerPage) + 1);
    const next = new URLSearchParams(searchParams);
    next.delete(paramName);
    setSearchParams(next, { replace: true });
  }, [targetId, filteredData, setCurrentPage, itemsPerPage, paramName, searchParams, setSearchParams]);
}
