import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// Standard sieve openings (mm) for Dreux-Gorisse
const TAMIS_OPENINGS = [0.063, 0.125, 0.25, 0.5, 1, 2, 4, 6.3, 8, 10, 12.5, 16, 20, 25, 31.5, 40];

// Log scale position for chart (base 10 log of sieve opening)
function logPos(mm: number) {
  return Math.log10(mm);
}

// Dreux-Gorisse reference curve
// Broken line from (Dmin, 0%) to breakpoint to (Dmax, 100%)
// Breakpoint: x = D/2 (in log scale: midpoint), y depends on vibration and Dmax
function computeReferenceCurve(
  dMax: number,
  classeConsistance: string,
  coeffG: number
) {
  const dMin = 0.063;

  // Y at breakpoint depends on the consistency class and coefficient G
  // Dreux-Gorisse: Y = 50 - sqrt(D) + K + Ks + Kp
  // Simplified: Y at midpoint ≈ 50 - √D + K
  // K: correction for vibration: S1=+6, S2=+4, S3=0, S4=-4, S5=-6
  const kMap: Record<string, number> = {
    "S1": 6, "S2": 4, "S3": 0, "S4": -4, "S5": -6,
  };
  const classeKey = classeConsistance?.split(" ")[0] || "S3";
  const K = kMap[classeKey] ?? 0;
  // Ks depends on shape and nature - assume 0 for standard crushed
  const Ks = 0;
  const yBreak = 50 - Math.sqrt(dMax) + K + Ks;

  // Breakpoint x in log scale at D/2
  const xBreak = dMax / 2;

  // Generate reference curve points
  const points: { ouverture: number; pourcentage: number }[] = [];

  for (const ouv of TAMIS_OPENINGS) {
    if (ouv < dMin) continue;
    if (ouv > dMax) break;

    let y: number;
    if (ouv <= xBreak) {
      // Linear interpolation from (dMin, 0) to (xBreak, yBreak)
      const t = (logPos(ouv) - logPos(dMin)) / (logPos(xBreak) - logPos(dMin));
      y = t * yBreak;
    } else {
      // Linear interpolation from (xBreak, yBreak) to (dMax, 100)
      const t = (logPos(ouv) - logPos(xBreak)) / (logPos(dMax) - logPos(xBreak));
      y = yBreak + t * (100 - yBreak);
    }
    points.push({ ouverture: ouv, pourcentage: Math.max(0, Math.min(100, y)) });
  }

  return points;
}

// Compute mix curve from individual granulometric curves weighted by proportions
function computeMixCurve(
  materials: { label: string; quantity: number; curve: { ouverture: number; pourcentageTamisat: number }[] }[]
) {
  const totalQty = materials.reduce((sum, m) => sum + m.quantity, 0);
  if (totalQty === 0) return [];

  const result: { ouverture: number; pourcentage: number }[] = [];

  for (const ouv of TAMIS_OPENINGS) {
    let weightedPass = 0;
    for (const mat of materials) {
      const point = mat.curve.find((p) => Math.abs(p.ouverture - ouv) < 0.001);
      const passPercent = point ? point.pourcentageTamisat : (ouv > (mat.curve[mat.curve.length - 1]?.ouverture || 0) ? 100 : 0);
      weightedPass += (passPercent * mat.quantity) / totalQty;
    }
    result.push({ ouverture: ouv, pourcentage: parseFloat(weightedPass.toFixed(1)) });
  }

  return result;
}

interface MaterialCurve {
  label: string;
  quantity: number;
  curve: { ouverture: number; pourcentageTamisat: number }[];
}

interface ProportionsStepProps {
  sableConcasseQte: string;
  sableFinQte: string;
  gravillons1Qte: string;
  gravier2Qte: string;
  gravier3Qte: string;
  cimentQte: string;
  adjuvantQte: string;
  eauQte: string;
  sable1Active: boolean;
  sable2Active: boolean;
  gravier1Active: boolean;
  gravier2Active: boolean;
  gravier3Active: boolean;
  coefficientGranulaire: string;
  classeRheologique: string;
  // Granulometric data from step 4 rapport selections (future: pass real data)
  granulatCurves?: MaterialCurve[];
}

// Colors for each material curve
const MATERIAL_COLORS = [
  "hsl(var(--primary))",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
];

