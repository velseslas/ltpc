import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Public endpoint (pre-login). Returns ONLY the email + statut for a given
// username or email, with no PII beyond what the user must already type.
// This replaces the previous anon SELECT policy on `utilisateurs`.
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

    if (!identifier || identifier.length > 200) {
      return new Response(
        JSON.stringify({ error: "Identifiant requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("utilisateurs")
      .select("email, statut")
      .or(`email.ilike.${identifier},nom.ilike.${identifier}`)
      .limit(1)
      .maybeSingle();

    if (error) {
      return new Response(
        JSON.stringify({ error: "Erreur de recherche" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data) {
      // Generic response — do not disclose whether the user exists
      return new Response(
        JSON.stringify({ found: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ found: true, email: data.email, statut: data.statut }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Erreur serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
