// LOT 15.5 — Invitation d'activation Push guidée, pour TOUS les rôles connectés.
//
// Aucune nouvelle logique Push : réutilise strictement `PushService`
// (VAPID, Service Worker, pushManager, table `push_subscriptions`, RLS inchangés).
// L'invitation est discrète, non bloquante, et mémorisée localement (pas de spam).
import { useCallback, useEffect, useState } from "react";
import { Bell, Loader2, X } from "lucide-react";
import { PushService } from "@/lib/notifications/PushService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Rappel : pas avant 7 jours après un « Plus tard », et jamais 2x dans la même session. */
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const storageKey = (userId: string) => `ltpc.push-invite.${userId}`;
const SESSION_KEY = "ltpc.push-invite.session-dismissed";

function isSnoozed(userId: string): boolean {
  try {
    if (sessionStorage.getItem(SESSION_KEY) === "1") return true;
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return false;
    const at = Number(JSON.parse(raw)?.dismissedAt ?? 0);
    return Number.isFinite(at) && Date.now() - at < SNOOZE_MS;
  } catch {
    return false;
  }
}

function snooze(userId: string) {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
    localStorage.setItem(storageKey(userId), JSON.stringify({ dismissedAt: Date.now() }));
  } catch { /* noop */ }
}

type Phase = "hidden" | "invite" | "permission-hint" | "blocked" | "sw-updating";

export function PushActivationBanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>("hidden");
  const [busy, setBusy] = useState(false);

  const evaluate = useCallback(async () => {
    if (!user?.id) return setPhase("hidden");
    if (!PushService.isSupported() || !PushService.hasVapidKey()) return setPhase("hidden");
    // HTTPS (ou localhost) requis pour le Service Worker.
    if (!window.isSecureContext) return setPhase("hidden");

    const st = await PushService.getState();
    // Abonnement déjà actif sur cet appareil → rien à proposer (🟢 Push actif).
    if (st.subscribed && st.permission === "granted") return setPhase("hidden");
    if (st.permission === "denied") return setPhase(isSnoozed(user.id) ? "hidden" : "blocked");
    if (isSnoozed(user.id)) return setPhase("hidden");
    if (!st.swReady && st.swUpdating) return setPhase("sw-updating");
    setPhase("invite");
  }, [user?.id]);

  useEffect(() => { void evaluate(); }, [evaluate]);

  // Service Worker en `installing`/`waiting` : on attend son activation, sans
  // jamais annoncer « Service Worker indisponible ».
  useEffect(() => {
    if (!user?.id || !PushService.isSupported()) return;
    let cancelled = false;
    const cleanups: Array<() => void> = [];
    void navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg || cancelled) return;
      const onState = () => { void evaluate(); };
      const onUpdateFound = () => {
        const w = reg.installing ?? reg.waiting;
        if (w) {
          w.addEventListener("statechange", onState);
          cleanups.push(() => w.removeEventListener("statechange", onState));
        }
        void evaluate();
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
  }, [user?.id, evaluate]);

  const activate = async () => {
    // Avant la demande navigateur : explication claire de ce qui va arriver.
    if (PushService.currentPermission() === "default" && phase !== "permission-hint") {
      setPhase("permission-hint");
      return;
    }
    setBusy(true);
    try {
      const r = await PushService.subscribe();
      if (r.ok) {
        toast({ title: "🟢 Push actif", description: "Cet appareil recevra vos échéances et vos nouveaux messages." });
        setPhase("hidden");
        return;
      }
      if (r.reason === "permission-denied") {
        setPhase("blocked");
      } else if (r.reason === "permission-default") {
        // Refus implicite (fermeture de la demande) : pas de nouvelle tentative immédiate.
        if (user?.id) snooze(user.id);
        setPhase("hidden");
        toast({
          title: "Autorisation non accordée",
          description: "Vous pourrez réactiver les notifications depuis le menu utilisateur.",
        });
      } else if (r.reason === "sw-unavailable") {
        setPhase("sw-updating");
      } else {
        toast({ title: "Activation impossible", description: r.detail ?? "Réessayez dans quelques instants.", variant: "destructive" });
      }
    } finally {
      setBusy(false);
    }
  };

  const later = () => {
    if (user?.id) snooze(user.id);
    setPhase("hidden");
  };

  if (phase === "hidden") return null;

  return (
    <div
      role="status"
      className={cn(
        "mb-4 rounded-lg border border-border bg-card shadow-sm",
        "px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3",
      )}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bell className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          {phase === "blocked" ? (
            <>
              <p className="text-sm font-medium text-foreground">🔴 Notifications bloquées</p>
              <p className="text-xs text-muted-foreground leading-snug">
                Ouvrez les réglages du navigateur pour ce site (Notifications → Autoriser), puis rechargez LTPC.
              </p>
            </>
          ) : phase === "sw-updating" ? (
            <>
              <p className="text-sm font-medium text-foreground">🟠 Service Worker en mise à jour</p>
              <p className="text-xs text-muted-foreground leading-snug">
                L'activation reprendra automatiquement dès la fin de la mise à jour.
              </p>
            </>
          ) : phase === "permission-hint" ? (
            <>
              <p className="text-sm font-medium text-foreground">🟠 Autorisation nécessaire</p>
              <p className="text-xs text-muted-foreground leading-snug">
                Autorisez les notifications pour recevoir vos échéances et vos nouveaux messages.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground">🔔 Activez vos notifications</p>
              <p className="text-xs text-muted-foreground leading-snug">
                Recevez directement vos échéances d'essais et vos nouveaux messages.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {(phase === "invite" || phase === "permission-hint") && (
          <Button size="sm" onClick={activate} disabled={busy}>
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {phase === "permission-hint" ? "Autoriser" : "Activer"}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={later}>
          {phase === "blocked" || phase === "sw-updating" ? <X className="h-4 w-4" /> : "Plus tard"}
        </Button>
      </div>
    </div>
  );
}
