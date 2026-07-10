// Phase 8 — Écran Debug PWA (accessible via /debug/pwa).
// Affiche l'état du Service Worker, du cache, d'IndexedDB, de la Sync Queue,
// du réseau et de la dernière synchronisation. Aucune action destructive
// silencieuse : boutons explicites.
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { indexedDBAdapter } from "@/lib/pwa/indexedDB";
import { syncQueue, drainSyncQueue } from "@/lib/pwa/syncQueue";
import { getLastSyncInfo, useOnlineStatus } from "@/lib/pwa/networkStatus";
import { applyPendingUpdate, getCurrentRegistration } from "@/lib/pwa/serviceWorkerRegistration";
import { readConflictLog, clearConflictLog, getConflictStrategy } from "@/lib/pwa/conflictResolver";
import { permissionManager, pushManager } from "@/lib/pwa/pushManager";

async function computeCacheSize(): Promise<{ caches: string[]; totalEntries: number; estimateBytes: number | null }> {
  const out = { caches: [] as string[], totalEntries: 0, estimateBytes: null as number | null };
  if (typeof caches !== "undefined") {
    try {
      const names = await caches.keys();
      out.caches = names;
      for (const n of names) {
        const c = await caches.open(n);
        const keys = await c.keys();
        out.totalEntries += keys.length;
      }
    } catch { /* noop */ }
  }
  if (typeof navigator !== "undefined" && "storage" in navigator && navigator.storage.estimate) {
    try {
      const est = await navigator.storage.estimate();
      out.estimateBytes = est.usage ?? null;
    } catch { /* noop */ }
  }
  return out;
}

function fmtBytes(n: number | null): string {
  if (n == null) return "n/a";
  if (n < 1024) return `${n} o`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} Ko`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} Mo`;
  return `${(n / 1024 ** 3).toFixed(2)} Go`;
}

export default function DebugPWA() {
  const online = useOnlineStatus();
  const [swInfo, setSwInfo] = useState<{ scope: string; state: string; waiting: boolean; installing: boolean } | null>(null);
  const [cacheInfo, setCacheInfo] = useState<{ caches: string[]; totalEntries: number; estimateBytes: number | null } | null>(null);
  const [idbKeys, setIdbKeys] = useState<string[]>([]);
  const [queueLen, setQueueLen] = useState<number>(0);
  const [lastSync, setLastSync] = useState<{ at: string; ok: number; failed: number } | null>(null);
  const [conflicts, setConflicts] = useState<number>(0);
  const [notifPerm, setNotifPerm] = useState<string>("unknown");
  const [pushSub, setPushSub] = useState<boolean>(false);

  const refresh = useMemo(() => async () => {
    const reg = getCurrentRegistration();
    setSwInfo(reg ? {
      scope: reg.scope,
      state: reg.active?.state ?? "n/a",
      waiting: !!reg.waiting,
      installing: !!reg.installing,
    } : null);
    setCacheInfo(await computeCacheSize());
    setIdbKeys(await indexedDBAdapter.keys());
    setQueueLen((await syncQueue.list()).length);
    setLastSync(await getLastSyncInfo());
    setConflicts((await readConflictLog()).length);
    setNotifPerm(permissionManager.current());
    setPushSub(!!(await pushManager.getSubscription()));
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const version = (import.meta.env.MODE === "production" ? "prod" : import.meta.env.MODE);

  return (
    <div className="container mx-auto p-6 space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Debug PWA</h1>
        <div className="flex gap-2">
          <Badge variant={online ? "default" : "destructive"}>{online ? "Online" : "Offline"}</Badge>
          <Badge variant="outline">Mode : {version}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Service Worker</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          {swInfo ? (
            <>
              <div>Scope : <code>{swInfo.scope}</code></div>
              <div>État : <code>{swInfo.state}</code></div>
              <div>En attente : {swInfo.waiting ? "oui" : "non"}</div>
              <div>Installation : {swInfo.installing ? "oui" : "non"}</div>
              {swInfo.waiting && (
                <Button size="sm" onClick={() => applyPendingUpdate()}>Appliquer la mise à jour</Button>
              )}
            </>
          ) : <div className="text-muted-foreground">Aucun Service Worker enregistré (dev / preview / non installé).</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Caches HTTP</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          <div>Nombre de caches : {cacheInfo?.caches.length ?? 0}</div>
          <div>Entrées totales : {cacheInfo?.totalEntries ?? 0}</div>
          <div>Taille estimée : {fmtBytes(cacheInfo?.estimateBytes ?? null)}</div>
          <ul className="list-disc pl-6 text-muted-foreground">
            {cacheInfo?.caches.map((n) => <li key={n}><code>{n}</code></li>)}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>IndexedDB</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <div>Clés stockées : {idbKeys.length}</div>
          <details><summary className="cursor-pointer">Voir les clés</summary>
            <pre className="mt-2 text-xs bg-muted p-2 rounded max-h-64 overflow-auto">{idbKeys.join("\n")}</pre>
          </details>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Sync Queue</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <div>Mutations en attente : {queueLen}</div>
          <div>Dernière synchronisation : {lastSync ? `${new Date(lastSync.at).toLocaleString()} · ok=${lastSync.ok} · échecs=${lastSync.failed}` : "jamais"}</div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={async () => { await drainSyncQueue(); await refresh(); }}>Forcer la synchronisation</Button>
            <Button size="sm" variant="ghost" onClick={async () => { await syncQueue.clear(); await refresh(); }}>Vider la file</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Conflits</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <div>Stratégie : <code>{getConflictStrategy()}</code></div>
          <div>Conflits journalisés : {conflicts}</div>
          <Button size="sm" variant="ghost" onClick={async () => { await clearConflictLog(); await refresh(); }}>Effacer le journal</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notifications / Push (Phase 9)</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <div>Permission : <code>{notifPerm}</code></div>
          <div>Souscription Push : {pushSub ? "active" : "aucune"}</div>
          <div className="text-muted-foreground text-xs">L'activation des notifications sera livrée en Phase 9.</div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="sm" onClick={() => refresh()}>Rafraîchir</Button>
      </div>
    </div>
  );
}
