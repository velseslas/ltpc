import { useEffect, useState } from "react";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PushService } from "@/lib/notifications/PushService";
import { NotificationRepository } from "@/lib/notifications/NotificationRepository";
import { NotificationService } from "@/lib/notifications/NotificationService";

export default function DebugNotifications() {
  const [permission, setPermission] = useState<string>("...");
  const [sub, setSub]               = useState<PushSubscription | null>(null);
  const [total, setTotal]           = useState(0);
  const [unread, setUnread]         = useState(0);
  const [lastError, setLastError]   = useState<string | null>(null);

  const refresh = async () => {
    try {
      setPermission(String(PushService.currentPermission()));
      setSub(await PushService.getSubscription());
      const items = await NotificationRepository.list({ limit: 1000 });
      setTotal(items.length);
      setUnread(items.filter((i) => !i.is_read).length);
    } catch (e) { setLastError(e instanceof Error ? e.message : String(e)); }
  };

  useEffect(() => { refresh(); }, []);

  const sendTest = async (priority: "info" | "success" | "warning" | "urgent" | "critical") => {
    await NotificationService.emit({
      type: "debug_test",
      priority,
      category: "systeme",
      title: `Notification de test (${priority})`,
      message: "Envoyée depuis Debug Notifications",
      source: "system",
    });
    refresh();
  };

  return (
    <>
      <AppBreadcrumb items={[{ label: "Debug" }, { label: "Notifications" }]} />
      <h1 className="text-3xl font-display font-bold mb-6">
        Debug <span className="text-primary text-glow">Notifications</span>
      </h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>État général</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Support Push</span><Badge variant={PushService.isSupported() ? "default" : "destructive"}>{String(PushService.isSupported())}</Badge></div>
            <div className="flex justify-between"><span>Clé VAPID</span><Badge variant={PushService.hasVapidKey() ? "default" : "outline"}>{PushService.hasVapidKey() ? "présente" : "absente"}</Badge></div>
            <div className="flex justify-between"><span>Permission</span><Badge>{permission}</Badge></div>
            <div className="flex justify-between"><span>Push actif</span><Badge variant={sub ? "default" : "outline"}>{sub ? "oui" : "non"}</Badge></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Historique</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Total</span><Badge>{total}</Badge></div>
            <div className="flex justify-between"><span>Non lues</span><Badge variant="destructive">{unread}</Badge></div>
            {lastError && <div className="text-red-500 text-xs">Erreur : {lastError}</div>}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Envoyer un test</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(["info","success","warning","urgent","critical"] as const).map((p) => (
              <Button key={p} variant="outline" size="sm" onClick={() => sendTest(p)}>Test {p}</Button>
            ))}
            <Button onClick={refresh} size="sm" className="ml-auto">Rafraîchir</Button>
          </CardContent>
        </Card>

        {sub && (
          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Abonnement Push</CardTitle></CardHeader>
            <CardContent><pre className="text-xs overflow-auto bg-muted/30 p-3 rounded">{JSON.stringify(sub.toJSON(), null, 2)}</pre></CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
