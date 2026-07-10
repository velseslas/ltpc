// Phase 8 — ConflictResolver : politique Last-Write-Wins configurable.
// Journalise les conflits pour analyse ultérieure. Aucune UI pour l'instant
// (la résolution utilisateur sera ajoutée dans une phase dédiée).
import { indexedDBAdapter } from "./indexedDB";

export type ConflictStrategy = "last-write-wins" | "keep-local" | "keep-remote" | "manual";

export interface ConflictRecord {
  id: string;
  scope: string;
  key: string;
  local_updated_at?: string | number;
  remote_updated_at?: string | number;
  resolved: "local" | "remote" | "pending";
  strategy: ConflictStrategy;
  logged_at: string;
}

const LOG_KEY = "conflicts:log:v1";
let strategy: ConflictStrategy = "last-write-wins";

export function setConflictStrategy(s: ConflictStrategy): void { strategy = s; }
export function getConflictStrategy(): ConflictStrategy { return strategy; }

function ts(v?: string | number): number {
  if (v === undefined) return 0;
  if (typeof v === "number") return v;
  const n = Date.parse(v);
  return Number.isFinite(n) ? n : 0;
}

/** Résout un conflit selon la stratégie active et journalise le résultat. */
export async function resolveConflict<T>(input: {
  scope: string;
  key: string;
  local: T;
  remote: T;
  localUpdatedAt?: string | number;
  remoteUpdatedAt?: string | number;
}): Promise<{ value: T; picked: "local" | "remote" | "pending" }> {
  let picked: "local" | "remote" | "pending";
  switch (strategy) {
    case "keep-local":  picked = "local";  break;
    case "keep-remote": picked = "remote"; break;
    case "manual":      picked = "pending"; break;
    case "last-write-wins":
    default:
      picked = ts(input.localUpdatedAt) >= ts(input.remoteUpdatedAt) ? "local" : "remote";
      break;
  }
  await logConflict({
    id: (crypto.randomUUID?.() ?? `${Date.now()}`),
    scope: input.scope,
    key: input.key,
    local_updated_at: input.localUpdatedAt,
    remote_updated_at: input.remoteUpdatedAt,
    resolved: picked,
    strategy,
    logged_at: new Date().toISOString(),
  });
  return { value: picked === "local" ? input.local : input.remote, picked };
}

async function logConflict(rec: ConflictRecord): Promise<void> {
  const list = (await indexedDBAdapter.get<ConflictRecord[]>(LOG_KEY)) ?? [];
  list.push(rec);
  // Garde les 200 dernières entrées
  const trimmed = list.slice(-200);
  await indexedDBAdapter.set(LOG_KEY, trimmed);
}

export async function readConflictLog(): Promise<ConflictRecord[]> {
  return (await indexedDBAdapter.get<ConflictRecord[]>(LOG_KEY)) ?? [];
}
export async function clearConflictLog(): Promise<void> {
  await indexedDBAdapter.delete(LOG_KEY);
}
