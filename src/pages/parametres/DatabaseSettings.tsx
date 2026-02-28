import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Database, Download, Upload, Trash2, RefreshCw, HardDrive, Clock, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const DatabaseSettings = () => {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Données de démonstration
  const dbStats = {
    tailleTotal: "245 MB",
    tailleUtilisee: 245,
    tailleLimite: 500,
    nombreTables: 24,
    nombreEnregistrements: 15847,
    derniereOptimisation: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    derniereBackup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    version: "PostgreSQL 15.4",
  };

  const tables = [
    { nom: "echantillons_compression", enregistrements: 2450, taille: "45 MB" },
    { nom: "echantillons_granulometrie", enregistrements: 1890, taille: "32 MB" },
    { nom: "clients", enregistrements: 156, taille: "2.4 MB" },
    { nom: "chantiers", enregistrements: 342, taille: "5.6 MB" },
    { nom: "intervenants", enregistrements: 48, taille: "1.2 MB" },
    { nom: "formulations", enregistrements: 234, taille: "8.5 MB" },
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

  const usagePercent = (dbStats.tailleUtilisee / dbStats.tailleLimite) * 100;

  return (
    <div className="space-y-6 animate-fade-in">
      <AppBreadcrumb items={[
        { label: "Paramètres", path: "/parametres" },
        { label: "Base de données" },
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
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-slate-500 to-gray-600">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Base de <span className="text-primary">données</span>
            </h1>
            <p className="text-muted-foreground">
              Configuration et maintenance de la base de données
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <Database className="h-5 w-5 text-emerald-500" />
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
                <CheckCircle className="h-5 w-5 text-blue-500" />
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
              <div className="p-2 rounded-lg bg-violet-500/10">
                <Clock className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-sm font-bold">
                  {format(new Date(dbStats.derniereBackup), "dd/MM HH:mm", { locale: fr })}
                </p>
                <p className="text-xs text-muted-foreground">Dernière sauvegarde</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Espace de stockage */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Espace de stockage</CardTitle>
            <CardDescription>
              Utilisation de l'espace disque de la base de données
            </CardDescription>
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

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Version: {dbStats.version}</p>
              <p className="text-sm text-muted-foreground">
                Dernière optimisation: {format(new Date(dbStats.derniereOptimisation), "dd MMMM yyyy", { locale: fr })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Actions de maintenance</CardTitle>
            <CardDescription>
              Opérations de maintenance et sauvegarde
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Exporter la base de données
            </Button>

            <Button variant="outline" className="w-full justify-start gap-3">
              <Upload className="h-4 w-4" />
              Importer des données
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start gap-3"
              onClick={handleOptimize}
              disabled={isOptimizing}
            >
              {isOptimizing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Optimiser la base de données
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start gap-3 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Vider le cache
            </Button>
          </CardContent>
        </Card>

        {/* Tables */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm lg:col-span-2">
          <CardHeader>
            <CardTitle>Tables principales</CardTitle>
            <CardDescription>
              Aperçu des tables les plus volumineuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tables.map((table) => (
                <div 
                  key={table.nom}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium font-mono text-sm">{table.nom}</p>
                      <p className="text-xs text-muted-foreground">
                        {table.enregistrements.toLocaleString()} enregistrements
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{table.taille}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DatabaseSettings;
