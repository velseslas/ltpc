import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Area, ComposedChart } from "recharts";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GranulometrieResultsProps {
  resultats: Record<string, unknown>;
  produit?: string;
}

interface TamisData {
  ouverture: number;
  refus: number;
  refusCumule: number;
  pourcentageRefusCumule: number;
  passant: number;
}

// Fuseaux normalisés selon NF EN 12620
const FUSEAUX_SABLE = {
  "0/1": {
    label: "Sable 0/1 mm",
    points: [
      { ouverture: 0.063, min: 0, max: 10 },
      { ouverture: 0.125, min: 5, max: 35 },
      { ouverture: 0.25, min: 20, max: 60 },
      { ouverture: 0.5, min: 50, max: 85 },
      { ouverture: 1, min: 85, max: 100 },
    ]
  },
  "0/3": {
    label: "Sable 0/3 mm",
    points: [
      { ouverture: 0.063, min: 0, max: 5 },
      { ouverture: 0.125, min: 2, max: 18 },
      { ouverture: 0.25, min: 8, max: 40 },
      { ouverture: 0.5, min: 20, max: 65 },
      { ouverture: 1, min: 40, max: 85 },
      { ouverture: 2, min: 70, max: 95 },
      { ouverture: 3, min: 90, max: 100 },
    ]
  },
  "0/4": {
    label: "Sable 0/4 mm",
    points: [
      { ouverture: 0.063, min: 0, max: 3 },
      { ouverture: 0.125, min: 0, max: 12 },
      { ouverture: 0.25, min: 5, max: 40 },
      { ouverture: 0.5, min: 15, max: 70 },
      { ouverture: 1, min: 35, max: 85 },
      { ouverture: 2, min: 55, max: 95 },
      { ouverture: 4, min: 85, max: 100 },
    ]
  },
};

const FUSEAUX_GRAVIER = {
  "3/8": {
    label: "Gravillon 3/8 mm",
    points: [
      { ouverture: 2, min: 0, max: 5 },
      { ouverture: 3, min: 0, max: 15 },
      { ouverture: 4, min: 10, max: 40 },
      { ouverture: 5, min: 30, max: 70 },
      { ouverture: 6.3, min: 60, max: 90 },
      { ouverture: 8, min: 85, max: 100 },
    ]
  },
  "8/15": {
    label: "Gravillon 8/15 mm",
    points: [
      { ouverture: 5, min: 0, max: 5 },
      { ouverture: 8, min: 0, max: 15 },
      { ouverture: 10, min: 15, max: 50 },
      { ouverture: 12.5, min: 45, max: 80 },
      { ouverture: 15, min: 85, max: 100 },
    ]
  },
  "15/25": {
    label: "Gravier 15/25 mm",
    points: [
      { ouverture: 10, min: 0, max: 5 },
      { ouverture: 15, min: 0, max: 15 },
      { ouverture: 20, min: 30, max: 70 },
      { ouverture: 25, min: 85, max: 100 },
    ]
  },
};

const ALL_FUSEAUX = { ...FUSEAUX_SABLE, ...FUSEAUX_GRAVIER };

const chartConfig = {
  passant: { label: "Tamisât (%)", color: "hsl(var(--primary))" },
  min: { label: "Limite min", color: "hsl(var(--destructive))" },
  max: { label: "Limite max", color: "hsl(var(--destructive))" },
};

