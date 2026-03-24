import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Pencil, ClipboardEdit, FileText } from "lucide-react";
import { ClassificationBadge, AbaqueButton } from "@/components/essais/geotechnique/CasagrandeAbaque";
import { useEchantillonGeotechniqueById, getGeoPrefix } from "@/hooks/useEchantillonsGeotechniqueFactory";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

function pf(v: string | number) { return parseFloat(String(v)) || 0; }
function fmt(v: number, dec = 2) { return isNaN(v) || !isFinite(v) ? "-" : v.toFixed(dec); }

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

function ClassificationSolResultats({ resultats }: { resultats: Record<string, unknown> }) {
  const granulometrie = (resultats.granulometrie as Record<string, string>) || {};
  const gtr = resultats.classification_gtr as Record<string, string> | null;
  const uscs = resultats.classification_uscs as Record<string, string> | null;

  return (
    <div className="space-y-6">
      {/* Key values */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-lg">Paramètres d'identification</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Passant 80µm</p>
              <p className="text-lg font-bold text-primary">{granulometrie["0.08"] ? `${granulometrie["0.08"]}%` : "-"}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Passant 2mm</p>
              <p className="text-lg font-bold text-primary">{granulometrie["2"] ? `${granulometrie["2"]}%` : "-"}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Wl</p>
              <p className="text-lg font-bold text-foreground">{resultats.wl ? `${String(resultats.wl)}%` : "-"}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Ip</p>
              <p className="text-lg font-bold text-foreground">{resultats.ip ? `${String(resultats.ip)}%` : "-"}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">VBS</p>
              <p className="text-lg font-bold text-foreground">{resultats.vbs ? String(resultats.vbs) : "-"}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">MO</p>
              <p className="text-lg font-bold text-foreground">{resultats.matiere_organique ? `${String(resultats.matiere_organique)}%` : "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classifications */}
      {(gtr || uscs) && (
        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="text-lg">Classification du sol</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {gtr && (
                <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">GTR (NF P 11-300)</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-lg font-bold border-primary/50 text-primary bg-primary/10 px-3 py-1">
                      {gtr.sous_classe}
                    </Badge>
                    <span className="font-semibold text-foreground">{gtr.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{gtr.description}</p>
                </div>
              )}
              {uscs && (
                <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">USCS (ASTM D2487)</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-lg font-bold border-primary/50 text-primary bg-primary/10 px-3 py-1">
                      {uscs.code}
                    </Badge>
                    <span className="font-semibold text-foreground">{uscs.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{uscs.description}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DensitometreResultats({ resultats }: { resultats: Record<string, unknown> }) {
  const v0 = pf(resultats.v0 as string); const v1 = pf(resultats.v1 as string);
  const V = v1 - v0; const M = pf(resultats.M as string);
  const tare = pf(resultats.tare as string); const H = pf(resultats.H as string);
  const S = pf(resultats.S as string); const I = S - tare; const E = H - S;
  const W = I > 0 ? (E / I) * 100 : 0;
  const P = V > 0 ? M / V : 0;
  const Pd = (100 + W) > 0 ? (P * 100) / (100 + W) : 0;
  const yd_max = pf(resultats.yd_max as string);
  const compactage = yd_max > 0 ? (Pd / yd_max) * 100 : 0;

  return (
    <Card className="border-border bg-card">
      <CardHeader><CardTitle className="text-lg">Résultats — Densitomètre à Membrane</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Volume du trou (V)</p>
            <p className="text-lg font-bold text-primary">{fmt(V)} cm³</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Teneur en eau (W)</p>
            <p className="text-lg font-bold text-primary">{fmt(W)} %</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Densité humide (P)</p>
            <p className="text-lg font-bold text-foreground">{fmt(P)} g/cm³</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Densité sèche (Pd)</p>
            <p className="text-lg font-bold text-primary">{fmt(Pd)} g/cm³</p>
          </div>
          {yd_max > 0 && (
            <>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">γd max</p>
                <p className="text-lg font-bold text-foreground">{fmt(yd_max)} g/cm³</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">% Compactage</p>
                <p className={`text-lg font-bold ${compactage >= 95 ? "text-emerald-500" : "text-amber-500"}`}>{fmt(compactage, 1)} %</p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TeneurEauSolResultats({ resultats }: { resultats: Record<string, unknown> }) {
  const prises = [1, 2].map(n => {
    const m1 = pf(resultats[`p${n}_m1`] as string);
    const m2 = pf(resultats[`p${n}_m2`] as string);
    const m3 = pf(resultats[`p${n}_m3`] as string);
    const mh = m2 - m1;
    const md = m3 - m1;
    const mw = m2 - m3;
    const W = md > 0 ? (mw / md) * 100 : 0;
    return { m1, m2, m3, mh, md, mw, W };
  });
  const validW = prises.filter(p => p.W > 0);
  const moyen = validW.length > 0 ? validW.reduce((s, p) => s + p.W, 0) / validW.length : 0;

  return (
    <Card className="border-border bg-card">
      <CardHeader><CardTitle className="text-lg">Résultats — Teneur en Eau</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">W Prise 01</p>
            <p className="text-lg font-bold text-primary">{prises[0].W > 0 ? fmt(prises[0].W) + " %" : "-"}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">W Prise 02</p>
            <p className="text-lg font-bold text-primary">{prises[1].W > 0 ? fmt(prises[1].W) + " %" : "-"}</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
            <p className="text-xs text-muted-foreground">W Moyen</p>
            <p className="text-xl font-bold text-primary">{moyen > 0 ? fmt(moyen) + " %" : "-"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const TAMIS_SOL = [125, 80, 63, 50, 40, 31.5, 25, 20, 16, 12.5, 10, 8, 6.3, 5, 4, 2, 1, 0.5, 0.25, 0.125, 0.063];

const FUSEAU_GNT_0_315 = {
  min: [
    { d: 0.063, p: 2 }, { d: 0.5, p: 10 }, { d: 2, p: 20 }, { d: 4, p: 25 },
    { d: 6.3, p: 30 }, { d: 10, p: 38 }, { d: 16, p: 50 }, { d: 20, p: 58 },
    { d: 25, p: 68 }, { d: 31.5, p: 100 },
  ],
  max: [
    { d: 0.063, p: 9 }, { d: 0.5, p: 30 }, { d: 2, p: 45 }, { d: 4, p: 55 },
    { d: 6.3, p: 60 }, { d: 10, p: 68 }, { d: 16, p: 78 }, { d: 20, p: 85 },
    { d: 25, p: 95 }, { d: 31.5, p: 100 },
  ],
};

function GranulometrieSolResultats({ resultats }: { resultats: Record<string, unknown> }) {
  const r = resultats;
  const m1 = pf(r.masse_seche_m1 as string);
  const m2 = pf(r.masse_apres_lavage_m2 as string);
  const fondP = pf(r.fond_p as string);
  const typeMateriau = String(r.type_materiau || "GNT");
  const isGNT = typeMateriau === "GNT";

  let refusCumule = 0;
  const tamisCalc = TAMIS_SOL.map(d => {
    const refus = pf(r[`refus_${d}`] as string);
    refusCumule += refus;
    const pct = m1 > 0 ? (refusCumule / m1) * 100 : 0;
    const passant = Math.max(0, 100 - pct);
    return { d, refus, refusCumule: parseFloat(refusCumule.toFixed(1)), refusCumulePct: parseFloat(pct.toFixed(1)), passant: parseFloat(passant.toFixed(1)) };
  });

  const f = m1 > 0 ? ((m1 - m2) + fondP) / m1 * 100 : 0;
  const classification = String(r.computed_classification || "-");
  const chartData = tamisCalc.filter(t => t.refusCumule > 0 || t.passant < 100).sort((a, b) => a.d - b.d).map(t => ({ d: t.d, passant: t.passant }));

  return (
    <div className="space-y-6">
      {/* Tableau des tamis */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Résultats — Analyse Granulométrique</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Tamis (mm)</TableHead>
                  <TableHead className="text-muted-foreground">Refus (g)</TableHead>
                  <TableHead className="text-muted-foreground">Refus cumulé (g)</TableHead>
                  <TableHead className="text-muted-foreground">Refus cumulé (%)</TableHead>
                  <TableHead className="text-muted-foreground">Passant (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tamisCalc.filter(t => t.refus > 0 || t.refusCumule > 0).map(t => (
                  <TableRow key={t.d} className="border-border">
                    <TableCell className="font-bold text-foreground">{t.d}</TableCell>
                    <TableCell className="text-foreground">{fmt(t.refus, 1)}</TableCell>
                    <TableCell className="text-foreground">{fmt(t.refusCumule, 1)}</TableCell>
                    <TableCell className="text-foreground">{fmt(t.refusCumulePct, 1)}</TableCell>
                    <TableCell className="font-bold text-primary">{fmt(t.passant, 1)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Synthèse */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Synthèse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Masse sèche M1</p>
              <p className="text-lg font-bold text-foreground">{m1 > 0 ? `${fmt(m1, 1)} g` : "-"}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Masse après lavage M2</p>
              <p className="text-lg font-bold text-foreground">{m2 > 0 ? `${fmt(m2, 1)} g` : "-"}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Teneur en fines (f)</p>
              <p className="text-lg font-bold text-primary">{f > 0 ? `${fmt(f, 1)} %` : "-"}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Type matériau</p>
              <p className="text-lg font-bold text-foreground">{typeMateriau}</p>
            </div>
            {isGNT && (
              <div className="p-3 rounded-lg bg-muted/50 md:col-span-4">
                <p className="text-xs text-muted-foreground">Classification NF EN 13285</p>
                <p className="text-xl font-bold text-primary">{classification}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Graphique */}
      {chartData.length > 1 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">{isGNT ? "Fuseau granulométrique — GNT 0/31.5" : "Courbe granulométrique"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                {isGNT ? (
                  <LineChart data={FUSEAU_GNT_0_315.min.map((pt, i) => {
                    const sample = chartData.find(t => Math.abs(t.d - pt.d) < 0.01);
                    return { d: pt.d, min: pt.p, max: FUSEAU_GNT_0_315.max[i].p, passant: sample?.passant ?? null };
                  })} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="d" scale="log" domain={['auto', 'auto']} tickFormatter={v => `${v}`} label={{ value: 'Tamis (mm)', position: 'bottom', offset: 10 }} tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="min" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Min fuseau" />
                    <Line type="monotone" dataKey="max" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Max fuseau" />
                    <Line type="monotone" dataKey="passant" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: 'hsl(var(--primary))', r: 4 }} connectNulls name="Échantillon" />
                  </LineChart>
                ) : (
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="d" scale="log" domain={['auto', 'auto']} tickFormatter={v => `${v}`} label={{ value: 'Tamis (mm)', position: 'bottom', offset: 10 }} tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="passant" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: 'hsl(var(--primary))', r: 4 }} connectNulls name="Échantillon" />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ResultatsSection({ essaiType, resultats }: { essaiType: string; resultats: Record<string, unknown> }) {
  if (essaiType === "limites-atterberg") {
    return <LimitesAtterbergResultats resultats={resultats} />;
  }
  if (essaiType === "classification-sol") {
    return <ClassificationSolResultats resultats={resultats} />;
  }
  if (essaiType === "densitometre") {
    return <DensitometreResultats resultats={resultats} />;
  }
  if (essaiType === "teneur-eau-sol") {
    return <TeneurEauSolResultats resultats={resultats} />;
  }
  if (essaiType === "granulometrie-sol") {
    return <GranulometrieSolResultats resultats={resultats} />;
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
