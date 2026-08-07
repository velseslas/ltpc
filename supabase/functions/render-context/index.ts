/**
 * render-context — Consommation atomique d'un jeton de rendu PDF (§7.2).
 *
 * Appelée par la route `/__render/:token` (moteur PDF). Elle échange le jeton
 * contre le contexte figé côté serveur : type de rapport, ressource, filtres et
 * route d'impression réelle LTPC. Usage unique, expiration 2 minutes.
 * Les paramètres ne sont JAMAIS lus depuis la query string du client.
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const REPORT_PATHS: Record<string, (id: string | null, p: Record<string, unknown>) => string> = {
  "rapport-technique": (id) => `/reports/rapport-technique/${id}/print`,
  "compression": (id) => `/essais/beton/beton-durci/compression/${id}/rapport`,
  "labo-mobile-echantillon": (id, p) =>
    `/laboratoires-mobiles/chantier/${p.chantier_id}/echantillon/${id}/rapport`,
  "granulat": (id, p) => `/essais/granulat/physiques/${p.famille ?? "granulometrie"}/${id}/rapport`,
  "plaque": (id) => `/essais/geotechnique/in-situ/plaque/${id}/rapport`,
  "formulation": (id) => `/essais/beton/formulation/${id}/rapport`,
  "carottage": (id) => `/essais/beton/destructif/carottage/${id}/rapport`,
  "etat-coulages": (id) => `/laboratoires-mobiles/chantier/${id}/etat-coulages`,
  "etat-essais-beton-durci": (_id, p) =>
    `/essais/beton/beton-durci/etat-essais?type=${encodeURIComponent(String(p.type ?? "compression"))}`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const body = await req.json().catch(() => null);
    const token = body && typeof body === "object" ? String((body as Record<string, unknown>).token ?? "") : "";
    if (!token || token.length < 20 || token.length > 128) return json({ error: "Jeton invalide" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Consommation atomique : un seul appel peut réussir.
    const { data, error } = await admin
      .from("render_tokens")
      .update({ consumed_at: new Date().toISOString() })
      .eq("token", token)
      .is("consumed_at", null)
      .gt("expires_at", new Date().toISOString())
      .select("report_kind, resource_id, params")
      .maybeSingle();

    if (error) return json({ error: error.message }, 500);
    if (!data) return json({ error: "Jeton expiré, déjà utilisé ou inconnu" }, 403);

    const builder = REPORT_PATHS[data.report_kind as string];
    if (!builder) return json({ error: "Type de rapport inconnu" }, 400);

    const params = (data.params ?? {}) as Record<string, unknown>;
    return json({
      report_kind: data.report_kind,
      resource_id: data.resource_id,
      params,
      path: builder(data.resource_id as string | null, params),
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erreur inconnue" }, 500);
  }
});
