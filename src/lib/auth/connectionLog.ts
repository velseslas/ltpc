import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const STORAGE_KEY = "ltpc_connexion_log_id";
let heartbeat: ReturnType<typeof setInterval> | null = null;

function getStoredId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredId(id: string | null) {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

async function touch(id: string) {
  const { data } = await supabase
    .from("journal_connexions")
    .select("connexion_at")
    .eq("id", id)
    .maybeSingle();
  if (!data) return;
  const start = new Date(data.connexion_at).getTime();
  const now = Date.now();
  await supabase
    .from("journal_connexions")
    .update({
      deconnexion_at: new Date(now).toISOString(),
      duree_secondes: Math.max(0, Math.round((now - start) / 1000)),
    })
    .eq("id", id);
}

function startHeartbeat(id: string) {
  stopHeartbeat();
  heartbeat = setInterval(() => {
    void touch(id).catch(() => {});
  }, 60_000);
}

function stopHeartbeat() {
  if (heartbeat) clearInterval(heartbeat);
  heartbeat = null;
}

/** Enregistre une nouvelle session de connexion pour l'utilisateur. */
export async function logConnexionStart(user: User) {
  try {
    if (getStoredId()) {
      startHeartbeat(getStoredId() as string);
      return;
    }
    const nom =
      (user.user_metadata?.nom as string | undefined) ||
      (user.user_metadata?.full_name as string | undefined) ||
      user.email ||
      null;
    const { data, error } = await supabase
      .from("journal_connexions")
      .insert({
        user_id: user.id,
        utilisateur_nom: nom,
        utilisateur_email: user.email ?? null,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      })
      .select("id")
      .single();
    if (error || !data) return;
    setStoredId(data.id);
    startHeartbeat(data.id);
  } catch {
    /* silencieux : ne jamais bloquer l'authentification */
  }
}

/** Clôture la session de connexion en cours (déconnexion). */
export async function logConnexionEnd() {
  const id = getStoredId();
  stopHeartbeat();
  setStoredId(null);
  if (!id) return;
  try {
    await touch(id);
  } catch {
    /* ignore */
  }
}
