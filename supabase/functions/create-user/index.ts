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

    const { nom, email, password, role, statut, poste_id, intervenant_id } = await req.json();

    if (!email || !password || !nom) {
      return new Response(
        JSON.stringify({ error: "Nom, email et mot de passe sont requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to create auth user, or find existing one
    let authUserId: string;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nom },
    });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        // User exists in auth - find their ID and update password
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) {
          return new Response(
            JSON.stringify({ error: listError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const existingUser = users.find((u: any) => u.email === email);
        if (!existingUser) {
          return new Response(
            JSON.stringify({ error: "Utilisateur introuvable" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        authUserId = existingUser.id;
        // Update password
        await supabaseAdmin.auth.admin.updateUserById(authUserId, { password });
      } else {
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      authUserId = authData.user.id;
    }

    // Check if utilisateur record already exists for this email
    const { data: existingUtil } = await supabaseAdmin
      .from("utilisateurs")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUtil) {
      // Update existing record
      const { data: utilisateur, error: utilError } = await supabaseAdmin
        .from("utilisateurs")
        .update({
          user_id: authUserId,
          nom,
          role: role || "technicien",
          statut: statut || "actif",
          poste_id: poste_id || null,
          intervenant_id: intervenant_id || null,
          mot_de_passe: password,
        })
        .eq("id", existingUtil.id)
        .select()
        .single();

      if (utilError) {
        return new Response(
          JSON.stringify({ error: utilError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Upsert user_roles
      await supabaseAdmin
        .from("user_roles")
        .upsert(
          { user_id: authUserId, role: role || "technicien" },
          { onConflict: "user_id,role" }
        );

      return new Response(
        JSON.stringify({ success: true, utilisateur }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new utilisateur record
    const { data: utilisateur, error: utilError } = await supabaseAdmin
      .from("utilisateurs")
      .insert({
        user_id: authUserId,
        nom,
        email,
        role: role || "technicien",
        statut: statut || "actif",
        poste_id: poste_id || null,
        intervenant_id: intervenant_id || null,
        mot_de_passe: password,
      })
      .select()
      .single();

    if (utilError) {
      // Rollback: delete auth user if utilisateur creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      return new Response(
        JSON.stringify({ error: utilError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert into user_roles
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: authUserId, role: role || "technicien" });

    if (roleError) {
      console.error("Error inserting user_role:", roleError.message);
    }

    return new Response(
      JSON.stringify({ success: true, utilisateur }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
