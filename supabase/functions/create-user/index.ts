import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function requireAdmin(req: Request): Promise<{ error: Response } | { supabaseAdmin: any; isSuperAdmin: boolean }> {
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
  const isSuperAdmin = (roles ?? []).some((r: any) => r.role === "super_admin");
  const isAdmin = isSuperAdmin || (roles ?? []).some((r: any) => r.role === "admin");
  if (!isAdmin) {
    return { error: new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }) };
  }
  return { supabaseAdmin, isSuperAdmin };
}

function authPasswordErrorResponse(error: any) {
  const code = error?.code;
  const message = String(error?.message || "");
  let msg = "Impossible de créer le mot de passe";

  if (code === "weak_password" || message.includes("Password is known") || message.includes("pwned")) {
    msg = "Mot de passe refusé : il est trop faible ou présent dans une fuite connue. Choisissez un mot de passe plus long et unique.";
  } else if (message) {
    msg = message;
  }

  return new Response(
    JSON.stringify({ error: msg, code }),
    { status: code === "weak_password" ? 422 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
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

    // Seul un super_admin peut accorder le rôle super_admin.
    if (role === "super_admin" && !guard.isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: "Seul un Super Admin peut attribuer le rôle Super Admin" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
          console.error("create-user listUsers error:", listError);
          return new Response(
            JSON.stringify({ error: "Erreur interne du serveur" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        const { error: pwdErr } = await supabaseAdmin.auth.admin.updateUserById(authUserId, { password });
        if (pwdErr) {
          console.error("create-user password update error:", pwdErr);
          return authPasswordErrorResponse(pwdErr);
        }
      } else {
        console.error("create-user auth error:", authError);
        return authPasswordErrorResponse(authError);
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
        console.error("create-user utilisateurs update error:", utilError);
        return new Response(
          JSON.stringify({ error: "Erreur de mise à jour de l'utilisateur" }),
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
      console.error("create-user utilisateurs insert error:", utilError);
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      return new Response(
        JSON.stringify({ error: "Erreur de création de l'utilisateur" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: authUserId, role: role || "technicien" });

    if (roleError) {
      console.error("Error inserting user_role:", roleError);
    }

    return new Response(
      JSON.stringify({ success: true, utilisateur }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("create-user unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
