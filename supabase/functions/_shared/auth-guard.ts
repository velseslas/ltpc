// Shared auth guard for edge functions. Validates the caller JWT and returns claims.
// Throws-friendly: returns a Response on failure so callers just `return guard.response`.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

export interface AuthGuardOk {
  ok: true;
  userId: string;
  claims: Record<string, unknown>;
  token: string;
}
export interface AuthGuardErr {
  ok: false;
  response: Response;
}

export async function requireAuth(req: Request): Promise<AuthGuardOk | AuthGuardErr> {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }
  const token = authHeader.slice("Bearer ".length);
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const sb = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
  const { data, error } = await sb.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }
  return { ok: true, userId: String(data.claims.sub), claims: data.claims as Record<string, unknown>, token };
}

/** Check user has one of the given roles via public.user_roles. Uses service role. */
export async function hasAnyRole(userId: string, roles: string[]): Promise<boolean> {
  const url = Deno.env.get("SUPABASE_URL")!;
  const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, svc);
  const { data } = await admin.from("user_roles").select("role").eq("user_id", userId);
  const set = new Set((data ?? []).map((r: { role: string }) => r.role));
  return roles.some((r) => set.has(r));
}

/** Verify caller may access a technical report (owner, technician, or admin/manager/ingenieur). */
export async function canAccessRapport(userId: string, rapportId: string): Promise<boolean> {
  const url = Deno.env.get("SUPABASE_URL")!;
  const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, svc);
  const { data: r } = await admin
    .from("rapports_techniques")
    .select("technicien_id, created_by")
    .eq("id", rapportId)
    .maybeSingle();
  if (!r) return false;
  if (r.technicien_id === userId || r.created_by === userId) return true;
  return await hasAnyRole(userId, ["super_admin", "admin", "manager", "ingenieur"]);
}

export function unauthorized(msg = "Forbidden", status = 403): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
