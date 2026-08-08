// LOT 15.3 — Activation Push accessible à TOUS les utilisateurs connectés.
//
// Bloc compact affiché dans le menu utilisateur (Navbar). Il n'apporte AUCUNE
// nouvelle logique Push : il réutilise strictement `PushService` existant
// (VAPID, Service Worker, table `push_subscriptions`, RLS inchangés).
// Chaque utilisateur ne gère que son propre abonnement : `PushService.subscribe()`
// écrit avec la session courante, aucune notion d'utilisateur cible.
import { useCallback, useEffect, useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { PushService } from "@/lib/notifications/PushService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Visual = {
  dot: string;
  label: string;
  action: string | null;
  hint?: string;
};

export function PushActivationItem({ className }: { className?: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [subscribed, setSubscribed] = useState(false);
  const [swReady, setSwReady] = useState(false);
  const [swUpdating, setSwUpdating] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const st = await PushService.getState();
    setSupported(st.supported);
    setPermission(st.permission);
    setSubscribed(st.subscribed);
    setSwReady(st.swReady);
    setSwUpdating(st.swUpdating);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    void refresh();
  }, [user?.id, refresh]);

  // Retour à l'état réel dès que le Service Worker termine son activation.
  useEffect(() => {
    if (!user?.id || !PushService.isSupported()) return;
    let cancelled = false;
    const cleanups: Array<() => void> = [];
    void navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg || cancelled) return;
      const onState = () => { void refresh(); };
      const onUpdateFound = () => {
        const w = reg.installing ?? reg.waiting;
        w?.addEventListener("statechange", onState);
        if (w) cleanups.push(() => w.removeEventListener("statechange", onState));
        void refresh();
      };
      reg.addEventListener("updatefound", onUpdateFound);
      cleanups.push(() => reg.removeEventListener("updatefound", onUpdateFound));
      const pending = reg.installing ?? reg.waiting;
      if (pending) {
        pending.addEventListener("statechange", onState);
        cleanups.push(() => pending.removeEventListener("statechange", onState));
      }
    });
    return () => { cancelled = true; cleanups.forEach((c) => c()); };
  }, [user?.id, refresh]);

  const activate = async () => {
    setBusy(true);
    try {
      const r = await PushService.subscribe();
      if (r.ok) {
        toast({ title: "Notifications Push activées", description: "Cet appareil recevra les notifications LTPC." });
      } else if (r.reason === "permission-denied") {
        toast({
          title: "Notifications bloquées",
          description: "Autorisez les notifications pour ce site dans les réglages du navigateur, puis réessayez.",
          variant: "destructive",
        });
      } else if (r.reason === "permission-default") {
        toast({ title: "Autorisation nécessaire", description: "Acceptez la demande d'autorisation du navigateur.", variant: "destructive" });
      } else if (r.reason === "sw-unavailable") {
        toast({ title: "Mise à jour en cours", description: "Le Service Worker n'est pas encore prêt, réessayez dans quelques secondes.", variant: "destructive" });
      } else if (r.reason === "vapid-missing") {
        toast({ title: "Push indisponible", description: "Configuration serveur incomplète.", variant: "destructive" });
      } else if (r.reason === "unsupported") {
        toast({ title: "Push non supporté", description: "Ce navigateur ne supporte pas les notifications Push.", variant: "destructive" });
      } else {
        toast({ title: "Activation impossible", description: r.detail ?? "Réessayez.", variant: "destructive" });
      }
    } finally {
      setBusy(false);
      await refresh();
    }
  };

  if (!user?.id) return null;
  if (!supported || permission === "unsupported") return null;

  let v: Visual;
  if (permission === "denied") {
    v = { dot: "bg-destructive", label: "Notifications bloquées", action: null, hint: "Réactivez-les dans les réglages du navigateur (site LTPC → Notifications → Autoriser)." };
  } else if (subscribed && permission === "granted") {
    v = { dot: "bg-emerald-500", label: "Push actif", action: null };
  } else if (permission === "granted" && !swReady && swUpdating) {
    v = { dot: "bg-amber-500", label: "Mise à jour en cours", action: null };
  } else if (permission === "default") {
    v = { dot: "bg-amber-500", label: "Autorisation nécessaire", action: "Autoriser" };
  } else {
    v = { dot: "bg-amber-500", label: "Push non activé", action: "Activer" };
  }

  return (
    <div className={cn("px-3 py-2 border-b border-border", className)}>
      <div className="flex items-center gap-2">
        <Bell className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-xs font-medium text-foreground flex-1">Notifications Push</span>
        <span className={cn("w-2 h-2 rounded-full shrink-0", v.dot)} aria-hidden />
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">{v.label}</span>
        {v.action && (
          <button
            type="button"
            onClick={activate}
            disabled={busy}
            className="text-[11px] font-medium px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-60 inline-flex items-center gap-1"
          >
            {busy && <Loader2 className="w-3 h-3 animate-spin" />}
            {v.action}
          </button>
        )}
      </div>
      {v.hint && <p className="mt-1 text-[10px] text-muted-foreground leading-snug">{v.hint}</p>}
    </div>
  );
}
