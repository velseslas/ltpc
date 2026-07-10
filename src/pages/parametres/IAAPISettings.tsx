import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Brain,
  LayoutDashboard,
  Cpu,
  Boxes,
  Route as RouteIcon,
  FlaskConical,
  MessageSquareCode,
  BarChart3,
  History,
  CheckCircle2,
  AlertTriangle,
  Power,
  Settings2,
  Play,
  Loader2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import {
  AI_FEATURES,
  AI_MODELS,
  AI_PROVIDERS,
  getModel,
  getModelsByProvider,
  getProvider,
  type AIProviderId,
} from "@/lib/ai/aiCatalog";
import {
  loadActiveProvider,
  loadLastTest,
  loadProviders,
  loadRouting,
  saveActiveProvider,
  saveLastTest,
  saveProviders,
  saveRouting,
  type LastTest,
  type ProvidersState,
  type RoutingMap,
} from "@/lib/ai/aiRoutingStore";

type SectionId =
  | "dashboard"
  | "providers"
  | "models"
  | "routing"
  | "tests"
  | "prompts"
  | "stats"
  | "history";

interface SectionDef {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  soon?: boolean;
}

const SECTIONS: SectionDef[] = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "providers", label: "Fournisseurs IA", icon: Cpu },
  { id: "models", label: "Modèles IA", icon: Boxes },
  { id: "routing", label: "Routage IA", icon: RouteIcon },
  { id: "tests", label: "Tests des modèles", icon: FlaskConical },
  { id: "prompts", label: "Prompts système", icon: MessageSquareCode, disabled: true, soon: true },
  { id: "stats", label: "Statistiques", icon: BarChart3, disabled: true, soon: true },
  { id: "history", label: "Historique des appels", icon: History, disabled: true },
];

