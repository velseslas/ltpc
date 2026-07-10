// Phase 8 — SyncQueue : file d'attente persistante (IndexedDB) pour rejouer
// les mutations effectuées hors connexion (repository CRUD + storage).
// Drain automatique au retour de la connexion (voir networkStatus.ts).
import { indexedDBAdapter } from "./indexedDB";
import type { QueuedMutation, SyncQueueInterface } from "./adapters";

const QKEY = "sync:queue:v1";

function uid(): string {
  return (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

async function load(): Promise<QueuedMutation[]> {
  return (await indexedDBAdapter.get<QueuedMutation[]>(QKEY)) ?? [];
}
async function save(list: QueuedMutation[]): Promise<void> {
  await indexedDBAdapter.set(QKEY, list);
}

export const syncQueue: SyncQueueInterface = {
  async enqueue(m) {
    const list = await load();
    const item: QueuedMutation = {
      ...m,
      id: uid(),
      attempts: 0,
      created_at: new Date().toISOString(),
    };
    list.push(item);
    await save(list);
    return item.id;
  },
  async list() { return load(); },
  async drain(handler) {
    const list = await load();
    if (list.length === 0) return { ok: 0, failed: 0 };
    const remaining: QueuedMutation[] = [];
    let ok = 0, failed = 0;
    for (const item of list) {
      try {
        await handler(item);
        ok++;
      } catch (err) {
        failed++;
        remaining.push({
          ...item,
          attempts: item.attempts + 1,
          last_error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    await save(remaining);
    return { ok, failed };
  },
  async clear() { await indexedDBAdapter.delete(QKEY); },
};

/** Handler par défaut — no-op sûr. Les Repository pourront s'y brancher plus tard
 *  sans risque de régression : tant qu'aucun handler n'est enregistré, le drain
 *  est un no-op et la queue reste stable. */
type DrainHandler = (m: QueuedMutation) => Promise<void>;
let handler: DrainHandler | null = null;
export function registerSyncHandler(h: DrainHandler | null): void { handler = h; }
export async function drainSyncQueue(): Promise<{ ok: number; failed: number }> {
  if (!handler) return { ok: 0, failed: 0 };
  return syncQueue.drain(handler);
}
