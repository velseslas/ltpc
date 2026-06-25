import { MapPin, Building2, Users, FlaskConical, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AdminStatsCardsProps {
  wilayasCount: number;
  chantiersCount: number;
  techniciensCount: number;
  essaisCount: number;
  tauxReussite: number;
  hideTechniciens?: boolean;
}

export function AdminStatsCards({
  wilayasCount,
  chantiersCount,
  techniciensCount,
  essaisCount,
  tauxReussite,
  hideTechniciens = false,
}: AdminStatsCardsProps) {
  const stats = [
    {
      title: "Nombre de Wilayas",
      value: wilayasCount,
      subtitle: "Couverture territoriale",
      icon: MapPin,
    },
    {
      title: "Chantiers Total",
      value: chantiersCount,
      subtitle: "Tous projets confondus",
      icon: Building2,
    },
    ...(hideTechniciens
      ? []
      : [{
          title: "Techniciens",
          value: techniciensCount,
          subtitle: "Personnel actif",
          icon: Users,
        }]),
    {
      title: "Essais du mois",
      value: essaisCount,
      subtitle: "Mois en cours",
      icon: FlaskConical,
    },
    {
      title: "Taux de réussite",
      value: `${tauxReussite}%`,
      subtitle: "Conformité essais",
      icon: TrendingUp,
    },
  ];

  const gridCols = hideTechniciens
    ? "grid gap-4 grid-cols-2 md:grid-cols-4"
    : "grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5";

  return (
    <div className={gridCols}>
      {stats.map((stat, index) => (
        <Card key={index} className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{stat.title}</span>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold text-foreground">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
