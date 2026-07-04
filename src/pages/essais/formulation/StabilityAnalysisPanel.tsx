/**
 * Phase 10 — StabilityAnalysisPanel refondu.
 *
 * Ce panneau n'effectue AUCUN calcul métier Dreux-Gorisse. Il lit uniquement
 * `calcResult` (produit par `calculateMixDesign`) et les courbes granulométriques
 * réelles des matériaux sélectionnés par l'utilisateur, puis émet un diagnostic
 * de qualité (équilibre granulaire, ségrégation, trou granulaire, fuseau).
 *
 * Aucune référence à des noms commerciaux (3/8, 8/15, 15/25) — toutes les
 * décisions se basent sur les Dmax réels et sur les volumes/masses calculés
 * par le moteur.
 */

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Layers,
  Waves,
} from "lucide-react";
import type { MaterialCurve } from "./DreuxGorisseChart";
import type { CalculationResult } from "./dreuxGorisseCalculation";

// ---------------------------------------------------------------------------
// Constantes uniques (Étape 4) — plages Dreux-Gorisse par défaut
// ---------------------------------------------------------------------------
export const DEFAULT_BALANCE_RULES = {
  /** Part du sable dans (sables + graviers), en %. */
  sable: { min: 35, max: 45 },
  /** Part de la plus petite fraction de gravier dans le total gravier, en %. */
  smallestGravel: { min: 10, max: 20 },
  /** Part de chaque fraction intermédiaire dans le total gravier, en %. */
  middleGravel: { min: 20, max: 30 },
  /** Part de la plus grosse fraction dans le total gravier, en %. */
  largestGravel: { min: 20, max: 35 },
} as const;

const TAMIS_OPENINGS = [0.063, 0.125, 0.25, 0.5, 1, 2, 4, 6.3, 8, 10, 12.5, 16, 20, 25, 31.5, 40];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Issue {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  penalty: number;
  actions: string[];
  level: "ok" | "warn" | "danger";
}

type FractionKind = "small" | "middle" | "large";

interface FractionRow {
  label: string;
  pct: number;
  kind: FractionKind | "sand";
  range: { min: number; max: number };
  status: "ok" | "low" | "high";
}

interface StabilityAnalysisPanelProps {
  calcResult: CalculationResult;
  /** Sables sélectionnés (courbes réelles). */
  sandMaterials: MaterialCurve[];
  /** Gravillons sélectionnés (courbes réelles). */
  gravelMaterials: MaterialCurve[];
  /** Optionnel : la courbe reste-t-elle dans le fuseau Dreux ? */
  isWithinEnvelope?: boolean | null;
}

// ---------------------------------------------------------------------------
// Helpers purs
// ---------------------------------------------------------------------------
function getDmax(mat: MaterialCurve): number {
  return mat.curve.length > 0 ? Math.max(...mat.curve.map(p => p.ouverture)) : 0;
}

function detectGranularGap(
  materials: MaterialCurve[],
): { found: boolean; sieve1: number; sieve2: number; drop: number } | null {
  if (materials.length === 0) return null;
  const totalQty = materials.reduce((s, m) => s + m.quantity, 0);
  if (totalQty === 0) return null;

  const mixPass = TAMIS_OPENINGS.map((ouv) => {
    let wp = 0;
    for (const mat of materials) {
      const pt = mat.curve.find((p) => Math.abs(p.ouverture - ouv) < 0.001);
      const pass = pt
        ? pt.pourcentageTamisat
        : ouv > (mat.curve[mat.curve.length - 1]?.ouverture || 0)
          ? 100
          : 0;
      wp += (pass * mat.quantity) / totalQty;
    }
    return { ouverture: ouv, pct: wp };
  });

  for (let i = 1; i < mixPass.length; i++) {
    const diff = mixPass[i].pct - mixPass[i - 1].pct;
    if (diff > 30) {
      return {
        found: true,
        sieve1: mixPass[i - 1].ouverture,
        sieve2: mixPass[i].ouverture,
        drop: parseFloat(diff.toFixed(1)),
      };
    }
  }
  return null;
}

function statusOf(pct: number, range: { min: number; max: number }): "ok" | "low" | "high" {
  if (pct < range.min) return "low";
  if (pct > range.max) return "high";
  return "ok";
}

