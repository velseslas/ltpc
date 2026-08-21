import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Settings, Save, Loader2, Globe, Moon, Sun, Palette, Clock, Monitor,
  Bell, Shield, Zap, HardDrive, Mail, FileText, RotateCcw, Info, Languages,
  CalendarDays, Hash, Eye, EyeOff, Lock, Wifi, WifiOff, Download, Upload,
  RefreshCw, Trash2, AlertTriangle
} from "lucide-react";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useParametresSysteme, useUpsertParametresSysteme } from "@/hooks/useParametres";
import { toast } from "sonner";
import { isMaintenanceActive, setMaintenanceMode as persistMaintenanceMode } from "@/components/common/MaintenanceGate";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { loadPrefs, savePrefs, clearAppCache, applyPrefs } from "@/lib/uiPreferences";
import { useQueryClient } from "@tanstack/react-query";

const SystemeSettings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: parametres, isLoading } = useParametresSysteme();
  const upsertParametres = useUpsertParametresSysteme();
  const initial = loadPrefs();

  const [formData, setFormData] = useState({
    langue: "fr",
    fuseau_horaire: "Africa/Algiers",
    format_date: "DD/MM/YYYY",
    format_nombre: "fr-FR",
    theme: initial.theme,
    couleur_accent: initial.couleurAccent,
    logo_header: true,
    nom_application: "",
  });

  // Extended local settings (persistés dans localStorage)
  const [sessionTimeout, setSessionTimeout] = useState(initial.sessionTimeout);
  const [autoSave, setAutoSave] = useState(initial.autoSave);
  const [compactMode, setCompactMode] = useState(initial.compactMode);
  const [animations, setAnimations] = useState(initial.animations);
  const [emailNotifications, setEmailNotifications] = useState(initial.emailNotifications);
  const [pushNotifications, setPushNotifications] = useState(initial.pushNotifications);
  const [soundNotifications, setSoundNotifications] = useState(initial.soundNotifications);
  const [notifEssais, setNotifEssais] = useState(initial.notifEssais);
  const [notifFacturation, setNotifFacturation] = useState(initial.notifFacturation);
  const [notifMateriel, setNotifMateriel] = useState(initial.notifMateriel);
  const [notifRH, setNotifRH] = useState(initial.notifRH);
  const [maintenanceMode, setMaintenanceModeState] = useState<boolean>(() => isMaintenanceActive());
  const isAdmin = useIsAdmin();
  const handleToggleMaintenance = (v: boolean) => {
    if (!isAdmin) {
      toast.error("Seuls les administrateurs peuvent activer le mode maintenance");
      return;
    }
    setMaintenanceModeState(v);
    persistMaintenanceMode(v);
    toast.success(v ? "Mode maintenance activé" : "Mode maintenance désactivé");
  };
  const [debugMode, setDebugMode] = useState(initial.debugMode);
  const [autoBackup, setAutoBackup] = useState(initial.autoBackup);
  const [backupFrequency, setBackupFrequency] = useState(initial.backupFrequency);
  const [dataRetention, setDataRetention] = useState(initial.dataRetention);
  const [paginationDefault, setPaginationDefault] = useState(initial.paginationDefault);

  // Auto-apply visual prefs on toggle
  const applyAndPersist = (patch: Partial<ReturnType<typeof loadPrefs>>) => {
    savePrefs(patch);
  };

  useEffect(() => {
    if (parametres) {
      setFormData({
        langue: parametres.langue,
        fuseau_horaire: parametres.fuseau_horaire,
        format_date: parametres.format_date,
        format_nombre: parametres.format_nombre,
        theme: parametres.theme,
        couleur_accent: parametres.couleur_accent,
        logo_header: parametres.logo_header,
        nom_application: parametres.nom_application || "",
      });
      savePrefs({ theme: parametres.theme, couleurAccent: parametres.couleur_accent });
    }
  }, [parametres]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === "theme" && typeof value === "string") applyAndPersist({ theme: value });
    if (field === "couleur_accent" && typeof value === "string") applyAndPersist({ couleurAccent: value });
  };

  const handleSave = async () => {
    await upsertParametres.mutateAsync({
      ...formData,
      nom_application: formData.nom_application || null,
    });
    savePrefs({
      theme: formData.theme,
      couleurAccent: formData.couleur_accent,
      sessionTimeout, autoSave, compactMode, animations,
      emailNotifications, pushNotifications, soundNotifications,
      notifEssais, notifFacturation, notifMateriel, notifRH,
      debugMode, autoBackup, backupFrequency, dataRetention, paginationDefault,
    });
    applyPrefs();
    toast.success("Paramètres système enregistrés");
  };

  const handleResetDefaults = () => {
    setFormData({
      langue: "fr",
      fuseau_horaire: "Africa/Algiers",
      format_date: "DD/MM/YYYY",
      format_nombre: "fr-FR",
      theme: "dark",
      couleur_accent: "cyan",
      logo_header: true,
      nom_application: "",
    });
    setSessionTimeout("30");
    setAutoSave(true);
    setCompactMode(false);
    setAnimations(true);
    savePrefs({ theme: "dark", couleurAccent: "cyan", compactMode: false, animations: true });
    toast.info("Paramètres réinitialisés aux valeurs par défaut");
  };

  const handleClearCache = () => {
    const { keysCleared } = clearAppCache();
    queryClient.clear();
    toast.success(`Cache vidé (${keysCleared} entrée(s))`);
  };

  const handleExportSettings = () => {
    const settings = { ...formData, sessionTimeout, autoSave, compactMode, animations };
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "parametres-systeme.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Paramètres exportés");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <AppBreadcrumb items={[
        { label: "Paramètres", path: "/parametres" },
        { label: "Système" },
      ]} />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/parametres")}
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3 min-w-0">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
              <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground break-words">
                <span className="text-primary">Système</span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Configuration générale du système
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExportSettings} className="gap-2 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetDefaults} className="gap-2 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50">
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-card/50 border border-border/50">
          <TabsTrigger value="general" className="gap-2"><Globe className="h-4 w-4" /> Général</TabsTrigger>
          <TabsTrigger value="apparence" className="gap-2"><Palette className="h-4 w-4" /> Apparence</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4" /> Notifications</TabsTrigger>
          <TabsTrigger value="performance" className="gap-2"><Zap className="h-4 w-4" /> Performance</TabsTrigger>
          <TabsTrigger value="avance" className="gap-2"><Shield className="h-4 w-4" /> Avancé</TabsTrigger>
        </TabsList>

        {/* === GENERAL === */}
        <TabsContent value="general">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Langue et région */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-primary" />
                  <CardTitle>Langue et région</CardTitle>
                </div>
                <CardDescription>Paramètres de localisation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Langue de l'interface</Label>
                  <Select value={formData.langue} onValueChange={(v) => handleChange("langue", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr"><div className="flex items-center gap-2"><span>🇫🇷</span> Français</div></SelectItem>
                      <SelectItem value="ar"><div className="flex items-center gap-2"><span>🇩🇿</span> العربية</div></SelectItem>
                      <SelectItem value="en"><div className="flex items-center gap-2"><span>🇬🇧</span> English</div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fuseau horaire</Label>
                  <Select value={formData.fuseau_horaire} onValueChange={(v) => handleChange("fuseau_horaire", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Algiers">Alger (UTC+1)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (UTC+1/+2)</SelectItem>
                      <SelectItem value="Africa/Tunis">Tunis (UTC+1)</SelectItem>
                      <SelectItem value="Africa/Casablanca">Casablanca (UTC+0/+1)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nom de l'application</Label>
                  <Input
                    value={formData.nom_application}
                    onChange={(e) => handleChange("nom_application", e.target.value)}
                    placeholder="Nom personnalisé de l'application"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Format date et nombre */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <CardTitle>Formats d'affichage</CardTitle>
                </div>
                <CardDescription>Date, heure et nombres</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Format de date</Label>
                  <Select value={formData.format_date} onValueChange={(v) => handleChange("format_date", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">23/01/2025 (DD/MM/YYYY)</SelectItem>
                      <SelectItem value="MM/DD/YYYY">01/23/2025 (MM/DD/YYYY)</SelectItem>
                      <SelectItem value="YYYY-MM-DD">2025-01-23 (YYYY-MM-DD)</SelectItem>
                      <SelectItem value="DD-MM-YYYY">23-01-2025 (DD-MM-YYYY)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Format de nombre</Label>
                  <Select value={formData.format_nombre} onValueChange={(v) => handleChange("format_nombre", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr-FR">1 234,56 (Français)</SelectItem>
                      <SelectItem value="en-US">1,234.56 (Anglais)</SelectItem>
                      <SelectItem value="de-DE">1.234,56 (Allemand)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Éléments par page (défaut)</Label>
                  <Select value={paginationDefault} onValueChange={setPaginationDefault}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 éléments</SelectItem>
                      <SelectItem value="25">25 éléments</SelectItem>
                      <SelectItem value="50">50 éléments</SelectItem>
                      <SelectItem value="100">100 éléments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Session */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <CardTitle>Session et sécurité</CardTitle>
                </div>
                <CardDescription>Gestion des sessions utilisateur</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Délai d'expiration de session (min)</Label>
                    <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 heure</SelectItem>
                        <SelectItem value="120">2 heures</SelectItem>
                        <SelectItem value="480">8 heures</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Sauvegarde automatique</Label>
                      <p className="text-xs text-muted-foreground">Sauvegarder les formulaires en cours</p>
                    </div>
                    <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Logo dans l'en-tête</Label>
                      <p className="text-xs text-muted-foreground">Afficher le logo en haut</p>
                    </div>
                    <Switch checked={formData.logo_header} onCheckedChange={(v) => handleChange("logo_header", v)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* === APPARENCE === */}
        <TabsContent value="apparence">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  <CardTitle>Thème</CardTitle>
                </div>
                <CardDescription>Choisissez l'apparence de l'interface</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Mode d'affichage</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "light", label: "Clair", icon: Sun, desc: "Fond blanc" },
                      { value: "dark", label: "Sombre", icon: Moon, desc: "Fond sombre" },
                      { value: "system", label: "Auto", icon: Monitor, desc: "Système" },
                    ].map(({ value, label, icon: Icon, desc }) => (
                      <button
                        key={value}
                        onClick={() => handleChange("theme", value)}
                        className={`p-4 rounded-xl border-2 transition-all text-center space-y-2 ${
                          formData.theme === value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/50 bg-card/30 text-muted-foreground hover:border-primary/30 hover:bg-primary/5"
                        }`}
                      >
                        <Icon className="h-6 w-6 mx-auto" />
                        <div className="text-sm font-medium">{label}</div>
                        <div className="text-xs text-muted-foreground">{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  <CardTitle>Couleur d'accent</CardTitle>
                </div>
                <CardDescription>Personnalisez la couleur principale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { color: "cyan", label: "Cyan", hex: "#00d4ff" },
                    { color: "blue", label: "Bleu", hex: "#3b82f6" },
                    { color: "violet", label: "Violet", hex: "#8b5cf6" },
                    { color: "pink", label: "Rose", hex: "#ec4899" },
                    { color: "orange", label: "Orange", hex: "#f97316" },
                    { color: "green", label: "Vert", hex: "#22c55e" },
                  ].map(({ color, label, hex }) => (
                    <button
                      key={color}
                      onClick={() => handleChange("couleur_accent", color)}
                      className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        formData.couleur_accent === color
                          ? "border-foreground bg-muted/30"
                          : "border-border/50 hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: hex }} />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  <CardTitle>Options d'affichage</CardTitle>
                </div>
                <CardDescription>Ajustez l'expérience visuelle</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/30">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Mode compact</Label>
                      <p className="text-xs text-muted-foreground">Réduire les espaces pour afficher plus de contenu</p>
                    </div>
                    <Switch checked={compactMode} onCheckedChange={(v) => { setCompactMode(v); applyAndPersist({ compactMode: v }); }} />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/30">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Animations</Label>
                      <p className="text-xs text-muted-foreground">Activer les transitions et animations</p>
                    </div>
                    <Switch checked={animations} onCheckedChange={(v) => { setAnimations(v); applyAndPersist({ animations: v }); }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* === NOTIFICATIONS === */}
        <TabsContent value="notifications">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <CardTitle>Canaux de notification</CardTitle>
                </div>
                <CardDescription>Choisissez comment recevoir les alertes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Notifications par email", desc: "Recevoir les alertes par email", checked: emailNotifications, onChange: setEmailNotifications, icon: Mail },
                  { label: "Notifications push", desc: "Alertes dans le navigateur", checked: pushNotifications, onChange: setPushNotifications, icon: Bell },
                  { label: "Sons de notification", desc: "Signal sonore pour les alertes", checked: soundNotifications, onChange: setSoundNotifications, icon: Zap },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <div className="space-y-0.5">
                        <Label className="text-sm">{item.label}</Label>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <Switch checked={item.checked} onCheckedChange={item.onChange} />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle>Catégories de notifications</CardTitle>
                </div>
                <CardDescription>Sélectionnez les modules à surveiller</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Essais et échantillons", desc: "Nouveaux résultats, échéances", checked: notifEssais, onChange: setNotifEssais },
                  { label: "Facturation", desc: "Factures, paiements, devis", checked: notifFacturation, onChange: setNotifFacturation },
                  { label: "Matériel", desc: "Étalonnage, maintenance", checked: notifMateriel, onChange: setNotifMateriel },
                  { label: "Ressources humaines", desc: "Affectations, documents", checked: notifRH, onChange: setNotifRH },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                    <div className="space-y-0.5">
                      <Label className="text-sm">{item.label}</Label>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch checked={item.checked} onCheckedChange={item.onChange} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* === PERFORMANCE === */}
        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-primary" />
                  <CardTitle>Stockage et cache</CardTitle>
                </div>
                <CardDescription>Gérer l'espace et le cache</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cache navigateur</span>
                    <span className="font-medium">~12.4 MB</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary/70 w-[35%]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Stockage local</span>
                    <span className="font-medium">~2.1 MB</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-accent/70 w-[12%]" />
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleClearCache} className="w-full gap-2 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50">
                  <Trash2 className="h-4 w-4" />
                  Vider le cache
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-primary" />
                  <CardTitle>Sauvegarde automatique</CardTitle>
                </div>
                <CardDescription>Configuration des sauvegardes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Sauvegarde auto</Label>
                    <p className="text-xs text-muted-foreground">Sauvegarder périodiquement les données</p>
                  </div>
                  <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
                </div>
                <div className="space-y-2">
                  <Label>Fréquence</Label>
                  <Select value={backupFrequency} onValueChange={setBackupFrequency} disabled={!autoBackup}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Toutes les heures</SelectItem>
                      <SelectItem value="daily">Quotidienne</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rétention des données (jours)</Label>
                  <Select value={dataRetention} onValueChange={setDataRetention}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90 jours</SelectItem>
                      <SelectItem value="180">180 jours</SelectItem>
                      <SelectItem value="365">1 an</SelectItem>
                      <SelectItem value="730">2 ans</SelectItem>
                      <SelectItem value="unlimited">Illimité</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* === AVANCÉ === */}
        <TabsContent value="avance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle>Mode maintenance</CardTitle>
                </div>
                <CardDescription>Options avancées du système</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      Mode maintenance
                    </Label>
                    <p className="text-xs text-muted-foreground">Désactiver l'accès utilisateur temporairement</p>
                  </div>
                  <Switch checked={maintenanceMode} onCheckedChange={handleToggleMaintenance} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Mode débogage</Label>
                    <p className="text-xs text-muted-foreground">Journaux détaillés pour le diagnostic</p>
                  </div>
                  <Switch checked={debugMode} onCheckedChange={setDebugMode} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  <CardTitle>Informations système</CardTitle>
                </div>
                <CardDescription>Détails de l'application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Version", value: <Badge variant="outline">1.0.0</Badge> },
                  { label: "Build", value: <span className="font-mono text-xs">2025.01.23</span> },
                  { label: "Environnement", value: <Badge variant="secondary">Production</Badge> },
                  { label: "Navigateur", value: <span className="text-xs">{navigator.userAgent.split(" ").slice(-2).join(" ")}</span> },
                  { label: "Résolution", value: <span className="text-xs">{window.innerWidth}×{window.innerHeight}</span> },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center text-sm py-1.5 border-b border-border/20 last:border-0">
                    <span className="text-muted-foreground">{item.label}</span>
                    {item.value}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={upsertParametres.isPending} className="gap-2 gradient-primary text-primary-foreground font-semibold px-8">
          {upsertParametres.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Enregistrer
        </Button>
      </div>
    </div>
  );
};

export default SystemeSettings;
