import { useNavigate } from "react-router-dom";
import { Bot, FileCheck, AlertTriangle, FlaskConical, FileText, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardAIStats } from "@/hooks/useDashboardWidgets";

const items = [
  { key: "rapportsAnalysesAujourdhui", label: "Rapports analysés (jour)", icon: FileText, color: "text-cyan-400" },
  { key: "rapportsAValider", label: "Rapports à valider", icon: FileCheck, color: "text-amber-400" },
  { key: "alertesOuvertes", label: "Alertes IA ouvertes", icon: AlertTriangle, color: "text-rose-400" },
  { key: "anomaliesDetectees", label: "Anomalies détectées", icon: Sparkles, color: "text-orange-400" },
  { key: "formulationsAVerifier", label: "Formulations à vérifier", icon: FlaskConical, color: "text-purple-400" },
  { key: "documentsAnalyses", label: "Documents analysés (jour)", icon: FileText, color: "text-emerald-400" },
] as const;

export function DashboardAIWidget() {
  const navigate = useNavigate();
  const { data, isLoading } = useDashboardAIStats();

  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6 box-glow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl gradient-primary box-glow">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
              LTPC AI
              <Sparkles className="w-4 h-4 text-primary" />
            </h3>
            <p className="text-xs text-muted-foreground">Copilote intelligent du laboratoire</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/ltpc-ai")}>
          Ouvrir LTPC AI <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : data?.isEmpty ? (
        <div className="py-8 text-center text-muted-foreground">Aucune analyse en attente.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {items.map((it) => {
            const Icon = it.icon;
            const value = (data?.[it.key as keyof typeof data] as number) ?? 0;
            return (
              <div key={it.key} className="rounded-lg border border-border/50 bg-card/60 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${it.color}`} />
                  <span className="text-2xl font-display font-bold text-foreground">{value}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-tight">{it.label}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DashboardAIWidget;
