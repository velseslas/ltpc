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

const D_MIN_REF = 0.080;

/** Interpolation log-linéaire : ouverture (mm) où la courbe atteint p%.
 *  Fallback robuste : si p est hors plage, renvoie l'ouverture du point le
 *  plus proche afin de toujours produire une ligne de partage exploitable. */
function dAtPassant(
  curve: { ouverture: number; pourcentageTamisat: number }[],
  p: number
): number | null {
  const pts = [...curve]
    .filter((c) => c.ouverture > 0 && Number.isFinite(c.pourcentageTamisat))
    .sort((a, b) => a.ouverture - b.ouverture);
  if (pts.length === 0) return null;
  if (pts.length === 1) return pts[0].ouverture;
  if (p <= pts[0].pourcentageTamisat) return pts[0].ouverture;
  if (p >= pts[pts.length - 1].pourcentageTamisat) return pts[pts.length - 1].ouverture;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (p >= a.pourcentageTamisat && p <= b.pourcentageTamisat) {
      if (b.pourcentageTamisat === a.pourcentageTamisat) return a.ouverture;
      const xa = Math.log10(a.ouverture);
      const xb = Math.log10(b.ouverture);
      const t = (p - a.pourcentageTamisat) / (b.pourcentageTamisat - a.pourcentageTamisat);
      return Math.pow(10, xa + t * (xb - xa));
    }
  }
  return pts[pts.length - 1].ouverture;
}

/** Intersection segment/segment ; renvoie null si non sécant. */
function intersectSegments(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  p4: { x: number; y: number }
) {
  const rx = p2.x - p1.x;
  const ry = p2.y - p1.y;
  const sx = p4.x - p3.x;
  const sy = p4.y - p3.y;
  const denom = rx * sy - ry * sx;
  if (Math.abs(denom) < 1e-12) return null;
  const qpx = p3.x - p1.x;
  const qpy = p3.y - p1.y;
  const t = (qpx * sy - qpy * sx) / denom;
  const u = (qpx * ry - qpy * rx) / denom;
  const EPS = 1e-9;
  if (t < -EPS || t > 1 + EPS) return null;
  if (u < -EPS || u > 1 + EPS) return null;
  return { x: p1.x + t * rx, y: p1.y + t * ry };
}

// Standard sieve openings (mm) for Dreux-Gorisse
const ALL_TAMIS_OPENINGS = [0.063, 0.125, 0.25, 0.5, 1, 2, 4, 6.3, 8, 10, 12.5, 16, 20, 25, 31.5, 40];

function getTamisForDmax(dMax: number) {
  return ALL_TAMIS_OPENINGS.filter(t => t <= dMax + 0.001);
}

function logPos(mm: number) {
  return Math.log10(mm);
}



export interface MaterialCurve {
  label: string;
  quantity: number;
  curve: { ouverture: number; pourcentageTamisat: number }[];
}

type MaterialSeriesId = "sable01" | "sable04" | "gravier815" | "gravier1525" | "other";

const STRICT_PARTITION_ORDER: MaterialSeriesId[] = ["sable01", "sable04", "gravier815", "gravier1525"];
const SERIES_LOWER_5MM: Partial<Record<MaterialSeriesId, number>> = {
  gravier815: 6.3,
  gravier1525: 12.5,
};

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

function getCurveFinenessKey(material: MaterialCurve) {
  const d50 = dAtPassant(material.curve, 50);
  const dMaxMat = material.curve.reduce((mx, p) => (p.ouverture > mx ? p.ouverture : mx), 0);
  return d50 ?? dMaxMat;
}

function interpolatePassantAtOpening(
  curve: { ouverture: number; pourcentageTamisat: number }[],
  opening: number
) {
  const pts = [...curve]
    .filter((c) => c.ouverture > 0 && Number.isFinite(c.pourcentageTamisat))
    .sort((a, b) => a.ouverture - b.ouverture);
  if (pts.length === 0) return null;
  if (opening <= pts[0].ouverture) return pts[0].pourcentageTamisat;
  if (opening >= pts[pts.length - 1].ouverture) return pts[pts.length - 1].pourcentageTamisat;

  const targetLogX = Math.log10(opening);
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (opening >= a.ouverture && opening <= b.ouverture) {
      const xa = Math.log10(a.ouverture);
      const xb = Math.log10(b.ouverture);
      const t = (targetLogX - xa) / (xb - xa || 1);
      return a.pourcentageTamisat + t * (b.pourcentageTamisat - a.pourcentageTamisat);
    }
  }
  return null;
}

