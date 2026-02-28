import { ArrowDown, Thermometer, Clock, Wind, TrendingUp, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBetonFraisStats } from "@/hooks/useBetonFraisStats";

export function BetonFraisStatsCards() {
  const { data: stats, isLoading } = useBetonFraisStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const essaiTypes = [
    {
      id: "affaissement",
      title: "Affaissement",
      icon: ArrowDown,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-500/10 to-cyan-500/10",
      stats: stats?.affaissement,
    },
    {
      id: "temperature",
      title: "Température",
      icon: Thermometer,
      gradient: "from-red-500 to-orange-500",
      bgGradient: "from-red-500/10 to-orange-500/10",
      stats: stats?.temperature,
    },
    {
      id: "temps-prise",
      title: "Temps de Prise",
      icon: Clock,
      gradient: "from-amber-500 to-yellow-500",
      bgGradient: "from-amber-500/10 to-yellow-500/10",
      stats: stats?.tempsPrise,
    },
    {
      id: "teneur-air",
      title: "Teneur en Air",
      icon: Wind,
      gradient: "from-cyan-500 to-teal-500",
      bgGradient: "from-cyan-500/10 to-teal-500/10",
      stats: stats?.teneurAir,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Échantillons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats?.global.total || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-border bg-gradient-to-br from-blue-500/5 to-blue-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              À Faire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{stats?.global.aFaire || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-border bg-gradient-to-br from-amber-500/5 to-amber-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-amber-500" />
              En Cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">{stats?.global.enCours || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-border bg-gradient-to-br from-green-500/5 to-green-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Terminés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{stats?.global.termine || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Per-Test Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {essaiTypes.map((essai) => (
          <Card key={essai.id} className={`border-border bg-gradient-to-br ${essai.bgGradient}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${essai.gradient}`}>
                  <essai.icon className="w-5 h-5 text-white" />
                </div>
                <Badge variant="outline" className="text-xs">
                  {essai.stats?.total || 0} total
                </Badge>
              </div>
              <CardTitle className="text-base font-semibold mt-2">{essai.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground">À faire:</span>
                  <span className="font-medium">{essai.stats?.aFaire || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-muted-foreground">En cours:</span>
                  <span className="font-medium">{essai.stats?.enCours || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">Terminés:</span>
                  <span className="font-medium">{essai.stats?.termine || 0}</span>
                </div>
              </div>
              
              {/* Progress bar */}
              {(essai.stats?.total || 0) > 0 && (
                <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden flex">
                  <div 
                    className="bg-blue-500 transition-all"
                    style={{ width: `${((essai.stats?.aFaire || 0) / (essai.stats?.total || 1)) * 100}%` }}
                  />
                  <div 
                    className="bg-amber-500 transition-all"
                    style={{ width: `${((essai.stats?.enCours || 0) / (essai.stats?.total || 1)) * 100}%` }}
                  />
                  <div 
                    className="bg-green-500 transition-all"
                    style={{ width: `${((essai.stats?.termine || 0) / (essai.stats?.total || 1)) * 100}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
