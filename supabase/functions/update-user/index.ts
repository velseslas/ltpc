import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function requireAdmin(req: Request): Promise<{ error: Response } | { supabaseAdmin: any }> {
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

    const { utilisateur_id, password, role, statut, poste_id } = await req.json();

    if (!utilisateur_id) {
      return new Response(
        JSON.stringify({ error: "utilisateur_id requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: util, error: utilFetchErr } = await supabaseAdmin
      .from("utilisateurs")
      .select("id, email, user_id, nom")
      .eq("id", utilisateur_id)
      .single();

    if (utilFetchErr || !util) {
      if (utilFetchErr) console.error("update-user fetch error:", utilFetchErr);
      return new Response(
        JSON.stringify({ error: "Utilisateur introuvable" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let authUserId: string | null = util.user_id;

    if (password && password.length >= 6) {
      if (!authUserId) {
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) {
          console.error("update-user listUsers error:", listError);
          return new Response(
            JSON.stringify({ error: "Erreur interne du serveur" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const existingUser = users.find((u: any) => u.email === util.email);
        if (existingUser) {
          authUserId = existingUser.id;
        } else {
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: util.email,
            password,
            email_confirm: true,
            user_metadata: { nom: util.email },
          });
          if (authError || !authData?.user) {
            if (authError) console.error("update-user createUser error:", authError);
            return new Response(
              JSON.stringify({ error: "Création auth échouée" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          authUserId = authData.user.id;
        }
      }

      const authUpdatePayload: Record<string, unknown> = {
        password,
        email: util.email,
        email_confirm: true,
        user_metadata: { nom: util.nom || util.email },
      };

      const { error: pwdErr } = await supabaseAdmin.auth.admin.updateUserById(authUserId!, authUpdatePayload);
      if (pwdErr) {
        console.error("update-user password update error:", pwdErr);
        const code = (pwdErr as any)?.code;
        let msg = "Impossible de mettre à jour le mot de passe";
        if (code === "weak_password") {
          msg = "Mot de passe trop faible ou compromis (présent dans une fuite connue). Choisissez-en un autre, plus long et unique.";
        } else if (pwdErr.message) {
          msg = pwdErr.message;
        }
        return new Response(
          JSON.stringify({ error: msg, code }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Store plaintext password for Super Admin visibility (option B)
      await supabaseAdmin
        .from("user_passwords_visible")
        .upsert(
          { utilisateur_id, password_plain: password, updated_at: new Date().toISOString() },
          { onConflict: "utilisateur_id" }
        );
    } else if (authUserId) {
      const { data: authUserData, error: authFetchErr } = await supabaseAdmin.auth.admin.getUserById(authUserId);
      if (authFetchErr) {
        console.error("update-user getUserById error:", authFetchErr);
      } else if (authUserData?.user?.email !== util.email) {
        const { error: emailSyncErr } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
          email: util.email,
          email_confirm: true,
          user_metadata: { nom: util.nom || util.email },
        });
        if (emailSyncErr) {
          console.error("update-user email sync error:", emailSyncErr);
          return new Response(
            JSON.stringify({ error: "Impossible de synchroniser l'email de connexion" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    const updateData: Record<string, unknown> = {};
    if (role !== undefined) updateData.role = role;
    if (statut !== undefined) updateData.statut = statut;
    if (poste_id !== undefined) updateData.poste_id = poste_id || null;
    if (authUserId && authUserId !== util.user_id) updateData.user_id = authUserId;

    if (Object.keys(updateData).length > 0) {
      const { error: updErr } = await supabaseAdmin
        .from("utilisateurs")
        .update(updateData)
        .eq("id", utilisateur_id);
      if (updErr) {
        console.error("update-user utilisateurs update error:", updErr);
        return new Response(
          JSON.stringify({ error: "Erreur de mise à jour de l'utilisateur" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

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
    console.error("update-user unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
