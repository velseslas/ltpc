import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function requireAdmin(req: Request): Promise<{ error: Response } | { supabaseAdmin: ReturnType<typeof createClient> }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }) };
  }
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await userClient.auth.getClaims(token);
  if (error || !data?.claims) {
    return { error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }) };
  }
  const userId = data.claims.sub as string;

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const isAdmin = (roles ?? []).some((r: any) => r.role === "admin" || r.role === "super_admin");
  if (!isAdmin) {
    return { error: new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }) };
  }
  return { supabaseAdmin };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const guard = await requireAdmin(req);
    if ("error" in guard) return guard.error;
    const supabaseAdmin = guard.supabaseAdmin;

    const { nom, email, password, role, statut, poste_id, intervenant_id } = await req.json();

    if (!email || !password || !nom) {
      return new Response(
        JSON.stringify({ error: "Nom, email et mot de passe sont requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let authUserId: string;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nom },
    });

    if (authError) {
      if (authError.message.includes("already been registered")) {
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

    const { data: existingUtil } = await supabaseAdmin
      .from("utilisateurs")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUtil) {
      const { data: utilisateur, error: utilError } = await supabaseAdmin
        .from("utilisateurs")
        .update({
          user_id: authUserId,
          nom,
          role: role || "technicien",
          statut: statut || "actif",
          poste_id: poste_id || null,
          intervenant_id: intervenant_id || null,
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
      })
      .select()
      .single();

    if (utilError) {
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      return new Response(
        JSON.stringify({ error: utilError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
