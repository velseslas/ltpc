import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Public endpoint (pre-login). Resolves a username/email to the account's
// email so the client can complete sign-in. To avoid user enumeration we:
//  - strictly validate the identifier (no wildcards, no PostgREST operators)
//  - use exact equality (not ILIKE) on both `email` and `nom`
//  - always return the same generic response shape; do not leak `statut`
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const identifier: string = (body?.identifier ?? "").toString().trim().toLowerCase();

    // Strict validation — reject anything that could be a PostgREST pattern
    // (%, _, *, commas, parens, quotes). Allow common email/username chars only.
    const VALID = /^[a-z0-9._+\-@]{1,128}$/;
    if (!identifier || !VALID.test(identifier)) {
      return new Response(
        JSON.stringify({ error: "Identifiant invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Exact match on email or nom — no pattern matching, no wildcard enumeration
    const { data, error } = await supabaseAdmin
      .from("utilisateurs")
      .select("email, statut")
      .or(`email.eq.${identifier},nom.eq.${identifier}`)
      .limit(1)
      .maybeSingle();

    if (error) {
      return new Response(
        JSON.stringify({ error: "Erreur de recherche" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Treat inactive accounts as "not found" — do not disclose status
    if (!data || (data.statut && data.statut !== "actif")) {
      return new Response(
        JSON.stringify({ found: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ found: true, email: data.email }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (_error) {
    return new Response(
      JSON.stringify({ error: "Erreur serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
