import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { History, Search, ChevronRight, Lock } from "lucide-react";
import {
  useRapportsTechniques,
  type RapportStatut,
  STATUT_LABELS,
  STATUT_COLORS,
} from "@/hooks/useRapportsTechniques";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * P3/1 — Historique des rapports techniques.
 * Route dédiée `/essais/rapports-techniques/historique` (déclarée AVANT `/:id`
 * pour ne plus être capturée par la route de détail).
 *
 * Lecture seule : cette page ne fait qu'orienter vers le rapport. Les rapports
 * validés / archivés restent verrouillés en base (trigger `trg_guard_rapport_statut`)
 * et les permissions RLS existantes filtrent déjà ce que l'utilisateur peut voir.
 */
type TabKey = "brouillon" | "revision" | "valide" | "archive";

const TAB_STATUTS: Record<TabKey, RapportStatut[]> = {
  brouillon: ["brouillon", "en_cours"],
  revision: ["en_attente_validation", "a_completer", "refuse"],
  valide: ["valide"],
  archive: ["archive"],
};

const TAB_LABELS: Record<TabKey, string> = {
  brouillon: "Brouillons",
  revision: "En révision",
  valide: "Validés",
  archive: "Archivés",
};

export default function HistoriqueRapportsTechniques() {
  const [activeTab, setActiveTab] = useState<TabKey>("brouillon");
  const [search, setSearch] = useState("");

  const { data: rapports = [], isLoading } = useRapportsTechniques({
    statuts: TAB_STATUTS[activeTab],
    search: search.trim() || undefined,
  });

  const readOnly = useMemo(() => activeTab === "valide" || activeTab === "archive", [activeTab]);

  return (
    <div data-essai-mobile className="space-y-6">
      <AppBreadcrumb
        items={[
          { label: "Essais", path: "/essais" },
          { label: "Rapports techniques", path: "/essais/rapports-techniques" },
          { label: "Historique" },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <BackButton to="/essais/rapports-techniques" />
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-tight">
              Historique des rapports techniques
            </h1>
            <p className="text-sm text-muted-foreground">
              Consultez les rapports par statut : brouillon, en révision, validé, archivé.
            </p>
          </div>
        </div>
      </div>

      <div className="relative max-w-xl">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par numéro, titre ou description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
        <TabsList>
          {(Object.keys(TAB_LABELS) as TabKey[]).map((k) => (
            <TabsTrigger key={k} value={k}>
              {TAB_LABELS[k]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-2">
          {readOnly && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              Documents officiels figés : consultation et impression uniquement, aucune
              modification possible.
            </div>
          )}

          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Chargement…
              </CardContent>
            </Card>
          ) : rapports.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                Aucun rapport dans « {TAB_LABELS[activeTab]} ».
              </CardContent>
            </Card>
          ) : (
            <>
              {rapports.map((r) => (
                <Link key={r.id} to={`/essais/rapports-techniques/${r.id}`} className="block">
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
                        <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-3">
                          {r.clients?.nom && <span>{r.clients.nom}</span>}
                          {r.chantiers?.nom && <span>· {r.chantiers.nom}</span>}
                          <span>
                            · {format(new Date(r.created_at), "dd MMM yyyy", { locale: fr })}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
              <div className="text-xs text-muted-foreground text-right pr-1">
                {rapports.length} rapport(s)
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
