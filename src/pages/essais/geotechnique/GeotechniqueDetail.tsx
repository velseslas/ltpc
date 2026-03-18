import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Pencil, ClipboardEdit, FileText } from "lucide-react";
import { useEchantillonGeotechniqueById, getGeoPrefix } from "@/hooks/useEchantillonsGeotechniqueFactory";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

function pf(v: string | number) { return parseFloat(String(v)) || 0; }
function fmt(v: number) { return isNaN(v) || !isFinite(v) ? "-" : v.toFixed(2); }

function linearRegression(points: { x: number; y: number }[]) {
  if (points.length < 2) return { slope: 0, intercept: 0 };
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

interface LiqEssai { numero_tare: string; poids_tare: string; poids_tare_sol_humide: string; poids_tare_sol_sec: string; nombre_coups: string; }
interface PlasEssai { numero_tare: string; poids_tare: string; poids_tare_sol_humide: string; poids_tare_sol_sec: string; }

function LimitesAtterbergResultats({ resultats }: { resultats: Record<string, unknown> }) {
  const liquidite = (resultats.liquidite || []) as LiqEssai[];
  const plasticite = (resultats.plasticite || []) as PlasEssai[];
  const teneurEauW = resultats.teneur_eau_w ? String(resultats.teneur_eau_w) : "";

  const calcLiq = liquidite.map(e => {
    const ph = pf(e.poids_tare_sol_humide); const ps = pf(e.poids_tare_sol_sec); const pt = pf(e.poids_tare);
    const eau = ph - ps; const sol = ps - pt;
    const teneur = sol > 0 ? (eau / sol) * 100 : 0;
    return { eau, sol, teneur };
  });

  const calcPlas = plasticite.map(e => {
    const ph = pf(e.poids_tare_sol_humide); const ps = pf(e.poids_tare_sol_sec); const pt = pf(e.poids_tare);
    const eau = ph - ps; const sol = ps - pt;
    const teneur = sol > 0 ? (eau / sol) * 100 : 0;
    return { eau, sol, teneur };
  });

  const points = liquidite.map((e, i) => ({ x: pf(e.nombre_coups), y: calcLiq[i].teneur })).filter(p => p.x > 0 && p.y > 0);
  const { slope, intercept } = linearRegression(points);
  const wl = points.length >= 2 ? slope * 25 + intercept : 0;

  const wpValues = calcPlas.filter(c => c.teneur > 0);
  const wp = wpValues.length > 0 ? wpValues.reduce((s, c) => s + c.teneur, 0) / wpValues.length : 0;
  const ip = wl > 0 && wp > 0 ? wl - wp : 0;
  const w = pf(teneurEauW);
  const ic = ip > 0 && w > 0 ? (wl - w) / ip : 0;

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Résultats — Limite de Liquidité (Wl)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Essai</TableHead>
                  <TableHead className="text-muted-foreground">N° Tare</TableHead>
                  <TableHead className="text-muted-foreground">Poids tare (g)</TableHead>
                  <TableHead className="text-muted-foreground">P. tare+sol humide (g)</TableHead>
                  <TableHead className="text-muted-foreground">P. tare+sol sec (g)</TableHead>
                  <TableHead className="text-muted-foreground">Nbre coups</TableHead>
                  <TableHead className="text-muted-foreground">Poids eau (g)</TableHead>
                  <TableHead className="text-muted-foreground">Poids sol sec (g)</TableHead>
                  <TableHead className="text-muted-foreground">Teneur en eau (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liquidite.map((e, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell className="font-medium text-foreground">{i + 1}</TableCell>
                    <TableCell className="text-foreground">{e.numero_tare || "-"}</TableCell>
                    <TableCell className="text-foreground">{e.poids_tare || "-"}</TableCell>
                    <TableCell className="text-foreground">{e.poids_tare_sol_humide || "-"}</TableCell>
                    <TableCell className="text-foreground">{e.poids_tare_sol_sec || "-"}</TableCell>
                    <TableCell className="text-foreground">{e.nombre_coups || "-"}</TableCell>
                    <TableCell className="text-primary font-medium">{fmt(calcLiq[i].eau)}</TableCell>
                    <TableCell className="text-primary font-medium">{fmt(calcLiq[i].sol)}</TableCell>
                    <TableCell className="text-primary font-bold">{fmt(calcLiq[i].teneur)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Résultats — Limite de Plasticité (Wp)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Essai</TableHead>
                  <TableHead className="text-muted-foreground">N° Tare</TableHead>
                  <TableHead className="text-muted-foreground">Poids tare (g)</TableHead>
                  <TableHead className="text-muted-foreground">P. tare+sol humide (g)</TableHead>
                  <TableHead className="text-muted-foreground">P. tare+sol sec (g)</TableHead>
                  <TableHead className="text-muted-foreground">Poids eau (g)</TableHead>
                  <TableHead className="text-muted-foreground">Poids sol sec (g)</TableHead>
                  <TableHead className="text-muted-foreground">Teneur en eau (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plasticite.map((e, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell className="font-medium text-foreground">{i + 1}</TableCell>
                    <TableCell className="text-foreground">{e.numero_tare || "-"}</TableCell>
                    <TableCell className="text-foreground">{e.poids_tare || "-"}</TableCell>
                    <TableCell className="text-foreground">{e.poids_tare_sol_humide || "-"}</TableCell>
                    <TableCell className="text-foreground">{e.poids_tare_sol_sec || "-"}</TableCell>
                    <TableCell className="text-primary font-medium">{fmt(calcPlas[i].eau)}</TableCell>
                    <TableCell className="text-primary font-medium">{fmt(calcPlas[i].sol)}</TableCell>
                    <TableCell className="text-primary font-bold">{fmt(calcPlas[i].teneur)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Synthèse</CardTitle>
            {wl > 0 && ip > 0 && <AbaqueButton wl={wl} ip={ip} />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Wl (à 25 coups)</p>
              <p className="text-lg font-bold text-primary">{wl > 0 ? fmt(wl) + " %" : "-"}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Wp (moyenne)</p>
              <p className="text-lg font-bold text-primary">{wp > 0 ? fmt(wp) + " %" : "-"}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Ip = Wl − Wp</p>
              <p className="text-lg font-bold text-primary">{ip > 0 ? fmt(ip) + " %" : "-"}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">W naturelle</p>
              <p className="text-lg font-bold text-foreground">{w > 0 ? fmt(w) + " %" : "-"}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Ic = (Wl−W)/Ip</p>
              <p className="text-lg font-bold text-foreground">{ic > 0 ? fmt(ic) : "-"}</p>
            </div>
          </div>
          {wl > 0 && ip > 0 && (
            <div className="mt-4">
              <ClassificationBadge wl={wl} ip={ip} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ResultatsSection({ essaiType, resultats }: { essaiType: string; resultats: Record<string, unknown> }) {
  if (essaiType === "limites-atterberg") {
    return <LimitesAtterbergResultats resultats={resultats} />;
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Résultats</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-sm text-foreground bg-muted/50 p-4 rounded-lg overflow-auto">
          {JSON.stringify(resultats, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}


interface GeotechniqueDetailProps {
  essaiType: string;
  essaiTitle: string;
  basePath: string;
  categoryPath: string;
  categoryLabel: string;
}

const getStatutBadge = (statut: string) => {
  switch (statut) {
    case "en-cours":
      return <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 bg-yellow-500/10">En cours</Badge>;
    case "termine":
      return <Badge variant="outline" className="border-emerald-500/50 text-emerald-500 bg-emerald-500/10">Terminé</Badge>;
    case "a-faire":
      return <Badge variant="outline" className="border-sky-500/50 text-sky-500 bg-sky-500/10">À faire</Badge>;
    default:
      return <Badge variant="outline">{statut}</Badge>;
  }
};

export default function GeotechniqueDetail({ essaiType, essaiTitle, basePath, categoryPath, categoryLabel }: GeotechniqueDetailProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: echantillon, isLoading } = useEchantillonGeotechniqueById(essaiType, id);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!echantillon) {
    return <div className="text-center py-8 text-muted-foreground">Échantillon non trouvé</div>;
  }

  const prefix = getGeoPrefix(essaiType);
  const numero = `${prefix}-${String(echantillon.numero).padStart(3, "0")}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <EssaiBreadcrumb items={[
        { label: "Géotechnique", path: "/essais/geotechnique" },
        { label: categoryLabel, path: categoryPath },
        { label: essaiTitle, path: basePath },
        { label: <><span className="text-primary">{prefix}</span>-{String(echantillon.numero).padStart(3, "0")}</> }
      ]} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(basePath)} className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Échantillon <span className="text-primary">{numero}</span>
            </h1>
            <p className="text-muted-foreground mt-1">{essaiTitle}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`${basePath}/${id}/saisie`)}>
            <ClipboardEdit className="w-4 h-4 mr-2" />Saisie
          </Button>
          {echantillon.statut === "termine" && (
            <Button variant="outline" onClick={() => navigate(`${basePath}/${id}/rapport`)}>
              <FileText className="w-4 h-4 mr-2" />Rapport
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate(`${basePath}/${id}/modifier`)}>
            <Pencil className="w-4 h-4 mr-2" />Modifier
          </Button>
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Identification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Numéro</p>
              <p className="font-medium font-mono text-foreground">{numero}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Statut</p>
              <div className="mt-1">{getStatutBadge(echantillon.statut)}</div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="font-medium text-foreground">{echantillon.clients?.nom || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Chantier</p>
              <p className="font-medium text-foreground">{echantillon.chantiers?.nom || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type de sol</p>
              <p className="font-medium text-foreground">{echantillon.type_sol}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Profondeur</p>
              <p className="font-medium text-foreground">{echantillon.profondeur || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date de prélèvement</p>
              <p className="font-medium text-foreground">
                {format(new Date(echantillon.date_prelevement), "dd/MM/yyyy", { locale: fr })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Opérateur</p>
              <p className="font-medium text-foreground">
                {echantillon.intervenants ? `${echantillon.intervenants.prenom} ${echantillon.intervenants.nom}` : "-"}
              </p>
            </div>
            {echantillon.observations && (
              <div className="md:col-span-3">
                <p className="text-sm text-muted-foreground">Observations</p>
                <p className="font-medium text-foreground">{echantillon.observations}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {echantillon.resultats && (
        <ResultatsSection essaiType={essaiType} resultats={echantillon.resultats as Record<string, unknown>} />
      )}
    </div>
  );
}
