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
import type { PointA, GravelSplitReport } from "./dreuxGorisseCalculation";

// Standard sieve openings (mm) for Dreux-Gorisse
const ALL_TAMIS_OPENINGS = [0.063, 0.125, 0.25, 0.5, 1, 2, 4, 6.3, 8, 10, 12.5, 16, 20, 25, 31.5, 40];

function getTamisForDmax(dMax: number) {
  return ALL_TAMIS_OPENINGS.filter(t => t <= dMax + 0.001);
}

export interface MaterialCurve {
  label: string;
  quantity: number;
  curve: { ouverture: number; pourcentageTamisat: number }[];
}

type MaterialSeriesId = "sable01" | "sable04" | "gravier815" | "gravier1525" | "other";

const STRICT_PARTITION_ORDER: MaterialSeriesId[] = ["sable01", "sable04", "gravier815", "gravier1525"];

function normalizeMaterialLabel(label: string) {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getMaterialSeriesId(label: string): MaterialSeriesId {
  const normalized = normalizeMaterialLabel(label);
  const isSable = normalized.includes("sable");
  const isGravier = normalized.includes("gravier") || normalized.includes("gravillon");

  if (isSable && /\b0\s*\/\s*1\b/.test(normalized)) return "sable01";
  if (isSable && /\b0\s*\/\s*4\b/.test(normalized)) return "sable04";
  if (isGravier && /\b8\s*\/\s*15\b/.test(normalized)) return "gravier815";
  if (isGravier && /\b15\s*\/\s*25\b/.test(normalized)) return "gravier1525";
  return "other";
}

// Phase 6 — computeMixCurve, dAtPassant, dAtPassantForSeries, intersectSegments,
// SERIES_LOWER_5MM, getCurveFinenessKey, interpolatePassantAtOpening, MATERIAL_COLOR_BY_SERIES
// TOUS supprimés : le composant devient un LECTEUR PUR de calcResult.

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
  /** Point A produit par le moteur (Phase 6 : source unique — jamais recalculé ici). */
  pointA: PointA;
  /** Courbe OAB produite par le moteur (Phase 6 : source unique). */
  referenceCurve: { ouverture: number; pourcentage: number }[];
  /** Courbe de mélange produite par le moteur (Phase 6 : source unique). */
  mixCurve: { ouverture: number; pourcentage: number }[];
  /** Rapport de répartition 95/5 issu du moteur (Phase 6 : source unique). */
  gravelSplit: GravelSplitReport;
  mfMelange?: number;
}

