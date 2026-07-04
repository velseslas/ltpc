/**
 * Phase 11 — StabilityAnalysisPanel : classification purement par Dmax.
 *
 * Ce panneau n'effectue AUCUN calcul métier Dreux-Gorisse. Il lit uniquement
 * `calcResult` (produit par `calculateMixDesign`) et les courbes granulométriques
 * réelles des matériaux sélectionnés par l'utilisateur, puis émet un diagnostic
 * de qualité (équilibre granulaire, ségrégation, trou granulaire, fuseau).
 *
 * Règle de classification (UNIQUE) :
 *   dMax ≤ 10          → Petites fractions
 *   10 < dMax ≤ 16     → Fractions intermédiaires
 *   16 < dMax ≤ 31.5   → Grosses fractions
 *   dMax > 31.5        → Ignoré (hors domaine Dreux classique)
 *
 * Aucune regex sur les libellés, aucune dépendance aux slots gravier1/2/3,
 * aucune référence à "3/8", "8/15", "15/25".
 *
 * Pourcentages TOUJOURS calculés par rapport au volume total gravillons :
 *   pct = volumeFraction / volumeTotalGraviers * 100
 * où volumeTotalGraviers = calcResult.volumes.gravier.
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
// Constantes UNIQUES — plages Dreux-Gorisse (aucune valeur codée ailleurs)
// ---------------------------------------------------------------------------

/** Plage attendue de la part du sable dans (sables + graviers), en %. */
export const SAND_LIMIT = { min: 35, max: 45 } as const;

/** Plages attendues par classe de gravillon (en % du volume total graviers). */
export const FRACTION_LIMITS = {
  small: { min: 10, max: 20 },
  medium: { min: 20, max: 35 },
  large: { min: 20, max: 35 },
} as const;

const TAMIS_OPENINGS = [0.063, 0.125, 0.25, 0.5, 1, 2, 4, 6.3, 8, 10, 12.5, 16, 20, 25, 31.5, 40];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type FractionClass = "small" | "medium" | "large";

interface ClassifiedGravel {
  label: string;
  dMax: number;
  volume: number;
  pct: number;
  klass: FractionClass;
}

interface Issue {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  penalty: number;
  actions: string[];
  level: "ok" | "warn" | "danger";
}

interface ClassRow {
  klass: FractionClass | "sand";
  label: string;
  pct: number;
  range: { min: number; max: number };
  status: "ok" | "low" | "high";
  members: string[]; // libellés réels des matériaux agrégés
}

interface StabilityAnalysisPanelProps {
  calcResult: CalculationResult;
  sandMaterials: MaterialCurve[];
  gravelMaterials: MaterialCurve[];
  isWithinEnvelope?: boolean | null;
}

// ---------------------------------------------------------------------------
// Helpers purs
// ---------------------------------------------------------------------------
function getDmax(mat: MaterialCurve): number {
  return mat.curve.length > 0 ? Math.max(...mat.curve.map(p => p.ouverture)) : 0;
}

/** Classification UNIQUE par Dmax réel. Retourne null si hors domaine. */
function classifyByDmax(dMax: number): FractionClass | null {
  if (dMax <= 0) return null;
  if (dMax <= 10) return "small";
  if (dMax <= 16) return "medium";
  if (dMax <= 31.5) return "large";
  return null; // > 31.5 mm : ignoré
}

const CLASS_META: Record<FractionClass, { label: string; range: { min: number; max: number } }> = {
  small: { label: "Petites fractions", range: FRACTION_LIMITS.small },
  medium: { label: "Fractions intermédiaires", range: FRACTION_LIMITS.medium },
  large: { label: "Grosses fractions", range: FRACTION_LIMITS.large },
};