function dAtPassantForSeries(
  curve: { ouverture: number; pourcentageTamisat: number }[],
  p: number,
  seriesId: MaterialSeriesId
) {
  const lowerLimit = p === 5 ? SERIES_LOWER_5MM[seriesId] : undefined;

  if (!lowerLimit) return dAtPassant(curve, p);

  const lowerPassant = interpolatePassantAtOpening(curve, lowerLimit);
  if (lowerPassant !== null && lowerPassant >= p) return lowerLimit;

  const restrictedCurve = [
    ...(lowerPassant !== null ? [{ ouverture: lowerLimit, pourcentageTamisat: lowerPassant }] : []),
    ...curve.filter((c) => c.ouverture > lowerLimit + 1e-9),
  ];

  return dAtPassant(restrictedCurve, p) ?? lowerLimit;
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

// Couleur fixe par type de matériau pour garantir l'association demandée :
// Sable 0/1 → orange, Sable 0/4 → vert, Gravier 8/15 → violet, Gravier 15/25 → rouge.
const MATERIAL_COLOR_BY_SERIES: Record<MaterialSeriesId, string> = {
  sable01: "#f59e0b",
  sable04: "#10b981",
  gravier815: "#8b5cf6",
  gravier1525: "#ef4444",
  other: "#06b6d4",
};

function getMaterialColor(label: string, fallbackIndex: number) {
  const seriesId = getMaterialSeriesId(label);
  if (seriesId !== "other") return MATERIAL_COLOR_BY_SERIES[seriesId];
  return MATERIAL_COLORS[fallbackIndex % MATERIAL_COLORS.length];
}

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

  const mixCurve = useMemo(() => computeMixCurve(materials, dMax), [materials, dMax]);

  // Conformity: mix curve cumulated pass within ±5 % of reference at each sieve.
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


  // ===== Méthode graphique 95/5 — droites de partage et fractions =====
  // Association stricte des séries pour la méthode 95/5 :
  // Sable 0/1 → Sable 0/4 → Gravier 8/15 → Gravier 15/25.
  // Les matériaux non standards restent triés physiquement en fallback.
  const sortedMaterials = useMemo(() => {
    const usedLabels = new Set<string>();

    const ordered = STRICT_PARTITION_ORDER
      .map((seriesId) => materials.find((m) => getMaterialSeriesId(m.label) === seriesId))
      .filter((m): m is MaterialCurve => {
        if (!m || usedLabels.has(m.label)) return false;
        usedLabels.add(m.label);
        return true;
      });

    if (ordered.length === STRICT_PARTITION_ORDER.length) return ordered;

    const fallback = materials
      .filter((m) => !usedLabels.has(m.label))
      .sort((a, b) => getCurveFinenessKey(a) - getCurveFinenessKey(b));

    return [...ordered, ...fallback];
  }, [materials]);

  const partitionData = useMemo(() => {
    if (sortedMaterials.length < 2) {
      return { lines: [] as Array<{
        pair: string;
        from: { x: number; y: number };
        to: { x: number; y: number };
        intersection: { x: number; y: number } | null;
      }>, fractions: [] as Array<{ label: string; pct: number }> };
    }

    // OAB en coordonnées (mm, %).
    const O = { x: D_MIN_REF, y: 0 };
    const A = { x: pointA.dA, y: pointA.pA };
    const B = { x: dMax, y: 100 };

    // Intersection en (log10 d, %).
    const Olog = { x: Math.log10(O.x), y: O.y };
    const Alog = { x: Math.log10(A.x), y: A.y };
    const Blog = { x: Math.log10(B.x), y: B.y };

    const lines: Array<{
      pair: string;
      from: { x: number; y: number };
      to: { x: number; y: number };
      intersection: { x: number; y: number } | null;
    }> = [];
    const cutoffs: number[] = []; // Y1, Y2, Y3… dans l'ordre des paires (du plus fin au plus gros)

    for (let i = 0; i < sortedMaterials.length - 1; i++) {
      const fin = sortedMaterials[i];
      const suivant = sortedMaterials[i + 1];
      const finSeriesId = getMaterialSeriesId(fin.label);
      const suivantSeriesId = getMaterialSeriesId(suivant.label);
      let d95 = dAtPassantForSeries(fin.curve, 95, finSeriesId);
      let d05 = dAtPassantForSeries(suivant.curve, 5, suivantSeriesId);
      // Garde-fous : si la courbe ne fournit pas l'ordonnée, on retombe sur
      // l'extrémité raisonnable (max pour le fin, min utile pour le suivant).
      if (d95 == null) {
        d95 = fin.curve.reduce((mx, p) => (p.ouverture > mx ? p.ouverture : mx), 0) || 0.063;
      }
      if (d05 == null) {
        const nonZero = suivant.curve.filter((p) => p.pourcentageTamisat > 0);
        d05 = nonZero.length
          ? nonZero.reduce((mn, p) => (p.ouverture < mn ? p.ouverture : mn), Infinity)
          : 0.063;
      }
      const from = { x: d95, y: 95 };
      const to = { x: d05, y: 5 };

      const P95log = { x: Math.log10(d95), y: 95 };
      const P05log = { x: Math.log10(d05), y: 5 };

      // Tentative d'intersection avec les segments OA puis AB.
      const seg1 = intersectSegments(P95log, P05log, Olog, Alog);
      const seg2 = intersectSegments(P95log, P05log, Alog, Blog);
      const candidates = [seg1, seg2].filter((p): p is { x: number; y: number } => p !== null);
      let intersection: { x: number; y: number } | null = null;
      if (candidates.length > 0) {
        candidates.sort((a, b) => Math.abs(a.y - A.y) - Math.abs(b.y - A.y));
        const chosen = candidates[0];
        intersection = { x: Math.pow(10, chosen.x), y: chosen.y };
      } else {
        // Fallback : intersection avec la droite OAB prolongée
        // en cherchant le y sur la référence à mi-chemin (interp x).
        const midLogX = (P95log.x + P05log.x) / 2;
        // y de la référence par interpolation linéaire en log
        const refY = (() => {
          const refCurve = referenceCurve;
          for (let k = 0; k < refCurve.length - 1; k++) {
            const a = refCurve[k];
            const b = refCurve[k + 1];
            const xa = Math.log10(a.ouverture);
            const xb = Math.log10(b.ouverture);
            if (midLogX >= xa && midLogX <= xb) {
              const t = (midLogX - xa) / (xb - xa || 1);
              return a.pourcentage + t * (b.pourcentage - a.pourcentage);
            }
          }
          return 50;
        })();
        intersection = { x: Math.pow(10, midLogX), y: refY };
      }
      cutoffs.push(Math.min(100, Math.max(0, intersection.y)));
      lines.push({ pair: `${fin.label} → ${suivant.label}`, from, to, intersection });
    }

    // Les cutoffs sont déjà dans l'ordre cumulé (fin → gros) : Y1, Y2, Y3…
    // Forçage de la monotonie croissante pour éviter toute inversion numérique.
    const sortedCutoffs: number[] = [];
    let last = 0;
    for (const c of cutoffs) {
      const v = Math.max(c, last);
      sortedCutoffs.push(v);
      last = v;
    }

    const fractions: Array<{ label: string; pct: number }> = [];
    let prev = 0;
    for (let i = 0; i < sortedMaterials.length; i++) {
      let pct: number;
      if (i < sortedCutoffs.length) {
        pct = sortedCutoffs[i] - prev;
        prev = sortedCutoffs[i];
      } else {
        pct = 100 - prev;
      }
      fractions.push({ label: sortedMaterials[i].label, pct: Math.max(0, pct) });
    }

    // Normalisation finale pour garantir un total strict de 100.0 %.
    const total = fractions.reduce((s, f) => s + f.pct, 0);
    if (total > 0 && Math.abs(total - 100) > 1e-6) {
      const k = 100 / total;
      fractions.forEach((f) => (f.pct = f.pct * k));
    }

    return { lines, fractions, sortedCutoffs };
  }, [sortedMaterials, pointA, dMax, referenceCurve]);

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
            <svg width="22" height="6"><line x1="0" y1="3" x2="22" y2="3" stroke="#dc2626" strokeWidth="1.2" strokeDasharray="4 3" /></svg>
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
                      <td className="px-3 py-2 text-right font-mono font-semibold text-red-600">
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
