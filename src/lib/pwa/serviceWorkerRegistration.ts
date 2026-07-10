// Phase 7.5 — C3 : Wrapper d'enregistrement du futur Service Worker.
//
// ⚠️ INFRASTRUCTURE UNIQUEMENT — aucun cache, aucun fetch handler, aucune logique
// offline. Le Service Worker lui-même (`public/sw.js`) sera créé en Phase 8.
//
// Contraintes appliquées :
//   • Ne jamais enregistrer en dev (import.meta.env.PROD)
//   • Ne jamais enregistrer dans une iframe (Lovable preview)
//   • Ne jamais enregistrer sur un host de preview Lovable
//   • Ne jamais enregistrer hors HTTPS (sauf localhost)
//   • Kill-switch `?sw=off` — désenregistre les SW existants
//   • Hooks de mise à jour exposés (onUpdateAvailable / onControllerChange)

export interface ServiceWorkerHooks {
  onReady?: (registration: ServiceWorkerRegistration) => void;
  onUpdateAvailable?: (registration: ServiceWorkerRegistration) => void;
  onControllerChange?: () => void;
  onError?: (error: unknown) => void;
}

const SW_URL = "/sw.js";

function isPreviewHost(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return (
    h.startsWith("id-preview--") ||
    h.startsWith("preview--") ||
    h === "lovableproject.com" ||
    h.endsWith(".lovableproject.com") ||
    h === "lovableproject-dev.com" ||
    h.endsWith(".lovableproject-dev.com") ||
    h === "beta.lovable.dev" ||
    h.endsWith(".beta.lovable.dev")
  );
}

function isInIframe(): boolean {
  try {
    return typeof window !== "undefined" && window.self !== window.top;
  } catch {
    return true;
  }
}

function isSecureContextOrLocalhost(): boolean {
  if (typeof window === "undefined") return false;
  if (window.isSecureContext) return true;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "::1";
}

function hasKillSwitch(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("sw") === "off";
  } catch {
    return false;
  }
}

async function unregisterAll(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
  } catch {
    /* noop */
  }
}

/**
 * Détermine si l'enregistrement est autorisé dans le contexte courant.
 * Exposé pour les tests / diagnostics.
 */
export function canRegisterServiceWorker(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!import.meta.env.PROD) return false;
  if (isInIframe()) return false;
  if (isPreviewHost()) return false;
  if (!isSecureContextOrLocalhost()) return false;
  if (hasKillSwitch()) return false;
  return true;
}

/**
 * Point d'entrée unique. À appeler depuis `main.tsx`.
 * Aucune régression possible : refuse silencieusement dans tous les contextes non-prod.
 */
export async function registerServiceWorker(hooks: ServiceWorkerHooks = {}): Promise<ServiceWorkerRegistration | null> {
  // Kill-switch ou contexte interdit → désenregistrer tout SW existant.
  if (hasKillSwitch() || isPreviewHost() || isInIframe() || !import.meta.env.PROD) {
    await unregisterAll();
    return null;
  }
  if (!canRegisterServiceWorker()) return null;

  // Vérifie que le fichier existe avant d'enregistrer (évite les 404 bruyants en Phase 7.5).
  try {
    const head = await fetch(SW_URL, { method: "HEAD" });
    if (!head.ok) return null;
  } catch {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_URL, { scope: "/" });

    // Hook : mise à jour disponible
    registration.addEventListener("updatefound", () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener("statechange", () => {
        if (installing.state === "installed" && navigator.serviceWorker.controller) {
          hooks.onUpdateAvailable?.(registration);
        }
      });
    });

    // Hook : nouveau controller (post-skipWaiting)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      hooks.onControllerChange?.();
    });

    hooks.onReady?.(registration);
    return registration;
  } catch (err) {
    hooks.onError?.(err);
    return null;
  }
}

/** Utilitaire manuel — désenregistre tous les SW du site. */
export async function unregisterServiceWorker(): Promise<void> {
  await unregisterAll();
}