function statusOf(pct: number, range: { min: number; max: number }): "ok" | "low" | "high" {
  if (pct < range.min) return "low";
  if (pct > range.max) return "high";
  return "ok";
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

    // --- Volumes de référence (lecture pure) --------------------------------
    // RÉFÉRENTIEL UNIQUE :
    //   Vsquelette = Vsables + Vgraviers   (jamais eau/ciment/air/adjuvant)
    //   % sable        = Vsables / Vsquelette * 100
    //   % gravier_i    = Vgravier_i / Vgraviers * 100
    //   % classe       = Σ Vgravier_i(classe) / Vgraviers * 100
    const volDetail = calcResult.volumes.detail || {};
    const volGravier = calcResult.volumes.gravier;
    const volSable = calcResult.volumes.sable;
    const volSquelette = volSable + volGravier;

    // --- Classification des gravillons UNIQUEMENT par dMax réel ------------
    const classified: ClassifiedGravel[] = gravelMaterials
      .filter(g => g.quantity > 0)
      .map(g => {
        const dMax = getDmax(g);
        const volume = g.key && volDetail[g.key] !== undefined ? volDetail[g.key] : 0;
        const pct = volGravier > 0 ? (volume / volGravier) * 100 : 0;
        const klass = classifyByDmax(dMax);
        return { label: g.label, dMax, volume, pct, klass: klass ?? "large" };
      })
      // Ignorer les hors-domaine (dMax > 31.5 mm)
      .filter(g => classifyByDmax(g.dMax) !== null);

    // --- Agrégation par classe ---------------------------------------------
    const buildClassRow = (klass: FractionClass): ClassRow | null => {
      const members = classified.filter(c => c.klass === klass);
      if (members.length === 0) return null;
      const pct = members.reduce((s, m) => s + m.pct, 0);
      const meta = CLASS_META[klass];
      return {
        klass,
        label: meta.label,
        pct,
        range: meta.range,
        status: statusOf(pct, meta.range),
        members: members.map(m => m.label),
      };
    };

    const classRows: ClassRow[] = (["small", "medium", "large"] as FractionClass[])
      .map(buildClassRow)
      .filter((r): r is ClassRow => r !== null);

    // Sable total (part du sable dans le squelette granulaire)
    const sablePct = volSquelette > 0 ? (volSable / volSquelette) * 100 : 0;
    const sableRow: ClassRow = {
      klass: "sand",
      label: "Sables (total)",
      pct: sablePct,
      range: SAND_LIMIT,
      status: statusOf(sablePct, SAND_LIMIT),
      members: sandMaterials.filter(s => s.quantity > 0).map(s => s.label),
    };

    const rows: ClassRow[] = [sableRow, ...classRows];

    // --- Score --------------------------------------------------------------
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

    // Classes de gravillons
    const classIssueSpec: Record<FractionClass, { penalty: number; icon: React.ReactNode }> = {
      small: { penalty: 10, icon: <Layers className="w-4 h-4" /> },
      medium: { penalty: 10, icon: <Layers className="w-4 h-4" /> },
      large: { penalty: 15, icon: <TrendingDown className="w-4 h-4" /> },
    };

    for (const row of classRows) {
      if (row.status === "ok") continue;
      const spec = classIssueSpec[row.klass as FractionClass];
      balanceScore -= spec.penalty;
      const membersTxt = row.members.length > 0 ? ` (${row.members.join(" + ")})` : "";
      issues.push({
        id: `class-${row.klass}`,
        icon: spec.icon,
        title: row.status === "high"
          ? `Excès de ${row.label.toLowerCase()}`
          : `Manque de ${row.label.toLowerCase()}`,
        description: `« ${row.label} »${membersTxt} représente ${row.pct.toFixed(1)}% des graviers (plage ${row.range.min}–${row.range.max}%).`,
        penalty: spec.penalty,
        actions: row.status === "high"
          ? [`Réduire la proportion de « ${row.label.toLowerCase()} »`, "Redistribuer vers les autres classes granulaires"]
          : [`Augmenter la proportion de « ${row.label.toLowerCase()} »`, "Vérifier l'équilibre du squelette granulaire"],
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

        {/* Répartition par classes (dMax réel) */}
        <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-muted/50">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Répartition du squelette granulaire (par classe Dmax)
            </p>
          </div>
          <div className="divide-y divide-border">
            {rows.map((r, i) => (
              <div key={i} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{r.label}</p>
                  {r.members.length > 0 && (
                    <p className="text-[10px] text-muted-foreground truncate">
                      ({r.members.join(" + ")})
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    Plage attendue : {r.range.min}–{r.range.max} %
                    {r.klass === "sand" && " (sable / (sable + gravier))"}
                    {r.klass !== "sand" && " (fraction / total gravier)"}
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

        {/* Warnings moteur — lecture pure de calcResult */}
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
