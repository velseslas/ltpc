// Phase 8 — IndexedDBAdapter : implémente le contrat défini en Phase 5.
// Repose sur idb-keyval (léger, sans schéma). Namespaces logiques via préfixe
// de clé "ns:key" — pas de stores multiples pour rester compatible avec le
// contrat existant.
//
// NE JAMAIS y stocker : JWT, refresh tokens, clés API, secrets.
import {
  clear as idbClear,
  createStore,
  del as idbDel,
  get as idbGet,
  keys as idbKeys,
  set as idbSet,
  type UseStore,
} from "idb-keyval";
import type { IndexedDBAdapter } from "./adapters";

const FORBIDDEN_KEY_PATTERNS = [/token/i, /jwt/i, /secret/i, /apikey/i, /api-key/i, /password/i];

function assertSafeKey(key: string): void {
  for (const re of FORBIDDEN_KEY_PATTERNS) {
    if (re.test(key)) {
      throw new Error(`[IndexedDBAdapter] Clé interdite (secret): ${key}`);
    }
  }
}

function buildKey(namespace: string | undefined, key: string): string {
  return namespace ? `${namespace}:${key}` : key;
}

function isSupported(): boolean {
  return typeof indexedDB !== "undefined";
}

let store: UseStore | null = null;
function getStore(): UseStore {
  if (!store) store = createStore("ltpc-pwa", "kv");
  return store;
}

class IndexedDBAdapterImpl implements IndexedDBAdapter {
  async get<T = unknown>(key: string): Promise<T | null> {
    if (!isSupported()) return null;
    try {
      const v = await idbGet<T>(key, getStore());
      return v ?? null;
    } catch {
      return null;
    }
  }

  async set<T = unknown>(key: string, value: T): Promise<void> {
    if (!isSupported()) return;
    assertSafeKey(key);
    try { await idbSet(key, value, getStore()); } catch { /* noop */ }
  }

  async delete(key: string): Promise<void> {
    if (!isSupported()) return;
    try { await idbDel(key, getStore()); } catch { /* noop */ }
  }

  async clear(namespace?: string): Promise<void> {
    if (!isSupported()) return;
    try {
      if (!namespace) { await idbClear(getStore()); return; }
      const all = await idbKeys(getStore());
      const prefix = `${namespace}:`;
      await Promise.all(
        all
          .filter((k): k is string => typeof k === "string" && k.startsWith(prefix))
          .map((k) => idbDel(k, getStore())),
      );
    } catch { /* noop */ }
  }

  async keys(namespace?: string): Promise<string[]> {
    if (!isSupported()) return [];
    try {
      const all = await idbKeys(getStore());
      const strKeys = all.filter((k): k is string => typeof k === "string");
      if (!namespace) return strKeys;
      const prefix = `${namespace}:`;
      return strKeys.filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length));
    } catch { return []; }
  }
}

export const indexedDBAdapter: IndexedDBAdapter = new IndexedDBAdapterImpl();

/** Helpers namespacés fortement typés — usage recommandé pour les caches applicatifs. */
export function ns(namespace: string) {
  return {
    get: <T = unknown>(key: string) => indexedDBAdapter.get<T>(buildKey(namespace, key)),
    set: <T = unknown>(key: string, value: T) => indexedDBAdapter.set<T>(buildKey(namespace, key), value),
    delete: (key: string) => indexedDBAdapter.delete(buildKey(namespace, key)),
    clear: () => indexedDBAdapter.clear(namespace),
    keys: () => indexedDBAdapter.keys(namespace),
  };
}

// Namespaces standardisés (utilisés par les hooks / services).
export const IDB_NAMESPACES = {
  preferences: "prefs",
  aiCache: "ai",
  searchCache: "search",
  chantiers: "chantiers",
  clients: "clients",
  materiels: "materiels",
  documents: "docs",
  syncQueue: "sync",
  meta: "meta",
} as const;
