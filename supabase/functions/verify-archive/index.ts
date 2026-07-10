// Public verification endpoint for QR-scanned official documents.
// Called anonymously — enforces token scoping via SECURITY DEFINER RPC
// `verify_archive_by_token`, and returns a short-lived signed URL for the
// archived PDF. No internal fields (variables, contenu_snapshot,
// generated_by uuid) are ever exposed.
//
// Route: POST /functions/v1/verify-archive
// Body:  { token: string, ttl?: number, max_age_days?: number }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TOKEN_REGEX = /^[a-f0-9]{16,128}$/i;
const DEFAULT_TTL_SEC = 3600;
const MAX_TTL_SEC = 24 * 3600;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const token: string = typeof body?.token === "string" ? body.token.trim() : "";
    const ttl: number = Math.min(Math.max(Number(body?.ttl) || DEFAULT_TTL_SEC, 60), MAX_TTL_SEC);
    const maxAgeDays: number | null = body?.max_age_days == null
      ? null
      : Math.min(Math.max(Number(body.max_age_days) || 0, 1), 3650);

    if (!TOKEN_REGEX.test(token)) {
      return new Response(JSON.stringify({ valid: false, reason: "invalid_token" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await admin.rpc("verify_archive_by_token", {
      _token: token,
      _max_age_days: maxAgeDays,
    });

    if (error) {
      return new Response(JSON.stringify({ valid: false, reason: "lookup_failed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      return new Response(JSON.stringify({ valid: false, reason: "not_found_or_expired" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Short-lived signed URL for the archived PDF.
    let signedUrl: string | null = null;
    if (row.pdf_path) {
      const { data: sig } = await admin.storage
        .from("documents-officiels")
        .createSignedUrl(row.pdf_path, ttl);
      signedUrl = sig?.signedUrl ?? null;
    }

    return new Response(
      JSON.stringify({
        valid: true,
        archive: {
          document_type: row.document_type,
          numero: row.numero,
          version: row.version,
          created_at: row.created_at,
          generated_by_nom: row.generated_by_nom,
          pdf_size: row.pdf_size,
          sha256: row.sha256,
          status: row.status,
        },
        signed_url: signedUrl,
        signed_url_ttl: ttl,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (_e) {
    return new Response(JSON.stringify({ valid: false, reason: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
