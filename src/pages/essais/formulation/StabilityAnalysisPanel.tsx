import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

// Standard sieve openings
const TAMIS_OPENINGS = [0.063, 0.125, 0.25, 0.5, 1, 2, 4, 6.3, 8, 10, 12.5, 16, 20, 25, 31.5, 40];

interface Issue {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  penalty: number;
  actions: string[];
  level: "ok" | "warn" | "danger";
}

interface StabilityAnalysisPanelProps {
  mfMelange: number | null;
  materials: MaterialCurve[];
  /** Percentage of 3/8 within total gravel */
  pct38?: number;
  /** Percentage of 15/25 within total gravel */
  pct1525?: number;
  /** Whether mix curve stays within Dreux envelope */
  isWithinEnvelope?: boolean | null;
}

/** Detect granular gap: a sudden drop >30% between consecutive sieves on the mix curve */
function detectGranularGap(materials: MaterialCurve[]): { found: boolean; sieve1: number; sieve2: number; drop: number } | null {
  if (materials.length === 0) return null;

  // Compute weighted mix curve
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

  // Check consecutive differences (ascending sieves → pct should increase)
  for (let i = 1; i < mixPass.length; i++) {
    const diff = mixPass[i].pct - mixPass[i - 1].pct;
    // A jump >30% between two consecutive sieves indicates a gap
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

export default function StabilityAnalysisPanel({
  mfMelange,
  materials,
  pct38,
  pct1525,
  isWithinEnvelope,
}: StabilityAnalysisPanelProps) {
  const analysis = useMemo(() => {
    const issues: Issue[] = [];
    let score = 100;
    const mf = mfMelange ?? 2.65;

    // 1. MF < 2.4 — Excess fines
    if (mf < 2.4) {
      const penalty = 20;
      score -= penalty;
      issues.push({
        id: "mf-low",
        icon: <Waves className="w-4 h-4" />,
        title: "Excès de fines — risque de ségrégation par pâte",
        description: `MF = ${mf.toFixed(2)} < 2.4 — La proportion de fines est trop élevée, augmentant la demande en eau et le retrait.`,
        penalty,
        actions: [
          "Réduire la proportion de sable fin (0/1)",
          "Augmenter la proportion de sable grossier (0/4)",
        ],
        level: mf < 2.2 ? "danger" : "warn",
      });
    }

    // 2. MF > 2.8 — Coarse sand
    if (mf > 2.8) {
      const penalty = 20;
      score -= penalty;
      issues.push({
        id: "mf-high",
        icon: <TrendingUp className="w-4 h-4" />,
        title: "Sable trop grossier — mauvaise pompabilité",
        description: `MF = ${mf.toFixed(2)} > 2.8 — Manque de fines compromettant la cohésion et la pompabilité du béton.`,
        penalty,
        actions: [
          "Augmenter la proportion de sable fin (0/1)",
          "Ajuster les proportions entre les sables",
        ],
        level: mf > 3.0 ? "danger" : "warn",
      });
    }

    // 3. Excess 3/8
    if (pct38 !== undefined && pct38 > 10) {
      const penalty = 15;
      score -= penalty;
      issues.push({
        id: "excess-38",
        icon: <Layers className="w-4 h-4" />,
        title: "Trop de 3/8 — risque de ségrégation",
        description: `Le gravillon 3/8 représente ${pct38.toFixed(1)}% des graviers (limite : 10%). Un excès favorise la ségrégation.`,
        penalty,
        actions: [
          "Réduire la quantité de gravillon 3/8",
          "Redistribuer vers le 8/15 ou 15/25",
        ],
        level: pct38 > 15 ? "danger" : "warn",
      });
    }

    // 4. Granular gap
    const gap = detectGranularGap(materials);
    if (gap) {
      const penalty = 25;
      score -= penalty;
      issues.push({
        id: "granular-gap",
        icon: <AlertTriangle className="w-4 h-4" />,
        title: "Discontinuité granulométrique — risque de ségrégation",
        description: `Variation brutale de ${gap.drop}% entre les tamis ${gap.sieve1} mm et ${gap.sieve2} mm. Ce trou granulaire compromet l'empilement.`,
        penalty,
        actions: [
          "Ajouter une fraction intermédiaire pour combler le trou",
          "Corriger la distribution granulaire",
        ],
        level: "danger",
      });
    }

    // 5. Lack of coarse aggregate
    if (pct1525 !== undefined && pct1525 < 25) {
      const penalty = 15;
      score -= penalty;
      issues.push({
        id: "lack-coarse",
        icon: <TrendingDown className="w-4 h-4" />,
        title: "Manque de squelette granulaire — instabilité possible",
        description: `Le gravier 15/25 ne représente que ${pct1525.toFixed(1)}% des graviers (minimum recommandé : 25%).`,
        penalty,
        actions: [
          "Augmenter la proportion de gravier 15/25",
          "Vérifier l'équilibre du squelette granulaire",
        ],
        level: pct1525 < 15 ? "danger" : "warn",
      });
    }

    // 6. Curve outside envelope
    if (isWithinEnvelope === false) {
      const penalty = 20;
      score -= penalty;
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

    score = Math.max(0, score);

    let globalLevel: "ok" | "warn" | "danger";
    let globalLabel: string;
    let GlobalIcon: typeof ShieldCheck;

    if (score > 80) {
      globalLevel = "ok";
      globalLabel = "Granulométrie stable";
      GlobalIcon = ShieldCheck;
    } else if (score >= 60) {
      globalLevel = "warn";
      globalLabel = "Acceptable avec ajustement";
      GlobalIcon = ShieldAlert;
    } else {
      globalLevel = "danger";
      globalLabel = "Risque élevé de ségrégation";
      GlobalIcon = ShieldX;
    }

    return { issues, score, globalLevel, globalLabel, GlobalIcon };
  }, [mfMelange, materials, pct38, pct1525, isWithinEnvelope]);

  const { issues, score, globalLevel, globalLabel, GlobalIcon } = analysis;

  const colorMap = {
    ok: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-600",
      badge: "bg-emerald-500",
      progress: "bg-emerald-500",
    },
    warn: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      text: "text-amber-600",
      badge: "bg-amber-500",
      progress: "bg-amber-500",
    },
    danger: {
      bg: "bg-destructive/10",
      border: "border-destructive/30",
      text: "text-destructive",
      badge: "bg-destructive",
      progress: "bg-destructive",
    },
  };

  const c = colorMap[globalLevel];

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
                Analyse de stabilité & ségrégation
              </h3>
              <Badge className={cn("text-[10px] text-white border-0", c.badge)}>
                Score : {score}/100
              </Badge>
              <Badge variant="outline" className={cn("text-[10px]", c.border, c.text)}>
                {globalLabel}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Détection automatique des risques de ségrégation, manque de cohésion et défauts granulométriques.
            </p>
          </div>
        </div>

        {/* Score bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Score de stabilité</span>
            <span className={cn("font-bold", c.text)}>{score}/100</span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted/50 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-700", c.progress)}
              style={{ width: `${score}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0 — Critique</span>
            <span>60 — Acceptable</span>
            <span>80 — Stable</span>
            <span>100</span>
          </div>
        </div>

        {/* Issues list */}
        {issues.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Problèmes détectés ({issues.length})
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

        {/* Penalty breakdown */}
        {issues.length > 0 && (
          <div className="rounded-lg bg-muted/50 p-3 space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Détail des pénalités</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {issues.map((issue) => (
                <div key={issue.id} className="flex items-center gap-1.5 text-xs text-foreground">
                  <span className={cn("w-2 h-2 rounded-full shrink-0", colorMap[issue.level].badge)} />
                  <span className="truncate">{issue.id === "mf-low" ? "MF bas" : issue.id === "mf-high" ? "MF élevé" : issue.id === "excess-38" ? "Excès 3/8" : issue.id === "granular-gap" ? "Trou granulaire" : issue.id === "lack-coarse" ? "Manque 15/25" : "Hors fuseau"}</span>
                  <span className="font-bold text-muted-foreground ml-auto">−{issue.penalty}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground col-span-full border-t border-border pt-1.5 mt-1">
                <span>Score final</span>
                <span className={cn("ml-auto", c.text)}>{score}/100</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
