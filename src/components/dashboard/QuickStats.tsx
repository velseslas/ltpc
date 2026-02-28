import { Building2, HardHat, Users, Loader2 } from "lucide-react";

interface QuickStatsProps {
  clients: number;
  chantiers: number;
  intervenants: number;
  isLoading?: boolean;
}

export function QuickStats({ clients, chantiers, intervenants, isLoading }: QuickStatsProps) {
  const stats = [
    {
      label: "Clients",
      value: clients,
      icon: Building2,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Chantiers",
      value: chantiers,
      icon: HardHat,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
    {
      label: "Intervenants",
      value: intervenants,
      icon: Users,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="rounded-xl bg-card border border-border p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card border border-border p-6">
      <h3 className="font-display font-semibold text-foreground mb-4">
        Aperçu Rapide
      </h3>
      <div className="space-y-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
            <span className="text-lg font-bold text-foreground">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
