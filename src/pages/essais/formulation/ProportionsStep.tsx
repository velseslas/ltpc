import { useState, useMemo, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, Sparkles, AlertTriangle, Info, SlidersHorizontal, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import DreuxGorisseChart, { type MaterialCurve } from "./DreuxGorisseChart";
import {
  calculateMixDesign,
  optimizeMix,
  determineDmax,
  calculatePointA,
  type GranulatInput,
  type CalculationInputs,
  type CalculationResult,
} from "./dreuxGorisseCalculation";

// Standard sieve openings (mm) for Dreux-Gorisse
const TAMIS_OPENINGS = [0.063, 0.125, 0.25, 0.5, 1, 2, 4, 6.3, 8, 10, 12.5, 16, 20, 25, 31.5, 40];

interface ValidationData {
  resistance28j: string;
  slumpSouhaite: string;
  classeExposition: string;
  materialsValid: boolean;
  missingMaterials: string[];
  minimumMaterialsValid: boolean;
  minimumMaterialsMissing: string[];
  coefficientGranulaire: string;
  coefficientCompacite: string;
  essaisValid: boolean;
  essaisMissing: string[];
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
  coefficientCompacite: string;
  classeRheologique: string;
  granulatCurves?: MaterialCurve[];
  granulatDensites?: Record<string, number>;
  granulatModuleFinesse?: Record<string, number>;
  granulatLabels?: Record<string, string>;
  dMaxUser?: number | null;
  pointAOverride?: { xA: number; yA: number } | null;
  calcEau: string;
  calcCiment: string;
  calcRatioGS: string;
  onQuantityChange?: (key: string, value: string) => void;
  validationData?: ValidationData;
  onStepErrors?: (errorSteps: number[]) => void;
  onMfCorrectionNeeded?: (needed: boolean) => void;
  mfMelangeStocke?: number | null;
}

interface GranulatSlider {
  key: string;
  label: string;
  active: boolean;
  value: string;
  color: string;
  max: number;
  isSable: boolean;
}

// Demo granulometric curves generator
function generateDemoCurve(type: string): { ouverture: number; pourcentageTamisat: number }[] {
  switch (type) {
    case "sable1":
      return TAMIS_OPENINGS.map(ouv => ({
        ouverture: ouv,
        pourcentageTamisat: ouv >= 4 ? 100 : Math.min(100, (Math.log10(ouv / 0.063) / Math.log10(4 / 0.063)) * 100),
      }));
    case "sable2":
      return TAMIS_OPENINGS.map(ouv => ({
        ouverture: ouv,
        pourcentageTamisat: ouv >= 2 ? 100 : Math.min(100, (Math.log10(ouv / 0.063) / Math.log10(2 / 0.063)) * 100),
      }));
    case "gravier1":
      return TAMIS_OPENINGS.map(ouv => ({
        ouverture: ouv,
        pourcentageTamisat: ouv >= 10 ? 100 : ouv <= 2 ? 0 : Math.min(100, ((ouv - 2) / (10 - 2)) * 100),
      }));
    case "gravier2":
      return TAMIS_OPENINGS.map(ouv => ({
        ouverture: ouv,
        pourcentageTamisat: ouv >= 20 ? 100 : ouv <= 6.3 ? 0 : Math.min(100, ((ouv - 6.3) / (20 - 6.3)) * 100),
      }));
    case "gravier3":
      return TAMIS_OPENINGS.map(ouv => ({
        ouverture: ouv,
        pourcentageTamisat: ouv >= 31.5 ? 100 : ouv <= 12.5 ? 0 : Math.min(100, ((ouv - 12.5) / (31.5 - 12.5)) * 100),
      }));
    default:
      return [];
  }
}

// Dmax mapping per granulat key
const DMAX_MAP: Record<string, number> = {
  sableFin: 1,
  sableConcasse: 4,
  gravillons1: 8,
  gravier2: 15,
  gravier3: 25,
};

type CalcMode = "none" | "calculate" | "optimize" | "manual";

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
  coefficientCompacite,
  classeRheologique,
  granulatCurves,
  granulatDensites = {},
  granulatModuleFinesse = {},
  granulatLabels = {},
  dMaxUser,
  pointAOverride,
  calcEau,
  calcCiment,
  calcRatioGS,
  onQuantityChange,
  validationData,
  onStepErrors,
  onMfCorrectionNeeded,
  mfMelangeStocke,
}: ProportionsStepProps) {
  const [localOverrides, setLocalOverrides] = useState<Record<string, string>>({});
  const [hasCalculated, setHasCalculated] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);
  const [missingReportsOpen, setMissingReportsOpen] = useState(false);
  const [missingReports, setMissingReports] = useState<string[]>([]);
  const [validationErrorOpen, setValidationErrorOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ step: number; label: string; fields: string[] }[]>([]);
  const [calculationErrors, setCalculationErrors] = useState<string[]>([]);
  const [calcResult, setCalcResult] = useState<CalculationResult | null>(null);
  const [calcMode, setCalcMode] = useState<CalcMode>("none");

  const mfMelangeEffectif = useMemo(
    () => mfMelangeStocke ?? calcResult?.moduleFinesse?.melange ?? null,
    [mfMelangeStocke, calcResult]
  );

  // calcEau, calcCiment, calcRatioGS come from props (Step 2)

  const getVal = (key: string, original: string) => localOverrides[key] ?? original;

  const handleSliderChange = (key: string, val: number) => {
    const strVal = val.toString();
    setLocalOverrides(prev => ({ ...prev, [key]: strVal }));
    onQuantityChange?.(key, strVal);
  };

  const handleInputChange = (key: string, val: string) => {
    setLocalOverrides(prev => ({ ...prev, [key]: val }));
    onQuantityChange?.(key, val);
  };

  const sc = parseFloat(getVal("sableConcasse", sableConcasseQte)) || 0;
  const sf = parseFloat(getVal("sableFin", sableFinQte)) || 0;
  const g1 = parseFloat(getVal("gravillons1", gravillons1Qte)) || 0;
  const g2 = parseFloat(getVal("gravier2", gravier2Qte)) || 0;
  const g3 = parseFloat(getVal("gravier3", gravier3Qte)) || 0;

  const sables = sc + sf;
  const graviers = g1 + g2 + g3;
  const ciment = parseFloat(cimentQte) || 0;
  const eau = parseFloat(eauQte) || 0;
  const adjuvant = parseFloat(adjuvantQte) || 0;
  const total = sables + graviers + ciment + adjuvant + eau;
  const ratioGS = sables > 0 ? (graviers / sables).toFixed(2) : "-";
  const ratioEC = ciment > 0 ? (eau / ciment).toFixed(2) : "-";

  // Build granulat inputs for calculation engine
  const granulatInputs = useMemo<GranulatInput[]>(() => {
    const items: { key: string; label: string; active: boolean; isSable: boolean; isSableCorrecteur: boolean; curveType: string }[] = [
      { key: "sableConcasse", label: granulatLabels["sableConcasse"] || "Sable 0/4", active: sable1Active, isSable: true, isSableCorrecteur: false, curveType: "sable1" },
      { key: "sableFin", label: granulatLabels["sableFin"] || "Sable 0/1", active: sable2Active, isSable: true, isSableCorrecteur: true, curveType: "sable2" },
      { key: "gravillons1", label: granulatLabels["gravillons1"] || "Gravillon 3/8", active: gravier1Active, isSable: false, isSableCorrecteur: false, curveType: "gravier1" },
      { key: "gravier2", label: granulatLabels["gravier2"] || "Gravier 8/15", active: gravier2Active, isSable: false, isSableCorrecteur: false, curveType: "gravier2" },
      { key: "gravier3", label: granulatLabels["gravier3"] || "Gravier 15/25", active: gravier3Active, isSable: false, isSableCorrecteur: false, curveType: "gravier3" },
    ];
    return items.map(item => ({
      key: item.key,
      label: item.label,
      active: item.active,
      isSable: item.isSable,
      isSableCorrecteur: item.isSableCorrecteur,
      densite: granulatDensites[item.key] ?? 0,
      moduleFinesse: granulatModuleFinesse[item.key],
      curve: generateDemoCurve(item.curveType),
      dMax: DMAX_MAP[item.key] || undefined,
    }));
  }, [
    sable1Active, sable2Active, gravier1Active, gravier2Active, gravier3Active,
    granulatDensites, granulatModuleFinesse, granulatLabels,
  ]);

  // Dmax réel (priorité à la valeur utilisateur étape 4)
  const dMaxAuto = useMemo(() => determineDmax(granulatInputs), [granulatInputs]);
  const dMaxReel = useMemo(() => {
    if (typeof dMaxUser === "number" && Number.isFinite(dMaxUser) && dMaxUser > 0) {
      return dMaxUser;
    }
    return dMaxAuto;
  }, [dMaxUser, dMaxAuto]);

  // Validate imported material data
  const validateDensities = useCallback((): boolean => {
    const activeItems = [
      { key: "sableConcasse", label: `${granulatLabels["sableConcasse"] || "Sable 1"} (Densité effective)`, active: sable1Active },
      { key: "sableFin", label: `${granulatLabels["sableFin"] || "Sable 2"} (Densité effective)`, active: sable2Active },
      { key: "gravillons1", label: `${granulatLabels["gravillons1"] || "Gravier 1"} (Densité effective)`, active: gravier1Active },
      { key: "gravier2", label: `${granulatLabels["gravier2"] || "Gravier 2"} (Densité effective)`, active: gravier2Active },
      { key: "gravier3", label: `${granulatLabels["gravier3"] || "Gravier 3"} (Densité effective)`, active: gravier3Active },
    ];

    const missing: string[] = [];
    for (const item of activeItems) {
      if (item.active && (!granulatDensites[item.key] || granulatDensites[item.key] <= 0)) {
        missing.push(item.label);
      }
    }

    const sableChecks = [
      { key: "sableConcasse", label: granulatLabels["sableConcasse"] || "Sable 1", active: sable1Active },
      { key: "sableFin", label: granulatLabels["sableFin"] || "Sable 2", active: sable2Active },
    ];

    for (const sable of sableChecks) {
      if (sable.active && (!granulatModuleFinesse[sable.key] || granulatModuleFinesse[sable.key] <= 0)) {
        missing.push(`${sable.label} (Module de finesse)`);
      }
    }

    if (missing.length > 0) {
      setMissingReports(missing);
      setMissingReportsOpen(true);
      return false;
    }
    return true;
  }, [sable1Active, sable2Active, gravier1Active, gravier2Active, gravier3Active, granulatDensites, granulatModuleFinesse, granulatLabels]);

  // Cross-step validation
  const validateAllSteps = useCallback((): boolean => {
    const errors: { step: number; label: string; fields: string[] }[] = [];
    if (validationData) {
      const step2Fields: string[] = [];
      if (!validationData.resistance28j) step2Fields.push("Résistance souhaitée à 28 j");
      if (!validationData.slumpSouhaite) step2Fields.push("Slump souhaité");
      if (!validationData.classeExposition) step2Fields.push("Classe d'exposition");
      if (step2Fields.length > 0) errors.push({ step: 2, label: "Données de base", fields: step2Fields });
      if (!validationData.minimumMaterialsValid) {
        errors.push({ step: 3, label: "Information matériaux — Minimum requis", fields: validationData.minimumMaterialsMissing });
      }
      if (!validationData.materialsValid) {
        errors.push({ step: 3, label: "Information matériaux — Données manquantes", fields: validationData.missingMaterials });
      }
      const step4Fields: string[] = [];
      if (!validationData.coefficientGranulaire) step4Fields.push("Coefficient granulaire (G')");
      if (!validationData.coefficientCompacite) step4Fields.push("Coefficient de compacité (γ)");
      if (step4Fields.length > 0) errors.push({ step: 4, label: "Coefficients", fields: step4Fields });
      if (!validationData.essaisValid) {
        errors.push({ step: 5, label: "Essai", fields: validationData.essaisMissing });
      }
    }

    const mfMelangeLocal = mfMelangeEffectif;
    if (mfMelangeLocal !== null && mfMelangeLocal > 2.8 && !sable2Active) {
      errors.push({
        step: 3,
        label: "Information matériaux — Correction module de finesse",
        fields: ["Sable 2 requis pour corriger un module de finesse > 2.8"],
      });
    }

    const step2Fields: string[] = [];
    if (!calcEau) step2Fields.push("Eau (kg/m³)");
    if (!calcCiment) step2Fields.push("Ciment (kg/m³)");
    if (!calcRatioGS) step2Fields.push("Rapport G/S");
    if (step2Fields.length > 0) errors.push({ step: 2, label: "Données de base", fields: step2Fields });

    setHasValidated(true);
    if (errors.length > 0) {
      setValidationErrors(errors);
      setValidationErrorOpen(true);
      onStepErrors?.(errors.map(e => e.step));
      return false;
    }
    onStepErrors?.([]);
    return true;
  }, [validationData, calcEau, calcCiment, calcRatioGS, mfMelangeEffectif, sable2Active, onStepErrors]);

  const buildInputs = useCallback((): CalculationInputs => {
    return {
      eau: parseFloat(calcEau) || 0,
      ciment: parseFloat(calcCiment) || 0,
      ratioGS: parseFloat(calcRatioGS) || 1.8,
      coeffGranulaire: parseFloat(coefficientGranulaire) || 0.5,
      coeffCompacite: parseFloat(coefficientCompacite) || 0.8,
      airOcclus: 0,
      granulats: granulatInputs,
      mfCible: mfMelangeStocke ?? undefined,
    };
  }, [calcEau, calcCiment, calcRatioGS, coefficientCompacite, coefficientGranulaire, granulatInputs, mfMelangeStocke]);

  const applyResult = useCallback((result: CalculationResult, massesSource: Record<string, number>) => {
    const errors = result.volumeErrors;
    setCalculationErrors(errors);

    const newOverrides: Record<string, string> = {};
    for (const [key, mass] of Object.entries(massesSource)) {
      const formattedMass = mass.toFixed(1);
      newOverrides[key] = formattedMass;
      onQuantityChange?.(key, formattedMass);
    }
    setLocalOverrides(newOverrides);
    setCalcResult(result);
    setHasCalculated(true);
  }, [onQuantityChange]);

  // BUTTON 1: Calculate Proportions
  const handleCalculate = useCallback(() => {
    if (!validateAllSteps()) return;
    if (!validateDensities()) return;

    const inputs = buildInputs();
    const result = calculateMixDesign(inputs);
    applyResult(result, result.masses);
    onQuantityChange?.("eau", inputs.eau.toString());
    onQuantityChange?.("ciment", inputs.ciment.toString());
    setCalcMode("calculate");
  }, [buildInputs, onQuantityChange, validateDensities, validateAllSteps, applyResult]);

  // BUTTON 2: Optimize Curve
  const handleOptimize = useCallback(() => {
    if (!validateAllSteps()) return;
    if (!validateDensities()) return;

    const inputs = buildInputs();
    const optimized = optimizeMix(inputs, dMaxReel, classeRheologique);
    const result = calculateMixDesign(inputs, optimized);
    applyResult(result, optimized);
    setCalcMode("optimize");
  }, [buildInputs, dMaxReel, classeRheologique, validateDensities, validateAllSteps, applyResult]);

  // BUTTON 3: Manual Mode
  const handleManualMode = useCallback(() => {
    if (!hasCalculated) {
      // Need at least one calculation first
      handleCalculate();
    }
    setCalcMode("manual");
  }, [hasCalculated, handleCalculate]);

  // Helper to get density for a granulat
  const getDensite = (key: string): number => {
    const g = granulatInputs.find(gi => gi.key === key);
    return g?.densite && g.densite > 0 ? g.densite / 1000 : 0;
  };

  const materiaux = [
    { label: "Eau", value: eau, unit: "L", density: 1.0 },
    { label: "Ciment", value: ciment, unit: "kg", density: 3.11 },
    { label: "Adjuvant", value: adjuvant, unit: "kg", density: 1.05, active: adjuvant > 0 },
    { label: granulatLabels["sableConcasse"] || "Sable 0/4", value: sc, unit: "kg", density: getDensite("sableConcasse"), active: sable1Active },
    { label: granulatLabels["sableFin"] || "Sable 0/1", value: sf, unit: "kg", density: getDensite("sableFin"), active: sable2Active },
    { label: granulatLabels["gravillons1"] || "Gravillon 3/8", value: g1, unit: "kg", density: getDensite("gravillons1"), active: gravier1Active },
    { label: granulatLabels["gravier2"] || "Gravier 8/15", value: g2, unit: "kg", density: getDensite("gravier2"), active: gravier2Active },
    { label: granulatLabels["gravier3"] || "Gravier 15/25", value: g3, unit: "kg", density: getDensite("gravier3"), active: gravier3Active },
  ].filter(c => ('active' in c ? c.active : true) && c.value > 0);

  const totalVolume = materiaux.reduce((sum, c) => {
    const vol = c.density > 0 ? c.value / (c.density * 1000) : 0;
    return sum + vol;
  }, 0);
  const components = materiaux;

  // Volume breakdown computed from inputs (always up-to-date)
  const calcVolumes = useMemo(() => {
    const eauVal = parseFloat(calcEau) || 0;
    const cimentVal = parseFloat(calcCiment) || 0;
    const gsVal = parseFloat(calcRatioGS) || 0;
    const Ve = eauVal / 1000;
    const Vc = cimentVal / 3110;
    const Vg = 1 - (Ve + Vc);
    const Vsable = gsVal > 0 ? Vg / (1 + gsVal) : 0;
    const Vgravier = gsVal > 0 ? Vg - Vsable : 0;
    const volumeCheck = Ve + Vc + Vg;
    return { Ve, Vc, Vg, Vsable, Vgravier, volumeCheck };
  }, [calcEau, calcCiment, calcRatioGS]);

  // Generate granulometric curves for chart
  const demoMaterials = useMemo<MaterialCurve[]>(() => {
    if (granulatCurves && granulatCurves.length > 0) return granulatCurves;
    const materials: MaterialCurve[] = [];
    if (sable1Active && sc > 0) {
      materials.push({ label: granulatLabels["sableConcasse"] || "Sable 0/4", quantity: sc, curve: generateDemoCurve("sable1") });
    }
    if (sable2Active && sf > 0) {
      materials.push({ label: granulatLabels["sableFin"] || "Sable 0/1", quantity: sf, curve: generateDemoCurve("sable2") });
    }
    if (gravier1Active && g1 > 0) {
      materials.push({ label: granulatLabels["gravillons1"] || "Gravillon 3/8", quantity: g1, curve: generateDemoCurve("gravier1") });
    }
    if (gravier2Active && g2 > 0) {
      materials.push({ label: granulatLabels["gravier2"] || "Gravier 8/15", quantity: g2, curve: generateDemoCurve("gravier2") });
    }
    if (gravier3Active && g3 > 0) {
      materials.push({ label: granulatLabels["gravier3"] || "Gravier 15/25", quantity: g3, curve: generateDemoCurve("gravier3") });
    }
    return materials;
  }, [sable1Active, sable2Active, gravier1Active, gravier2Active, gravier3Active, sc, sf, g1, g2, g3, granulatCurves, granulatLabels]);

  const sliders: GranulatSlider[] = [
    { key: "sableConcasse", label: granulatLabels["sableConcasse"] || "Sable 0/4", active: sable1Active, value: getVal("sableConcasse", sableConcasseQte), color: "#f59e0b", max: 1200, isSable: true },
    { key: "sableFin", label: granulatLabels["sableFin"] || "Sable 0/1", active: sable2Active, value: getVal("sableFin", sableFinQte), color: "#10b981", max: 800, isSable: true },
    { key: "gravillons1", label: granulatLabels["gravillons1"] || "Gravillon 3/8", active: gravier1Active, value: getVal("gravillons1", gravillons1Qte), color: "#8b5cf6", max: 1200, isSable: false },
    { key: "gravier2", label: granulatLabels["gravier2"] || "Gravier 8/15", active: gravier2Active, value: getVal("gravier2", gravier2Qte), color: "#ef4444", max: 1200, isSable: false },
    { key: "gravier3", label: granulatLabels["gravier3"] || "Gravier 15/25", active: gravier3Active, value: getVal("gravier3", gravier3Qte), color: "#06b6d4", max: 1200, isSable: false },
  ].filter(s => s.active);

  // MF warning
  const mfMelange = mfMelangeEffectif;
  const mfWarning = mfMelange !== null && mfMelange > 2.8;
  const needsSable2Correction = mfWarning && !sable2Active;

  useEffect(() => {
    onMfCorrectionNeeded?.(needsSable2Correction);
  }, [needsSable2Correction, onMfCorrectionNeeded]);

  return (
    <div className="space-y-6">
      {/* Calculation Parameters Card */}
      <Card className="border-primary/30 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              Calcul automatique — Méthode Dreux-Gorisse
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Les paramètres Eau, Ciment et G/S sont définis à l'étape "Données de base".
            Le rapport G/S est entièrement manuel et ne sera jamais modifié par le moteur.
          </p>


          {/* Volume breakdown */}
          {(calcEau || calcCiment) && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">V(eau)</p>
                <p className="text-sm font-semibold text-foreground">{calcEau ? `${(calcVolumes.Ve * 1000).toFixed(0)} L` : "—"}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">V(ciment)</p>
                <p className="text-sm font-semibold text-foreground">{calcCiment ? `${(calcVolumes.Vc * 1000).toFixed(0)} L` : "—"}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5 text-center border border-primary/30">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">V(granulats)</p>
                <p className="text-sm font-semibold text-primary">{(calcEau && calcCiment) ? `${(calcVolumes.Vg * 1000).toFixed(0)} L` : "—"}</p>
              </div>
            </div>

            {/* Vsable / Vgravier split */}
            {calcRatioGS && calcEau && calcCiment && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-amber-500/10 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">V(sable)</p>
                  <p className="text-sm font-semibold text-foreground">{(calcVolumes.Vsable * 1000).toFixed(0)} L</p>
                </div>
                <div className="bg-violet-500/10 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">V(gravier)</p>
                  <p className="text-sm font-semibold text-foreground">{(calcVolumes.Vgravier * 1000).toFixed(0)} L</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Dmax réel</p>
                  <p className="text-sm font-semibold text-foreground">{dMaxReel} mm</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Vérification</p>
                  <p className={cn("text-sm font-semibold", Math.abs(calcVolumes.volumeCheck - 1.0) < 0.001 ? "text-green-600" : "text-destructive")}>
                    {(calcVolumes.volumeCheck * 1000).toFixed(0)} L {Math.abs(calcVolumes.volumeCheck - 1.0) < 0.001 ? "✓" : "✗"}
                  </p>
                </div>
              </div>
            )}

            {/* Volume check error */}
            {calcEau && calcCiment && Math.abs(calcVolumes.volumeCheck - 1.0) > 0.001 && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-xs text-destructive">
                  Erreur de cohérence volumique : Ve + Vc + Vgranulats ≠ 1000 L
                </p>
              </div>
            )}
          </>
          )}

          {calculationErrors.length > 0 && (
            <div className="space-y-2">
              {calculationErrors.map((error) => (
                <div key={error} className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                  <p className="text-xs text-destructive">{error}</p>
                </div>
              ))}
            </div>
          )}

          {/* Point A display */}
          {calcResult && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-red-500/10 rounded-lg p-2.5 text-center border border-red-500/20">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Point A (Dreux)</p>
                <p className="text-sm font-semibold text-foreground">
                  dA = {pointAOverride ? pointAOverride.xA.toFixed(1) : calcResult.pointA.dA} mm — PA = {pointAOverride ? pointAOverride.yA.toFixed(1) : calcResult.pointA.pA.toFixed(1)}%
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Coeff. courbe N</p>
                <p className="text-sm font-semibold text-foreground">
                  {mfMelange !== null && mfMelange !== undefined
                    ? (0.5 + (mfMelange / 10)).toFixed(2)
                    : "—"}
                </p>
              </div>
            </div>
          )}

          {/* Module de finesse display */}
          {calcResult && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(calcResult.moduleFinesse.perSand).map(([key, mf]) => {
                  const fallbackLabelMap: Record<string, string> = {
                    sableConcasse: "Sable principal",
                    sableFin: "Sable correcteur",
                  };
                  const label = granulatLabels[key] || fallbackLabelMap[key] || key;
                  return (
                    <div key={key} className="bg-muted/50 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">MF {label}</p>
                      <p className="text-sm font-semibold text-foreground">{mf.toFixed(2)}</p>
                    </div>
                  );
                })}
                {mfMelange !== null && (
                  <div className={cn("rounded-lg p-2.5 text-center", mfWarning ? "bg-amber-500/15 border border-amber-500/30" : "bg-muted/50")}>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">MF mélange</p>
                    <p className={cn("text-sm font-semibold", mfWarning ? "text-amber-600" : "text-foreground")}>{mfMelange.toFixed(2)}</p>
                  </div>
                )}
              </div>
              {mfWarning && (
                <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 whitespace-pre-line">
                    {`Sable trop grossier — ajouter un sable correcteur.

Module de finesse élevé (MF > 2.8). Le sable est considéré comme grossier selon la méthode Dreux-Gorisse.

Recommandation : Ajouter un sable de correction plus fin (ex : sable 0/1) afin d'abaisser le module de finesse du mélange.`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Sand proportion verification (MF cible formula) */}
          {calcResult && mfMelangeStocke && (() => {
            const activeSables = granulatInputs.filter(g => g.active && g.isSable);
            if (activeSables.length !== 2) return null;
            const sorted = [...activeSables].sort((a, b) => (b.moduleFinesse ?? 0) - (a.moduleFinesse ?? 0));
            const mf1 = sorted[0].moduleFinesse;
            const mf2 = sorted[1].moduleFinesse;
            if (!mf1 || !mf2 || Math.abs(mf1 - mf2) < 0.001) return null;
            const s1 = Math.max(0, Math.min(1, (mfMelangeStocke - mf2) / (mf1 - mf2)));
            const s2 = 1 - s1;
            const mfRecalcule = (mf1 * s1) + (mf2 * s2);
            const label1 = granulatLabels[sorted[0].key] || sorted[0].label;
            const label2 = granulatLabels[sorted[1].key] || sorted[1].label;
            const isValid = Math.abs(mfRecalcule - mfMelangeStocke) < 0.05;
            return (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proportions des sables — Formule MF cible</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">S1 — {label1}</p>
                    <p className="text-sm font-semibold text-foreground">{(s1 * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">S2 — {label2}</p>
                    <p className="text-sm font-semibold text-foreground">{(s2 * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-2.5 text-center border border-primary/20">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">MF cible</p>
                    <p className="text-sm font-semibold text-primary">{mfMelangeStocke.toFixed(2)}</p>
                  </div>
                  <div className={cn("rounded-lg p-2.5 text-center border", isValid ? "bg-green-500/10 border-green-500/20" : "bg-destructive/10 border-destructive/20")}>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">MF recalculé</p>
                    <p className={cn("text-sm font-semibold", isValid ? "text-green-600" : "text-destructive")}>{mfRecalcule.toFixed(2)} {isValid ? "✓" : "✗"}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {calcResult && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Répartition par fraction</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {granulatInputs.filter(g => g.active).map(g => {
                  const vol = calcResult.volumes.detail[g.key] ?? 0;
                  const mass = calcResult.masses[g.key] ?? 0;
                  const totalGroupVol = g.isSable ? calcResult.volumes.sable : calcResult.volumes.gravier;
                  const pct = totalGroupVol > 0 ? ((vol / totalGroupVol) * 100).toFixed(0) : "0";
                  return (
                    <div key={g.key} className="bg-muted/40 rounded-lg p-2 text-center">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider truncate">{g.label}</p>
                      <p className="text-xs font-semibold text-foreground">{(vol * 1000).toFixed(0)} L ({pct}%)</p>
                      <p className="text-[10px] text-muted-foreground">{Math.round(mass)} kg</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3 Action buttons */}
          <Separator />
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button onClick={handleCalculate} className="gap-2">
              <Calculator className="w-4 h-4" />
              Calculer les proportions
            </Button>
            <Button
              onClick={handleOptimize}
              variant="outline"
              className="gap-2 border-primary/50 text-primary hover:bg-primary/10"
            >
              <Sparkles className="w-4 h-4" />
              Optimiser la courbe
            </Button>
            <Button
              onClick={handleManualMode}
              variant={calcMode === "manual" ? "default" : "outline"}
              className={cn("gap-2", calcMode !== "manual" && "border-muted-foreground/30")}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Mode manuel
            </Button>
          </div>

          {/* Active mode indicator */}
          {calcMode !== "none" && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn(
                "text-xs",
                calcMode === "calculate" && "bg-primary/10 text-primary border-primary/30",
                calcMode === "optimize" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
                calcMode === "manual" && "bg-amber-500/10 text-amber-500 border-amber-500/30",
              )}>
                {calcMode === "calculate" && "Mode : Calcul Dreux classique"}
                {calcMode === "optimize" && "Mode : Courbe optimisée"}
                {calcMode === "manual" && "Mode : Ajustement manuel"}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Interactive Granulat Sliders - only in manual mode */}
      {calcMode === "manual" && hasCalculated && (
        <Card className="border-amber-500/30 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-foreground">
                Mode manuel — Ajustement interactif
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Modifiez les quantités pour recalculer instantanément la courbe granulométrique, le module de finesse et les pourcentages.
            </p>
            <div className="space-y-4 pt-2">
              {sliders.map((s) => (
                <div key={s.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.label}
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {s.isSable ? "Sable" : "Gravier"}
                      </Badge>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={s.value}
                        onChange={(e) => handleInputChange(s.key, e.target.value)}
                        className="w-20 h-8 text-right text-sm"
                        min={0}
                        max={s.max}
                      />
                      <span className="text-xs text-muted-foreground w-8">kg</span>
                    </div>
                  </div>
                  <Slider
                    value={[parseFloat(s.value) || 0]}
                    onValueChange={([val]) => handleSliderChange(s.key, val)}
                    max={s.max}
                    step={5}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dreux-Gorisse Chart */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Graphique granulométrique – Méthode Dreux-Gorisse (Dmax {dMaxReel} mm)
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Fuseau granulométrique, courbe de référence, Point A scientifique et courbe de mélange
            </p>
          </div>

          <DreuxGorisseChart
            dMax={dMaxReel}
            classeRheologique={classeRheologique}
            materials={demoMaterials}
            sables={sables}
            graviers={graviers}
            pointA={pointAOverride ? { dA: pointAOverride.xA, pA: pointAOverride.yA } : (calcResult?.pointA ?? null)}
            mfMelange={mfMelange ?? 2.5}
          />
        </CardContent>
      </Card>

      {/* Final results table */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Récapitulatif pour 1 m³</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-2.5 text-left font-semibold">Matériau</th>
                  <th className="border border-border p-2.5 text-right font-semibold">%</th>
                  <th className="border border-border p-2.5 text-right font-semibold">Volume (L)</th>
                  <th className="border border-border p-2.5 text-right font-semibold">Densité</th>
                  <th className="border border-border p-2.5 text-right font-semibold">Poids (kg/m³)</th>
                </tr>
              </thead>
              <tbody>
                {components.map(({ label, value, density }, i) => {
                  const volumeL = density > 0 ? (value / (density * 1000)) * 1000 : 0;
                  const pct = totalVolume > 0 ? (volumeL / 1000) / totalVolume * 100 : 0;
                  return (
                    <tr key={label} className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                      <td className="border border-border p-2.5 text-foreground">{label}</td>
                      <td className="border border-border p-2.5 text-right text-foreground">{pct.toFixed(1)}%</td>
                      <td className="border border-border p-2.5 text-right text-foreground">{density > 0 ? volumeL.toFixed(1) : "-"}</td>
                      <td className="border border-border p-2.5 text-right text-foreground">{density > 0 ? density.toFixed(2) : "-"}</td>
                      <td className="border border-border p-2.5 text-right font-semibold text-foreground">{Math.round(value)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-primary/10">
                  <td className="border border-border p-2.5 font-bold text-foreground">Total</td>
                  <td className="border border-border p-2.5 text-right font-bold text-primary">100%</td>
                  <td className="border border-border p-2.5 text-right font-bold text-primary">{(totalVolume * 1000).toFixed(1)} L</td>
                  <td className="border border-border p-2.5 text-right text-muted-foreground">—</td>
                  <td className="border border-border p-2.5 text-right text-xl font-bold text-primary">{Math.round(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Missing reports dialog */}
      <Dialog open={missingReportsOpen} onOpenChange={setMissingReportsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Rapports manquants
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-foreground">
              Vous devez sélectionner les rapports d'essai suivants avant de pouvoir calculer les proportions :
            </p>
            <ul className="space-y-1.5">
              {missingReports.map((report) => (
                <li key={report} className="flex items-center gap-2 text-sm text-destructive">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                  {report}
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              Retournez à l'étape "Essais" pour sélectionner les rapports de masse volumique et granulométrie des granulats actifs.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setMissingReportsOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cross-step validation error dialog */}
      <Dialog open={validationErrorOpen} onOpenChange={setValidationErrorOpen}>
        <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[85vh] flex flex-col">
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="flex items-center gap-2.5 text-lg text-destructive">
              <div className="w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              Données manquantes
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
            <p className="text-sm text-muted-foreground">
              Veuillez compléter les champs suivants avant de calculer les proportions :
            </p>
            {validationErrors.map((error) => (
              <div key={`${error.step}-${error.label}`} className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2.5">
                <p className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs px-2 py-0.5">
                    Étape {error.step}
                  </Badge>
                  {error.label}
                </p>
                <ul className="space-y-1.5 ml-1">
                  {error.fields.map((field) => (
                    <li key={field} className="flex items-start gap-2.5 text-sm text-destructive">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0 mt-1.5" />
                      {field}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <DialogFooter className="pt-3 border-t border-border">
            <Button onClick={() => setValidationErrorOpen(false)} className="min-w-[100px]">OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
