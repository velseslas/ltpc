// Public direct-file endpoint for shared documents.
//
// Purpose: a shared link must serve the archived document FILE itself, so the
// recipient's browser renders it natively (inline `application/pdf`) instead of
// landing on an internal LTPC preview page.
//
// Route: GET /functions/v1/document-file?t=<qr_token>[&dl=1]
// Scoping: identical to `verify-archive` — SECURITY DEFINER RPC
// `verify_archive_by_token`. No internal fields are exposed.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, range",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
};

const TOKEN_REGEX = /^[a-f0-9]{16,128}$/i;

function contentTypeFor(path: string): string {
  const p = path.toLowerCase();
  if (p.endsWith(".pdf")) return "application/pdf";
  if (p.endsWith(".html") || p.endsWith(".htm")) return "text/html; charset=utf-8";
  if (p.endsWith(".png")) return "image/png";
  if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

function fail(status: number, reason: string) {
  return new Response(JSON.stringify({ error: reason }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "HEAD") return fail(405, "method_not_allowed");

  try {
    const url = new URL(req.url);
    const token = (url.searchParams.get("t") ?? url.searchParams.get("token") ?? "").trim();
    const forceDownload = url.searchParams.get("dl") === "1";
    if (!TOKEN_REGEX.test(token)) return fail(400, "invalid_token");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data, error } = await admin.rpc("verify_archive_by_token", {
      _token: token,
      _max_age_days: null,
    });
    if (error) return fail(500, "lookup_failed");

    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.pdf_path) return fail(404, "not_found_or_expired");

    const { data: file, error: derr } = await admin.storage
      .from("documents-officiels")
      .download(row.pdf_path);
    if (derr || !file) return fail(404, "file_unavailable");

    const type = contentTypeFor(row.pdf_path);
    const ext = row.pdf_path.split(".").pop() ?? "pdf";
    const safeName = `${(row.numero ?? "document").toString().replace(/[^A-Za-z0-9._-]+/g, "-")}-v${row.version ?? 1}.${ext}`;
    const disposition = forceDownload ? "attachment" : "inline";

    if (req.method === "HEAD") {
      return new Response(null, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": type,
          "Content-Disposition": `${disposition}; filename="${safeName}"`,
        },
      });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    return new Response(bytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": type,
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": `${disposition}; filename="${safeName}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (_e) {
    return fail(500, "internal_error");
  }
});
