// Phase 9 / LOT 14.2 — Service Push Web (WebPush API).
// La clé publique VAPID provient de `./vapid` (override possible via
// VITE_VAPID_PUBLIC_KEY). La clé privée n'est JAMAIS référencée ici.
//
// LOT 14.2 (correction finale) :
//   • attente réelle du Service Worker (`navigator.serviceWorker.ready`) ;
//   • réutilisation de l'abonnement existant (jamais de subscribe inutile) ;
//   • raisons d'erreur explicites (jamais « permission » pour une erreur technique) ;
//   • déduplication par endpoint/appareil, multi-appareils préservé.
import { supabase as _supabase } from "@/integrations/supabase/client";
import { VAPID_PUBLIC_KEY as CONFIGURED_VAPID_PUBLIC_KEY } from "./vapid";
const supabase = _supabase as unknown as { from: (t: string) => any; auth: typeof _supabase.auth };

const VAPID_PUBLIC_KEY: string | undefined = CONFIGURED_VAPID_PUBLIC_KEY || undefined;

/** Délai max d'attente du Service Worker (démarrage à froid de la PWA). */
const SW_READY_TIMEOUT_MS = 10_000;

export type PushFailureReason =
  | "unsupported"
  | "vapid-missing"
  | "permission-denied"
  | "permission-default"
  | "sw-unavailable"
  | "subscribe-failed";

export interface PushState {
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  swReady: boolean;
  /** Une registration existe mais son worker est encore `installing`/`waiting`
   *  (mise à jour normale du SW) — ce n'est PAS une indisponibilité. */
  swUpdating: boolean;
  subscribed: boolean;
  subscription: PushSubscription | null;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function applicationServerKeyBuffer(): ArrayBuffer {
  const key = urlBase64ToUint8Array(VAPID_PUBLIC_KEY as string);
  return key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer;
}

/** Compare la clé serveur d'un abonnement existant à la clé VAPID courante. */
function matchesCurrentVapidKey(sub: PushSubscription): boolean {
  try {
    const existing = sub.options?.applicationServerKey;
    if (!existing) return true; // information indisponible → on ne casse rien
    const current = new Uint8Array(applicationServerKeyBuffer());
    const bytes = new Uint8Array(existing as ArrayBuffer);
    if (bytes.length !== current.length) return false;
    for (let i = 0; i < bytes.length; i++) if (bytes[i] !== current[i]) return false;
    return true;
  } catch {
    return true;
  }
}

function detectPlatform(): string {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Windows/i.test(ua)) return "windows";
  if (/Mac OS/i.test(ua)) return "macos";
  return "web";
}

/**
 * LOT 14.2 (AbortError) — verrou d'activation.
 * Chrome/Android lève `AbortError` lorsqu'un `subscribe()` est demandé alors
 * qu'une opération pushManager (subscribe/unsubscribe) est déjà en cours sur la
 * même registration. Les paires d'abonnements créées à 1–3 s d'intervalle en
 * base prouvent ces appels concurrents. Un seul flux d'activation à la fois.
 */
let inFlight: Promise<SubscribeResult> | null = null;

