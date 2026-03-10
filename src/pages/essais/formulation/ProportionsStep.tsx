import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import DreuxGorisseChart, { type MaterialCurve } from "./DreuxGorisseChart";

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
  classeRheologique: string;
  granulatCurves?: MaterialCurve[];
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
  classeRheologique,
  granulatCurves,
}: ProportionsStepProps) {
  const sables = (parseFloat(sableConcasseQte) || 0) + (parseFloat(sableFinQte) || 0);
  const graviers = (parseFloat(gravillons1Qte) || 0) + (parseFloat(gravier2Qte) || 0) + (parseFloat(gravier3Qte) || 0);
  const ciment = parseFloat(cimentQte) || 0;
  const eau = parseFloat(eauQte) || 0;
  const adjuvant = parseFloat(adjuvantQte) || 0;
  const total = sables + graviers + ciment + adjuvant + eau;
  const ratioGS = sables > 0 ? (graviers / sables).toFixed(2) : "-";
  const ratioEC = ciment > 0 ? (eau / ciment).toFixed(2) : "-";

  const components = [
    { label: "Sable concassé", value: sableConcasseQte, unit: "kg", active: sable1Active },
    { label: "Sable fin", value: sableFinQte, unit: "kg", active: sable2Active },
    { label: "Gravillons 1", value: gravillons1Qte, unit: "kg", active: gravier1Active },
    { label: "Gravier 2", value: gravier2Qte, unit: "kg", active: gravier2Active },
    { label: "Gravier 3", value: gravier3Qte, unit: "kg", active: gravier3Active },
    { label: "Ciment", value: cimentQte, unit: "kg", active: true },
    { label: "Adjuvant", value: adjuvantQte, unit: "kg", active: true },
    { label: "Eau", value: eauQte, unit: "L", active: true },
  ].filter(({ value, active }) => active && value && parseFloat(value) > 0);

  const dMax = useMemo(() => {
    if (gravier3Active && parseFloat(gravier3Qte) > 0) return 31.5;
    if (gravier2Active && parseFloat(gravier2Qte) > 0) return 25;
    if (gravier1Active && parseFloat(gravillons1Qte) > 0) return 16;
    return 25;
  }, [gravier1Active, gravier2Active, gravier3Active, gravillons1Qte, gravier2Qte, gravier3Qte]);

  // Generate demo granulometric curves for active materials if no real data
  const demoMaterials = useMemo<MaterialCurve[]>(() => {
    if (granulatCurves && granulatCurves.length > 0) return granulatCurves;

    const materials: MaterialCurve[] = [];

    if (sable1Active && parseFloat(sableConcasseQte) > 0) {
      materials.push({
        label: "Sable concassé",
        quantity: parseFloat(sableConcasseQte),
        curve: TAMIS_OPENINGS.map((ouv) => ({
          ouverture: ouv,
          pourcentageTamisat: ouv >= 4 ? 100 : Math.min(100, (Math.log10(ouv / 0.063) / Math.log10(4 / 0.063)) * 100),
        })),
      });
    }
    if (sable2Active && parseFloat(sableFinQte) > 0) {
      materials.push({
        label: "Sable fin",
        quantity: parseFloat(sableFinQte),
        curve: TAMIS_OPENINGS.map((ouv) => ({
          ouverture: ouv,
          pourcentageTamisat: ouv >= 2 ? 100 : Math.min(100, (Math.log10(ouv / 0.063) / Math.log10(2 / 0.063)) * 100),
        })),
      });
    }
    if (gravier1Active && parseFloat(gravillons1Qte) > 0) {
      materials.push({
        label: "Gravillons 3/8",
        quantity: parseFloat(gravillons1Qte),
        curve: TAMIS_OPENINGS.map((ouv) => ({
          ouverture: ouv,
          pourcentageTamisat: ouv >= 10 ? 100 : ouv <= 2 ? 0 : Math.min(100, ((ouv - 2) / (10 - 2)) * 100),
        })),
      });
    }
    if (gravier2Active && parseFloat(gravier2Qte) > 0) {
      materials.push({
        label: "Gravier 8/15",
        quantity: parseFloat(gravier2Qte),
        curve: TAMIS_OPENINGS.map((ouv) => ({
          ouverture: ouv,
          pourcentageTamisat: ouv >= 20 ? 100 : ouv <= 6.3 ? 0 : Math.min(100, ((ouv - 6.3) / (20 - 6.3)) * 100),
        })),
      });
    }
    if (gravier3Active && parseFloat(gravier3Qte) > 0) {
      materials.push({
        label: "Gravier 15/25",
        quantity: parseFloat(gravier3Qte),
        curve: TAMIS_OPENINGS.map((ouv) => ({
          ouverture: ouv,
          pourcentageTamisat: ouv >= 31.5 ? 100 : ouv <= 12.5 ? 0 : Math.min(100, ((ouv - 12.5) / (31.5 - 12.5)) * 100),
        })),
      });
    }

    return materials;
  }, [sable1Active, sable2Active, gravier1Active, gravier2Active, gravier3Active, sableConcasseQte, sableFinQte, gravillons1Qte, gravier2Qte, gravier3Qte, granulatCurves]);

  return (
    <div className="space-y-6">
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

      {/* Dreux-Gorisse Chart */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Graphique granulométrique – Méthode Dreux-Gorisse (Dmax {dMax} mm)
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Fuseau granulaire, courbe de référence brisée et courbe de mélange
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

      {/* Recap table */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Récapitulatif pour 1 m³</h2>

          <div className="space-y-1">
            {components.map(({ label, value, unit }) => (
              <div key={label} className="flex justify-between items-center py-2.5 border-b border-border/30">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="font-semibold text-foreground">{parseFloat(value).toFixed(1)} {unit}</span>
              </div>
            ))}

            <Separator className="my-2 bg-primary/30" />

            <div className="flex justify-between items-center py-3">
              <span className="font-bold text-foreground">Poids Total</span>
              <span className="text-xl font-bold text-primary">{total.toFixed(1)} kg/m³</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
