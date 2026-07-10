// Phase 8 — Branche les adapters concrets dans PWA_ADAPTERS (Phase 5).
// Point d'entrée unique appelé depuis src/main.tsx.
import { PWA_ADAPTERS } from "./adapters";
import { indexedDBAdapter } from "./indexedDB";
import { offlineCache } from "./offlineCache";
import { syncQueue } from "./syncQueue";
import { subscribeNetworkStatus } from "./networkStatus";

let initialized = false;

export function initPWAAdapters(): void {
  if (initialized) return;
  initialized = true;

  PWA_ADAPTERS.indexedDB = indexedDBAdapter;
  PWA_ADAPTERS.offlineCache = offlineCache;
  PWA_ADAPTERS.syncQueue = syncQueue;
  PWA_ADAPTERS.backgroundSync = {
    register: async () => { /* Phase 9 */ },
    isSupported: () =>
      typeof self !== "undefined" &&
      "ServiceWorkerRegistration" in self &&
      "sync" in (self as unknown as { ServiceWorkerRegistration: { prototype: object } }).ServiceWorkerRegistration.prototype,
  };

  // Amorce l'écoute online/offline pour que le drain automatique fonctionne
  // même si aucun composant React n'appelle useOnlineStatus.
  subscribeNetworkStatus(() => { /* no-op, side effect : bind listeners */ });
}
