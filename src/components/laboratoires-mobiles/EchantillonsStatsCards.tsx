import { FlaskConical, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface EchantillonsStatsCardsProps {
  total: number;
  enCours: number;
  termines: number;
  aFaire: number;
}

export function EchantillonsStatsCards({ total, enCours, termines, aFaire }: EchantillonsStatsCardsProps) {
  const stats = [
    {
      title: "Total échantillons",
      value: total,
      icon: FlaskConical,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "En cours",
      value: enCours,
      icon: Clock,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-500",
    },
    {
      title: "Terminés",
      value: termines,
      icon: CheckCircle2,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
    },
    {
      title: "À faire",
      value: aFaire,
      icon: AlertTriangle,
      iconBg: "bg-sky-500/10",
      iconColor: "text-sky-500",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${stat.iconBg}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
