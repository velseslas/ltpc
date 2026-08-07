// Phase 9 / LOT 14.2 — Service Push Web (WebPush API).
// La clé publique VAPID provient de `./vapid` (override possible via
// VITE_VAPID_PUBLIC_KEY). La clé privée n'est JAMAIS référencée ici.
import { supabase as _supabase } from "@/integrations/supabase/client";
import { VAPID_PUBLIC_KEY as CONFIGURED_VAPID_PUBLIC_KEY } from "./vapid";
const supabase = _supabase as unknown as { from: (t: string) => any; auth: typeof _supabase.auth };

const VAPID_PUBLIC_KEY: string | undefined = CONFIGURED_VAPID_PUBLIC_KEY || undefined;


function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function detectPlatform(): string {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Windows/i.test(ua)) return "windows";
  if (/Mac OS/i.test(ua)) return "macos";
  return "web";
}

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

  async requestPermission(): Promise<NotificationPermission | "unsupported"> {
    if (!this.isSupported()) return "unsupported";
    try { return await Notification.requestPermission(); }
    catch { return "denied"; }
  },

  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.isSupported()) return null;
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      return (await reg?.pushManager.getSubscription()) ?? null;
    } catch { return null; }
  },

  /** Souscrit et enregistre côté serveur. Nécessite la clé publique VAPID. */
  async subscribe(): Promise<{ ok: boolean; reason?: string; subscription?: PushSubscription }> {
    if (!this.isSupported()) return { ok: false, reason: "unsupported" };
    if (!VAPID_PUBLIC_KEY) return { ok: false, reason: "vapid-missing" };
    const perm = await this.requestPermission();
    if (perm !== "granted") return { ok: false, reason: "permission-denied" };
    try {
      // Attend que le Service Worker soit réellement prêt (PWA fraîchement installée).
      const reg = (await navigator.serviceWorker.getRegistration())
        ?? (await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<undefined>((r) => setTimeout(() => r(undefined), 8000)),
        ]));
      if (!reg) return { ok: false, reason: "no-sw" };

      const existing = await reg.pushManager.getSubscription();
      const key = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer,
      });
      await this.registerSubscription(sub);
      return { ok: true, subscription: sub };
    } catch (e) {
      console.warn("[PushService] subscribe failed", e);
      return { ok: false, reason: "error" };
    }
  },

  async unsubscribe(): Promise<boolean> {
    const sub = await this.getSubscription();
    if (!sub) return true;
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        await supabase.from("push_subscriptions").delete()
          .eq("user_id", auth.user.id).eq("endpoint", sub.endpoint);
      }
      return await sub.unsubscribe();
    } catch { return false; }
  },

  async registerSubscription(sub: PushSubscription): Promise<void> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const raw = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    if (!raw.endpoint || !raw.keys?.p256dh || !raw.keys?.auth) return;
    await supabase.from("push_subscriptions").upsert({
      user_id: auth.user.id,
      endpoint: raw.endpoint,
      p256dh: raw.keys.p256dh,
      auth: raw.keys.auth,
      user_agent: navigator.userAgent,
      platform: detectPlatform(),
      is_active: true,
      last_used_at: new Date().toISOString(),
    }, { onConflict: "user_id,endpoint" });
  },
};
