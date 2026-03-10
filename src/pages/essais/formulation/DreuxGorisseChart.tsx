import { useMemo } from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle } from "lucide-react";

// Standard sieve openings (mm) for Dreux-Gorisse
const TAMIS_OPENINGS = [0.063, 0.125, 0.25, 0.5, 1, 2, 4, 6.3, 8, 10, 12.5, 16, 20, 25, 31.5, 40];

function logPos(mm: number) {
  return Math.log10(mm);
}

// Dreux-Gorisse reference curve (broken line through Point A)
function computeReferenceCurve(dMax: number, classeConsistance: string) {
  const dMin = 0.063;
  const kMap: Record<string, number> = {
    S1: 6, S2: 4, S3: 0, S4: -4, S5: -6,
  };
  const classeKey = classeConsistance?.split(" ")[0] || "S3";
  const K = kMap[classeKey] ?? 0;

  // Point A coordinates (Dreux method)
  const xA = dMax / 2;
  const yA = 50 - Math.sqrt(dMax) + K;

  const points: { ouverture: number; pourcentage: number }[] = [];

  for (const ouv of TAMIS_OPENINGS) {
    if (ouv < dMin) continue;
    if (ouv > dMax * 1.01) break;

    let y: number;
    if (ouv <= xA) {
      // Segment from origin (dMin, 0) to Point A (xA, yA) - log interpolation
      const t = (logPos(ouv) - logPos(dMin)) / (logPos(xA) - logPos(dMin));
      y = t * yA;
    } else {
      // Segment from Point A (xA, yA) to (dMax, 100) - log interpolation
      const t = (logPos(ouv) - logPos(xA)) / (logPos(dMax) - logPos(xA));
      y = yA + t * (100 - yA);
    }
    points.push({ ouverture: ouv, pourcentage: Math.max(0, Math.min(100, y)) });
  }

  return { points, yA, xA };
}

// Envelope: 5% lower limit and 95% upper limit curves
function computeEnvelope(
  refPoints: { ouverture: number; pourcentage: number }[],
  dMax: number
) {
  if (refPoints.length === 0) return [];
  const dMin = 0.063;

  return refPoints.map((p) => {
    // Progressive offset: larger in the middle, smaller at extremes
    const logRange = logPos(dMax) - logPos(dMin);
    const logRel = (logPos(p.ouverture) - logPos(dMin)) / logRange;
    // Bell-shaped offset peaking at center
    const offset = 15 * Math.sin(logRel * Math.PI);
    
    return {
      ouverture: p.ouverture,
      upper: Math.min(95, p.pourcentage + offset),
      lower: Math.max(5, p.pourcentage - offset),
    };
  });
}

// Module de finesse from sand curve (sum of % retained at 0.125, 0.25, 0.5, 1, 2, 4 / 100)
function computeModuleFinesse(
  materials: MaterialCurve[],
  sableLabels: string[]
) {
  const sandMats = materials.filter((m) =>
    sableLabels.some((l) => m.label.toLowerCase().includes(l.toLowerCase()))
  );
  if (sandMats.length === 0) return null;

  const sandTotal = sandMats.reduce((s, m) => s + m.quantity, 0);
  if (sandTotal === 0) return null;

  const mfTamis = [0.125, 0.25, 0.5, 1, 2, 4];
  let sumRefused = 0;

  for (const tamis of mfTamis) {
    let weightedPass = 0;
    for (const mat of sandMats) {
      const pt = mat.curve.find((c) => Math.abs(c.ouverture - tamis) < 0.001);
      const pass = pt ? pt.pourcentageTamisat : 100;
      weightedPass += (pass * mat.quantity) / sandTotal;
    }
    sumRefused += (100 - weightedPass);
  }

  return parseFloat((sumRefused / 100).toFixed(2));
}

export interface MaterialCurve {
  label: string;
  quantity: number;
  curve: { ouverture: number; pourcentageTamisat: number }[];
}

// Compute mix curve
function computeMixCurve(materials: MaterialCurve[]) {
  const totalQty = materials.reduce((sum, m) => sum + m.quantity, 0);
  if (totalQty === 0) return [];

  return TAMIS_OPENINGS.map((ouv) => {
    let weightedPass = 0;
    for (const mat of materials) {
      const point = mat.curve.find((p) => Math.abs(p.ouverture - ouv) < 0.001);
      const passPercent = point
        ? point.pourcentageTamisat
        : ouv > (mat.curve[mat.curve.length - 1]?.ouverture || 0)
          ? 100
          : 0;
      weightedPass += (passPercent * mat.quantity) / totalQty;
    }
    return { ouverture: ouv, pourcentage: parseFloat(weightedPass.toFixed(1)) };
  });
}

