// Phase 8 — Detection en ligne / hors ligne + drain automatique de la file
// de synchronisation au retour de la connexion.
import { useEffect, useState } from "react";
import { drainSyncQueue } from "./syncQueue";
import { indexedDBAdapter } from "./indexedDB";

type Listener = (online: boolean) => void;
const listeners = new Set<Listener>();
let bound = false;
const LAST_SYNC_KEY = "meta:last_sync_at";

function isOnlineNow(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

function bindOnce(): void {
  if (bound || typeof window === "undefined") return;
  bound = true;
  window.addEventListener("online", async () => {
    listeners.forEach((l) => { try { l(true); } catch { /* noop */ } });
    try {
      const res = await drainSyncQueue();
      await indexedDBAdapter.set(LAST_SYNC_KEY, {
        at: new Date().toISOString(),
        ok: res.ok, failed: res.failed,
      });
    } catch { /* noop */ }
  });
  window.addEventListener("offline", () => {
    listeners.forEach((l) => { try { l(false); } catch { /* noop */ } });
  });
}

export function subscribeNetworkStatus(l: Listener): () => void {
  bindOnce();
  listeners.add(l);
  return () => { listeners.delete(l); };
}

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(isOnlineNow());
  useEffect(() => subscribeNetworkStatus(setOnline), []);
  return online;
}

export async function getLastSyncInfo(): Promise<{ at: string; ok: number; failed: number } | null> {
  return (await indexedDBAdapter.get<{ at: string; ok: number; failed: number }>(LAST_SYNC_KEY)) ?? null;
}
