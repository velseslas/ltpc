import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Database, RefreshCw, HardDrive, AlertTriangle, Loader2, Shield,
  Activity, Server, Zap, BarChart3, Table2, Layers, ArrowUpDown, Search, Clock,
} from "lucide-react";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useDatabaseStats, formatBytes, type DatabaseTableStat } from "@/hooks/useDatabaseStats";

function formatUptime(startedAt: string, now: string): string {
  const ms = new Date(now).getTime() - new Date(startedAt).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `${days} j ${hours} h`;
  if (hours > 0) return `${hours} h ${minutes} min`;
  return `${minutes} min`;
}

const DatabaseSettings = () => {
  const navigate = useNavigate();
  const { data, isLoading, isFetching, error, refetch } = useDatabaseStats();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"taille" | "enregistrements" | "nom">("taille");

  const tables: DatabaseTableStat[] = data?.tables ?? [];

  const totalRecords = useMemo(
    () => tables.reduce((acc, t) => acc + (t.enregistrements ?? 0), 0),
    [tables],
  );

  const tablesSansRls = useMemo(() => tables.filter((t) => !t.rls), [tables]);

  const filteredTables = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? tables.filter((t) => t.nom.toLowerCase().includes(q)) : [...tables];
    return list.sort((a, b) => {
      if (sortBy === "nom") return a.nom.localeCompare(b.nom);
      if (sortBy === "enregistrements") return b.enregistrements - a.enregistrements;
      return b.taille_bytes - a.taille_bytes;
    });
  }, [tables, search, sortBy]);

  const topTables = useMemo(
    () => [...tables].sort((a, b) => b.taille_bytes - a.taille_bytes).slice(0, 8),
    [tables],
  );
  const totalTablesSize = useMemo(
    () => tables.reduce((acc, t) => acc + (t.taille_bytes ?? 0), 0) || 1,
    [tables],
  );

  const connexionPercent = data ? (data.connections_active / Math.max(data.connections_max, 1)) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <AppBreadcrumb items={[
        { label: "Paramètres", path: "/parametres" },
        { label: "Base de données" },
      ]} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-slate-500 to-gray-600">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Base de <span className="text-primary">données</span>
              </h1>
              <p className="text-muted-foreground">Données réelles issues du serveur PostgreSQL</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <>
              <Badge variant="outline" className="gap-1.5 border-emerald-500/30 text-emerald-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                En ligne
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                PostgreSQL {data.version}
              </Badge>
            </>
          )}
          <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Actualiser
          </Button>
        </div>
      </div>

      {isLoading && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-10 flex items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement des statistiques réelles…
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Impossible de charger les statistiques</p>
              <p className="text-sm text-muted-foreground">
                {(error as Error).message} — cette page est réservée aux administrateurs.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <HardDrive className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatBytes(data.database_size_bytes)}</p>
                    <p className="text-xs text-muted-foreground">Taille de la base</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Table2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{tables.length}</p>
                    <p className="text-xs text-muted-foreground">Tables</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Layers className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalRecords.toLocaleString("fr-FR")}</p>
                    <p className="text-xs text-muted-foreground">Enregistrements</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Activity className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.connections_active}</p>
                    <p className="text-xs text-muted-foreground">Connexions actives</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <Clock className="h-5 w-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatUptime(data.started_at, data.now)}</p>
                    <p className="text-xs text-muted-foreground">Uptime serveur</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="overview" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger value="tables" className="gap-2">
                <Table2 className="h-4 w-4" />
                Tables
              </TabsTrigger>
              <TabsTrigger value="performance" className="gap-2">
                <Zap className="h-4 w-4" />
                Performance
              </TabsTrigger>
            </TabsList>

            {/* Vue d'ensemble */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HardDrive className="h-5 w-5 text-primary" />
                      Espace de stockage
                    </CardTitle>
                    <CardDescription>Tables les plus volumineuses (données + index)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {topTables.map((t) => (
                      <div key={t.nom} className="space-y-1">
                        <div className="flex justify-between text-xs gap-2">
                          <span className="text-muted-foreground font-mono truncate">{t.nom}</span>
                          <span className="font-medium whitespace-nowrap">{formatBytes(t.taille_bytes)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${Math.max((t.taille_bytes / totalTablesSize) * 100, 1)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {topTables.length === 0 && (
                      <p className="text-sm text-muted-foreground">Aucune table.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="h-5 w-5 text-emerald-500" />
                      Santé du serveur
                    </CardTitle>
                    <CardDescription>Mesures en direct du serveur PostgreSQL</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          Connexions
                        </span>
                        <span className="font-medium">{data.connections_active} / {data.connections_max}</span>
                      </div>
                      <Progress value={connexionPercent} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-muted-foreground" />
                          Cache Hit Ratio
                        </span>
                        <span className="font-medium">{Number(data.cache_hit_ratio).toFixed(2)}%</span>
                      </div>
                      <Progress value={Number(data.cache_hit_ratio)} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                          Utilisation des index
                        </span>
                        <span className="font-medium">{Number(data.index_usage_ratio).toFixed(2)}%</span>
                      </div>
                      <Progress value={Number(data.index_usage_ratio)} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/50">
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">Version</p>
                        <p className="text-sm font-medium">PostgreSQL {data.version}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">Démarré le</p>
                        <p className="text-sm font-medium">
                          {format(new Date(data.started_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">Transactions validées</p>
                        <p className="text-sm font-medium">{data.transactions_committed?.toLocaleString("fr-FR")}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">Interblocages (deadlocks)</p>
                        <p className="text-sm font-medium">{data.deadlocks}</p>
                      </div>
                    </div>

                    <div className={`flex items-center gap-2 p-3 rounded-lg ${tablesSansRls.length ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                      <Shield className="h-4 w-4" />
                      <span className="text-sm">
                        {tablesSansRls.length
                          ? `${tablesSansRls.length} table(s) sans sécurité RLS activée`
                          : "Sécurité RLS activée sur toutes les tables"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tables */}
            <TabsContent value="tables" className="space-y-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Table2 className="h-5 w-5 text-primary" />
                        Tables de la base de données
                      </CardTitle>
                      <CardDescription>
                        {tables.length} tables · {totalRecords.toLocaleString("fr-FR")} enregistrements au total
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Rechercher une table…"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="pl-8 w-full md:w-64"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 whitespace-nowrap"
                        onClick={() =>
                          setSortBy(sortBy === "taille" ? "enregistrements" : sortBy === "enregistrements" ? "nom" : "taille")
                        }
                      >
                        <ArrowUpDown className="h-4 w-4" />
                        {sortBy === "taille" ? "Taille" : sortBy === "enregistrements" ? "Lignes" : "Nom"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-border/50 overflow-x-auto">
                    <div className="min-w-[720px]">
                      <div className="grid grid-cols-12 gap-2 p-3 bg-muted/40 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <div className="col-span-4">Table</div>
                        <div className="col-span-2 text-right">Enregistrements</div>
                        <div className="col-span-2 text-right">Taille</div>
                        <div className="col-span-2 text-center">Index</div>
                        <div className="col-span-2 text-center">Sécurité RLS</div>
                      </div>
                      {filteredTables.map((table, i) => (
                        <div
                          key={table.nom}
                          className={`grid grid-cols-12 gap-2 p-3 items-center text-sm transition-colors hover:bg-muted/20 ${i !== filteredTables.length - 1 ? "border-b border-border/30" : ""}`}
                        >
                          <div className="col-span-4 flex items-center gap-2">
                            <Database className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-mono text-xs truncate">{table.nom}</span>
                          </div>
                          <div className="col-span-2 text-right font-medium">
                            {table.enregistrements.toLocaleString("fr-FR")}
                          </div>
                          <div className="col-span-2 text-right">
                            <Badge variant="outline" className="font-mono text-xs">{formatBytes(table.taille_bytes)}</Badge>
                          </div>
                          <div className="col-span-2 text-center">
                            <Badge variant="secondary" className="text-xs">{table.index} index</Badge>
                          </div>
                          <div className="col-span-2 text-center">
                            {table.rls ? (
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs gap-1">
                                <Shield className="h-3 w-3" />
                                {table.policies} règle(s)
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Inactif
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      {filteredTables.length === 0 && (
                        <div className="p-6 text-center text-sm text-muted-foreground">Aucune table trouvée.</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ArrowUpDown className="h-5 w-5 text-primary" />
                      Tables les plus scannées séquentiellement
                    </CardTitle>
                    <CardDescription>Candidates à l'ajout d'index</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[...tables]
                      .sort((a, b) => b.seq_scan - a.seq_scan)
                      .slice(0, 8)
                      .map((t) => (
                        <div key={t.nom} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 gap-2">
                          <span className="font-mono text-xs truncate">{t.nom}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="text-xs">{t.seq_scan.toLocaleString("fr-FR")} seq</Badge>
                            <Badge variant="secondary" className="text-xs">{t.idx_scan.toLocaleString("fr-FR")} idx</Badge>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-emerald-500" />
                      Métriques de performance
                    </CardTitle>
                    <CardDescription>Indicateurs mesurés sur le serveur</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {[
                      { label: "Cache Hit Ratio", value: Number(data.cache_hit_ratio), icon: Zap, color: "text-emerald-500", status: Number(data.cache_hit_ratio) > 95 ? "Excellent" : "À surveiller" },
                      { label: "Utilisation des index", value: Number(data.index_usage_ratio), icon: ArrowUpDown, color: "text-blue-500", status: Number(data.index_usage_ratio) > 90 ? "Optimal" : "À optimiser" },
                      { label: "Connexions utilisées", value: connexionPercent, icon: Activity, color: "text-violet-500", status: connexionPercent < 50 ? "Normal" : "Élevé" },
                    ].map((metric) => (
                      <div key={metric.label} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm flex items-center gap-2">
                            <metric.icon className={`h-4 w-4 ${metric.color}`} />
                            {metric.label}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{metric.value.toFixed(1)}%</span>
                            <Badge variant="outline" className="text-xs">{metric.status}</Badge>
                          </div>
                        </div>
                        <Progress value={metric.value} className="h-2" />
                      </div>
                    ))}

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/50">
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">Transactions annulées</p>
                        <p className="text-sm font-medium">{data.transactions_rolled_back?.toLocaleString("fr-FR")}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">Interblocages</p>
                        <p className="text-sm font-medium">{data.deadlocks}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default DatabaseSettings;
