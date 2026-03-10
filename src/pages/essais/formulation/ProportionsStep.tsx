import { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, Sparkles, AlertTriangle } from "lucide-react";
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
  type GranulatInput,
  type CalculationInputs,
} from "./dreuxGorisseCalculation";

// Standard sieve openings (mm) for Dreux-Gorisse
const TAMIS_OPENINGS = [0.063, 0.125, 0.25, 0.5, 1, 2, 4, 6.3, 8, 10, 12.5, 16, 20, 25, 31.5, 40];

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
  onQuantityChange?: (key: string, value: string) => void;
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
  onQuantityChange,
}: ProportionsStepProps) {
  // Local overrides for interactive adjustments
  const [localOverrides, setLocalOverrides] = useState<Record<string, string>>({});

  // Calculation input parameters
  const [calcEau, setCalcEau] = useState(eauQte || "175");
  const [calcCiment, setCalcCiment] = useState(cimentQte || "350");
  const [calcRatioGS, setCalcRatioGS] = useState("1.8");
  const [calcAirOcclus, setCalcAirOcclus] = useState("2");
  const [hasCalculated, setHasCalculated] = useState(false);
  const [missingReportsOpen, setMissingReportsOpen] = useState(false);
  const [missingReports, setMissingReports] = useState<string[]>([]);

  // Sync from parent
  useEffect(() => {
    if (eauQte && !hasCalculated) setCalcEau(eauQte);
  }, [eauQte, hasCalculated]);
  useEffect(() => {
    if (cimentQte && !hasCalculated) setCalcCiment(cimentQte);
  }, [cimentQte, hasCalculated]);

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
    const items: { key: string; label: string; active: boolean; isSable: boolean; curveType: string }[] = [
      { key: "sableConcasse", label: "Sable 0/4", active: sable1Active, isSable: true, curveType: "sable1" },
      { key: "sableFin", label: "Sable 0/1", active: sable2Active, isSable: true, curveType: "sable2" },
      { key: "gravillons1", label: "Gravillon 3/8", active: gravier1Active, isSable: false, curveType: "gravier1" },
      { key: "gravier2", label: "Gravier 8/15", active: gravier2Active, isSable: false, curveType: "gravier2" },
      { key: "gravier3", label: "Gravier 15/25", active: gravier3Active, isSable: false, curveType: "gravier3" },
    ];
    return items.map(item => ({
      key: item.key,
      label: item.label,
      active: item.active,
      isSable: item.isSable,
      densite: granulatDensites[item.key] || 2650,
      curve: generateDemoCurve(item.curveType),
    }));
  }, [sable1Active, sable2Active, gravier1Active, gravier2Active, gravier3Active, granulatDensites]);

  const handleCalculate = useCallback(() => {
    const eauVal = parseFloat(calcEau) || 0;
    const cimentVal = parseFloat(calcCiment) || 0;
    const gsVal = parseFloat(calcRatioGS) || 1.8;
    const airVal = parseFloat(calcAirOcclus) || 2;
    const compacite = parseFloat(coefficientCompacite) || 0.8;
    const granulaire = parseFloat(coefficientGranulaire) || 0.5;

    const inputs: CalculationInputs = {
      eau: eauVal,
      ciment: cimentVal,
      ratioGS: gsVal,
      coeffGranulaire: granulaire,
      coeffCompacite: compacite,
      airOcclus: airVal,
      granulats: granulatInputs,
    };

    const result = calculateMixDesign(inputs);

    // Update quantities
    const newOverrides: Record<string, string> = {};
    for (const [key, mass] of Object.entries(result.masses)) {
      newOverrides[key] = mass.toString();
      onQuantityChange?.(key, mass.toString());
    }
    setLocalOverrides(newOverrides);

    // Update eau and ciment in parent
    onQuantityChange?.("eau", eauVal.toString());
    onQuantityChange?.("ciment", cimentVal.toString());
    setHasCalculated(true);
  }, [calcEau, calcCiment, calcRatioGS, calcAirOcclus, coefficientCompacite, coefficientGranulaire, granulatInputs, onQuantityChange]);

  const handleOptimize = useCallback(() => {
    const eauVal = parseFloat(calcEau) || 0;
    const cimentVal = parseFloat(calcCiment) || 0;
    const gsVal = parseFloat(calcRatioGS) || 1.8;
    const airVal = parseFloat(calcAirOcclus) || 2;
    const compacite = parseFloat(coefficientCompacite) || 0.8;
    const granulaire = parseFloat(coefficientGranulaire) || 0.5;

    const inputs: CalculationInputs = {
      eau: eauVal,
      ciment: cimentVal,
      ratioGS: gsVal,
      coeffGranulaire: granulaire,
      coeffCompacite: compacite,
      airOcclus: airVal,
      granulats: granulatInputs,
    };

    const dMax = gravier3Active ? 31.5 : gravier2Active ? 25 : gravier1Active ? 16 : 25;
    const optimized = optimizeMix(inputs, dMax, classeRheologique);

    const newOverrides: Record<string, string> = {};
    for (const [key, mass] of Object.entries(optimized)) {
      newOverrides[key] = mass.toString();
      onQuantityChange?.(key, mass.toString());
    }
    setLocalOverrides(newOverrides);
    setHasCalculated(true);
  }, [calcEau, calcCiment, calcRatioGS, calcAirOcclus, coefficientCompacite, coefficientGranulaire, granulatInputs, classeRheologique, gravier1Active, gravier2Active, gravier3Active, onQuantityChange]);

  // Helper to get density for a granulat from granulatInputs
  const getDensite = (key: string): number => {
    const g = granulatInputs.find(gi => gi.key === key);
    return g?.densite && g.densite > 0 ? g.densite / 1000 : 0;
  };

  const materiaux = [
    { label: "Eau", value: eau, unit: "L", density: 1.0 },
    { label: "Ciment", value: ciment, unit: "kg", density: 3.11 },
    { label: "Adjuvant", value: adjuvant, unit: "kg", density: 1.05, active: adjuvant > 0 },
    { label: "Sable 0/4", value: sc, unit: "kg", density: getDensite("sableConcasse"), active: sable1Active },
    { label: "Sable 0/1", value: sf, unit: "kg", density: getDensite("sableFin"), active: sable2Active },
    { label: "Gravillon 3/8", value: g1, unit: "kg", density: getDensite("gravillons1"), active: gravier1Active },
    { label: "Gravier 8/15", value: g2, unit: "kg", density: getDensite("gravier2"), active: gravier2Active },
    { label: "Gravier 15/25", value: g3, unit: "kg", density: getDensite("gravier3"), active: gravier3Active },
  ].filter(c => ('active' in c ? c.active : true) && c.value > 0);

  const materiauxVolume = materiaux.reduce((sum, c) => {
    const vol = c.density > 0 ? c.value / (c.density * 1000) : 0;
    return sum + vol;
  }, 0);
  const airVolume = Math.max(0, 1 - materiauxVolume); // m³
  const components = [
    ...materiaux,
    { label: "Air occlus", value: 0, unit: "-", density: 0 },
  ];
  const totalVolume = 1; // Always 1 m³ = 1000 L

  const dMax = useMemo(() => {
    if (gravier3Active && g3 > 0) return 31.5;
    if (gravier2Active && g2 > 0) return 25;
    if (gravier1Active && g1 > 0) return 16;
    return 25;
  }, [gravier1Active, gravier2Active, gravier3Active, g1, g2, g3]);

  // Generate granulometric curves for chart
  const demoMaterials = useMemo<MaterialCurve[]>(() => {
    if (granulatCurves && granulatCurves.length > 0) return granulatCurves;
    const materials: MaterialCurve[] = [];
    if (sable1Active && sc > 0) {
      materials.push({ label: "Sable 0/4", quantity: sc, curve: generateDemoCurve("sable1") });
    }
    if (sable2Active && sf > 0) {
      materials.push({ label: "Sable 0/1", quantity: sf, curve: generateDemoCurve("sable2") });
    }
    if (gravier1Active && g1 > 0) {
      materials.push({ label: "Gravillon 3/8", quantity: g1, curve: generateDemoCurve("gravier1") });
    }
    if (gravier2Active && g2 > 0) {
      materials.push({ label: "Gravier 8/15", quantity: g2, curve: generateDemoCurve("gravier2") });
    }
    if (gravier3Active && g3 > 0) {
      materials.push({ label: "Gravier 15/25", quantity: g3, curve: generateDemoCurve("gravier3") });
    }
    return materials;
  }, [sable1Active, sable2Active, gravier1Active, gravier2Active, gravier3Active, sc, sf, g1, g2, g3, granulatCurves]);

  const sliders: GranulatSlider[] = [
    { key: "sableConcasse", label: "Sable 0/4", active: sable1Active, value: getVal("sableConcasse", sableConcasseQte), color: "#f59e0b", max: 1200, isSable: true },
    { key: "sableFin", label: "Sable 0/1", active: sable2Active, value: getVal("sableFin", sableFinQte), color: "#10b981", max: 800, isSable: true },
    { key: "gravillons1", label: "Gravillon 3/8", active: gravier1Active, value: getVal("gravillons1", gravillons1Qte), color: "#8b5cf6", max: 1200, isSable: false },
    { key: "gravier2", label: "Gravier 8/15", active: gravier2Active, value: getVal("gravier2", gravier2Qte), color: "#ef4444", max: 1200, isSable: false },
    { key: "gravier3", label: "Gravier 15/25", active: gravier3Active, value: getVal("gravier3", gravier3Qte), color: "#06b6d4", max: 1200, isSable: false },
  ].filter(s => s.active);

  // Volume breakdown for display
  const calcVolumes = useMemo(() => {
    const eauVal = parseFloat(calcEau) || 0;
    const cimentVal = parseFloat(calcCiment) || 0;
    const airVal = parseFloat(calcAirOcclus) || 2;
    const compacite = parseFloat(coefficientCompacite) || 0;
    const Ve = eauVal / 1000;
    const Vc = cimentVal / 3110;
    const Vair = airVal / 100;
    let Vg = 1 - (Ve + Vc + Vair);
    if (compacite > 0) Vg *= compacite;
    return { Ve, Vc, Vair, Vg };
  }, [calcEau, calcCiment, calcAirOcclus, coefficientCompacite]);

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
            Saisissez les paramètres pour calculer automatiquement les proportions de granulats
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Eau (kg/m³)</Label>
              <Input
                type="number" step="1" min="0"
                value={calcEau}
                onChange={(e) => setCalcEau(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Ciment (kg/m³)</Label>
              <Input
                type="number" step="1" min="0"
                value={calcCiment}
                onChange={(e) => setCalcCiment(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Rapport G/S</Label>
              <Input
                type="number" step="0.1" min="0.1"
                value={calcRatioGS}
                onChange={(e) => setCalcRatioGS(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Coeff. granulaire (G')</Label>
              <Input
                value={coefficientGranulaire || "—"}
                readOnly
                className="bg-muted border-border cursor-default"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Coeff. compacité (γ)</Label>
              <Input
                value={coefficientCompacite || "—"}
                readOnly
                className="bg-muted border-border cursor-default"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Air occlus (%)</Label>
              <Input
                type="number" step="0.5" min="0" max="10"
                value={calcAirOcclus}
                onChange={(e) => setCalcAirOcclus(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
          </div>

          {/* Volume breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-muted/50 rounded-lg p-2.5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">V(eau)</p>
              <p className="text-sm font-semibold text-foreground">{(calcVolumes.Ve * 1000).toFixed(0)} L</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2.5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">V(ciment)</p>
              <p className="text-sm font-semibold text-foreground">{(calcVolumes.Vc * 1000).toFixed(0)} L</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2.5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">V(air)</p>
              <p className="text-sm font-semibold text-foreground">{(calcVolumes.Vair * 1000).toFixed(0)} L</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2.5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">V(granulats)</p>
              <p className="text-sm font-semibold text-primary">{(calcVolumes.Vg * 1000).toFixed(0)} L</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-1">
            <Button onClick={handleCalculate} className="gap-2">
              <Calculator className="w-4 h-4" />
              Calculer les proportions
            </Button>
            <Button onClick={handleOptimize} variant="outline" className="gap-2 border-primary/50 text-primary hover:bg-primary/10">
              <Sparkles className="w-4 h-4" />
              Optimiser le mélange
            </Button>
          </div>
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

      {/* Interactive Granulat Sliders */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">
            Ajustement interactif des proportions
          </h2>
          <p className="text-xs text-muted-foreground">
            Modifiez les quantités pour recalculer automatiquement la courbe de mélange
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

      {/* Dreux-Gorisse Chart */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Graphique granulométrique – Méthode Dreux-Gorisse (Dmax {dMax} mm)
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Fuseau granulométrique, courbe de référence brisée, Point A et courbe de mélange
            </p>
          </div>

          <DreuxGorisseChart
            dMax={dMax}
            classeRheologique={classeRheologique}
            materials={demoMaterials}
            sables={sables}
            graviers={graviers}
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
                  const isAir = label === "Air occlus";
                  const volumeL = isAir ? airVolume * 1000 : (density > 0 ? (value / (density * 1000)) * 1000 : 0);
                  const pct = (volumeL / 1000) * 100;
                  return (
                    <tr key={label} className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                      <td className="border border-border p-2.5 text-foreground">{label}</td>
                      <td className="border border-border p-2.5 text-right text-foreground">{pct.toFixed(1)}%</td>
                      <td className="border border-border p-2.5 text-right text-foreground">{volumeL.toFixed(1)}</td>
                      <td className="border border-border p-2.5 text-right text-foreground">{isAir ? "-" : (density > 0 ? density.toFixed(2) : "-")}</td>
                      <td className="border border-border p-2.5 text-right font-semibold text-foreground">{isAir ? "-" : value.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-primary/10">
                  <td className="border border-border p-2.5 font-bold text-foreground">Total</td>
                  <td className="border border-border p-2.5 text-right font-bold text-primary">100%</td>
                  <td className="border border-border p-2.5 text-right font-bold text-primary">1000.0 L</td>
                  <td className="border border-border p-2.5 text-right text-muted-foreground">—</td>
                  <td className="border border-border p-2.5 text-right text-xl font-bold text-primary">{total.toFixed(1)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