export interface SubscribeResult {
  ok: boolean;
  reason?: PushFailureReason;
  detail?: string;
  subscription?: PushSubscription;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const PushService = {
  isSupported(): boolean {
    return typeof window !== "undefined"
      && "serviceWorker" in navigator
      && "PushManager" in window
      && "Notification" in window;
  },

  hasVapidKey(): boolean { return !!VAPID_PUBLIC_KEY; },

  currentPermission(): NotificationPermission | "unsupported" {
    if (!this.isSupported()) return "unsupported";
    return Notification.permission;
  },

  /** Contexte permettant réellement d'enregistrer un Service Worker. */
  swContext(): { ok: boolean; detail: string } {
    if (typeof window === "undefined") return { ok: false, detail: "no-window" };
    if (!("serviceWorker" in navigator)) return { ok: false, detail: "no-sw-api" };
    try { if (window.self !== window.top) return { ok: false, detail: "iframe" }; }
    catch { return { ok: false, detail: "iframe" }; }
    if (!window.isSecureContext) return { ok: false, detail: "insecure-context" };
    return { ok: true, detail: "ok" };
  },

  /** Attend l'activation d'un worker donné (ou expire). */
  async awaitActivation(worker: ServiceWorker | null, timeoutMs: number): Promise<void> {
    if (!worker || worker.state === "activated") return;
    await new Promise<void>((resolve) => {
      const done = () => { worker.removeEventListener("statechange", onChange); resolve(); };
      const onChange = () => { if (worker.state === "activated" || worker.state === "redundant") done(); };
      worker.addEventListener("statechange", onChange);
      setTimeout(done, timeoutMs);
    });
  },

  /**
   * Enregistrement direct de `/sw.js` (récupération). Utilisé quand aucune
   * registration exploitable n'existe : PWA fraîchement installée, worker
   * `redundant`, ou SW désenregistré par un passage en preview.
   */
  async forceRegister(timeoutMs: number = SW_READY_TIMEOUT_MS): Promise<ServiceWorkerRegistration | null> {
    if (!this.swContext().ok) return null;
    try {
      const head = await fetch("/sw.js", { method: "HEAD", cache: "no-store" });
      if (!head.ok) return null;
    } catch { return null; }
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await this.awaitActivation(reg.installing ?? reg.waiting ?? reg.active ?? null, timeoutMs);
      const fresh = (await navigator.serviceWorker.getRegistration()) ?? reg;
      return fresh;
    } catch {
      return null;
    }
  },