const IAAPISettings = () => {
  const navigate = useNavigate();
  const [section, setSection] = useState<SectionId>("dashboard");

  const [providers, setProviders] = useState<ProvidersState>(() => loadProviders());
  const [routing, setRouting] = useState<RoutingMap>(() => loadRouting());
  const [activeProvider, setActiveProvider] = useState<AIProviderId>(() => loadActiveProvider());
  const [lastTest, setLastTest] = useState<LastTest | null>(() => loadLastTest());

  const updateProviders = (next: ProvidersState) => {
    setProviders(next);
    saveProviders(next);
  };
  const updateRouting = (next: RoutingMap) => {
    setRouting(next);
    saveRouting(next);
  };
  const updateActiveProvider = (id: AIProviderId) => {
    setActiveProvider(id);
    saveActiveProvider(id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <AppBreadcrumb items={[
        { label: "Paramètres", path: "/parametres" },
        { label: "IA & API" },
      ]} />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/parametres")}
          className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">IA & API</h1>
            <p className="text-sm text-muted-foreground">
              Centre de contrôle de toute l'intelligence artificielle de LTPC
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar */}
        <Card className="border-border/50 h-fit lg:sticky lg:top-4">
          <CardContent className="p-2">
            <nav className="flex flex-col gap-1">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const active = section === s.id;
                return (
                  <button
                    key={s.id}
                    disabled={s.disabled}
                    onClick={() => !s.disabled && setSection(s.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left",
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                      s.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{s.label}</span>
                    {s.soon && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                        Bientôt
                      </Badge>
                    )}
                    {s.disabled && !s.soon && <Lock className="h-3 w-3" />}
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="space-y-6 min-w-0">
          {section === "dashboard" && (
            <DashboardSection
              providers={providers}
              routing={routing}
              activeProvider={activeProvider}
              lastTest={lastTest}
              onGoto={setSection}
            />
          )}
          {section === "providers" && (
            <ProvidersSection
              providers={providers}
              activeProvider={activeProvider}
              onChange={updateProviders}
              onSetActive={updateActiveProvider}
              onGotoTest={() => setSection("tests")}
            />
          )}
          {section === "models" && <ModelsSection />}
          {section === "routing" && (
            <RoutingSection routing={routing} onChange={updateRouting} />
          )}
          {section === "tests" && (
            <TestsSection
              activeProvider={activeProvider}
              onTested={(t) => {
                setLastTest(t);
                saveLastTest(t);
              }}
            />
          )}
          {section === "prompts" && <SoonSection title="Prompts système" />}
          {section === "stats" && <SoonSection title="Statistiques" />}
          {section === "history" && <SoonSection title="Historique des appels" />}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------- Dashboard ------------------------------- */

interface DashboardProps {
  providers: ProvidersState;
  routing: RoutingMap;
  activeProvider: AIProviderId;
  lastTest: LastTest | null;
  onGoto: (s: SectionId) => void;
}

const DashboardSection = ({ providers, routing, activeProvider, lastTest, onGoto }: DashboardProps) => {
  const configuredCount = Object.values(providers).filter((p) => p.configured && !p.disabled).length;
  const connectedFeatures = AI_FEATURES.filter((f) => f.status === "connected").length;
  const allRouted = AI_FEATURES.every((f) => !!routing[f.id]);
  const activeOk = providers[activeProvider]?.configured && !providers[activeProvider]?.disabled;
  const systemOk = activeOk && configuredCount > 0 && allRouted;

  const active = getProvider(activeProvider);

  const cards = [
    { label: "Fournisseur actif", value: active?.name ?? "—", icon: Cpu },
    { label: "Fournisseurs configurés", value: `${configuredCount} / ${AI_PROVIDERS.length}`, icon: Boxes },
    { label: "Modèles disponibles", value: String(AI_MODELS.length), icon: Boxes },
    { label: "Fonctionnalités IA connectées", value: `${connectedFeatures} / ${AI_FEATURES.length}`, icon: RouteIcon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-semibold">Tableau de bord</h2>
        <p className="text-sm text-muted-foreground">Vue d'ensemble de la configuration IA.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="border-border/50">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{c.label}</p>
                  <p className="text-lg font-semibold truncate">{c.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">État global du système</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-lg border",
              systemOk
                ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                : "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400",
            )}>
              {systemOk ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              <div className="text-sm font-medium">
                {systemOk ? "🟢 Système opérationnel" : "🟠 Configuration incomplète"}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => onGoto("providers")}>Configurer un fournisseur</Button>
              <Button size="sm" variant="outline" onClick={() => onGoto("routing")}>Ajuster le routage</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Dernier test effectué</CardTitle>
          </CardHeader>
          <CardContent>
            {lastTest ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Modèle</span>
                  <span className="font-medium">{getModel(lastTest.modelId)?.label ?? lastTest.modelId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Résultat</span>
                  <Badge variant={lastTest.ok ? "default" : "destructive"}>
                    {lastTest.ok ? "Succès" : "Échec"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Durée</span>
                  <span>{lastTest.durationMs} ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{new Date(lastTest.at).toLocaleString("fr-FR")}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun test enregistré pour le moment.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/* ------------------------------- Providers ------------------------------- */

interface ProvidersProps {
  providers: ProvidersState;
  activeProvider: AIProviderId;
  onChange: (next: ProvidersState) => void;
  onSetActive: (id: AIProviderId) => void;
  onGotoTest: () => void;
}

const ProvidersSection = ({ providers, activeProvider, onChange, onSetActive, onGotoTest }: ProvidersProps) => {
  const setModel = (id: AIProviderId, modelId: string) => {
    onChange({ ...providers, [id]: { ...providers[id], activeModelId: modelId } });
  };
  const toggleDisabled = (id: AIProviderId) => {
    onChange({ ...providers, [id]: { ...providers[id], disabled: !providers[id].disabled } });
  };
  const markConfigured = (id: AIProviderId) => {
    onChange({ ...providers, [id]: { ...providers[id], configured: true } });
    toast.success("Fournisseur marqué comme configuré (interface uniquement).");
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-display font-semibold">Fournisseurs IA</h2>
        <p className="text-sm text-muted-foreground">
          Interface de configuration — les clés API restent gérées côté backend sécurisé.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AI_PROVIDERS.map((p) => {
          const state = providers[p.id];
          const models = getModelsByProvider(p.id);
          const isActive = activeProvider === p.id;
          return (
            <Card key={p.id} className={cn("border-border/50", isActive && "ring-1 ring-primary/40")}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-primary flex items-center justify-center font-semibold">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <CardDescription className="text-xs">{p.description}</CardDescription>
                    </div>
                  </div>
                  {state.disabled ? (
                    <Badge variant="outline" className="text-muted-foreground">Désactivé</Badge>
                  ) : state.configured ? (
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15">
                      ✓ Configuré
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30">
                      Non configuré
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Modèle actif</label>
                  <Select
                    value={state.activeModelId ?? models[0]?.id}
                    onValueChange={(v) => setModel(p.id, v)}
                  >
                    <SelectTrigger className="h-9 mt-1">
                      <SelectValue placeholder="Choisir un modèle" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => markConfigured(p.id)}>
                    <Settings2 className="h-3.5 w-3.5 mr-1.5" /> Configurer
                  </Button>
                  <Button size="sm" variant="outline" onClick={onGotoTest}>
                    <Play className="h-3.5 w-3.5 mr-1.5" /> Tester
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleDisabled(p.id)}>
                    <Power className="h-3.5 w-3.5 mr-1.5" />
                    {state.disabled ? "Activer" : "Désactiver"}
                  </Button>
                  {!isActive && state.configured && !state.disabled && (
                    <Button size="sm" variant="ghost" className="text-primary" onClick={() => onSetActive(p.id)}>
                      Définir comme actif
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

/* -------------------------------- Models -------------------------------- */

const ModelsSection = () => (
  <div className="space-y-4">
    <div>
      <h2 className="text-xl font-display font-semibold">Modèles IA</h2>
      <p className="text-sm text-muted-foreground">Catalogue des modèles disponibles, groupés par fournisseur.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {AI_PROVIDERS.map((p) => {
        const models = getModelsByProvider(p.id);
        return (
          <Card key={p.id} className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{p.name}</CardTitle>
              <CardDescription className="text-xs">{models.length} modèle(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border/50">
                {models.map((m) => (
                  <li key={m.id} className="py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{m.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.id}</p>
                    </div>
                    {m.family && <Badge variant="outline" className="text-[10px]">{m.family}</Badge>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  </div>
);

/* -------------------------------- Routing -------------------------------- */

interface RoutingProps {
  routing: RoutingMap;
  onChange: (next: RoutingMap) => void;
}

const RoutingSection = ({ routing, onChange }: RoutingProps) => {
  const setFeature = (fid: string, modelId: string) => {
    onChange({ ...routing, [fid]: modelId });
  };
  const reset = () => {
    const defaults: RoutingMap = {};
    for (const f of AI_FEATURES) defaults[f.id] = f.defaultModelId;
    onChange(defaults);
    toast.success("Routage réinitialisé aux valeurs par défaut.");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold">Routage IA</h2>
          <p className="text-sm text-muted-foreground">
            Associer chaque fonctionnalité IA à un modèle. La configuration est enregistrée localement.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>Réinitialiser</Button>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            <div className="grid grid-cols-[1fr_260px] gap-4 px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground bg-muted/30">
              <div>Fonctionnalité IA</div>
              <div>Modèle utilisé</div>
            </div>
            {AI_FEATURES.map((f) => (
              <div key={f.id} className="grid grid-cols-[1fr_260px] gap-4 px-4 py-3 items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{f.label}</p>
                    {f.status === "planned" && (
                      <Badge variant="outline" className="text-[10px]">Prévu</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{f.description}</p>
                </div>
                <Select value={routing[f.id]} onValueChange={(v) => setFeature(f.id, v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_PROVIDERS.map((p) => {
                      const models = getModelsByProvider(p.id);
                      if (!models.length) return null;
                      return (
                        <div key={p.id}>
                          <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                            {p.name}
                          </div>
                          {models.map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                          ))}
                        </div>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/* --------------------------------- Tests --------------------------------- */

interface TestsProps {
  activeProvider: AIProviderId;
  onTested: (t: LastTest) => void;
}

const TestsSection = ({ activeProvider, onTested }: TestsProps) => {
  const [providerId, setProviderId] = useState<AIProviderId>(activeProvider);
  const models = useMemo(() => getModelsByProvider(providerId), [providerId]);
  const [modelId, setModelId] = useState<string>(models[0]?.id ?? "");
  const [prompt, setPrompt] = useState("Bonjour, peux-tu confirmer que la connexion fonctionne ?");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string; durationMs: number; tokens?: number } | null>(null);

  // keep model in sync with provider
  const onProviderChange = (v: AIProviderId) => {
    setProviderId(v);
    const first = getModelsByProvider(v)[0]?.id ?? "";
    setModelId(first);
  };

  const runTest = async () => {
    if (!modelId) return;
    setLoading(true);
    setResult(null);
    const start = performance.now();
    // Simulation : cette version prépare l'interface. Le branchement runtime
    // arrivera via AIProviderFactory sans casser les edge functions existantes.
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 600));
    const durationMs = Math.round(performance.now() - start);
    const ok = true;
    const text = `✓ Interface prête. Modèle "${getModel(modelId)?.label}" sélectionné.\n\n(La connexion runtime sera activée via AIProviderFactory lors de la prochaine étape.)`;
    setResult({ ok, text, durationMs, tokens: Math.round(prompt.length / 4) });
    onTested({ at: new Date().toISOString(), providerId, modelId, ok, durationMs });
    toast.success("Test simulé exécuté.");
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-display font-semibold">Tests des modèles</h2>
        <p className="text-sm text-muted-foreground">
          Interface de test — exécution simulée pour valider la sélection provider / modèle.
        </p>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Fournisseur</label>
              <Select value={providerId} onValueChange={(v) => onProviderChange(v as AIProviderId)}>
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AI_PROVIDERS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Modèle</label>
              <Select value={modelId} onValueChange={setModelId}>
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Message de test</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="mt-1"
            />
          </div>

          <Button onClick={runTest} disabled={loading || !modelId}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            {loading ? "Test en cours..." : "Tester"}
          </Button>

          {result && (
            <>
              <Separator />
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Temps de réponse</p>
                  <p className="font-medium">{result.durationMs} ms</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">État</p>
                  <Badge variant={result.ok ? "default" : "destructive"}>
                    {result.ok ? "Succès" : "Échec"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tokens (est.)</p>
                  <p className="font-medium">{result.tokens ?? "—"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Réponse du modèle</p>
                <pre className="text-xs bg-muted/40 rounded-md p-3 whitespace-pre-wrap font-mono">
                  {result.text}
                </pre>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/* --------------------------------- Soon --------------------------------- */

const SoonSection = ({ title }: { title: string }) => (
  <Card className="border-dashed border-border/60">
    <CardContent className="py-16 flex flex-col items-center justify-center text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Cette section fait partie de l'architecture prévue du centre IA. Son emplacement est
          réservé — l'implémentation arrivera dans une prochaine itération.
        </p>
      </div>
      <Badge variant="outline">Bientôt disponible</Badge>
    </CardContent>
  </Card>
);

export default IAAPISettings;
