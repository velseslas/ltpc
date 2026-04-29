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

    const email = "admin@labo.dz";
    const password = "Admin@2024";
    const nom = "Administrateur";

    // Check if any super_admin already exists -> refuse
    const { data: existingAdmins } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "super_admin");

    if (existingAdmins && existingAdmins.length > 0) {
      return new Response(
        JSON.stringify({ error: "Un super_admin existe déjà. Bootstrap refusé." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create or find auth user
    let authUserId: string;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nom },
    });

    if (authError) {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const existing = users.find((u: any) => u.email === email);
      if (!existing) {
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      authUserId = existing.id;
      await supabaseAdmin.auth.admin.updateUserById(authUserId, { password, email_confirm: true });
    } else {
      authUserId = authData.user.id;
    }

    // Upsert utilisateurs row
    const { data: existingUtil } = await supabaseAdmin
      .from("utilisateurs")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUtil) {
      await supabaseAdmin
        .from("utilisateurs")
        .update({ user_id: authUserId, nom, role: "super_admin", statut: "actif" })
        .eq("id", existingUtil.id);
    } else {
      await supabaseAdmin
        .from("utilisateurs")
        .insert({ user_id: authUserId, nom, email, role: "super_admin", statut: "actif" });
    }

    // Upsert user_roles
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: authUserId, role: "super_admin" }, { onConflict: "user_id,role" });

    return new Response(
      JSON.stringify({ success: true, email, password, message: "Admin créé. Connectez-vous puis supprimez la fonction bootstrap-admin." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
