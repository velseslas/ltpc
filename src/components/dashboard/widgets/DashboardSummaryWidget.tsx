import { Sparkles, Loader2 } from "lucide-react";
import { useDashboardSummary } from "@/hooks/useDashboardWidgets";

export function DashboardSummaryWidget() {
  const { data, isLoading } = useDashboardSummary();

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl gradient-primary box-glow">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground">Résumé du laboratoire</h3>
          <p className="text-xs text-muted-foreground">Synthèse automatique de l'activité — prêt pour LTPC AI</p>
        </div>
      </div>
      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Génération du résumé…</div>
      ) : !data || data.points.length === 0 ? (
        <p className="text-muted-foreground">Aucune donnée disponible pour générer un résumé.</p>
      ) : (
        <ul className="space-y-2">
          {data.points.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-foreground/90">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span className="leading-relaxed">{p}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DashboardSummaryWidget;