export default function GranulometrieResults({ resultats, produit }: GranulometrieResultsProps) {
  const isGrav = resultats.is_gravier === true || (produit ? /^(gravier|gravillon)/i.test(produit.trim()) || (/^\d+\/\d+/.test(produit.trim()) && !produit.trim().startsWith("0/")) : false);
  const masseSechM1 = (resultats.masse_seche_m1 as number) || 0;
  const masseApresLavageM2 = (resultats.masse_apres_lavage_m2 as number) || 0;
  const masseLavageM1M2 = (resultats.masse_lavage_m1_m2 as number) || 0;
  const fondP = (resultats.fond_p as number) || 0;
  const moduleFinesse = (resultats.module_finesse as number) || 0;
  const sommeRiPlusP = (resultats.somme_ri_plus_p as number) || 0;
  const pertePourcentage = (resultats.perte_pourcentage as number) || 0;
  const teneurFinesF = (resultats.teneur_fines_f as number) || 0;
  const procede = (resultats.procede as string) || "lavage_tamisage";
  const tamisData = (resultats.tamis as TamisData[]) || [];
  const [selectedFuseau, setSelectedFuseau] = useState<string>("0/4");

  const procedeLabel = procede === "lavage_tamisage" ? "Lavage et tamisage" : "Tamisage par voie sèche";

  const fuseau = ALL_FUSEAUX[selectedFuseau as keyof typeof ALL_FUSEAUX];

  const buildChartData = () => {
    const sampleData = [...tamisData]
      .filter(t => t.ouverture > 0)
      .sort((a, b) => a.ouverture - b.ouverture);

    const allSieves = new Set<number>();
    sampleData.forEach(t => allSieves.add(t.ouverture));
    fuseau?.points.forEach(p => allSieves.add(p.ouverture));

    return Array.from(allSieves).sort((a, b) => a - b).map(ouverture => {
      const sample = sampleData.find(t => t.ouverture === ouverture);
      const fuseauPoint = fuseau?.points.find(p => p.ouverture === ouverture);
      return {
        ouverture,
        passant: sample?.passant ?? null,
        min: fuseauPoint?.min ?? null,
        max: fuseauPoint?.max ?? null,
      };
    });
  };

  const chartData = buildChartData();

  const checkConformity = () => {
    if (!fuseau) return null;
    let isConform = true;
    const issues: string[] = [];
    tamisData.forEach(t => {
      const fp = fuseau.points.find(p => Math.abs(p.ouverture - t.ouverture) < 0.01);
      if (fp) {
        if ((t.passant ?? 0) < fp.min) { isConform = false; issues.push(`${t.ouverture}mm: ${(t.passant ?? 0).toFixed(1)}% < min ${fp.min}%`); }
        if ((t.passant ?? 0) > fp.max) { isConform = false; issues.push(`${t.ouverture}mm: ${(t.passant ?? 0).toFixed(1)}% > max ${fp.max}%`); }
      }
    });
    return { isConform, issues };
  };

  const conformity = checkConformity();

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Résultats - Analyse Granulométrique (NF EN 933-1)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Header info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Procédé</p>
            <p className="font-medium text-foreground text-sm">{procedeLabel}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Masse sèche M1</p>
            <p className="font-medium text-foreground">{masseSechM1 || "-"} g</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">M1 - M2 (lavage)</p>
            <p className="font-medium text-foreground">{masseLavageM1M2 || "-"} g</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Masse après lavage M2</p>
            <p className="font-medium text-foreground">{masseApresLavageM2 || "-"} g</p>
          </div>
        </div>

        {/* Key results */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-primary/20 border border-primary/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Module de Finesse (FM)</p>
            <p className="text-2xl font-bold text-primary">{moduleFinesse || "--"}</p>
          </div>
          <div className="bg-muted/50 border border-border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Σ Ri + P</p>
            <p className="text-lg font-bold text-foreground">{sommeRiPlusP || "--"}</p>
          </div>
          <div className="bg-muted/50 border border-border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Perte (%)</p>
            <p className={`text-lg font-bold ${Math.abs(pertePourcentage) < 1 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
              {pertePourcentage ? `${pertePourcentage.toFixed(2)}%` : "--"}
            </p>
          </div>
          <div className="bg-muted/50 border border-border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Teneur fines f (%)</p>
            <p className="text-lg font-bold text-foreground">{teneurFinesF ? `${teneurFinesF.toFixed(2)}%` : "--"}</p>
          </div>
        </div>

        {/* Courbe granulométrique */}
        {tamisData.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h4 className="font-medium text-foreground">Courbe Granulométrique</h4>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Fuseau:</span>
                <Select value={selectedFuseau} onValueChange={setSelectedFuseau}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>-- Sables --</SelectItem>
                    {Object.entries(FUSEAUX_SABLE).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                    <SelectItem value="none2" disabled>-- Gravillons --</SelectItem>
                    {Object.entries(FUSEAUX_GRAVIER).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {conformity && (
              <div className={`p-3 rounded-lg border ${conformity.isConform 
                ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400' 
                : 'bg-destructive/10 border-destructive/30 text-destructive'}`}>
                <p className="font-medium text-sm">
                  {conformity.isConform 
                    ? `✓ Conforme au fuseau ${fuseau?.label}` 
                    : `✗ Non conforme au fuseau ${fuseau?.label}`}
                </p>
                {!conformity.isConform && conformity.issues.length > 0 && (
                  <ul className="text-xs mt-1 space-y-0.5">
                    {conformity.issues.slice(0, 3).map((issue, i) => (
                      <li key={i}>• {issue}</li>
                    ))}
                    {conformity.issues.length > 3 && <li>• ... et {conformity.issues.length - 3} autre(s)</li>}
                  </ul>
                )}
              </div>
            )}

            <div className="h-[350px] w-full">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="ouverture" scale="log" domain={['dataMin', 'dataMax']}
                    tickFormatter={(value) => `${value}`}
                    label={{ value: 'Ouverture tamis (mm)', position: 'bottom', offset: 20 }}
                    className="text-xs"
                  />
                  <YAxis 
                    domain={[0, 100]} tickFormatter={(value) => `${value}%`}
                    label={{ value: 'Tamisât cumulé (%)', angle: -90, position: 'insideLeft' }}
                    className="text-xs"
                  />
                  <ChartTooltip content={
                    <ChartTooltipContent 
                      formatter={(value, name) => {
                        if (value === null) return null;
                        const labels: Record<string, string> = { passant: "Tamisât", min: "Limite min", max: "Limite max" };
                        return [`${Number(value).toFixed(1)}%`, labels[name as string] || name];
                      }}
                      labelFormatter={(label) => `Tamis: ${label} mm`}
                    />
                  } />
                  <Area type="monotone" dataKey="max" stroke="hsl(var(--destructive))" strokeWidth={1.5} strokeDasharray="4 4" fill="hsl(var(--destructive))" fillOpacity={0.1} connectNulls dot={false} />
                  <Area type="monotone" dataKey="min" stroke="hsl(var(--destructive))" strokeWidth={1.5} strokeDasharray="4 4" fill="hsl(var(--background))" fillOpacity={1} connectNulls dot={false} />
                  <Line type="monotone" dataKey="passant" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 5 }} activeDot={{ r: 7 }} connectNulls />
                </ComposedChart>
              </ChartContainer>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-primary rounded" />
                <span className="text-muted-foreground">Courbe échantillon</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-destructive/20 border border-dashed border-destructive rounded" />
                <span className="text-muted-foreground">Fuseau {fuseau?.label}</span>
              </div>
            </div>
          </div>
        )}

        {/* Table des tamis */}
        {tamisData.length > 0 && (
          <div className="overflow-x-auto">
            <h4 className="font-medium text-foreground mb-3">Tableau des résultats</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Tamis (mm)</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Refus Ri (g)</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Refus cumulé Rn (g)</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">% Refus cumulés</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">% Tamisât</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Fuseau</th>
                </tr>
              </thead>
              <tbody>
                {tamisData.filter(t => t.refus > 0 || t.passant < 100).map((tamis) => {
                  const fuseauPoint = fuseau?.points.find(p => Math.abs(p.ouverture - tamis.ouverture) < 0.01);
                  const isInFuseau = fuseauPoint ? tamis.passant >= fuseauPoint.min && tamis.passant <= fuseauPoint.max : null;
                  return (
                    <tr key={tamis.ouverture} className="border-b border-border/50">
                      <td className="py-2 px-2 font-medium text-foreground">{tamis.ouverture}</td>
                      <td className="py-2 px-2 text-center text-foreground">{(tamis.refus ?? 0).toFixed(1)}</td>
                      <td className="py-2 px-2 text-center text-muted-foreground">{(tamis.refusCumule ?? 0).toFixed(1)}</td>
                      <td className="py-2 px-2 text-center text-muted-foreground">{(tamis.pourcentageRefusCumule ?? 0).toFixed(2)}</td>
                      <td className="py-2 px-2 text-center">
                        <span className={`px-3 py-1 rounded-full font-medium ${
                          isInFuseau === null ? 'bg-primary/10 text-primary'
                            : isInFuseau ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                              : 'bg-destructive/10 text-destructive'
                        }`}>
                          {(tamis.passant ?? 0).toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center text-muted-foreground text-xs">
                        {fuseauPoint ? `${fuseauPoint.min} - ${fuseauPoint.max}%` : '-'}
                      </td>
                    </tr>
                  );
                })}
                {/* Fond P */}
                <tr className="border-t-2 border-border bg-muted/30">
                  <td className="py-2 px-2 font-medium text-foreground">Fond P</td>
                  <td className="py-2 px-2 text-center font-bold text-foreground">{fondP || "-"}</td>
                  <td className="py-2 px-2 text-center text-muted-foreground" colSpan={2}>
                    Σ Ri + P = <span className="font-bold">{sommeRiPlusP}</span>
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-primary" colSpan={2}>
                    FM = {moduleFinesse}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
