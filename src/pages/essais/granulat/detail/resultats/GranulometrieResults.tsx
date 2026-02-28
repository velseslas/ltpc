import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Area, ComposedChart } from "recharts";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GranulometrieResultsProps {
  resultats: Record<string, unknown>;
}

interface TamisData {
  ouverture: number;
  refus: number;
  refusCumule: number;
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
  passant: {
    label: "Passant (%)",
    color: "hsl(var(--primary))",
  },
  min: {
    label: "Limite min",
    color: "hsl(var(--destructive))",
  },
  max: {
    label: "Limite max",
    color: "hsl(var(--destructive))",
  },
};

export default function GranulometrieResults({ resultats }: GranulometrieResultsProps) {
  const masseTotale = (resultats.masse_totale as number) || 0;
  const moduleFinesse = (resultats.module_finesse as number) || 0;
  const tamisData = (resultats.tamis as TamisData[]) || [];
  const [selectedFuseau, setSelectedFuseau] = useState<string>("0/4");

  const getModuleFinesseClassification = (mf: number) => {
    if (mf < 1.8) return "Sable très fin";
    if (mf < 2.2) return "Sable fin";
    if (mf < 2.8) return "Sable moyen (idéal pour béton)";
    if (mf < 3.3) return "Sable grossier";
    return "Sable très grossier";
  };

  // Get the selected fuseau data
  const fuseau = ALL_FUSEAUX[selectedFuseau as keyof typeof ALL_FUSEAUX];

  // Merge sample data with fuseau data for the chart
  const buildChartData = () => {
    const sampleData = [...tamisData]
      .filter(t => t.ouverture > 0)
      .sort((a, b) => a.ouverture - b.ouverture);

    // Get all unique sieve sizes from both sample and fuseau
    const allSieves = new Set<number>();
    sampleData.forEach(t => allSieves.add(t.ouverture));
    fuseau?.points.forEach(p => allSieves.add(p.ouverture));

    const sortedSieves = Array.from(allSieves).sort((a, b) => a - b);

    return sortedSieves.map(ouverture => {
      const sample = sampleData.find(t => t.ouverture === ouverture);
      const fuseauPoint = fuseau?.points.find(p => p.ouverture === ouverture);

      return {
        ouverture,
        passant: sample?.passant ?? null,
        min: fuseauPoint?.min ?? null,
        max: fuseauPoint?.max ?? null,
        label: `${ouverture} mm`,
      };
    });
  };

  const chartData = buildChartData();

  // Check if sample is within fuseau limits
  const checkConformity = () => {
    if (!fuseau) return null;
    
    let isConform = true;
    const issues: string[] = [];

    tamisData.forEach(t => {
      const fuseauPoint = fuseau.points.find(p => Math.abs(p.ouverture - t.ouverture) < 0.01);
      if (fuseauPoint) {
        if (t.passant < fuseauPoint.min) {
          isConform = false;
          issues.push(`${t.ouverture}mm: ${t.passant.toFixed(1)}% < min ${fuseauPoint.min}%`);
        }
        if (t.passant > fuseauPoint.max) {
          isConform = false;
          issues.push(`${t.ouverture}mm: ${t.passant.toFixed(1)}% > max ${fuseauPoint.max}%`);
        }
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Masse totale de l'échantillon</p>
            <p className="font-medium text-foreground">{masseTotale || "-"} g</p>
          </div>
          <div className="bg-primary/20 border border-primary/30 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Module de Finesse</p>
            <p className="text-2xl font-bold text-primary">{moduleFinesse || "--"}</p>
            {moduleFinesse > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {getModuleFinesseClassification(moduleFinesse)}
              </p>
            )}
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

            {/* Conformity indicator */}
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
                    {conformity.issues.length > 3 && (
                      <li>• ... et {conformity.issues.length - 3} autre(s)</li>
                    )}
                  </ul>
                )}
              </div>
            )}

            <div className="h-[350px] w-full">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="ouverture" 
                    scale="log"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(value) => `${value}`}
                    label={{ value: 'Ouverture tamis (mm)', position: 'bottom', offset: 20 }}
                    className="text-xs"
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    label={{ value: 'Passant (%)', angle: -90, position: 'insideLeft' }}
                    className="text-xs"
                  />
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent 
                        formatter={(value, name) => {
                          if (value === null) return null;
                          const labels: Record<string, string> = {
                            passant: "Passant",
                            min: "Limite min",
                            max: "Limite max"
                          };
                          return [`${Number(value).toFixed(1)}%`, labels[name as string] || name];
                        }}
                        labelFormatter={(label) => `Tamis: ${label} mm`}
                      />
                    } 
                  />
                  
                  {/* Fuseau area (shaded zone between min and max) */}
                  <Area
                    type="monotone"
                    dataKey="max"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fill="hsl(var(--destructive))"
                    fillOpacity={0.1}
                    connectNulls
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="min"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fill="hsl(var(--background))"
                    fillOpacity={1}
                    connectNulls
                    dot={false}
                  />
                  
                  {/* Sample curve */}
                  <Line 
                    type="monotone" 
                    dataKey="passant" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2.5}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, fill: "hsl(var(--primary))" }}
                    connectNulls
                  />
                </ComposedChart>
              </ChartContainer>
            </div>
            
            {/* Legend */}
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
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Refus (g)</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Refus cumulé (g)</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Passant (%)</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Fuseau</th>
                </tr>
              </thead>
              <tbody>
                {tamisData.filter(t => t.refus > 0 || t.passant < 100).map((tamis) => {
                  const fuseauPoint = fuseau?.points.find(p => Math.abs(p.ouverture - tamis.ouverture) < 0.01);
                  const isInFuseau = fuseauPoint 
                    ? tamis.passant >= fuseauPoint.min && tamis.passant <= fuseauPoint.max 
                    : null;
                  
                  return (
                    <tr key={tamis.ouverture} className="border-b border-border/50">
                      <td className="py-2 px-2 font-medium text-foreground">{tamis.ouverture}</td>
                      <td className="py-2 px-2 text-center text-foreground">{tamis.refus.toFixed(1)}</td>
                      <td className="py-2 px-2 text-center text-muted-foreground">{tamis.refusCumule.toFixed(1)}</td>
                      <td className="py-2 px-2 text-center">
                        <span className={`px-3 py-1 rounded-full font-medium ${
                          isInFuseau === null 
                            ? 'bg-primary/10 text-primary'
                            : isInFuseau 
                              ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                              : 'bg-destructive/10 text-destructive'
                        }`}>
                          {tamis.passant.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center text-muted-foreground text-xs">
                        {fuseauPoint ? `${fuseauPoint.min} - ${fuseauPoint.max}%` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
