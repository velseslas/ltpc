// Phase 7.5 — C2 : Rate Limiter centralisé pour toutes les Edge Functions IA.
//
// Caractéristiques :
//   • Fenêtre glissante (sliding window) par (scope + identité).
//   • Identité = user_id extrait du JWT si présent, sinon IP (x-forwarded-for / cf-connecting-ip).
//   • Deux limites cumulées : par utilisateur ET par IP.
//   • Réponse HTTP 429 standard avec en-tête Retry-After.
//   • Journalise chaque refus (console.warn) — indépendant du provider IA.
//   • Stockage in-memory par isolate Deno (ad-hoc — le backend ne fournit pas encore
//     de primitive rate-limit persistante ; suffisant pour bloquer les abus courants).
//
// Utilisation :
//   const rl = await enforceRateLimit(req, { scope: "ltpc-ai-chat" });
//   if (rl) return rl;

export interface RateLimitConfig {
  scope: string;
  /** Limite par utilisateur sur la fenêtre. Défaut : 30. */
  userLimit?: number;
  /** Limite par IP sur la fenêtre. Défaut : 60. */
  ipLimit?: number;
  /** Fenêtre glissante en secondes. Défaut : 60. */
  windowSec?: number;
}

interface Bucket {
  timestamps: number[]; // epoch ms
}

// Map<key, Bucket> — key = `${scope}:${kind}:${id}`
const store = new Map<string, Bucket>();

function getIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  return "unknown";
}

function getUserId(req: Request): string | null {
  try {
    const auth = req.headers.get("Authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "");
    if (!token || !token.includes(".")) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.sub ?? null;
  } catch { return null; }
}

function hit(key: string, limit: number, windowMs: number, now: number): { ok: boolean; retryAfter: number; count: number } {
  const bucket = store.get(key) ?? { timestamps: [] };
  const cutoff = now - windowMs;
  // Fenêtre glissante : on ne garde que les hits dans la fenêtre.
  const kept = bucket.timestamps.filter((t) => t > cutoff);
  if (kept.length >= limit) {
    const oldest = kept[0];
    const retryAfter = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    bucket.timestamps = kept;
    store.set(key, bucket);
    return { ok: false, retryAfter, count: kept.length };
  }
  kept.push(now);
  bucket.timestamps = kept;
  store.set(key, bucket);
  return { ok: true, retryAfter: 0, count: kept.length };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Applique le rate-limit. Retourne une Response 429 si la limite est franchie,
 * sinon `null` (la function peut continuer).
 */
export async function enforceRateLimit(req: Request, cfg: RateLimitConfig): Promise<Response | null> {
  const userLimit = cfg.userLimit ?? 30;
  const ipLimit = cfg.ipLimit ?? 60;
  const windowMs = (cfg.windowSec ?? 60) * 1000;
  const now = Date.now();

  const uid = getUserId(req);
  const ip = getIp(req);

  // Contrôle IP
  const ipRes = hit(`${cfg.scope}:ip:${ip}`, ipLimit, windowMs, now);
  if (!ipRes.ok) {
    console.warn(`[rate-limit] REFUS ${cfg.scope} ip=${ip} count=${ipRes.count}/${ipLimit} retryAfter=${ipRes.retryAfter}s`);
    return makeLimitResponse(ipRes.retryAfter, "IP");
  }

  // Contrôle utilisateur (si authentifié)
  if (uid) {
    const uRes = hit(`${cfg.scope}:user:${uid}`, userLimit, windowMs, now);
    if (!uRes.ok) {
      console.warn(`[rate-limit] REFUS ${cfg.scope} user=${uid} count=${uRes.count}/${userLimit} retryAfter=${uRes.retryAfter}s`);
      return makeLimitResponse(uRes.retryAfter, "user");
    }
  }

  return null;
}

function makeLimitResponse(retryAfter: number, kind: "IP" | "user"): Response {
  return new Response(
    JSON.stringify({
      error: "Trop de requêtes. Réessayez dans quelques instants.",
      code: "RATE_LIMIT_EXCEEDED",
      scope: kind,
      retry_after_seconds: retryAfter,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    },
  );
}
