import { ArrowLeft, Bell, Save, Loader2, Smartphone, Mail, MessageSquare, BellOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (prefs) {
      setPushEnabled(prefs.push_enabled);
      setInapp(prefs.inapp_enabled);
      setEmail(prefs.email_enabled);
      setSms(prefs.sms_enabled);
      setFreq(prefs.frequency);
      setDisabled(prefs.disabled_categories);
    }
    setPermission(String(PushService.currentPermission()));
  }, [prefs]);

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
    const r = await PushService.subscribe();
    setPermission(String(PushService.currentPermission()));
    if (r.ok) toast.success("Notifications Push activées");
    else if (r.reason === "vapid-missing") toast.warning("Clé VAPID absente — Push non activé");
    else if (r.reason === "permission-denied") toast.error("Permission refusée");
    else if (r.reason === "unsupported") toast.error("Push non supporté sur ce navigateur");
    else toast.error("Activation impossible");
  };

  const handleDisablePush = async () => {
    const ok = await PushService.unsubscribe();
    if (ok) toast.success("Push désactivé");
  };

  return (
    <>
      <AppBreadcrumb items={[{ label: "Paramètres", href: "/parametres" }, { label: "Notifications" }]} />
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate("/parametres")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold">
            Préférences de <span className="text-primary text-glow">Notifications</span>
          </h1>
          <p className="text-muted-foreground">Personnalisez les canaux, fréquences et catégories</p>
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-4 h-4" />
                  <div>
                    <Label>Notifications Push (Web / PWA)</Label>
                    <p className="text-xs text-muted-foreground">Permission : {permission}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
                  {permission !== "granted" ? (
                    <Button size="sm" variant="outline" onClick={handleEnablePush}>Activer</Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={handleDisablePush}>Désactiver</Button>
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
                <SelectTrigger className="max-w-md"><SelectValue /></SelectTrigger>
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(Object.keys(CATEGORY_META) as NotificationCategory[]).map((cat) => (
                  <label key={cat} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 cursor-pointer">
                    <span className="text-sm">{CATEGORY_META[cat].label}</span>
                    <Switch checked={!disabled.includes(cat)} onCheckedChange={() => toggleCategory(cat)} />
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={save.isPending} className="gap-2">
              {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
