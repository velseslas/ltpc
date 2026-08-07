import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Sparkles,
  FileText,
  Layers,
  Boxes,
  Package,
  FlaskConical,
  Bolt,
  HardHat,
  TestTube,
  AlertTriangle,
  MessageSquareWarning,
  ClipboardCheck,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";
import {
  useRapportCategories,
  useRapportModeles,
  useRapportsTechniques,
  type RapportStatut,
  STATUT_LABELS,
  STATUT_COLORS,
} from "@/hooks/useRapportsTechniques";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Layers,
  Boxes,
  Package,
  FlaskConical,
  Bolt,
  HardHat,
  TestTube,
  AlertTriangle,
  MessageSquareWarning,
  ClipboardCheck,
  MoreHorizontal,
};

type TabKey = "tous" | "brouillons" | "en_attente" | "valides" | "archives";

const TAB_STATUTS: Record<TabKey, RapportStatut[] | undefined> = {
  tous: undefined,
  brouillons: ["brouillon", "a_completer", "en_cours"],
  en_attente: ["en_attente_validation"],
  valides: ["valide"],
  archives: ["archive", "refuse"],
};

export default function RedactionRapportTechnique() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("tous");
  const [categorieId, setCategorieId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: categories = [] } = useRapportCategories();
  const { data: modeles = [] } = useRapportModeles(categorieId);
  const { data: rapports = [], isLoading } = useRapportsTechniques({
    statuts: TAB_STATUTS[activeTab],
    categorieId,
    search: search.trim() || undefined,
  });

  const counts = useMemo(() => {
    const c: Record<TabKey, number> = {
      tous: 0,
      brouillons: 0,
      en_attente: 0,
      valides: 0,
      archives: 0,
    };
    // rely on filtered length only for active tab; other counts require unfiltered fetch — kept simple in phase 1
    c[activeTab] = rapports.length;
    return c;
  }, [rapports, activeTab]);

  return (
    <div data-essai-mobile className="space-y-6">
      <AppBreadcrumb
        items={[
          { label: "Essais", path: "/essais" },
          { label: "Assistant IA — Rapports techniques" },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton to="/essais" />
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 p-2 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold leading-tight">
                Assistant IA de rédaction de rapports techniques
              </h1>
              <p className="text-sm text-muted-foreground">
                Décrivez un problème, l'IA analyse, propose un rapport, l'ingénieur valide.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/essais/rapports-techniques/historique")}
          >
            <FileText className="h-4 w-4 mr-2" /> Historique
          </Button>
          <Button
            onClick={() => navigate("/essais/rapports-techniques/nouveau")}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90"
          >
            <Plus className="hidden md:inline-block h-4 w-4 md:mr-2" /> Nouveau rapport
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar catégories */}
        <Card>
          <CardContent className="p-3 space-y-1">
            <div className="px-2 py-1.5 text-xs uppercase tracking-wide text-muted-foreground">
              Bibliothèque
            </div>
            <button
              onClick={() => setCategorieId(null)}
              className={`w-full flex items-center justify-between px-2 py-2 rounded-md text-sm transition ${
                !categorieId
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted"
              }`}
            >
              <span>Toutes les catégories</span>
              <ChevronRight className="h-4 w-4 opacity-50" />
            </button>
            {categories.map((c) => {
              const Icon = ICONS[c.icone ?? ""] ?? FileText;
              const active = categorieId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategorieId(c.id)}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm transition ${
                    active
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{c.nom}</span>
                </button>
              );
            })}

            {categorieId && modeles.length > 0 && (
              <>
                <div className="px-2 pt-3 pb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  Modèles
                </div>
                {modeles.map((m) => (
                  <Link
                    key={m.id}
                    to={`/essais/rapports-techniques/nouveau?modele=${m.id}`}
                    className="block px-2 py-1.5 rounded-md text-xs hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    {m.titre}
                  </Link>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        {/* Contenu principal */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro, titre ou description…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
            <TabsList>
              <TabsTrigger value="tous">Tous</TabsTrigger>
              <TabsTrigger value="brouillons">Brouillons</TabsTrigger>
              <TabsTrigger value="en_attente">En attente</TabsTrigger>
              <TabsTrigger value="valides">Validés</TabsTrigger>
              <TabsTrigger value="archives">Archivés</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {isLoading ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    Chargement…
                  </CardContent>
                </Card>
              ) : rapports.length === 0 ? (
                <Card>
                  <CardContent className="p-10 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-3">
                      <Sparkles className="h-6 w-6 text-violet-600" />
                    </div>
                    <h3 className="font-semibold mb-1">Aucun rapport dans cette vue</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Commencez par décrire un problème rencontré sur chantier ou en laboratoire.
                    </p>
                    <Button
                      onClick={() => navigate("/essais/rapports-techniques/nouveau")}
                      className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Créer un rapport
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {rapports.map((r) => (
                    <Link
                      key={r.id}
                      to={`/essais/rapports-techniques/${r.id}`}
                      className="block"
                    >
                      <Card className="hover:border-primary/40 transition">
                        <CardContent className="p-4 flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={STATUT_COLORS[r.statut]} variant="outline">
                                {STATUT_LABELS[r.statut]}
                              </Badge>
                              {r.numero && (
                                <span className="text-xs font-mono text-muted-foreground">
                                  {r.numero}
                                </span>
                              )}
                              {r.rapport_categories?.nom && (
                                <Badge variant="secondary" className="text-xs">
                                  {r.rapport_categories.nom}
                                </Badge>
                              )}
                            </div>
                            <div className="font-medium truncate">
                              {r.titre || r.description_probleme.slice(0, 90)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                              {r.clients?.nom && <span>{r.clients.nom}</span>}
                              {r.chantiers?.nom && <span>· {r.chantiers.nom}</span>}
                              <span>
                                ·{" "}
                                {format(new Date(r.created_at), "dd MMM yyyy", {
                                  locale: fr,
                                })}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                  <div className="text-xs text-muted-foreground text-right pr-1">
                    {counts[activeTab]} rapport(s)
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
