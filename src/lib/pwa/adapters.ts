// Phase 5 — Préparation PWA (interfaces uniquement, AUCUNE logique offline).
// Ces contrats seront implémentés lors de la Phase 8 (PWA offline + sync).
// Objectif ici : figer la surface d'API pour brancher plus tard :
//   • IndexedDB (persistance locale)
//   • Cache offline (lecture hors ligne)
//   • Sync queue (rejeu des mutations quand le réseau revient)
//   • Background Sync (déclenché par le Service Worker)

/** Adapter clé/valeur persistant. Implémentation cible : IndexedDB via idb-keyval. */
export interface IndexedDBAdapter {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(namespace?: string): Promise<void>;
  keys(namespace?: string): Promise<string[]>;
}

/** Cache de lecture pour les requêtes Repository (mode hors ligne). */
export interface OfflineCacheAdapter {
  read<T = unknown>(scope: string, key: string): Promise<T | null>;
  write<T = unknown>(scope: string, key: string, value: T, ttlMs?: number): Promise<void>;
  invalidate(scope: string, key?: string): Promise<void>;
  isFresh(scope: string, key: string): Promise<boolean>;
}

export type QueuedMutationKind = "insert" | "update" | "delete" | "upsert" | "storage.upload" | "storage.delete";

export interface QueuedMutation {
  id: string;
  kind: QueuedMutationKind;
  target: string;                     // ex: "clients", "storage://logos/xxx"
  payload: unknown;
  attempts: number;
  created_at: string;
  last_error?: string;
}

/** File d'attente pour rejouer les mutations quand la connexion revient. */
export interface SyncQueueInterface {
  enqueue(m: Omit<QueuedMutation, "id" | "attempts" | "created_at">): Promise<string>;
  list(): Promise<QueuedMutation[]>;
  drain(handler: (m: QueuedMutation) => Promise<void>): Promise<{ ok: number; failed: number }>;
  clear(): Promise<void>;
}

/** Wrapper autour de l'API Background Sync du Service Worker. */
export interface BackgroundSyncInterface {
  register(tag: string): Promise<void>;
  isSupported(): boolean;
  onSync?: (tag: string, handler: () => Promise<void>) => void;
}

/** Registre unique, non initialisé — sera peuplé en Phase 8. */
export const PWA_ADAPTERS: {
  indexedDB: IndexedDBAdapter | null;
  offlineCache: OfflineCacheAdapter | null;
  syncQueue: SyncQueueInterface | null;
  backgroundSync: BackgroundSyncInterface | null;
} = {
  indexedDB: null,
  offlineCache: null,
  syncQueue: null,
  backgroundSync: null,
};
