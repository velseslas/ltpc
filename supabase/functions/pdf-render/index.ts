/**
 * pdf-render — Génération de PDF vectoriel via Gotenberg (Phase 4).
 *
 * Chaîne : LTPC → render-token → /__render/:token → Gotenberg → PDF vectoriel.
 *
 * Garanties :
 *  - Gotenberg ne reçoit QUE l'URL de rendu à usage unique (2 min) ;
 *  - aucun identifiant Supabase, aucun cookie, aucune donnée métier transmis ;
 *  - le secret d'appel est porté par l'en-tête X-LTPC-Render-Secret ;
 *  - archivage PDF optionnel dans le Storage (le partage n'est PAS branché ici).
 *
 * Ne modifie ni le bouton Partager, ni document-file, ni les templates,
 * ni le moteur d'impression Phase 11.
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const APP_ORIGIN = "https://ltpc.lovable.app";
const BUCKET = "documents-officiels";

/** Orientation figée par type de rapport (identique au référentiel Phase 3). */
const LANDSCAPE_KINDS = new Set(["etat-coulages", "etat-essais-beton-durci"]);

const REPORT_KINDS = new Set([
  "rapport-technique",
  "compression",
  "labo-mobile-echantillon",
  "granulat",
  "plaque",
  "formulation",
  "carottage",
  "etat-coulages",
  "etat-essais-beton-durci",
]);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const started = Date.now();
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Non authentifié" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const gotenbergUrl = (Deno.env.get("GOTENBERG_URL") ?? "").replace(/\/+$/, "");
    const gotenbergSecret = Deno.env.get("GOTENBERG_SHARED_SECRET") ?? "";
    if (!gotenbergUrl || !gotenbergSecret) {
      return json({ error: "Moteur PDF non configuré (GOTENBERG_URL / GOTENBERG_SHARED_SECRET)" }, 503);
    }

    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Non authentifié" }, 401);

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return json({ error: "Corps invalide" }, 400);

    const kind = String(body.report_kind ?? "");
    if (!REPORT_KINDS.has(kind)) return json({ error: "Type de rapport inconnu" }, 400);

    const resourceId = body.resource_id ? String(body.resource_id) : null;
    if (resourceId && !UUID.test(resourceId)) return json({ error: "Ressource invalide" }, 400);

    const params =
      body.params && typeof body.params === "object" && !Array.isArray(body.params)
        ? (body.params as Record<string, unknown>)
        : {};
    if (JSON.stringify(params).length > 4000) return json({ error: "Paramètres trop volumineux" }, 400);

    const archive = body.archive === true;

    // 1) Jeton de rendu — mêmes règles que render-token (usage unique, 2 min).
    const admin = createClient(url, service);
    const token = b64url(crypto.getRandomValues(new Uint8Array(32)));
    const { error: tokenErr } = await admin.from("render_tokens").insert({
      token,
      report_kind: kind,
      resource_id: resourceId,
      params,
      created_by: userData.user.id,
      expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
    });
    if (tokenErr) return json({ error: tokenErr.message }, 500);

    // 2) Conversion Chromium — Gotenberg ne voit que cette URL opaque.
    const landscape = LANDSCAPE_KINDS.has(kind);
    const form = new FormData();
    form.append("url", `${APP_ORIGIN}/__render/${token}`);
    form.append("paperWidth", landscape ? "11.69" : "8.27");
    form.append("paperHeight", landscape ? "8.27" : "11.69");
    form.append("marginTop", "0");
    form.append("marginBottom", "0");
    form.append("marginLeft", "0");
    form.append("marginRight", "0");
    form.append("printBackground", "true");
    form.append("preferCssPageSize", "true");
    form.append("emulatedMediaType", "print");
    form.append("waitDelay", "2s");
    form.append("waitForExpression", "window.__LTPC_PRINT_READY === true");
    form.append("failOnHttpStatusCodes", "[499,599]");

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 90_000);
    let pdfRes: Response;
    try {
      pdfRes = await fetch(`${gotenbergUrl}/forms/chromium/convert/url`, {
        method: "POST",
        headers: { "X-LTPC-Render-Secret": gotenbergSecret },
        body: form,
        signal: ctrl.signal,
      });
    } catch (e) {
      clearTimeout(timer);
      return json({ error: `Moteur PDF injoignable : ${e instanceof Error ? e.message : "timeout"}` }, 502);
    }
    clearTimeout(timer);

    if (!pdfRes.ok) {
      const detail = await pdfRes.text().catch(() => "");
      return json({ error: "Échec de conversion", status: pdfRes.status, detail: detail.slice(0, 500) }, 502);
    }

    const pdf = new Uint8Array(await pdfRes.arrayBuffer());
    const durationMs = Date.now() - started;
    const isPdf = pdf[0] === 0x25 && pdf[1] === 0x50 && pdf[2] === 0x44 && pdf[3] === 0x46; // %PDF
    if (!isPdf || pdf.byteLength < 1024) return json({ error: "PDF invalide renvoyé par le moteur" }, 502);

    // 3) Archivage optionnel (le fallback HTML actuel reste en place).
    let storagePath: string | null = null;
    if (archive) {
      storagePath = `pdf/${kind}/${resourceId ?? "global"}/${Date.now()}.pdf`;
      const { error: upErr } = await admin.storage
        .from(BUCKET)
        .upload(storagePath, pdf, { contentType: "application/pdf", upsert: false });
      if (upErr) return json({ error: `Archivage impossible : ${upErr.message}` }, 500);
    }

    if (body.return_pdf === true && !archive) {
      return new Response(pdf, {
        headers: { ...corsHeaders, "Content-Type": "application/pdf", "Content-Disposition": "inline" },
      });
    }

    return json({
      ok: true,
      report_kind: kind,
      bytes: pdf.byteLength,
      duration_ms: durationMs,
      landscape,
      bucket: archive ? BUCKET : null,
      storage_path: storagePath,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erreur inconnue" }, 500);
  }
});
