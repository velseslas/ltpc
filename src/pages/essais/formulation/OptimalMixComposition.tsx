import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateReferenceCurve, type PointA } from "./dreuxGorisseCalculation";
import type { MaterialCurve } from "./DreuxGorisseChart";

const ALL_TAMIS = [0.063, 0.125, 0.25, 0.5, 1, 2, 4, 6.3, 8, 10, 12.5, 16, 20, 25, 31.5, 40];

interface OptimalMixCompositionProps {
  dMax: number;
  mfMelange: number;
  pointA: PointA | null;
  materials: MaterialCurve[];
  /** Densités absolues (kg/m³) par label de matériau, pour convertir vol → masse. */
  densities?: Record<string, number>;
}

/** Passant interpolé/évalué d'un matériau à une ouverture donnée. */
function passantAt(curve: { ouverture: number; pourcentageTamisat: number }[], ouv: number): number {
  const p = curve.find((c) => Math.abs(c.ouverture - ouv) < 1e-6);
  if (p) return p.pourcentageTamisat;
  const maxOuv = curve.reduce((m, c) => Math.max(m, c.ouverture), 0);
  return ouv > maxOuv ? 100 : 0;
}

/** Projection sur le simplexe { x ≥ 0, Σ x = 1 } (Wang & Carreira-Perpiñán, 2013). */
function projectSimplex(v: number[]): number[] {
  const n = v.length;
  const u = [...v].sort((a, b) => b - a);
  let cssv = 0;
  let rho = -1;
  for (let i = 0; i < n; i++) {
    cssv += u[i];
    const t = (cssv - 1) / (i + 1);
    if (u[i] - t > 0) rho = i;
  }
  const lambda = (u.slice(0, rho + 1).reduce((s, x) => s + x, 0) - 1) / (rho + 1);
  return v.map((x) => Math.max(0, x - lambda));
}

/**
 * Résout min_x ||A x - b||² sous contraintes x ≥ 0, Σ x = 1,
 * par gradient projeté à pas adaptatif.
 */
function solveOptimalProportions(A: number[][], b: number[], n: number): number[] {
  // x init = uniforme
  let x = new Array(n).fill(1 / n);
  const lr0 = 0.01;
  const maxIter = 5000;
  let prevLoss = Infinity;

  const loss = (xv: number[]) => {
    let s = 0;
    for (let k = 0; k < A.length; k++) {
      let r = -b[k];
      for (let i = 0; i < n; i++) r += A[k][i] * xv[i];
      s += r * r;
    }
    return s;
  };

  for (let it = 0; it < maxIter; it++) {
    // grad = 2 Aᵀ (A x - b)
    const Ax_b = new Array(A.length).fill(0);
    for (let k = 0; k < A.length; k++) {
      let r = -b[k];
      for (let i = 0; i < n; i++) r += A[k][i] * x[i];
      Ax_b[k] = r;
    }
    const grad = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let g = 0;
      for (let k = 0; k < A.length; k++) g += A[k][i] * Ax_b[k];
      grad[i] = 2 * g;
    }
    const lr = lr0 / (1 + it * 0.001);
    const xNew = projectSimplex(x.map((xi, i) => xi - lr * grad[i]));
    const lNew = loss(xNew);
    if (Math.abs(prevLoss - lNew) < 1e-10) {
      x = xNew;
      break;
    }
    prevLoss = lNew;
    x = xNew;
  }
  return x;
}

