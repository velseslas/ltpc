import { ArrowLeft, Bell, Save, Loader2, Smartphone, Mail, MessageSquare, BellOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useNotificationPreferences } from "@/hooks/useNotificationCenter";
import { CATEGORY_META } from "@/lib/notifications/types";
import type { NotificationCategory, NotificationFrequency } from "@/lib/notifications/types";
import { PushService } from "@/lib/notifications/PushService";
import { toast } from "sonner";

const FREQUENCIES: { value: NotificationFrequency; label: string }[] = [
  { value: "immediat", label: "Immédiat" },
  { value: "5min",     label: "Toutes les 5 minutes" },
  { value: "15min",    label: "Toutes les 15 minutes" },
  { value: "30min",    label: "Toutes les 30 minutes" },
  { value: "quotidien", label: "Résumé quotidien" },
  { value: "hebdomadaire", label: "Résumé hebdomadaire" },
];

export default function NotificationPreferences() {
  const navigate = useNavigate();
  const { data: prefs, isLoading, save } = useNotificationPreferences();

  const [pushEnabled, setPushEnabled]   = useState(true);
  const [inapp, setInapp]               = useState(true);
  const [email, setEmail]               = useState(false);
  const [sms, setSms]                   = useState(false);
  const [freq, setFreq]                 = useState<NotificationFrequency>("immediat");
  const [disabled, setDisabled]         = useState<NotificationCategory[]>([]);
  const [permission, setPermission]     = useState<string>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [swReady, setSwReady]           = useState(true);
  const [pushError, setPushError]       = useState<string | null>(null);
  const [pushBusy, setPushBusy]         = useState(false);
  const [checking, setChecking]         = useState(true);

  const refreshPushState = useCallback(async () => {
    const st = await PushService.getState();
    setPermission(String(st.permission));
    setIsSubscribed(st.subscribed);
    setSwReady(st.swReady);
    setChecking(false);
  }, []);

  useEffect(() => {
    if (prefs) {
      setPushEnabled(prefs.push_enabled);
      setInapp(prefs.inapp_enabled);
      setEmail(prefs.email_enabled);
      setSms(prefs.sms_enabled);
      setFreq(prefs.frequency);
      setDisabled(prefs.disabled_categories);
    }
  }, [prefs]);

  // Réévaluation sur les événements natifs — jamais de polling.
  useEffect(() => {
    void refreshPushState();
    const onVisible = () => { if (document.visibilityState === "visible") void refreshPushState(); };
    document.addEventListener("visibilitychange", onVisible);

    let sw: ServiceWorkerContainer | undefined;
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      sw = navigator.serviceWorker;
      sw.addEventListener("controllerchange", refreshPushState);
      // Le SW peut devenir actif APRÈS le montage React (démarrage à froid PWA).
      sw.ready.then(() => refreshPushState()).catch(() => { /* noop */ });
    }
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      sw?.removeEventListener("controllerchange", refreshPushState);
    };
  }, [refreshPushState]);

  // États explicites — « Permission nécessaire » n'est plus un fallback générique.
  const pushStatus: { badge: string; label: string; variant: "default" | "secondary" | "destructive" | "outline" } =
    permission === "unsupported" || !PushService.isSupported()
      ? { badge: "⚪ Non disponible", label: "Push non supporté par ce navigateur", variant: "outline" }
      : permission === "denied"
      ? { badge: "🔴 Notifications bloquées", label: "Notifications bloquées dans le navigateur", variant: "destructive" }
      : checking
      ? { badge: "… Vérification", label: "Vérification de l'état du Service Worker…", variant: "outline" }
      : isSubscribed && permission === "granted"
      ? { badge: "🟢 Push actif", label: "Cet appareil recevra les notifications Push", variant: "default" }
      : pushError
      ? { badge: "🔴 Activation Push impossible", label: pushError, variant: "destructive" }
      : permission === "granted" && !swReady
      ? { badge: "🟠 Service Worker indisponible", label: "Service Worker indisponible, veuillez réessayer", variant: "secondary" }
      : permission === "granted"
      ? { badge: "🟠 Non activé sur cet appareil", label: "Activez le Push pour cet appareil", variant: "secondary" }
      : { badge: "🟠 Autorisation nécessaire", label: "Autorisation nécessaire pour cet appareil", variant: "secondary" };

  const toggleCategory = (cat: NotificationCategory) => {
    setDisabled((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  };

  const handleSave = async () => {
    await save.mutateAsync({
      push_enabled: pushEnabled,
      inapp_enabled: inapp,
      email_enabled: email,
      sms_enabled: sms,
      frequency: freq,
      disabled_categories: disabled,
    });
    toast.success("Préférences enregistrées");
  };

  const handleEnablePush = async () => {
    if (pushBusy) return;              // verrou UI : jamais deux activations concurrentes
    setPushBusy(true);
    setPushError(null);
    try {
      const r = await PushService.subscribe();
      if (r.ok) {
        toast.success("Push activé sur cet appareil");
      } else if (r.reason === "vapid-missing") {
        setPushError("Configuration Push indisponible (clé publique absente)");
        toast.error("Configuration Push indisponible");
      } else if (r.reason === "permission-denied") {
        toast.error("Notifications bloquées dans le navigateur — réautorisez-les depuis les paramètres du site");
      } else if (r.reason === "permission-default") {
        toast.error("Autorisation nécessaire — acceptez la demande du navigateur");
      } else if (r.reason === "unsupported") {
        toast.error("Push non supporté sur ce navigateur");
      } else if (r.reason === "sw-unavailable") {
        toast.error("Service Worker indisponible, veuillez réessayer (Push actif uniquement sur l'application publiée)");
      } else {
        // Erreur technique réelle : jamais présentée comme un refus de permission.
        setPushError(r.detail ? `Activation Push impossible — ${r.detail}` : "Activation Push impossible");
        toast.error(r.detail ? `Activation Push impossible — ${r.detail}` : "Activation Push impossible");
      }
      await refreshPushState();
    } finally {
      setPushBusy(false);
    }
  };


  const handleDisablePush = async () => {
    const ok = await PushService.unsubscribe();
    await refreshPushState();
    if (ok) toast.success("Push désactivé sur cet appareil");
    else toast.error("Désactivation impossible");
  };


  return (
    <>
      <AppBreadcrumb items={[{ label: "Paramètres", path: "/parametres" }, { label: "Notifications" }]} />
      <div className="flex items-start gap-3 mb-6">
        <Button variant="outline" size="icon" className="shrink-0" onClick={() => navigate("/parametres")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl md:text-3xl font-display font-bold leading-tight">
            Préférences de <span className="text-primary text-glow">Notifications</span>
          </h1>
          <p className="text-xs md:text-base text-muted-foreground">Personnalisez les canaux, fréquences et catégories</p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      )}

      {!isLoading && (
        <div className="space-y-6">
          {/* Canaux */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5 text-primary" /> Canaux</CardTitle>
              <CardDescription>Choisissez où vous souhaitez recevoir vos notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><Bell className="w-4 h-4" /><Label>Notifications dans l'application</Label></div>
                <Switch checked={inapp} onCheckedChange={setInapp} />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <Smartphone className="w-4 h-4 mt-1 shrink-0" />
                  <div className="min-w-0">
                    <Label>Notifications Push (Web / PWA)</Label>
                    <p className="text-xs text-muted-foreground">{pushStatus.label}</p>
                    {permission === "denied" && (
                      <p className="text-xs text-muted-foreground mt-1 max-w-md">
                        Les notifications sont bloquées par le navigateur. Réautorisez-les
                        depuis les paramètres du site (icône cadenas dans la barre d'adresse),
                        puis revenez sur cette page.
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0 pl-7 sm:pl-0">
                  <Badge variant={pushStatus.variant}>{pushStatus.badge}</Badge>
                  <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
                  {isSubscribed ? (
                    <Button size="sm" variant="ghost" onClick={handleDisablePush}>Désactiver</Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEnablePush}
                      disabled={permission === "denied" || permission === "unsupported"}
                    >
                      Activer
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between opacity-60">
                <div className="flex items-center gap-3"><Mail className="w-4 h-4" /><Label>Email <Badge variant="outline" className="ml-2">Bientôt</Badge></Label></div>
                <Switch checked={email} onCheckedChange={setEmail} />
              </div>
              <div className="flex items-center justify-between opacity-60">
                <div className="flex items-center gap-3"><MessageSquare className="w-4 h-4" /><Label>SMS <Badge variant="outline" className="ml-2">Bientôt</Badge></Label></div>
                <Switch checked={sms} onCheckedChange={setSms} />
              </div>
            </CardContent>
          </Card>

          {/* Fréquence */}
          <Card>
            <CardHeader>
              <CardTitle>Fréquence de regroupement</CardTitle>
              <CardDescription>Contrôlez la cadence des notifications non-critiques</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={freq} onValueChange={(v) => setFreq(v as NotificationFrequency)}>
                <SelectTrigger className="w-full max-w-md"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Catégories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BellOff className="w-5 h-5 text-primary" /> Catégories désactivées</CardTitle>
              <CardDescription>Décochez celles que vous ne voulez plus recevoir</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(Object.keys(CATEGORY_META) as NotificationCategory[]).map((cat) => (
                  <label key={cat} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:border-primary/50 cursor-pointer">
                    <span className="text-sm min-w-0">{CATEGORY_META[cat].label}</span>
                    <Switch checked={!disabled.includes(cat)} onCheckedChange={() => toggleCategory(cat)} />
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={save.isPending} className="gap-2 w-full sm:w-auto">
              {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
