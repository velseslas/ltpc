import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { utilisateur_id, password, role, statut, poste_id } = await req.json();

    if (!utilisateur_id) {
      return new Response(
        JSON.stringify({ error: "utilisateur_id requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the utilisateur record
    const { data: util, error: utilFetchErr } = await supabaseAdmin
      .from("utilisateurs")
      .select("id, email, user_id")
      .eq("id", utilisateur_id)
      .single();

    if (utilFetchErr || !util) {
      return new Response(
        JSON.stringify({ error: utilFetchErr?.message || "Utilisateur introuvable" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let authUserId: string | null = util.user_id;

    // If a password change is requested, ensure auth user exists and update password
    if (password && password.length >= 6) {
      if (!authUserId) {
        // Try to find by email
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) {
          return new Response(
            JSON.stringify({ error: listError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const existingUser = users.find((u: any) => u.email === util.email);
        if (existingUser) {
          authUserId = existingUser.id;
        } else {
          // Create the auth user
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: util.email,
            password,
            email_confirm: true,
            user_metadata: { nom: util.email },
          });
          if (authError || !authData?.user) {
            return new Response(
              JSON.stringify({ error: authError?.message || "Création auth échouée" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          authUserId = authData.user.id;
        }
      }

      // Update password in auth
      const { error: pwdErr } = await supabaseAdmin.auth.admin.updateUserById(authUserId!, { password });
      if (pwdErr) {
        return new Response(
          JSON.stringify({ error: pwdErr.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Build update payload for utilisateurs
    const updateData: Record<string, unknown> = {};
    if (role !== undefined) updateData.role = role;
    if (statut !== undefined) updateData.statut = statut;
    if (poste_id !== undefined) updateData.poste_id = poste_id || null;
    if (password && password.length >= 6) updateData.mot_de_passe = password;
    if (authUserId && authUserId !== util.user_id) updateData.user_id = authUserId;

    if (Object.keys(updateData).length > 0) {
      const { error: updErr } = await supabaseAdmin
        .from("utilisateurs")
        .update(updateData)
        .eq("id", utilisateur_id);
      if (updErr) {
        return new Response(
          JSON.stringify({ error: updErr.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Sync user_roles
    if (authUserId && role) {
      await supabaseAdmin
        .from("user_roles")
        .upsert(
          { user_id: authUserId, role },
          { onConflict: "user_id,role" }
        );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