export default function OptimalMixComposition({
  dMax,
  mfMelange,
  pointA,
  materials,
  densities = {},
}: OptimalMixCompositionProps) {
  const result = useMemo(() => {
    if (!materials || materials.length === 0) return null;

    const pA = pointA ?? { dA: dMax / 2, pA: 45 };
    const refCurve = generateReferenceCurve(dMax, mfMelange, pA);
    const sieves = ALL_TAMIS.filter((t) => t <= dMax + 1e-6);

    // Système A x ≈ b : pour chaque tamis, Σ x_i * passant_i = ref
    const A: number[][] = [];
    const b: number[] = [];
    for (const ouv of sieves) {
      const row = materials.map((m) => passantAt(m.curve, ouv));
      const ref = refCurve.find((r) => Math.abs(r.ouverture - ouv) < 1e-6);
      if (!ref) continue;
      A.push(row);
      b.push(ref.pourcentage);
    }

    const volFractions = solveOptimalProportions(A, b, materials.length);

    // Conversion fractions volumiques → fractions massiques avec les densités fournies.
    const masses = materials.map((m, i) => {
      const d = densities[m.label] ?? 2650; // fallback densité granulat usuelle
      return volFractions[i] * d;
    });
    const totalMass = masses.reduce((s, x) => s + x, 0);
    const massFractions = masses.map((m) => (totalMass > 0 ? m / totalMass : 0));

    // RMSE & R² de la courbe optimale vs référence
    let sse = 0;
    let sst = 0;
    const meanRef = b.reduce((s, x) => s + x, 0) / b.length;
    const fitted: { ouverture: number; mix: number; ref: number }[] = [];
    for (let k = 0; k < A.length; k++) {
      let mix = 0;
      for (let i = 0; i < volFractions.length; i++) mix += A[k][i] * volFractions[i];
      fitted.push({ ouverture: sieves[k], mix, ref: b[k] });
      sse += (mix - b[k]) ** 2;
      sst += (b[k] - meanRef) ** 2;
    }
    const rmse = Math.sqrt(sse / A.length);
    const r2 = sst > 0 ? 1 - sse / sst : 1;
    const maxDev = Math.max(...fitted.map((f) => Math.abs(f.mix - f.ref)));

    return {
      proportions: materials.map((m, i) => ({
        label: m.label,
        volPct: volFractions[i] * 100,
        massPct: massFractions[i] * 100,
      })),
      rmse,
      r2,
      maxDev,
    };
  }, [materials, dMax, mfMelange, pointA, densities]);

  if (!result) return null;

  const quality =
    result.rmse < 2 ? "excellent" : result.rmse < 5 ? "bon" : result.rmse < 8 ? "moyen" : "faible";
  const isOk = result.rmse < 5;

  return (
    <Card className="border-primary/30 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Composition optimale du mélange</h2>
          <Badge variant="outline" className="ml-auto text-[10px]">
            Calcul automatique — Méthode Dreux-Gorisse
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Pourcentages massiques calculés par moindres carrés sous contraintes (≥ 0 et Σ = 100 %)
          pour approcher au plus près la courbe de référence Dreux-Gorisse.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border p-2.5 text-left font-semibold">Matériau</th>
                <th className="border border-border p-2.5 text-right font-semibold">% volumique</th>
                <th className="border border-border p-2.5 text-right font-semibold">% massique</th>
              </tr>
            </thead>
            <tbody>
              {result.proportions.map((p, i) => (
                <tr key={p.label} className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                  <td className="border border-border p-2.5 text-foreground">{p.label}</td>
                  <td className="border border-border p-2.5 text-right tabular-nums">
                    {p.volPct.toFixed(1)} %
                  </td>
                  <td className="border border-border p-2.5 text-right font-semibold tabular-nums text-primary">
                    {p.massPct.toFixed(1)} %
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-primary/10 font-bold">
                <td className="border border-border p-2.5">Total</td>
                <td className="border border-border p-2.5 text-right tabular-nums text-emerald-500">
                  {result.proportions.reduce((s, p) => s + p.volPct, 0).toFixed(1)} %
                </td>
                <td className="border border-border p-2.5 text-right tabular-nums text-emerald-500">
                  {result.proportions.reduce((s, p) => s + p.massPct, 0).toFixed(1)} %
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Quality indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">RMSE</p>
            <p className={cn("text-lg font-bold", isOk ? "text-emerald-500" : "text-amber-500")}>
              {result.rmse.toFixed(2)} %
            </p>
            <p className="text-[10px] text-muted-foreground">Écart quadratique moyen</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">R²</p>
            <p className="text-lg font-bold text-foreground">{(result.r2 * 100).toFixed(1)} %</p>
            <p className="text-[10px] text-muted-foreground">Corrélation</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Écart max</p>
            <p className="text-lg font-bold text-foreground">{result.maxDev.toFixed(2)} %</p>
            <p className="text-[10px] text-muted-foreground">Tamis le plus éloigné</p>
          </div>
          <div
            className={cn(
              "rounded-lg p-3 text-center border",
              isOk
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-amber-500/10 border-amber-500/30"
            )}
          >
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Qualité</p>
            <p
              className={cn(
                "text-lg font-bold capitalize flex items-center justify-center gap-1.5",
                isOk ? "text-emerald-500" : "text-amber-500"
              )}
            >
              {isOk ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              {quality}
            </p>
            <p className="text-[10px] text-muted-foreground">Ajustement global</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
