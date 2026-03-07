import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Database, Download, Upload, Trash2, RefreshCw, HardDrive, Clock, 
  CheckCircle, AlertTriangle, Loader2, Shield, Activity, Server, Zap, 
  FileText, BarChart3, Lock, Eye, History, Table2, Layers, ArrowUpDown
} from "lucide-react";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const DatabaseSettings = () => {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  const dbStats = {
    tailleTotal: "245 MB",
    tailleUtilisee: 245,
    tailleLimite: 500,
    nombreTables: 24,
    nombreEnregistrements: 15847,
    derniereOptimisation: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    derniereBackup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    version: "PostgreSQL 15.4",
    uptime: "99.98%",
    connexionsActives: 12,
    connexionsMax: 100,
    cacheHitRatio: 97.3,
    tempsReponseMoyen: "4.2 ms",
    indexUtilisation: 94.5,
  };

  const tables = [
    { nom: "echantillons_compression", enregistrements: 2450, taille: "45 MB", index: 3, rls: true },
    { nom: "echantillons_granulometrie", enregistrements: 1890, taille: "32 MB", index: 2, rls: true },
    { nom: "echantillons_affaissement", enregistrements: 1230, taille: "18 MB", index: 2, rls: true },
    { nom: "formulations", enregistrements: 234, taille: "8.5 MB", index: 2, rls: true },
    { nom: "chantiers", enregistrements: 342, taille: "5.6 MB", index: 3, rls: true },
    { nom: "clients", enregistrements: 156, taille: "2.4 MB", index: 2, rls: true },
    { nom: "intervenants", enregistrements: 48, taille: "1.2 MB", index: 1, rls: true },
    { nom: "factures", enregistrements: 520, taille: "12.3 MB", index: 2, rls: true },
    { nom: "contrats", enregistrements: 89, taille: "3.1 MB", index: 1, rls: true },
    { nom: "materiel_laboratoire", enregistrements: 67, taille: "1.8 MB", index: 1, rls: true },
  ];

  const backupHistory = [
    { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), taille: "243 MB", type: "Automatique", statut: "success" },
    { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), taille: "241 MB", type: "Automatique", statut: "success" },
    { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), taille: "240 MB", type: "Manuelle", statut: "success" },
    { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), taille: "238 MB", type: "Automatique", statut: "success" },
    { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), taille: "235 MB", type: "Automatique", statut: "warning" },
  ];

  const recentQueries = [
    { query: "SELECT * FROM echantillons_compression", temps: "12 ms", frequence: "haute" },
    { query: "INSERT INTO echantillons_affaissement", temps: "8 ms", frequence: "moyenne" },
    { query: "UPDATE formulations SET ...", temps: "5 ms", frequence: "basse" },
    { query: "SELECT * FROM clients JOIN chantiers", temps: "23 ms", frequence: "haute" },
    { query: "DELETE FROM journal_audit WHERE ...", temps: "15 ms", frequence: "basse" },
  ];

  const storageBreakdown = [
    { categorie: "Échantillons béton", taille: 95, couleur: "bg-primary" },
    { categorie: "Échantillons granulats", taille: 50, couleur: "bg-blue-500" },
    { categorie: "Échantillons géotechnique", taille: 35, couleur: "bg-emerald-500" },
    { categorie: "Facturation", taille: 25, couleur: "bg-amber-500" },
    { categorie: "Clients & Chantiers", taille: 20, couleur: "bg-violet-500" },
    { categorie: "Autres", taille: 20, couleur: "bg-muted-foreground" },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast.success("Export de la base de données terminé");
    setIsExporting(false);
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    toast.success("Optimisation de la base de données terminée");
    setIsOptimizing(false);
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    await new Promise(resolve => setTimeout(resolve, 2500));
    toast.success("Sauvegarde manuelle créée avec succès");
    setIsBackingUp(false);
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success("Cache vidé avec succès");
    setIsClearingCache(false);
  };

  const usagePercent = (dbStats.tailleUtilisee / dbStats.tailleLimite) * 100;
  const connexionPercent = (dbStats.connexionsActives / dbStats.connexionsMax) * 100;
  const totalStorage = storageBreakdown.reduce((a, b) => a + b.taille, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <AppBreadcrumb items={[
        { label: "Paramètres", path: "/parametres" },
        { label: "Base de données" },
      ]} />

      {/* Header */}
      <div className="flex items-center justify-between">
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
              <p className="text-muted-foreground">
                Surveillance, maintenance et configuration
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 border-emerald-500/30 text-emerald-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            En ligne
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">
            {dbStats.version}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <HardDrive className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dbStats.tailleTotal}</p>
                <p className="text-xs text-muted-foreground">Espace utilisé</p>
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
                <p className="text-2xl font-bold">{dbStats.nombreTables}</p>
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
                <p className="text-2xl font-bold">{dbStats.nombreEnregistrements.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Enregistrements</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Zap className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dbStats.tempsReponseMoyen}</p>
                <p className="text-xs text-muted-foreground">Temps de réponse</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <Activity className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dbStats.uptime}</p>
                <p className="text-xs text-muted-foreground">Disponibilité</p>
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
          <TabsTrigger value="backups" className="gap-2">
            <History className="h-4 w-4" />
            Sauvegardes
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <Zap className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Maintenance
          </TabsTrigger>
        </TabsList>

        {/* Tab: Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Espace de stockage */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-primary" />
                  Espace de stockage
                </CardTitle>
                <CardDescription>Répartition de l'espace disque</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{dbStats.tailleUtilisee} MB utilisés</span>
                    <span>{dbStats.tailleLimite} MB disponibles</span>
                  </div>
                  <Progress value={usagePercent} className="h-3" />
                  <p className="text-xs text-muted-foreground text-right">
                    {usagePercent.toFixed(1)}% utilisé
                  </p>
                </div>

                {usagePercent > 80 && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-500">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">L'espace de stockage est presque plein</span>
                  </div>
                )}

                {/* Storage breakdown */}
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <p className="text-sm font-medium">Répartition par catégorie</p>
                  {storageBreakdown.map((item) => (
                    <div key={item.categorie} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{item.categorie}</span>
                        <span className="font-medium">{item.taille} MB</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${item.couleur} transition-all`}
                          style={{ width: `${(item.taille / totalStorage) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Connexions & Santé */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-emerald-500" />
                  Santé du serveur
                </CardTitle>
                <CardDescription>État actuel de la base de données</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Connexions */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      Connexions actives
                    </span>
                    <span className="font-medium">{dbStats.connexionsActives} / {dbStats.connexionsMax}</span>
                  </div>
                  <Progress value={connexionPercent} className="h-2" />
                </div>

                {/* Cache Hit Ratio */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      Cache Hit Ratio
                    </span>
                    <span className="font-medium">{dbStats.cacheHitRatio}%</span>
                  </div>
                  <Progress value={dbStats.cacheHitRatio} className="h-2" />
                </div>

                {/* Index Utilisation */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                      Utilisation des index
                    </span>
                    <span className="font-medium">{dbStats.indexUtilisation}%</span>
                  </div>
                  <Progress value={dbStats.indexUtilisation} className="h-2" />
                </div>

                {/* Info supplémentaires */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/50">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Version</p>
                    <p className="text-sm font-medium">{dbStats.version}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Dernière optimisation</p>
                    <p className="text-sm font-medium">
                      {format(new Date(dbStats.derniereOptimisation), "dd/MM/yyyy", { locale: fr })}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Temps de réponse</p>
                    <p className="text-sm font-medium">{dbStats.tempsReponseMoyen}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Disponibilité</p>
                    <p className="text-sm font-medium">{dbStats.uptime}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Tables */}
        <TabsContent value="tables" className="space-y-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Table2 className="h-5 w-5 text-primary" />
                    Tables de la base de données
                  </CardTitle>
                  <CardDescription>
                    {tables.length} tables · {dbStats.nombreEnregistrements.toLocaleString()} enregistrements au total
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border/50 overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 p-3 bg-muted/40 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <div className="col-span-4">Table</div>
                  <div className="col-span-2 text-right">Enregistrements</div>
                  <div className="col-span-2 text-right">Taille</div>
                  <div className="col-span-2 text-center">Index</div>
                  <div className="col-span-2 text-center">Sécurité RLS</div>
                </div>
                {/* Rows */}
                {tables.map((table, i) => (
                  <div 
                    key={table.nom}
                    className={`grid grid-cols-12 gap-2 p-3 items-center text-sm transition-colors hover:bg-muted/20 ${i !== tables.length - 1 ? 'border-b border-border/30' : ''}`}
                  >
                    <div className="col-span-4 flex items-center gap-2">
                      <Database className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-mono text-xs truncate">{table.nom}</span>
                    </div>
                    <div className="col-span-2 text-right font-medium">
                      {table.enregistrements.toLocaleString()}
                    </div>
                    <div className="col-span-2 text-right">
                      <Badge variant="outline" className="font-mono text-xs">{table.taille}</Badge>
                    </div>
                    <div className="col-span-2 text-center">
                      <Badge variant="secondary" className="text-xs">{table.index} index</Badge>
                    </div>
                    <div className="col-span-2 text-center">
                      {table.rls ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs gap-1">
                          <Shield className="h-3 w-3" />
                          Actif
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Sauvegardes */}
        <TabsContent value="backups" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Historique des sauvegardes
                </CardTitle>
                <CardDescription>
                  Les 5 dernières sauvegardes de la base de données
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {backupHistory.map((backup, i) => (
                    <div 
                      key={i}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${backup.statut === 'success' ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                          {backup.statut === 'success' ? (
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {format(backup.date, "EEEE dd MMMM yyyy", { locale: fr })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(backup.date, "HH:mm", { locale: fr })} · {backup.taille}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={backup.type === "Automatique" ? "secondary" : "outline"} className="text-xs">
                          {backup.type}
                        </Badge>
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
                          <Download className="h-3.5 w-3.5" />
                          Restaurer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-500" />
                  Politique de sauvegarde
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm">Fréquence</span>
                    <Badge variant="outline">Quotidienne</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm">Rétention</span>
                    <Badge variant="outline">30 jours</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm">Chiffrement</span>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs gap-1">
                      <Lock className="h-3 w-3" />
                      AES-256
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm">Dernière</span>
                    <span className="text-sm font-medium">
                      {format(new Date(dbStats.derniereBackup), "dd/MM HH:mm", { locale: fr })}
                    </span>
                  </div>
                </div>

                <Button 
                  className="w-full gap-2" 
                  onClick={handleBackup}
                  disabled={isBackingUp}
                >
                  {isBackingUp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Créer une sauvegarde
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Performance */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Requêtes récentes */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Requêtes fréquentes
                </CardTitle>
                <CardDescription>Aperçu des requêtes les plus exécutées</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentQueries.map((q, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/30 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <code className="text-xs font-mono text-muted-foreground break-all leading-relaxed">
                          {q.query}
                        </code>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs gap-1">
                          <Clock className="h-3 w-3" />
                          {q.temps}
                        </Badge>
                        <Badge 
                          variant="secondary"
                          className={`text-xs ${
                            q.frequence === 'haute' ? 'bg-primary/10 text-primary' :
                            q.frequence === 'moyenne' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-muted text-muted-foreground'
                          }`}
                        >
                          {q.frequence}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Métriques de performance */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-500" />
                  Métriques de performance
                </CardTitle>
                <CardDescription>Indicateurs clés de performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {[
                  { label: "Cache Hit Ratio", value: dbStats.cacheHitRatio, suffix: "%", color: "text-emerald-500", icon: Zap, status: dbStats.cacheHitRatio > 95 ? "Excellent" : "Bon" },
                  { label: "Utilisation des index", value: dbStats.indexUtilisation, suffix: "%", color: "text-blue-500", icon: ArrowUpDown, status: dbStats.indexUtilisation > 90 ? "Optimal" : "À optimiser" },
                  { label: "Connexions utilisées", value: connexionPercent, suffix: "%", color: "text-violet-500", icon: Activity, status: connexionPercent < 50 ? "Normal" : "Élevé" },
                ].map((metric) => (
                  <div key={metric.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <metric.icon className={`h-4 w-4 ${metric.color}`} />
                        {metric.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{metric.value.toFixed(1)}{metric.suffix}</span>
                        <Badge variant="outline" className="text-xs">{metric.status}</Badge>
                      </div>
                    </div>
                    <Progress value={metric.value} className="h-2" />
                  </div>
                ))}

                <div className="pt-4 border-t border-border/50 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm">État global</span>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      Sain
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tous les indicateurs sont dans les seuils normaux. La base de données fonctionne de manière optimale.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Maintenance */}
        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-primary" />
                  Actions de maintenance
                </CardTitle>
                <CardDescription>Opérations de maintenance et administration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3 h-12"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <div className="text-left">
                    <p className="text-sm font-medium">Exporter la base de données</p>
                    <p className="text-xs text-muted-foreground">Télécharger un dump SQL complet</p>
                  </div>
                </Button>

                <Button variant="outline" className="w-full justify-start gap-3 h-12">
                  <Upload className="h-4 w-4" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Importer des données</p>
                    <p className="text-xs text-muted-foreground">Restaurer depuis un fichier SQL</p>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3 h-12"
                  onClick={handleOptimize}
                  disabled={isOptimizing}
                >
                  {isOptimizing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <div className="text-left">
                    <p className="text-sm font-medium">Optimiser la base de données</p>
                    <p className="text-xs text-muted-foreground">VACUUM et réindexation des tables</p>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive"
                  onClick={handleClearCache}
                  disabled={isClearingCache}
                >
                  {isClearingCache ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <div className="text-left">
                    <p className="text-sm font-medium">Vider le cache</p>
                    <p className="text-xs text-muted-foreground">Purger les données en cache</p>
                  </div>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-500" />
                  Journal de maintenance
                </CardTitle>
                <CardDescription>Dernières opérations effectuées</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { action: "Sauvegarde automatique", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), statut: "success", detail: "243 MB sauvegardés" },
                    { action: "Optimisation VACUUM", date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), statut: "success", detail: "12 MB récupérés" },
                    { action: "Réindexation", date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), statut: "success", detail: "24 index reconstruits" },
                    { action: "Nettoyage du cache", date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), statut: "success", detail: "Cache purgé (45 MB)" },
                    { action: "Export manuel", date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), statut: "success", detail: "Dump SQL complet" },
                  ].map((log, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">{log.action}</p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(log.date, "dd/MM/yyyy", { locale: fr })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{log.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DatabaseSettings;
