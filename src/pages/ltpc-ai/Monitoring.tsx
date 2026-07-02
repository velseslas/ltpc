import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { AlertTriangle, Info, ShieldAlert, RefreshCw, Loader2, Check, X, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useProactiveAlerts, type AiAlert } from "@/hooks/useProactiveAlerts";
import { Link } from "react-router-dom";

const severityIcon = { critique: ShieldAlert, warning: AlertTriangle, info: Info } as const;
const severityStyle: Record<AiAlert["severity"], string> = {
  critique: "border-destructive/40 bg-destructive/5",
  warning: "border-amber-500/40 bg-amber-500/5",
  info: "border-primary/30 bg-primary/5",
};

function alertHref(a: AiAlert): string | null {
  if (!a.source_id) return null;
  if (a.source_type === "essai_compression") return `/essais/beton-durci/compression`;
  if (a.source_type === "formulation") return `/essais/formulation`;
  if (a.source_type === "materiel") return `/materiel/liste`;
  return null;
}

export default function Monitoring() {
  const { alerts, summary, loading, running, runScan, dismiss, resolve } = useProactiveAlerts();
  const counts = {
    critique: alerts.filter((a) => a.severity === "critique").length,
    warning: alerts.filter((a) => a.severity === "warning").length,
    info: alerts.filter((a) => a.severity === "info").length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <BackButton to="/ltpc-ai" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="h-6 w-6" /> Surveillance proactive LTPC AI</h1>
          <p className="text-sm text-muted-foreground">Détection d'anomalies quotidienne : compression, formulations, étalonnages.</p>
        </div>
        <Button onClick={runScan} disabled={running}>
          {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Lancer un scan
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Critiques</div><div className="text-3xl font-bold text-destructive">{counts.critique}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Warnings</div><div className="text-3xl font-bold text-amber-600">{counts.warning}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Info</div><div className="text-3xl font-bold text-primary">{counts.info}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Résumé quotidien</span>
            {summary && <Badge variant="secondary">{summary.summary_date}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{summary.contenu}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun résumé encore généré. Lancez un scan.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Alertes ouvertes ({alerts.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
          {!loading && alerts.length === 0 && <p className="text-sm text-muted-foreground">Aucune alerte ouverte. Tout est nominal.</p>}
          {alerts.map((a) => {
            const Icon = severityIcon[a.severity];
            const href = alertHref(a);
            return (
              <div key={a.id} className={`p-3 rounded-md border ${severityStyle[a.severity]}`}>
                <div className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${a.severity === "critique" ? "text-destructive" : a.severity === "warning" ? "text-amber-600" : "text-primary"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{a.title}</span>
                      <Badge variant="outline" className="text-[10px]">{a.code}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{a.message}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{new Date(a.created_at).toLocaleString("fr-FR")}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {href && <Button asChild size="sm" variant="ghost"><Link to={href}>Voir</Link></Button>}
                    <Button size="sm" variant="ghost" onClick={() => resolve(a.id)} title="Marquer résolu"><Check className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => dismiss(a.id)} title="Ignorer"><X className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