const MATERIAL_COLORS = [
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
];

interface DreuxGorisseChartProps {
  dMax: number;
  classeRheologique: string;
  materials: MaterialCurve[];
  sables: number;
  graviers: number;
}

export default function DreuxGorisseChart({
  dMax,
  classeRheologique,
  materials,
  sables,
  graviers,
}: DreuxGorisseChartProps) {
  const totalAggregats = sables + graviers;
  const pctSable = totalAggregats > 0 ? ((sables / totalAggregats) * 100).toFixed(1) : "-";
  const pctGravier = totalAggregats > 0 ? ((graviers / totalAggregats) * 100).toFixed(1) : "-";

  const { points: referenceCurve, yA, xA } = useMemo(
    () => computeReferenceCurve(dMax, classeRheologique),
    [dMax, classeRheologique]
  );

  const envelope = useMemo(() => computeEnvelope(referenceCurve, dMax), [referenceCurve, dMax]);

  const mixCurve = useMemo(() => computeMixCurve(materials), [materials]);

  const moduleFinesse = useMemo(
    () => computeModuleFinesse(materials, ["sable"]),
    [materials]
  );

  // Check conformity: mix curve within envelope (5%-95%)
  const isConforme = useMemo(() => {
    if (mixCurve.length === 0) return null;
    for (const mp of mixCurve) {
      const env = envelope.find((e) => Math.abs(e.ouverture - mp.ouverture) < 0.001);
      if (!env) continue;
      if (mp.pourcentage < env.lower - 0.5 || mp.pourcentage > env.upper + 0.5) {
        return false;
      }
    }
    return true;
  }, [mixCurve, envelope]);

  // Build chart data
  const chartData = useMemo(() => {
    return TAMIS_OPENINGS.map((ouv) => {
      const point: Record<string, number | string | number[]> = { ouverture: ouv };

      // Envelope
      const env = envelope.find((e) => Math.abs(e.ouverture - ouv) < 0.001);
      point["Limite 95 %"] = env ? env.upper : 95;
      point["Limite 5 %"] = env ? env.lower : 5;
      point["_envelopeRange"] = env ? [env.lower, env.upper] : [5, 95];

      // Reference
      const ref = referenceCurve.find((r) => Math.abs(r.ouverture - ouv) < 0.001);
      point["Référence Dreux-Gorisse"] = ref ? ref.pourcentage : 0;

      // Materials
      materials.forEach((mat) => {
        const mp = mat.curve.find((c) => Math.abs(c.ouverture - ouv) < 0.001);
        point[mat.label] = mp ? parseFloat(mp.pourcentageTamisat.toFixed(1)) : 0;
      });

      // Mix
      const mix = mixCurve.find((m) => Math.abs(m.ouverture - ouv) < 0.001);
      point["Courbe de mélange"] = mix ? mix.pourcentage : 0;

      return point;
    });
  }, [referenceCurve, envelope, materials, mixCurve]);

  const dMaxHalf = dMax / 2;
  const hasMaterials = materials.length > 0;

  return (
    <div className="space-y-4">
      {/* Info panel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Dmax</p>
          <p className="text-lg font-bold text-foreground">{dMax} mm</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Module de finesse</p>
          <p className="text-lg font-bold text-foreground">{moduleFinesse ?? "-"}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">% Sable</p>
          <p className="text-lg font-bold text-foreground">{pctSable}%</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">% Gravier</p>
          <p className="text-lg font-bold text-foreground">{pctGravier}%</p>
        </div>
      </div>

      {/* Chart */}
      {hasMaterials ? (
        <div className="h-[500px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
              <XAxis
                dataKey="ouverture"
                scale="log"
                domain={[0.063, 40]}
                type="number"
                tickFormatter={(v: number) => (v >= 1 ? `${v}` : `${v}`)}
                label={{
                  value: "Ouverture des tamis (mm)",
                  position: "bottom",
                  offset: 0,
                  className: "text-xs fill-muted-foreground",
                }}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                domain={[0, 100]}
                label={{
                  value: "% Tamisât cumulé",
                  angle: -90,
                  position: "insideLeft",
                  offset: -5,
                  className: "text-xs fill-muted-foreground",
                }}
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
                formatter={(value: number, name: string) => {
                  if (name === "_envelopeRange" || name === "Fuseau granulaire") return [null, null];
                  return [`${typeof value === "number" ? value.toFixed(1) : value}%`, name];
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "9px", paddingTop: "10px", lineHeight: "18px" }}
                layout="horizontal"
                align="center"
                verticalAlign="bottom"
                iconSize={8}
                iconType="plainline"
                formatter={(value: string) => {
                  if (value === "_envelopeRange") return null;
                  return <span style={{ marginRight: 10, whiteSpace: "nowrap" }}>{value}</span>;
                }}
              />

              {/* Fuseau granulaire - shaded area */}
              <Area
                type="linear"
                dataKey="_envelopeRange"
                fill="hsl(var(--primary))"
                fillOpacity={0.08}
                stroke="none"
                legendType="none"
                tooltipType="none"
                connectNulls
              />

              {/* Upper envelope line - Limite 95% */}
              <Line
                type="linear"
                dataKey="Limite 95 %"
                stroke="#22c55e"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                dot={false}
                connectNulls
                name="Limite 95 %"
              />

              {/* Lower envelope line - Limite 5% */}
              <Line
                type="linear"
                dataKey="Limite 5 %"
                stroke="#f97316"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                dot={false}
                connectNulls
                name="Limite 5 %"
              />

              {/* Vertical reference lines */}
              <ReferenceLine
                x={dMax}
                stroke="hsl(var(--destructive))"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                label={{
                  value: `Dmax = ${dMax} mm`,
                  position: "top",
                  fill: "hsl(var(--destructive))",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
              <ReferenceLine
                x={dMaxHalf}
                stroke="#a855f7"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                label={{
                  value: `D/2 = ${dMaxHalf} mm (Limite sable / gravier)`,
                  position: "top",
                  fill: "#a855f7",
                  fontSize: 9,
                  fontWeight: 600,
                }}
              />

              {/* Point A de Dreux */}
              <ReferenceDot
                x={xA}
                y={yA}
                r={6}
                fill="#ef4444"
                stroke="#fff"
                strokeWidth={2}
                label={{
                  value: `A (${xA}, ${yA.toFixed(1)}%)`,
                  position: "right",
                  fill: "#ef4444",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              />

              {/* Reference curve - Dreux-Gorisse broken line */}
              <Line
                type="linear"
                dataKey="Référence Dreux-Gorisse"
                stroke="hsl(var(--destructive))"
                strokeWidth={2.5}
                strokeDasharray="8 4"
                dot={false}
                connectNulls
                name="Référence Dreux-Gorisse"
              />

              {/* Individual material curves */}
              {materials.map((mat, i) => (
                <Line
                  key={mat.label}
                  type="monotone"
                  dataKey={mat.label}
                  stroke={MATERIAL_COLORS[i % MATERIAL_COLORS.length]}
                  strokeWidth={1.5}
                  dot={{ r: 2, fill: MATERIAL_COLORS[i % MATERIAL_COLORS.length] }}
                  connectNulls
                  opacity={0.85}
                  name={mat.label}
                />
              ))}

              {/* Mix curve */}
              <Line
                type="monotone"
                dataKey="Courbe de mélange"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ r: 3, fill: "hsl(var(--primary))" }}
                connectNulls
                name="Courbe de mélange"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
          Ajoutez des quantités de granulats à l'étape 3 pour afficher le graphique.
        </div>
      )}

      {/* Fuseau legend */}
      {hasMaterials && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block w-6 h-3 rounded-sm" style={{ backgroundColor: "hsl(var(--primary))", opacity: 0.15 }} />
          Fuseau granulométrique Dreux-Gorisse (entre limites 5 % et 95 %)
        </div>
      )}

      {/* Conformity badge */}
      {isConforme !== null && (
        <div className="pt-1">
          {isConforme ? (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1.5 py-1.5 px-3">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Granulométrie conforme à la méthode Dreux-Gorisse
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 gap-1.5 py-1.5 px-3">
              <AlertTriangle className="h-3.5 w-3.5" />
              Granulométrie hors fuseau – ajuster les proportions sable/gravier
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