// ---------------------------------------------------------------------------
// Composant
// ---------------------------------------------------------------------------
export default function StabilityAnalysisPanel({
  calcResult,
  sandMaterials,
  gravelMaterials,
  isWithinEnvelope,
}: StabilityAnalysisPanelProps) {
  const analysis = useMemo(() => {
    const issues: Issue[] = [];
    const mf = calcResult.moduleFinesse?.melange ?? 2.65;

    // --- Étape 1-3 : gravillons triés par Dmax réel + parts sur volume gravier
    const gravelsSorted = [...gravelMaterials]
      .filter(g => g.quantity > 0)
      .map(g => ({ ...g, dMax: getDmax(g) }))
      .sort((a, b) => a.dMax - b.dMax);

    const volGravier = calcResult.volumes.gravier;
    const volSable = calcResult.volumes.sable;
    const volGranTotal = volSable + volGravier;

    // Volumes par matériau (m³) — sources : calcResult.volumes.detail est indexé par key,
    // mais MaterialCurve n'expose pas la key. On retombe donc sur les masses/densités
    // implicites via `quantity` (kg/m³) proportionnellement au total gravier.
    const totalGravelQty = gravelsSorted.reduce((s, g) => s + g.quantity, 0);
    const gravelRows: FractionRow[] = gravelsSorted.map((g, idx) => {
      const pct = totalGravelQty > 0 ? (g.quantity / totalGravelQty) * 100 : 0;
      let kind: FractionKind;
      let range: { min: number; max: number };
      if (gravelsSorted.length === 1) {
        kind = "large";
        range = DEFAULT_BALANCE_RULES.largestGravel;
      } else if (idx === 0) {
        kind = "small";
        range = DEFAULT_BALANCE_RULES.smallestGravel;
      } else if (idx === gravelsSorted.length - 1) {
        kind = "large";
        range = DEFAULT_BALANCE_RULES.largestGravel;
      } else {
        kind = "middle";
        range = DEFAULT_BALANCE_RULES.middleGravel;
      }
      return { label: g.label, pct, kind, range, status: statusOf(pct, range) };
    });

    // Sable (part dans sable + gravier)
    const sablePct = volGranTotal > 0 ? (volSable / volGranTotal) * 100 : 0;
    const sableRow: FractionRow = {
      label: "Sables (total)",
      pct: sablePct,
      kind: "sand",
      range: DEFAULT_BALANCE_RULES.sable,
      status: statusOf(sablePct, DEFAULT_BALANCE_RULES.sable),
    };

    const rows: FractionRow[] = [sableRow, ...gravelRows];

    // --- Étape 6 : score
    let balanceScore = 100;

    // Sable
    if (sableRow.status !== "ok") {
      const penalty = 15;
      balanceScore -= penalty;
      issues.push({
        id: "sand-balance",
        icon: <Waves className="w-4 h-4" />,
        title: sableRow.status === "high"
          ? "Répartition des sables déséquilibrée — excès de sable"
          : "Répartition des sables déséquilibrée — manque de sable",
        description: `Les sables représentent ${sablePct.toFixed(1)}% du squelette granulaire (plage ${sableRow.range.min}–${sableRow.range.max}%).`,
        penalty,
        actions: sableRow.status === "high"
          ? ["Réduire la proportion totale de sable", "Augmenter la proportion de graviers"]
          : ["Augmenter la proportion totale de sable", "Vérifier la cohérence du squelette granulaire"],
        level: "warn",
      });
    }

    // MF
    if (mf < 2.4) {
      const penalty = 20;
      balanceScore -= penalty;
      issues.push({
        id: "mf-low",
        icon: <Waves className="w-4 h-4" />,
        title: "Excès de fines — risque de ségrégation par pâte",
        description: `MF = ${mf.toFixed(2)} < 2.4 — La proportion de fines est trop élevée, augmentant la demande en eau et le retrait.`,
        penalty,
        actions: [
          "Réduire la proportion du sable le plus fin",
          "Augmenter la proportion du sable le plus grossier",
        ],
        level: mf < 2.2 ? "danger" : "warn",
      });
    } else if (mf > 2.8) {
      const penalty = 20;
      balanceScore -= penalty;
      issues.push({
        id: "mf-high",
        icon: <TrendingUp className="w-4 h-4" />,
        title: "Sable trop grossier — mauvaise pompabilité",
        description: `MF = ${mf.toFixed(2)} > 2.8 — Manque de fines compromettant la cohésion et la pompabilité du béton.`,
        penalty,
        actions: [
          "Augmenter la proportion du sable le plus fin",
          "Ajuster les proportions entre les sables",
        ],
        level: mf > 3.0 ? "danger" : "warn",
      });
    }

    // Petite fraction
    const small = gravelRows.find(r => r.kind === "small");
    if (small && small.status !== "ok") {
      const penalty = 10;
      balanceScore -= penalty;
      issues.push({
        id: "small-fraction",
        icon: <Layers className="w-4 h-4" />,
        title: small.status === "high"
          ? "Excès de petites fractions — risque de ségrégation"
          : "Manque de petites fractions",
        description: `La fraction « ${small.label} » représente ${small.pct.toFixed(1)}% des graviers (plage ${small.range.min}–${small.range.max}%).`,
        penalty,
        actions: small.status === "high"
          ? [`Réduire la quantité de « ${small.label} »`, "Redistribuer vers les fractions intermédiaires ou supérieures"]
          : [`Augmenter la quantité de « ${small.label} »`, "Vérifier l'équilibre du squelette granulaire"],
        level: "warn",
      });
    }

    // Fractions intermédiaires
    for (const mid of gravelRows.filter(r => r.kind === "middle")) {
      if (mid.status !== "ok") {
        const penalty = 10;
        balanceScore -= penalty;
        issues.push({
          id: `middle-${mid.label}`,
          icon: <Layers className="w-4 h-4" />,
          title: mid.status === "high"
            ? "Excès de fractions intermédiaires"
            : "Manque de fractions intermédiaires",
          description: `La fraction « ${mid.label} » représente ${mid.pct.toFixed(1)}% des graviers (plage ${mid.range.min}–${mid.range.max}%).`,
          penalty,
          actions: mid.status === "high"
            ? [`Réduire la quantité de « ${mid.label} »`]
            : [`Augmenter la quantité de « ${mid.label} »`],
          level: "warn",
        });
      }
    }

    // Plus grosse fraction
    const large = gravelRows.find(r => r.kind === "large");
    if (large && large.status !== "ok") {
      const penalty = 15;
      balanceScore -= penalty;
      issues.push({
        id: "large-fraction",
        icon: <TrendingDown className="w-4 h-4" />,
        title: large.status === "low"
          ? "Manque de grosses fractions — instabilité possible"
          : "Excès de grosses fractions",
        description: `La fraction « ${large.label} » représente ${large.pct.toFixed(1)}% des graviers (plage ${large.range.min}–${large.range.max}%).`,
        penalty,
        actions: large.status === "low"
          ? [`Augmenter la proportion de « ${large.label} »`, "Vérifier l'équilibre du squelette granulaire"]
          : [`Réduire la proportion de « ${large.label} »`, "Redistribuer vers les fractions intermédiaires"],
        level: "warn",
      });
    }

    // Trou granulaire (mélange complet : sables + graviers)
    const gap = detectGranularGap([...sandMaterials, ...gravelMaterials]);
    if (gap) {
      const penalty = 20;
      balanceScore -= penalty;
      issues.push({
        id: "granular-gap",
        icon: <AlertTriangle className="w-4 h-4" />,
        title: "Trou granulaire détecté",
        description: `Variation brutale de ${gap.drop}% entre les tamis ${gap.sieve1} mm et ${gap.sieve2} mm. Ce trou compromet l'empilement granulaire.`,
        penalty,
        actions: [
          "Ajouter une fraction intermédiaire pour combler le trou",
          "Corriger la distribution granulaire",
        ],
        level: "danger",
      });
    }

    // Fuseau
    if (isWithinEnvelope === false) {
      const penalty = 15;
      balanceScore -= penalty;
      issues.push({
        id: "out-envelope",
        icon: <AlertCircle className="w-4 h-4" />,
        title: "Courbe hors fuseau Dreux-Gorisse",
        description: "La courbe de mélange sort du fuseau granulométrique de référence (limites 5%–95%).",
        penalty,
        actions: [
          "Ajuster les proportions pour ramener la courbe dans le fuseau",
          "Vérifier la cohérence des fractions granulaires",
        ],
        level: "warn",
      });
    }

    balanceScore = Math.max(0, Math.min(100, balanceScore));

    let grade: string;
    let globalLevel: "ok" | "warn" | "danger";
    let GlobalIcon: typeof ShieldCheck;
    if (balanceScore >= 90) { grade = "Excellent"; globalLevel = "ok"; GlobalIcon = ShieldCheck; }
    else if (balanceScore >= 80) { grade = "Très bon"; globalLevel = "ok"; GlobalIcon = ShieldCheck; }
    else if (balanceScore >= 65) { grade = "Bon"; globalLevel = "warn"; GlobalIcon = ShieldAlert; }
    else if (balanceScore >= 50) { grade = "Moyen"; globalLevel = "warn"; GlobalIcon = ShieldAlert; }
    else { grade = "À corriger"; globalLevel = "danger"; GlobalIcon = ShieldX; }

    // Diagnostic lisible
    const summary = issues.length === 0
      ? "La formulation est parfaitement équilibrée selon les plages Dreux-Gorisse."
      : issues.length === 1
        ? "La formulation est globalement équilibrée avec un point d'attention mineur."
        : `La formulation présente ${issues.length} points d'attention à corriger pour améliorer la compacité.`;

    return { issues, balanceScore, grade, globalLevel, GlobalIcon, rows, summary };
  }, [calcResult, sandMaterials, gravelMaterials, isWithinEnvelope]);

  const { issues, balanceScore, grade, globalLevel, GlobalIcon, rows, summary } = analysis;

  const colorMap = {
    ok: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-600", badge: "bg-emerald-500", progress: "bg-emerald-500" },
    warn: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-600", badge: "bg-amber-500", progress: "bg-amber-500" },
    danger: { bg: "bg-destructive/10", border: "border-destructive/30", text: "text-destructive", badge: "bg-destructive", progress: "bg-destructive" },
  };
  const c = colorMap[globalLevel];

  const statusPill = (status: "ok" | "low" | "high") => {
    if (status === "ok") return <span className="text-emerald-600 font-medium">✓ Conforme</span>;
    if (status === "low") return <span className="text-amber-600 font-medium">⚠ Insuffisante</span>;
    return <span className="text-amber-600 font-medium">⚠ Excédentaire</span>;
  };

  return (
    <Card className={cn("border bg-card/80 backdrop-blur-sm", c.border)}>
      <CardContent className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={cn("w-11 h-11 rounded-full flex items-center justify-center shrink-0", c.bg, c.text)}>
            <GlobalIcon className="w-6 h-6" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-foreground">
                Indice d'équilibre granulaire
              </h3>
              <Badge className={cn("text-[10px] text-white border-0", c.badge)}>
                {balanceScore}/100
              </Badge>
              <Badge variant="outline" className={cn("text-[10px]", c.border, c.text)}>
                {grade}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Audit automatique de la formulation calculée par le moteur Dreux-Gorisse (source : <code>calcResult</code>).
            </p>
          </div>
        </div>

        {/* Score bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Score d'équilibre</span>
            <span className={cn("font-bold", c.text)}>{balanceScore}/100</span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted/50 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-700", c.progress)}
              style={{ width: `${balanceScore}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0 — À corriger</span>
            <span>50 — Moyen</span>
            <span>65 — Bon</span>
            <span>80 — Très bon</span>
            <span>90+ — Excellent</span>
          </div>
        </div>

        {/* Répartition détaillée (Étape 7) */}
        <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-muted/50">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Répartition du squelette granulaire
            </p>
          </div>
          <div className="divide-y divide-border">
            {rows.map((r, i) => (
              <div key={i} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{r.label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Plage attendue : {r.range.min}–{r.range.max} %
                    {r.kind === "sand" && " (sable / (sable + gravier))"}
                    {r.kind !== "sand" && " (fraction / total gravier)"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground tabular-nums">{r.pct.toFixed(1)} %</p>
                  <p className="text-[10px]">{statusPill(r.status)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Diagnostic textuel */}
        <div className={cn("rounded-lg border p-3 text-xs", c.border, c.bg)}>
          <p className={cn("font-semibold mb-1", c.text)}>Diagnostic</p>
          <p className="text-foreground">{summary}</p>
        </div>

        {/* Issues list */}
        {issues.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Points d'attention ({issues.length})
            </p>
            {issues.map((issue) => {
              const ic = colorMap[issue.level];
              return (
                <div key={issue.id} className={cn("rounded-lg border p-4 space-y-2.5", ic.border, ic.bg)}>
                  <div className="flex items-start gap-2.5">
                    <div className={cn("shrink-0 mt-0.5", ic.text)}>{issue.icon}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={cn("text-sm font-semibold", ic.text)}>{issue.title}</p>
                        <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0", ic.border, ic.text)}>
                          −{issue.penalty} pts
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{issue.description}</p>
                    </div>
                  </div>
                  <div className="ml-6.5 space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Recommandations
                    </p>
                    <ul className="space-y-1">
                      {issue.actions.map((action, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0 mt-1", ic.badge)} />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={cn("rounded-lg p-4 flex items-center gap-3", c.bg)}>
            <CheckCircle2 className={cn("w-5 h-5", c.text)} />
            <div>
              <p className={cn("text-sm font-semibold", c.text)}>Aucun problème détecté</p>
              <p className="text-xs text-muted-foreground">
                La distribution granulométrique est équilibrée. Le béton présente un bon potentiel de stabilité et de pompabilité.
              </p>
            </div>
          </div>
        )}

        {/* Warnings moteur (Étape 8) — lecture pure de calcResult */}
        {(calcResult.warnings?.length || calcResult.volumeErrors?.length || calcResult.gravelSplit?.warnings?.length) ? (
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Diagnostics moteur (lecture pure)
            </p>
            <ul className="space-y-1">
              {calcResult.volumeErrors?.map((w, i) => (
                <li key={`ve-${i}`} className="text-xs text-destructive">• {w}</li>
              ))}
              {calcResult.warnings?.map((w, i) => (
                <li key={`w-${i}`} className="text-xs text-amber-600">• {w}</li>
              ))}
              {calcResult.gravelSplit?.warnings?.map((w, i) => (
                <li key={`gs-${i}`} className="text-xs text-amber-600">• {w}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