  /**
   * Attend que le Service Worker soit RÉELLEMENT prêt (démarrage à froid PWA).
   * `navigator.serviceWorker.ready` est la source de vérité ; `getRegistration()`
   * n'est qu'un raccourci quand la registration est déjà connue.
   */
  async readyRegistration(timeoutMs: number = SW_READY_TIMEOUT_MS): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) return null;
    try {
      let immediate = await navigator.serviceWorker.getRegistration();
      if (immediate?.active?.state === "activated") return immediate;

      // Registration inexploitable (aucun worker, ou worker `redundant`) :
      // `navigator.serviceWorker.ready` ne résoudrait jamais.
      const unusable = !immediate
        || (!immediate.installing && !immediate.waiting && (!immediate.active || immediate.active.state === "redundant"));

      if (unusable) {
        immediate = (await this.forceRegister(timeoutMs)) ?? undefined;
        if (!immediate) {
          try { immediate = await navigator.serviceWorker.getRegistration(); } catch { /* noop */ }
        }
        if (!immediate) return null;
        if (immediate.active?.state === "activated") return immediate;
      }

      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
      ]);
      return reg ?? immediate ?? null;
    } catch {
      return null;
    }
  },


  /**
   * Registration dont le worker est RÉELLEMENT `activated`.
   * Chrome lève `AbortError: … no active service worker` si `subscribe()` est
   * appelé sur une registration dont le worker est encore `installing`/`waiting`
   * (cas typique juste après une mise à jour du SW ou un démarrage à froid).
   */
  async activeRegistration(timeoutMs: number = SW_READY_TIMEOUT_MS): Promise<ServiceWorkerRegistration | null> {
    const reg = await this.readyRegistration(timeoutMs);
    if (reg?.active?.state === "activated") return reg;

    if (reg) {
      await this.awaitActivation(reg.installing ?? reg.waiting ?? reg.active ?? null, timeoutMs);
      try {
        const fresh = (await navigator.serviceWorker.getRegistration()) ?? reg;
        if (fresh.active?.state === "activated") return fresh;
      } catch { /* noop */ }
    }

    // Dernière chance : ré-enregistrement direct puis attente d'activation.
    const forced = await this.forceRegister(timeoutMs);
    if (forced?.active?.state === "activated") return forced;
    if (forced) {
      await this.awaitActivation(forced.installing ?? forced.waiting ?? forced.active ?? null, timeoutMs);
      try {
        const fresh = (await navigator.serviceWorker.getRegistration()) ?? forced;
        if (fresh.active?.state === "activated") return fresh;
      } catch { /* noop */ }
    }
    return null;
  },




  async requestPermission(): Promise<NotificationPermission | "unsupported"> {
    if (!this.isSupported()) return "unsupported";
    try { return await Notification.requestPermission(); }
    catch { return "denied"; }
  },

  /** Lecture non destructive de l'abonnement, après attente du SW. */
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.isSupported()) return null;
    const reg = await this.readyRegistration();
    if (!reg) return null;
    try {
      return (await reg.pushManager.getSubscription()) ?? null;
    } catch (e) {
      console.warn("[PushService] getSubscription failed", e);
      return null;
    }
  },

  /** État complet, utilisé par l'UI pour ne jamais confondre technique et permission. */
  async getState(): Promise<PushState> {
    const supported = this.isSupported();
    const permission = this.currentPermission();
    if (!supported) {
      return { supported, permission, swReady: false, swUpdating: false, subscribed: false, subscription: null };
    }
    // `navigator.serviceWorker.ready` reste la référence pour « worker actif ».
    const reg = await this.activeRegistration();

    // Tolérance aux mises à jour : si aucun worker `activated` n'est disponible,
    // une registration en cours d'installation/attente n'est PAS une absence de SW.
    let effective: ServiceWorkerRegistration | null = reg;
    let swUpdating = false;
    if (!reg) {
      let pending: ServiceWorkerRegistration | null = null;
      try { pending = (await navigator.serviceWorker.getRegistration()) ?? null; } catch { pending = null; }
      if (pending && (pending.installing || pending.waiting || pending.active)) {
        effective = pending;
        swUpdating = true;
      }
    }

    let subscription: PushSubscription | null = null;
    if (effective) {
      try { subscription = (await effective.pushManager.getSubscription()) ?? null; }
      catch { subscription = null; }
    }
    return {
      supported,
      permission,
      swReady: !!reg,
      swUpdating,
      subscribed: !!subscription,
      subscription,
    };
  },


  /**
   * Active le Push. Réutilise systématiquement l'abonnement existant.
   * Sérialisé par un verrou : un seul flux d'activation à la fois (AbortError).
   */
  async subscribe(): Promise<SubscribeResult> {
    if (inFlight) return inFlight;
    inFlight = this.subscribeInternal().finally(() => { inFlight = null; });
    return inFlight;
  },

  async subscribeInternal(): Promise<SubscribeResult> {
    if (!this.isSupported()) return { ok: false, reason: "unsupported" };
    if (!VAPID_PUBLIC_KEY) return { ok: false, reason: "vapid-missing" };

    // Service Worker d'abord : une indisponibilité SW n'est pas un refus de permission.
    // On exige un worker `activated` : sinon Chrome lève
    // « AbortError: … no active service worker ».
    let reg = await this.activeRegistration();
    if (!reg) {
      const ctx = this.swContext();
      const detail = ctx.ok ? "aucun Service Worker actif" : `contexte : ${ctx.detail}`;
      return { ok: false, reason: "sw-unavailable", detail };
    }

    // Abonnement déjà présent et compatible → réutilisation, aucun subscribe().
    let existing: PushSubscription | null = null;
    try { existing = (await reg.pushManager.getSubscription()) ?? null; } catch { existing = null; }

    if (existing && matchesCurrentVapidKey(existing)) {
      if (Notification.permission !== "granted") {
        return { ok: false, reason: Notification.permission === "denied" ? "permission-denied" : "permission-default" };
      }
      await this.registerSubscription(existing);
      return { ok: true, subscription: existing };
    }

    const perm = Notification.permission === "granted"
      ? "granted"
      : await this.requestPermission();
    if (perm !== "granted") {
      return { ok: false, reason: perm === "denied" ? "permission-denied" : "permission-default" };
    }

    // Abonnement présent mais lié à une ancienne clé VAPID → renouvellement propre.
    if (existing) {
      const staleEndpoint = existing.endpoint;
      try { await existing.unsubscribe(); } catch { /* noop */ }
      await this.deactivateEndpoint(staleEndpoint);
      // Laisse le push service libérer la registration avant un nouveau subscribe.
      await sleep(300);
    }

    // Une tentative + une reprise après nettoyage local : AbortError signifie que
    // la registration était encore occupée / sans worker actif.
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKeyBuffer(),
        });
        await this.registerSubscription(sub);
        return { ok: true, subscription: sub };
      } catch (e) {
        const name = e instanceof Error ? e.name : "Error";
        const message = e instanceof Error ? e.message : String(e);
        const detail = `${name}: ${message}`;
        console.error(`[PushService] pushManager.subscribe failed (tentative ${attempt}) —`, detail);
        const noActiveWorker = /no active service worker/i.test(message);
        const retryable = attempt === 1 && (name === "AbortError" || name === "InvalidStateError" || noActiveWorker);
        if (!retryable) {
          return {
            ok: false,
            reason: noActiveWorker ? "sw-unavailable" : "subscribe-failed",
            detail,
          };
        }

        // Nettoyage LOCAL uniquement (cet appareil) avant la seconde tentative.
        try {
          const stale = await reg.pushManager.getSubscription();
          if (stale) {
            const staleEndpoint = stale.endpoint;
            await stale.unsubscribe().catch(() => false);
            await this.deactivateEndpoint(staleEndpoint);
          }
        } catch { /* noop */ }

        await sleep(1000);
        // Re-acquisition : la registration a pu être remplacée par une mise à
        // jour du SW (ancienne registration devenue `redundant`).
        const fresh = await this.activeRegistration();
        if (!fresh) return { ok: false, reason: "sw-unavailable", detail };
        reg = fresh;
      }
    }

    return { ok: false, reason: "subscribe-failed", detail: "AbortError persistant après reprise" };
  },


  async unsubscribe(): Promise<boolean> {
    const sub = await this.getSubscription();
    if (!sub) return true;
    try {
      await this.deactivateEndpoint(sub.endpoint);
      return await sub.unsubscribe();
    } catch { return false; }
  },

  /** Désactive (jamais supprime) un endpoint devenu obsolète pour l'utilisateur courant. */
  async deactivateEndpoint(endpoint: string): Promise<void> {
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      await supabase.from("push_subscriptions")
        .update({ is_active: false })
        .eq("user_id", auth.user.id)
        .eq("endpoint", endpoint);
    } catch { /* noop */ }
  },

  async registerSubscription(sub: PushSubscription): Promise<void> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const raw = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    if (!raw.endpoint || !raw.keys?.p256dh || !raw.keys?.auth) return;

    const userAgent = navigator.userAgent;
    await supabase.from("push_subscriptions").upsert({
      user_id: auth.user.id,
      endpoint: raw.endpoint,
      p256dh: raw.keys.p256dh,
      auth: raw.keys.auth,
      user_agent: userAgent,
      platform: detectPlatform(),
      is_active: true,
      last_used_at: new Date().toISOString(),
    }, { onConflict: "user_id,endpoint" });

    // Déduplication CIBLÉE : uniquement les anciens endpoints du MÊME appareil
    // (même user_agent). Les autres appareils de l'utilisateur restent actifs.
    try {
      await supabase.from("push_subscriptions")
        .update({ is_active: false })
        .eq("user_id", auth.user.id)
        .eq("user_agent", userAgent)
        .eq("is_active", true)
        .neq("endpoint", raw.endpoint);
    } catch { /* noop */ }
  },
};
