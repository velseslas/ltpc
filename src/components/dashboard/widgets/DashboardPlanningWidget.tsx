import { useState } from "react";
import { Calendar, Loader2, FlaskConical, Users, Truck, Gauge } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { usePlanning, PlanningRange, PlanningItem } from "@/hooks/useDashboardWidgets";
import { cn } from "@/lib/utils";

const TABS: { key: PlanningRange; label: string }[] = [
  { key: "today", label: "Aujourd'hui" },
  { key: "week", label: "Cette semaine" },
  { key: "month", label: "Ce mois" },
];

const TYPE_META: Record<PlanningItem["type"], { label: string; icon: any; color: string }> = {
  essai: { label: "Essai", icon: FlaskConical, color: "text-cyan-400 bg-cyan-500/10" },
  intervention: { label: "Intervention", icon: Users, color: "text-purple-400 bg-purple-500/10" },
  labo_mobile: { label: "Labo mobile", icon: Truck, color: "text-emerald-400 bg-emerald-500/10" },
  etalonnage: { label: "Étalonnage", icon: Gauge, color: "text-amber-400 bg-amber-500/10" },
  echeance: { label: "Échéance", icon: Calendar, color: "text-rose-400 bg-rose-500/10" },
};

export function DashboardPlanningWidget() {
  const [range, setRange] = useState<PlanningRange>("today");
  const { data = [], isLoading } = usePlanning(range);

  return (
    <div className="rounded-xl bg-card border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">Planning</h3>
            <p className="text-xs text-muted-foreground">Essais, missions, étalonnages, échéances</p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-muted/40 p-1">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setRange(t.key)}
              className={cn("px-3 py-1 text-xs rounded-md transition",
                range === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : data.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Aucun événement planifié.</div>
        ) : (
          data.map((it) => {
            const meta = TYPE_META[it.type];
            const Icon = meta.icon;
            return (
              <div key={it.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/40 transition">
                <div className={cn("p-2 rounded-lg", meta.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{it.titre}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {it.chantier || "—"}{it.responsable ? ` · ${it.responsable}` : ""}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground shrink-0">
                  <div>{it.date ? format(parseISO(it.date), "dd MMM", { locale: fr }) : "—"}</div>
                  {it.heure && <div className="text-primary">{it.heure.slice(0, 5)}</div>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default DashboardPlanningWidget;
