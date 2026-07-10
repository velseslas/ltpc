// Phase 7.5 (C3) + Phase 8 — Wrapper d'enregistrement du Service Worker.
//
// Contraintes appliquées :
//   • Ne jamais enregistrer en dev (import.meta.env.PROD)
//   • Ne jamais enregistrer dans une iframe (Lovable preview)
//   • Ne jamais enregistrer sur un host de preview Lovable
//   • Ne jamais enregistrer hors HTTPS (sauf localhost)
//   • Kill-switch `?sw=off` — désenregistre les SW existants
//   • Hooks de mise à jour exposés (onUpdateAvailable / onControllerChange)
//   • SKIP_WAITING piloté par l'utilisateur (jamais de MAJ silencieuse)

export interface ServiceWorkerHooks {
  onReady?: (registration: ServiceWorkerRegistration) => void;
  onUpdateAvailable?: (registration: ServiceWorkerRegistration) => void;
  onControllerChange?: () => void;
  onError?: (error: unknown) => void;
}

const SW_URL = "/sw.js";

// --- Contexte -------------------------------------------------------------
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
  try { return typeof window !== "undefined" && window.self !== window.top; }
  catch { return true; }
}
function isSecureContextOrLocalhost(): boolean {
  if (typeof window === "undefined") return false;
  if (window.isSecureContext) return true;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "::1";
}
function hasKillSwitch(): boolean {
  if (typeof window === "undefined") return false;
  try { return new URLSearchParams(window.location.search).get("sw") === "off"; }
  catch { return false; }
}
async function unregisterAll(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
  } catch { /* noop */ }
}
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

// --- Bus d'événements -----------------------------------------------------
type UpdateListener = (reg: ServiceWorkerRegistration) => void;
type ControllerListener = () => void;

const updateListeners = new Set<UpdateListener>();
const controllerListeners = new Set<ControllerListener>();
let currentRegistration: ServiceWorkerRegistration | null = null;

export function onUpdateAvailable(l: UpdateListener): () => void {
  updateListeners.add(l);
  // Si déjà connu, notifier immédiatement.
  if (currentRegistration?.waiting) l(currentRegistration);
  return () => { updateListeners.delete(l); };
}
export function onControllerChange(l: ControllerListener): () => void {
  controllerListeners.add(l);
  return () => { controllerListeners.delete(l); };
}
export function getCurrentRegistration(): ServiceWorkerRegistration | null {
  return currentRegistration;
}
export async function applyPendingUpdate(): Promise<void> {
  const waiting = currentRegistration?.waiting;
  if (!waiting) return;
  try { waiting.postMessage({ type: "SKIP_WAITING" }); } catch { /* noop */ }
}

function notifyUpdate(reg: ServiceWorkerRegistration): void {
  updateListeners.forEach((l) => { try { l(reg); } catch { /* noop */ } });
}
function notifyController(): void {
  controllerListeners.forEach((l) => { try { l(); } catch { /* noop */ } });
}

// --- Enregistrement -------------------------------------------------------
export async function registerServiceWorker(hooks: ServiceWorkerHooks = {}): Promise<ServiceWorkerRegistration | null> {
  if (hasKillSwitch() || isPreviewHost() || isInIframe() || !import.meta.env.PROD) {
    await unregisterAll();
    return null;
  }
  if (!canRegisterServiceWorker()) return null;

  // Vérifie que le fichier existe avant d'enregistrer.
  try {
    const head = await fetch(SW_URL, { method: "HEAD" });
    if (!head.ok) return null;
  } catch { return null; }

  try {
    const registration = await navigator.serviceWorker.register(SW_URL, { scope: "/" });
    currentRegistration = registration;

    const handleUpdate = () => {
      notifyUpdate(registration);
      hooks.onUpdateAvailable?.(registration);
    };

    // Si un worker est déjà en attente (rechargement après build), notifier.
    if (registration.waiting && navigator.serviceWorker.controller) {
      handleUpdate();
    }

    registration.addEventListener("updatefound", () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener("statechange", () => {
        if (installing.state === "installed" && navigator.serviceWorker.controller) {
          handleUpdate();
        }
      });
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      notifyController();
      hooks.onControllerChange?.();
    });

    hooks.onReady?.(registration);
    return registration;
  } catch (err) {
    hooks.onError?.(err);
    return null;
  }
}

export async function unregisterServiceWorker(): Promise<void> {
  await unregisterAll();
}
