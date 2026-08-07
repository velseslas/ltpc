/**
 * RenderBootstrap — route `/__render/:token` (§7.2).
 *
 * Point d'entrée unique du moteur PDF (Gotenberg). Elle :
 *  1. échange le jeton contre le contexte figé côté serveur (`render-context`) ;
 *  2. mémorise les paramètres figés (filtres, ressource) en mémoire ;
 *  3. redirige vers la ROUTE D'IMPRESSION RÉELLE LTPC, inchangée.
 *
 * Aucun template, aucun moteur d'impression, aucun calcul n'est dupliqué ici.
 */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { setFrozenRenderContext } from "@/lib/render/renderParams";
import { armPrintReadySignal } from "@/lib/render/printReady";

export default function RenderBootstrap() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: fnError } = await supabase.functions.invoke("render-context", {
        body: { token },
      });
      if (cancelled) return;
      if (fnError || !data?.path) {
        setError(data?.error || fnError?.message || "Jeton de rendu invalide");
        document.documentElement.setAttribute("data-render-status", "error");
        return;
      }
      setFrozenRenderContext({
        report_kind: data.report_kind,
        resource_id: data.resource_id ?? null,
        params: data.params ?? {},
      });
      document.documentElement.setAttribute("data-render-status", "ready");
      armPrintReadySignal();
      document.documentElement.setAttribute("data-render-kind", String(data.report_kind));
      navigate(String(data.path), { replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  if (error) {
    return (
      <div className="p-8 text-sm text-destructive" data-render-error>
        {error}
      </div>
    );
  }
  return <div className="p-8 text-sm">Préparation du rendu…</div>;
}
