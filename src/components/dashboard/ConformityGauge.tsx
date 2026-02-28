import { CheckCircle, XCircle, Clock, Loader2, Target } from "lucide-react";
import { ConformityData } from "@/hooks/useDashboardStats";

interface ConformityGaugeProps {
  data: ConformityData;
  isLoading?: boolean;
}

export function ConformityGauge({ data, isLoading }: ConformityGaugeProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl bg-card border border-border p-6 h-80">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const { conforme, nonConforme, enAttente, total, tauxConformite } = data;

  // Calculate the stroke dash for the circular progress
  const circumference = 2 * Math.PI * 45;
  const strokeDash = (tauxConformite / 100) * circumference;

  return (
    <div className="rounded-xl bg-card border border-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Target className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground">
            Taux de Conformité
          </h3>
          <p className="text-xs text-muted-foreground">
            Résultats des essais
          </p>
        </div>
      </div>

      {/* Circular Progress */}
      <div className="flex justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="45"
              stroke="hsl(220, 20%, 18%)"
              strokeWidth="10"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="45"
              stroke={tauxConformite >= 80 ? "hsl(142, 71%, 45%)" : tauxConformite >= 50 ? "hsl(43, 96%, 56%)" : "hsl(0, 84%, 60%)"}
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - strokeDash}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-foreground">
              {tauxConformite}%
            </span>
          </div>
        </div>
      </div>

      {/* Stats breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/10">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm text-foreground">Conformes</span>
          </div>
          <span className="text-sm font-semibold text-green-400">{conforme}</span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/10">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-foreground">Non conformes</span>
          </div>
          <span className="text-sm font-semibold text-red-400">{nonConforme}</span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-yellow-500/10">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-foreground">En attente</span>
          </div>
          <span className="text-sm font-semibold text-yellow-400">{enAttente}</span>
        </div>

        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total essais</span>
            <span className="text-sm font-semibold text-foreground">{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
