import { supabase } from "@/integrations/supabase/client";

/**
 * Détecte les erreurs provoquées par une session expirée / non renouvelable :
 * - PGRST301 / PGRST303 : JWT expiré ou absent (PostgREST)
 * - 42501 : "permission denied" côté Postgres (requête envoyée en rôle anon)
 * - messages d'auth explicites (bad_jwt, refresh_token_not_found…)
 */
export function isSessionExpiredError(error: unknown): boolean {
  const err = error as { code?: string; message?: string; status?: number } | null;
  if (!err) return false;
  const code = err.code ?? "";
  const message = err.message ?? "";
  if (code === "PGRST301" || code === "PGRST303" || code === "42501") return true;
  if (err.status === 401 || err.status === 403) return true;
  return /jwt expired|token is expired|invalid refresh token|refresh_token_not_found|bad_jwt|permission denied/i.test(
    message,
  );
}

let handling = false;

/**
 * Tente un rafraîchissement unique de la session ; si impossible, déconnecte
 * localement et renvoie l'utilisateur vers la page de connexion.
 */
export async function handleSessionExpired(): Promise<void> {
  if (handling) return;
  handling = true;
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (!error && data.session) return;

    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/auth")) {
      window.location.assign("/auth");
    }
  } finally {
    setTimeout(() => {
      handling = false;
    }, 5000);
  }
}
