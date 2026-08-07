/**
 * render-token — Émission d'un jeton de rendu PDF (§7.2).
 *
 * Le jeton fige CÔTÉ SERVEUR : type de rapport, ressource, filtres et
 * paramètres nécessaires à la génération. Usage unique, expiration 2 minutes.
 * Aucun filtre n'est transporté dans l'URL publique : seule la chaîne opaque
 * du jeton circule jusqu'au moteur PDF (Gotenberg).
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

/** Catalogue fermé : type de rapport → route d'impression réelle LTPC. */
const REPORT_KINDS: Record<
  string,
  { needsResource: boolean; path: (resourceId: string | null, params: Record<string, unknown>) => string }
> = {
  "rapport-technique": {
    needsResource: true,
    path: (id) => `/reports/rapport-technique/${id}/print`,
  },
  "compression": {
    needsResource: true,
    path: (id) => `/essais/beton/beton-durci/compression/${id}/rapport`,
  },
  "labo-mobile-echantillon": {
    needsResource: true,
    path: (id, p) => `/laboratoires-mobiles/chantier/${p.chantier_id}/echantillon/${id}/rapport`,
  },
  "granulat": {
    needsResource: true,
    path: (id, p) => `/essais/granulat/physiques/${p.famille ?? "granulometrie"}/${id}/rapport`,
  },
  "plaque": {
    needsResource: true,
    path: (id) => `/essais/geotechnique/in-situ/plaque/${id}/rapport`,
  },
  "formulation": {
    needsResource: true,
    path: (id) => `/essais/beton/formulation/${id}/rapport`,
  },
  "carottage": {
    needsResource: true,
    path: (id) => `/essais/beton/destructif/carottage/${id}/rapport`,
  },
  "etat-coulages": {
    needsResource: true,
    path: (id) => `/laboratoires-mobiles/chantier/${id}/etat-coulages`,
  },
  "etat-essais-beton-durci": {
    needsResource: false,
    path: (_id, p) => `/essais/beton/beton-durci/etat-essais?type=${encodeURIComponent(String(p.type ?? "compression"))}`,
  },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Non authentifié" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Non authentifié" }, 401);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "Corps invalide" }, 400);

    const kind = String((body as Record<string, unknown>).report_kind ?? "");
    const spec = REPORT_KINDS[kind];
    if (!spec) return json({ error: "Type de rapport inconnu" }, 400);

    const resourceId = (body as Record<string, unknown>).resource_id
      ? String((body as Record<string, unknown>).resource_id)
      : null;
    if (spec.needsResource && (!resourceId || !UUID.test(resourceId))) {
      return json({ error: "Ressource invalide" }, 400);
    }

    const rawParams = (body as Record<string, unknown>).params;
    const params: Record<string, unknown> =
      rawParams && typeof rawParams === "object" && !Array.isArray(rawParams)
        ? (rawParams as Record<string, unknown>)
        : {};
    if (JSON.stringify(params).length > 4000) return json({ error: "Paramètres trop volumineux" }, 400);

    const token = b64url(crypto.getRandomValues(new Uint8Array(32)));
    const admin = createClient(url, service);
    const { error } = await admin.from("render_tokens").insert({
      token,
      report_kind: kind,
      resource_id: resourceId,
      params,
      created_by: userData.user.id,
      expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
    });
    if (error) return json({ error: error.message }, 500);

    return json({ token, render_path: `/__render/${token}` });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erreur inconnue" }, 500);
  }
});
