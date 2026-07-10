// Phase 8 — OfflineCacheAdapter : cache clé/valeur scoppé avec TTL, stocké
// dans IndexedDB. Utilisé pour rendre les listes lisibles hors ligne.
import { indexedDBAdapter } from "./indexedDB";
import type { OfflineCacheAdapter } from "./adapters";

interface Entry<T> { v: T; e: number | null; t: number }

function key(scope: string, k: string) { return `cache:${scope}:${k}`; }

export const offlineCache: OfflineCacheAdapter = {
  async read<T = unknown>(scope: string, k: string): Promise<T | null> {
    const raw = await indexedDBAdapter.get<Entry<T>>(key(scope, k));
    if (!raw) return null;
    if (raw.e && Date.now() > raw.e) { await indexedDBAdapter.delete(key(scope, k)); return null; }
    return raw.v;
  },
  async write<T = unknown>(scope: string, k: string, value: T, ttlMs?: number): Promise<void> {
    const now = Date.now();
    await indexedDBAdapter.set<Entry<T>>(key(scope, k), {
      v: value,
      e: ttlMs && ttlMs > 0 ? now + ttlMs : null,
      t: now,
    });
  },
  async invalidate(scope: string, k?: string): Promise<void> {
    if (k) { await indexedDBAdapter.delete(key(scope, k)); return; }
    const all = await indexedDBAdapter.keys();
    const prefix = `cache:${scope}:`;
    await Promise.all(all.filter((x) => x.startsWith(prefix)).map((x) => indexedDBAdapter.delete(x)));
  },
  async isFresh(scope: string, k: string): Promise<boolean> {
    const raw = await indexedDBAdapter.get<Entry<unknown>>(key(scope, k));
    if (!raw) return false;
    if (!raw.e) return true;
    return Date.now() <= raw.e;
  },
};