export default function DreuxGorisseChart({
  dMax,
  classeRheologique,
  materials,
  sables,
  graviers,
  pointA,
  referenceCurve,
  mixCurve,
  gravelSplit,
  mfMelange = 2.5,
}: DreuxGorisseChartProps) {
  void classeRheologique;
  const totalAggregats = sables + graviers;
  const pctSable = totalAggregats > 0 ? ((sables / totalAggregats) * 100).toFixed(1) : "-";
  const pctGravier = totalAggregats > 0 ? ((graviers / totalAggregats) * 100).toFixed(1) : "-";


  // Conformity: mix curve cumulated pass within ±8 % of reference at each sieve.
  const isConforme = useMemo(() => {
    if (mixCurve.length === 0) return null;
    for (const mp of mixCurve) {
      const ref = referenceCurve.find((r) => Math.abs(r.ouverture - mp.ouverture) < 0.001);
      if (!ref) continue;
      if (Math.abs(mp.pourcentage - ref.pourcentage) > 8) return false;
    }
    return true;
  }, [mixCurve, referenceCurve]);

  // Build chart data — filtered to Dmax
  const tamis = useMemo(() => getTamisForDmax(dMax), [dMax]);

  const chartData = useMemo(() => {
    return tamis.map((ouv) => {
      const point: Record<string, number | string | number[]> = { ouverture: ouv };

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
  }, [tamis, referenceCurve, materials, mixCurve, dMax]);


  // Phase 6 — sortedMaterials : uniquement pour l'affichage ordonné (couleurs). Aucun calcul métier ici.
  const sortedMaterials = useMemo(() => {
    const usedLabels = new Set<string>();
    const ordered = STRICT_PARTITION_ORDER
      .map((seriesId) => materials.find((m) => getMaterialSeriesId(m.label) === seriesId))
      .filter((m): m is MaterialCurve => {
        if (!m || usedLabels.has(m.label)) return false;
        usedLabels.add(m.label);
        return true;
      });
    const rest = materials.filter((m) => !usedLabels.has(m.label));
    return [...ordered, ...rest];
  }, [materials]);

  // Phase 6 : lignes de partage lues DIRECTEMENT depuis gravelSplit (moteur). Aucun recalcul.
  const partitionLines = gravelSplit.partitionLines;
  const gravelProportions = gravelSplit.proportions;

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
                // Domaine dynamique : borné par dMax (0.063 mm → dMax mm).
                // Les lignes de référence 5% / 95% s'étendent jusqu'à cette valeur.
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
                formatter={(value: string) => (
                  <span style={{ marginRight: 10, whiteSpace: "nowrap" }}>{value}</span>
                )}
              />

              {/* Lignes de référence horizontales 5% et 95% — dynamiques
                  suivant la valeur de dMax. Elles traversent tout le graphique
                  de l'abscisse 0.063 mm jusqu'à dMax. */}
              <ReferenceLine
                y={95}
                stroke="#94a3b8"
                strokeWidth={1.2}
                strokeDasharray="4 3"
                ifOverflow="extendDomain"
                label={{
                  value: "95%",
                  position: "right",
                  fill: "#94a3b8",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
              <ReferenceLine
                y={5}
                stroke="#94a3b8"
                strokeWidth={1.2}
                strokeDasharray="4 3"
                ifOverflow="extendDomain"
                label={{
                  value: "5%",
                  position: "right",
                  fill: "#94a3b8",
                  fontSize: 10,
                  fontWeight: 600,
                }}
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

              {/* Individual material curves — couleur assignée par RANG de finesse
                  (sortedMaterials : du plus fin au plus gros). Cela garantit que
                  la 1re courbe = orange (sable fin), 2e = vert (sable), 3e = violet
                  (gravier intermédiaire), 4e = rouge (gravier grossier), même si
                  les labels ne correspondent pas exactement aux gabarits 8/15, 15/25… */}
              {materials.map((mat) => {
                const orderedIdx = sortedMaterials.findIndex((m) => m.label === mat.label);
                const colorIdx = orderedIdx >= 0 ? orderedIdx : materials.indexOf(mat);
                const color = MATERIAL_COLORS[colorIdx % MATERIAL_COLORS.length];
                return (
                  <Line
                    key={mat.label}
                    type="monotone"
                    dataKey={mat.label}
                    stroke={color}
                    strokeWidth={1.5}
                    dot={{ r: 2, fill: color }}
                    connectNulls
                    opacity={0.85}
                    name={mat.label}
                  />
                );
              })}

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

              {/* Droites de partage 95/5 + projections horizontales — rendues
                  via un calque SVG custom utilisant directement les échelles
                  des axes. Garantit un tracé strictement aligné en log10(X)
                  entre P95(d95, 95) et P05(d05, 5) pour chaque paire. */}
              <Customized
                component={(props: any) => {
                  const { xAxisMap, yAxisMap } = props;
                  const xKey = xAxisMap ? Object.keys(xAxisMap)[0] : null;
                  const yKey = yAxisMap ? Object.keys(yAxisMap)[0] : null;
                  if (!xKey || !yKey) return null;
                  const xScale = xAxisMap[xKey].scale;
                  const yScale = yAxisMap[yKey].scale;
                  const xRange = xScale.range();
                  const xLeft = Math.min(xRange[0], xRange[1]);

                  return (
                    <g>
                      {partitionData.lines.map((ln, idx) => {
                        const x1 = xScale(ln.from.x);
                        const y1 = yScale(ln.from.y);
                        const x2 = xScale(ln.to.x);
                        const y2 = yScale(ln.to.y);
                        if (![x1, y1, x2, y2].every((v) => Number.isFinite(v))) return null;
                        const inter = ln.intersection;
                        const xi = inter ? xScale(inter.x) : null;
                        const yi = inter ? yScale(inter.y) : null;
                        // Les droites obliques 95/5 sont calculées en arrière-plan
                        // mais ne sont plus dessinées pour épurer le graphique.
                        // On ne garde que la projection horizontale + intersection.
                        if (!inter || !Number.isFinite(xi as number) || !Number.isFinite(yi as number)) {
                          return null;
                        }
                        return (
                        <g key={`partition-g-${idx}`}>
                            {/* Projection horizontale pointillée vers l'axe Y */}
                            <line
                              x1={xLeft}
                              y1={yi as number}
                              x2={xi as number}
                              y2={yi as number}
                              stroke="#9CA3AF"
                              strokeWidth={1}
                              strokeDasharray="4 3"
                            />
                            {/* Étiquette pourcentage sur l'axe Y, alignée verticalement avec la projection */}
                            <text
                              x={(xLeft as number) + 4}
                              y={yi as number}
                              dy="0.32em"
                              fill="#9CA3AF"
                              fontSize={11}
                              fontWeight={600}
                            >
                              {inter.y.toFixed(1)} %
                            </text>
                            {/* Point d'intersection sur la courbe de référence OAB */}
                            <circle
                              cx={xi as number}
                              cy={yi as number}
                              r={4}
                              fill="#ffffff"
                              stroke="#3B82F6"
                              strokeWidth={1}
                            />
                          </g>
                        );
                      })}
                    </g>
                  );
                }}
              />

            </ComposedChart>
          </ResponsiveContainer>
        </div>

      ) : (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
          Ajoutez des quantités de granulats à l'étape 3 pour afficher le graphique.
        </div>
      )}

      {/* Légende des lignes de référence */}
      {hasMaterials && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <svg width="22" height="6"><line x1="0" y1="3" x2="22" y2="3" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="4 3" /></svg>
            Lignes 5% et 95% (dynamiques jusqu'à dMax = {dMax} mm)
          </span>
          <span className="flex items-center gap-2">
            <svg width="22" height="6"><line x1="0" y1="3" x2="22" y2="3" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="4 3" /></svg>
            Projection vers l'axe Y (% cumulé)
          </span>
        </div>
      )}

      {/* Tableau récapitulatif des fractions individuelles (méthode graphique 95/5) */}
      {hasMaterials && partitionData.fractions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Fractions individuelles — Méthode graphique 95/5 Dreux-Gorisse
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-foreground">Constituant</th>
                  <th className="px-3 py-2 text-right font-semibold text-foreground">% cumulé lu</th>
                  <th className="px-3 py-2 text-right font-semibold text-foreground">% fraction</th>
                </tr>
              </thead>
              <tbody>
                {partitionData.fractions.map((f, i) => {
                  const sortedCutoffs = partitionData.sortedCutoffs ?? [];
                  const cum = i < sortedCutoffs.length ? sortedCutoffs[i] : 100;
                  return (
                    <tr key={f.label} className="border-t border-border">
                      <td className="px-3 py-2 text-foreground">{f.label}</td>
                      <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                        {typeof cum === "number" ? `${cum.toFixed(1)} %` : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-foreground">
                        {f.pct.toFixed(1)} %
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t border-border bg-muted/30">
                  <td className="px-3 py-2 font-semibold text-foreground">Total</td>
                  <td className="px-3 py-2"></td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-foreground">
                    {partitionData.fractions.reduce((s, f) => s + f.pct, 0).toFixed(1)} %
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground italic">
            Calcul par soustractions successives des ordonnées d'intersection des droites P95(d₉₅, 95%) → P05(d₀₅, 5%) avec la courbe de référence OAB.
          </p>
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
              Granulométrie hors plage – écart supérieur à 8 % avec la courbe de référence
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