export default function ProportionsStep({
  sableConcasseQte,
  sableFinQte,
  gravillons1Qte,
  gravier2Qte,
  gravier3Qte,
  cimentQte,
  adjuvantQte,
  eauQte,
  sable1Active,
  sable2Active,
  gravier1Active,
  gravier2Active,
  gravier3Active,
  coefficientGranulaire,
  classeRheologique,
  granulatCurves,
}: ProportionsStepProps) {
  // Parse quantities
  const sables = (parseFloat(sableConcasseQte) || 0) + (parseFloat(sableFinQte) || 0);
  const graviers = (parseFloat(gravillons1Qte) || 0) + (parseFloat(gravier2Qte) || 0) + (parseFloat(gravier3Qte) || 0);
  const ciment = parseFloat(cimentQte) || 0;
  const eau = parseFloat(eauQte) || 0;
  const adjuvant = parseFloat(adjuvantQte) || 0;
  const total = sables + graviers + ciment + adjuvant + eau;
  const ratioGS = sables > 0 ? (graviers / sables).toFixed(2) : "-";
  const ratioEC = ciment > 0 ? (eau / ciment).toFixed(2) : "-";

  // Build component list for recap
  const components = [
    { label: "Sable concassé", value: sableConcasseQte, unit: "kg", active: sable1Active },
    { label: "Sable fin", value: sableFinQte, unit: "kg", active: sable2Active },
    { label: "Gravillons 1", value: gravillons1Qte, unit: "kg", active: gravier1Active },
    { label: "Gravier 2", value: gravier2Qte, unit: "kg", active: gravier2Active },
    { label: "Gravier 3", value: gravier3Qte, unit: "kg", active: gravier3Active },
    { label: "Ciment", value: cimentQte, unit: "kg", active: true },
    { label: "Adjuvant", value: adjuvantQte, unit: "kg", active: true },
    { label: "Eau", value: eauQte, unit: "L", active: true },
  ].filter(({ value, active }) => active && value && parseFloat(value) > 0);

  // Determine Dmax from active graviers
  const dMax = useMemo(() => {
    if (gravier3Active && parseFloat(gravier3Qte) > 0) return 31.5;
    if (gravier2Active && parseFloat(gravier2Qte) > 0) return 25;
    if (gravier1Active && parseFloat(gravillons1Qte) > 0) return 16;
    return 25; // default
  }, [gravier1Active, gravier2Active, gravier3Active, gravillons1Qte, gravier2Qte, gravier3Qte]);

  const coeffG = parseFloat(coefficientGranulaire) || 0;

  // Reference curve
  const referenceCurve = useMemo(
    () => computeReferenceCurve(dMax, classeRheologique, coeffG),
    [dMax, classeRheologique, coeffG]
  );

  // Generate demo granulometric curves for active materials if no real data
  const demoMaterials = useMemo<MaterialCurve[]>(() => {
    if (granulatCurves && granulatCurves.length > 0) return granulatCurves;

    const materials: MaterialCurve[] = [];

    // Generate typical curves for each active material
    if (sable1Active && parseFloat(sableConcasseQte) > 0) {
      materials.push({
        label: "Sable concassé",
        quantity: parseFloat(sableConcasseQte),
        curve: TAMIS_OPENINGS.map((ouv) => ({
          ouverture: ouv,
          pourcentageTamisat: ouv >= 4 ? 100 : Math.min(100, (Math.log10(ouv / 0.063) / Math.log10(4 / 0.063)) * 100),
        })),
      });
    }
    if (sable2Active && parseFloat(sableFinQte) > 0) {
      materials.push({
        label: "Sable fin",
        quantity: parseFloat(sableFinQte),
        curve: TAMIS_OPENINGS.map((ouv) => ({
          ouverture: ouv,
          pourcentageTamisat: ouv >= 2 ? 100 : Math.min(100, (Math.log10(ouv / 0.063) / Math.log10(2 / 0.063)) * 100),
        })),
      });
    }
    if (gravier1Active && parseFloat(gravillons1Qte) > 0) {
      materials.push({
        label: "Gravillons 3/8",
        quantity: parseFloat(gravillons1Qte),
        curve: TAMIS_OPENINGS.map((ouv) => ({
          ouverture: ouv,
          pourcentageTamisat: ouv >= 10 ? 100 : ouv <= 2 ? 0 : Math.min(100, ((ouv - 2) / (10 - 2)) * 100),
        })),
      });
    }
    if (gravier2Active && parseFloat(gravier2Qte) > 0) {
      materials.push({
        label: "Gravier 8/15",
        quantity: parseFloat(gravier2Qte),
        curve: TAMIS_OPENINGS.map((ouv) => ({
          ouverture: ouv,
          pourcentageTamisat: ouv >= 20 ? 100 : ouv <= 6.3 ? 0 : Math.min(100, ((ouv - 6.3) / (20 - 6.3)) * 100),
        })),
      });
    }
    if (gravier3Active && parseFloat(gravier3Qte) > 0) {
      materials.push({
        label: "Gravier 15/25",
        quantity: parseFloat(gravier3Qte),
        curve: TAMIS_OPENINGS.map((ouv) => ({
          ouverture: ouv,
          pourcentageTamisat: ouv >= 31.5 ? 100 : ouv <= 12.5 ? 0 : Math.min(100, ((ouv - 12.5) / (31.5 - 12.5)) * 100),
        })),
      });
    }

    return materials;
  }, [sable1Active, sable2Active, gravier1Active, gravier2Active, gravier3Active, sableConcasseQte, sableFinQte, gravillons1Qte, gravier2Qte, gravier3Qte, granulatCurves]);

  // Mix curve
  const mixCurve = useMemo(() => computeMixCurve(demoMaterials), [demoMaterials]);

  // Build chart data
  const chartData = useMemo(() => {
    return TAMIS_OPENINGS.map((ouv) => {
      const point: Record<string, number | string> = {
        ouverture: ouv,
        label: ouv >= 1 ? `${ouv}` : `${ouv}`,
      };

      // Reference curve
      const ref = referenceCurve.find((r) => Math.abs(r.ouverture - ouv) < 0.001);
      point["Courbe de référence"] = ref ? ref.pourcentage : 0;

      // Individual material curves
      demoMaterials.forEach((mat) => {
        const mp = mat.curve.find((c) => Math.abs(c.ouverture - ouv) < 0.001);
        point[mat.label] = mp ? parseFloat(mp.pourcentageTamisat.toFixed(1)) : 0;
      });

      // Mix curve
      const mix = mixCurve.find((m) => Math.abs(m.ouverture - ouv) < 0.001);
      point["Courbe de mélange"] = mix ? mix.pourcentage : 0;

      return point;
    });
  }, [referenceCurve, demoMaterials, mixCurve]);

  const hasMaterials = demoMaterials.length > 0;

  return (
    <div className="space-y-6">
      {/* Ratios Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Poids Total</p>
            <p className="text-2xl font-bold text-primary">{total.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">kg/m³</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">G/S</p>
            <p className="text-2xl font-bold text-primary">{ratioGS}</p>
            <p className="text-xs text-muted-foreground">Gravier/Sable</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">E/C</p>
            <p className="text-2xl font-bold text-primary">{ratioEC}</p>
            <p className="text-xs text-muted-foreground">Eau/Ciment</p>
          </CardContent>
        </Card>
      </div>

      {/* Dreux-Gorisse Chart */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Graphique Dreux-Gorisse</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Courbes granulométriques, courbe de référence et courbe de mélange — Dmax = {dMax} mm
            </p>
          </div>

          {hasMaterials ? (
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="ouverture"
                    scale="log"
                    domain={[0.063, 40]}
                    type="number"
                    tickFormatter={(v) => v >= 1 ? `${v}` : `${v}`}
                    label={{ value: "Ouverture des tamis (mm)", position: "bottom", offset: 0, className: "text-xs fill-muted-foreground" }}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    label={{ value: "% Tamisât cumulé", angle: -90, position: "insideLeft", offset: -5, className: "text-xs fill-muted-foreground" }}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    labelFormatter={(v) => `Tamis: ${v} mm`}
                    formatter={(value: number) => [`${value.toFixed(1)}%`]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "10px", paddingTop: "16px", lineHeight: "22px" }}
                    layout="horizontal"
                    align="center"
                    verticalAlign="bottom"
                    iconSize={8}
                    iconType="plainline"
                    formatter={(value) => <span style={{ marginRight: 16, whiteSpace: "nowrap" }}>{value}</span>}
                  />

                  {/* Reference curve - dashed thick */}
                  <Line
                    type="linear"
                    dataKey="Courbe de référence"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2.5}
                    strokeDasharray="8 4"
                    dot={false}
                    connectNulls
                  />

                  {/* Individual material curves */}
                  {demoMaterials.map((mat, i) => (
                    <Line
                      key={mat.label}
                      type="monotone"
                      dataKey={mat.label}
                      stroke={MATERIAL_COLORS[i % MATERIAL_COLORS.length]}
                      strokeWidth={1.5}
                      dot={{ r: 2, fill: MATERIAL_COLORS[i % MATERIAL_COLORS.length] }}
                      connectNulls
                      opacity={0.7}
                    />
                  ))}

                  {/* Mix curve - solid thick */}
                  <Line
                    type="monotone"
                    dataKey="Courbe de mélange"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ r: 3, fill: "hsl(var(--primary))" }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              Ajoutez des quantités de granulats à l'étape 3 pour afficher le graphique.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recap table */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Récapitulatif pour 1 m³</h2>

          <div className="space-y-1">
            {components.map(({ label, value, unit }) => (
              <div key={label} className="flex justify-between items-center py-2.5 border-b border-border/30">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="font-semibold text-foreground">{parseFloat(value).toFixed(1)} {unit}</span>
              </div>
            ))}

            <Separator className="my-2 bg-primary/30" />

            <div className="flex justify-between items-center py-3">
              <span className="font-bold text-foreground">Poids Total</span>
              <span className="text-xl font-bold text-primary">{total.toFixed(1)} kg/m³</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
