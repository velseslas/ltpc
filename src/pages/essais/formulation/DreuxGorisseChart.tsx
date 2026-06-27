import { useMemo } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
  Customized,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { type PointA, generateReferenceCurve } from "./dreuxGorisseCalculation";

// Standard sieve openings (mm) for Dreux-Gorisse
const ALL_TAMIS_OPENINGS = [0.063, 0.125, 0.25, 0.5, 1, 2, 4, 6.3, 8, 10, 12.5, 16, 20, 25, 31.5, 40];

function getTamisForDmax(dMax: number) {
  return ALL_TAMIS_OPENINGS.filter(t => t <= dMax + 0.001);
}

function logPos(mm: number) {
  return Math.log10(mm);
}

// Log-linear interpolation: find sieve opening (mm) where the cumulative
// passant equals the target percentage. Reads on the raw material curve.
function dAtPassant(
  curve: { ouverture: number; pourcentageTamisat: number }[],
  targetPct: number
): number | null {
  if (!curve || curve.length < 2) return null;
  // Sort ascending by opening
  const pts = [...curve].sort((a, b) => a.ouverture - b.ouverture);
  // Find the bracket where passant crosses targetPct
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const yMin = Math.min(p1.pourcentageTamisat, p2.pourcentageTamisat);
    const yMax = Math.max(p1.pourcentageTamisat, p2.pourcentageTamisat);
    if (targetPct >= yMin && targetPct <= yMax && p1.pourcentageTamisat !== p2.pourcentageTamisat) {
      const t = (targetPct - p1.pourcentageTamisat) / (p2.pourcentageTamisat - p1.pourcentageTamisat);
      const logD = Math.log10(p1.ouverture) + t * (Math.log10(p2.ouverture) - Math.log10(p1.ouverture));
      return Math.pow(10, logD);
    }
  }
  return null;
}


export interface MaterialCurve {
  label: string;
  quantity: number;
  curve: { ouverture: number; pourcentageTamisat: number }[];
}

// Compute mix curve
function computeMixCurve(materials: MaterialCurve[], dMax: number) {
  const totalQty = materials.reduce((sum, m) => sum + m.quantity, 0);
  if (totalQty === 0) return [];

  const tamis = getTamisForDmax(dMax);
  return tamis.map((ouv) => {
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
  pointA?: PointA | null;
  mfMelange?: number;
}

export default function DreuxGorisseChart({
  dMax,
  classeRheologique,
  materials,
  sables,
  graviers,
  pointA: pointAProp,
  mfMelange = 2.5,
}: DreuxGorisseChartProps) {
  const totalAggregats = sables + graviers;
  const pctSable = totalAggregats > 0 ? ((sables / totalAggregats) * 100).toFixed(1) : "-";
  const pctGravier = totalAggregats > 0 ? ((graviers / totalAggregats) * 100).toFixed(1) : "-";

  // Use provided Point A or fallback
  const pointA = pointAProp ?? { dA: dMax / 2, pA: 45 };

  const referenceCurve = useMemo(
    () => generateReferenceCurve(dMax, mfMelange, pointA),
    [dMax, mfMelange, pointA]
  );

  const envelope = useMemo(() => computeEnvelope(referenceCurve, dMax), [referenceCurve, dMax]);

  const mixCurve = useMemo(() => computeMixCurve(materials, dMax), [materials, dMax]);

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

  // Build chart data — filtered to Dmax
  const tamis = useMemo(() => getTamisForDmax(dMax), [dMax]);

  const chartData = useMemo(() => {
    return tamis.map((ouv) => {
      const point: Record<string, number | string | number[]> = { ouverture: ouv };

      const env = envelope.find((e) => Math.abs(e.ouverture - ouv) < 0.001);
      point["Limite 95 %"] = env ? env.upper : 95;
      point["Limite 5 %"] = env ? env.lower : 5;
      point["_envelopeRange"] = env ? [env.lower, env.upper] : [5, 95];

      const ref = referenceCurve.find((r) => Math.abs(r.ouverture - ouv) < 0.001);
      point["Référence Dreux-Gorisse"] = ref ? ref.pourcentage : 0;

      materials.forEach((mat) => {
        const filteredCurve = mat.curve.filter(c => c.ouverture <= dMax + 0.001);
        const mp = filteredCurve.find((c) => Math.abs(c.ouverture - ouv) < 0.001);
        point[mat.label] = mp ? parseFloat(mp.pourcentageTamisat.toFixed(1)) : 0;
      });

      const mix = mixCurve.find((m) => Math.abs(m.ouverture - ouv) < 0.001);
      point["Courbe de mélange"] = mix ? mix.pourcentage : 0;

      return point;
    });
  }, [tamis, referenceCurve, envelope, materials, mixCurve, dMax]);

  const hasMaterials = materials.length > 0;

  return (
    <div className="space-y-4">
      {/* Info panel */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Dmax</p>
          <p className="text-lg font-bold text-foreground">{dMax} mm</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Point A</p>
          <p className="text-lg font-bold text-foreground">{pointA.dA} / {pointA.pA.toFixed(1)}%</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">% Sable</p>
          <p className="text-lg font-bold text-foreground">{pctSable}%</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">% Gravier</p>
          <p className="text-lg font-bold text-foreground">{pctGravier}%</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Coeff. N</p>
          <p className="text-lg font-bold text-foreground">{(0.5 + mfMelange / 10).toFixed(2)}</p>
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
                domain={[0.063, dMax]}
                type="number"
                tickFormatter={(v: number) => `${v}`}
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
                x={pointA.dA}
                stroke="#a855f7"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                label={{
                  value: `D/2 = ${pointA.dA} mm`,
                  position: "top",
                  fill: "#a855f7",
                  fontSize: 9,
                  fontWeight: 600,
                }}
              />

              {/* Point A de Dreux */}
              <ReferenceDot
                x={pointA.dA}
                y={pointA.pA}
                r={6}
                fill="#ef4444"
                stroke="#fff"
                strokeWidth={2}
                label={{
                  value: `A (${pointA.dA}, ${pointA.pA.toFixed(1)}%)`,
                  position: "right",
                  fill: "#ef4444",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              />

              {/* Reference curve */}
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
