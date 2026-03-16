import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Info } from "lucide-react";

// ─── Abaque G' : Coefficient granulaire selon Dreux-Gorisse ───
// Simplified 3-range table: < 12.5, 12.5-20, > 20
// Columns: qualité (Excellente, Bonne, Passable)
type AbaqueGRange = { label: string; minDmax: number; maxDmax: number; excellente: number; bonne: number; passable: number };
const ABAQUE_G_RANGES: AbaqueGRange[] = [
  { label: "< 12,5",    minDmax: 0,    maxDmax: 12.5, excellente: 0.55, bonne: 0.45, passable: 0.35 },
  { label: "12,5 - 20", minDmax: 12.5, maxDmax: 20,   excellente: 0.60, bonne: 0.50, passable: 0.40 },
  { label: "> 20",      minDmax: 20,   maxDmax: Infinity, excellente: 0.65, bonne: 0.55, passable: 0.45 },
];

// ─── Coefficient de compacité γ selon Dreux-Gorisse ───
// Depends on: consistance (serrage), Dmax
// Values from Dreux-Gorisse reference tables
const COMPACITE_TABLE: { dmax: number; piquage: number; vibrationFaible: number; vibrationNormale: number; vibrationPuissante: number }[] = [
  { dmax: 4,    piquage: 0.750, vibrationFaible: 0.755, vibrationNormale: 0.760, vibrationPuissante: 0.770 },
  { dmax: 6.3,  piquage: 0.760, vibrationFaible: 0.765, vibrationNormale: 0.770, vibrationPuissante: 0.780 },
  { dmax: 8,    piquage: 0.765, vibrationFaible: 0.770, vibrationNormale: 0.775, vibrationPuissante: 0.785 },
  { dmax: 10,   piquage: 0.770, vibrationFaible: 0.775, vibrationNormale: 0.780, vibrationPuissante: 0.790 },
  { dmax: 12.5, piquage: 0.775, vibrationFaible: 0.780, vibrationNormale: 0.785, vibrationPuissante: 0.795 },
  { dmax: 16,   piquage: 0.780, vibrationFaible: 0.785, vibrationNormale: 0.790, vibrationPuissante: 0.800 },
  { dmax: 20,   piquage: 0.785, vibrationFaible: 0.790, vibrationNormale: 0.795, vibrationPuissante: 0.805 },
  { dmax: 25,   piquage: 0.790, vibrationFaible: 0.795, vibrationNormale: 0.800, vibrationPuissante: 0.810 },
  { dmax: 31.5, piquage: 0.795, vibrationFaible: 0.800, vibrationNormale: 0.805, vibrationPuissante: 0.815 },
  { dmax: 40,   piquage: 0.800, vibrationFaible: 0.805, vibrationNormale: 0.810, vibrationPuissante: 0.820 },
  { dmax: 50,   piquage: 0.805, vibrationFaible: 0.810, vibrationNormale: 0.815, vibrationPuissante: 0.825 },
  { dmax: 63,   piquage: 0.810, vibrationFaible: 0.815, vibrationNormale: 0.820, vibrationPuissante: 0.830 },
  { dmax: 80,   piquage: 0.815, vibrationFaible: 0.820, vibrationNormale: 0.825, vibrationPuissante: 0.835 },
  { dmax: 100,  piquage: 0.820, vibrationFaible: 0.825, vibrationNormale: 0.830, vibrationPuissante: 0.840 },
];

type QualiteType = "passable" | "bonne" | "excellente";
type SerrageType = "piquage" | "vibrationFaible" | "vibrationNormale" | "vibrationPuissante";

function lookupG(dmax: number, qualite: QualiteType): number {
  for (const range of ABAQUE_G_RANGES) {
    if (dmax < range.maxDmax || range.maxDmax === Infinity) {
      return range[qualite];
    }
  }
  return ABAQUE_G_RANGES[ABAQUE_G_RANGES.length - 1][qualite];
}

function interpolateCompacite(dmax: number, serrage: SerrageType): number {
  if (dmax <= COMPACITE_TABLE[0].dmax) return COMPACITE_TABLE[0][serrage];
  if (dmax >= COMPACITE_TABLE[COMPACITE_TABLE.length - 1].dmax) return COMPACITE_TABLE[COMPACITE_TABLE.length - 1][serrage];
  for (let i = 0; i < COMPACITE_TABLE.length - 1; i++) {
    if (dmax >= COMPACITE_TABLE[i].dmax && dmax <= COMPACITE_TABLE[i + 1].dmax) {
      const ratio = (dmax - COMPACITE_TABLE[i].dmax) / (COMPACITE_TABLE[i + 1].dmax - COMPACITE_TABLE[i].dmax);
      return COMPACITE_TABLE[i][serrage] + ratio * (COMPACITE_TABLE[i + 1][serrage] - COMPACITE_TABLE[i][serrage]);
    }
  }
  return 0;
}

interface CoefficientStepProps {
  coefficientGranulaire: string;
  onCoefficientGranulaireChange: (v: string) => void;
  coefficientCompacite: string;
  onCoefficientCompaciteChange: (v: string) => void;
  dmaxValue?: string;
  onDmaxChange?: (v: string) => void;
  showError?: boolean;
}

export default function CoefficientStep({
  coefficientGranulaire,
  onCoefficientGranulaireChange,
  coefficientCompacite,
  onCoefficientCompaciteChange,
  dmaxValue = "",
  onDmaxChange,
  showError = false,
}: CoefficientStepProps) {
  // ── G' state ──
  const [qualiteG, setQualiteG] = useState<QualiteType | "">("");
  const [dmaxG, setDmaxG] = useState("");
  const [showAbaqueG, setShowAbaqueG] = useState(false);

  // ── Compacité state ──
  const [serrage, setSerrage] = useState<SerrageType | "">("");
  const [dmaxC, setDmaxC] = useState(dmaxValue);
  const [showAbaqueC, setShowAbaqueC] = useState(false);

  useEffect(() => {
    if (dmaxValue !== undefined) {
      setDmaxG(dmaxValue);
      setDmaxC(dmaxValue);
    }
  }, [dmaxValue]);

  // Auto-compute G'
  const computedG = useMemo(() => {
    const d = parseFloat(dmaxG);
    if (!qualiteG || isNaN(d) || d <= 0) return null;
    return lookupG(d, qualiteG);
  }, [qualiteG, dmaxG]);

  useEffect(() => {
    if (computedG !== null) {
      onCoefficientGranulaireChange(computedG.toFixed(2));
    }
  }, [computedG]);

  // Auto-compute compacité
  const computedC = useMemo(() => {
    const d = parseFloat(dmaxC);
    if (!serrage || isNaN(d) || d <= 0) return null;
    return interpolateCompacite(d, serrage);
  }, [serrage, dmaxC]);

  useEffect(() => {
    if (computedC !== null) {
      onCoefficientCompaciteChange(computedC.toFixed(3));
    }
  }, [computedC]);

  return (
    <div className="space-y-6">
      {/* ═══ Coefficient Granulaire G' ═══ */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Calculateur du coefficient granulaire G'</h2>
            <Badge variant="outline" className="text-xs">Dreux-Gorisse</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Qualité des granulats</Label>
              <Select value={qualiteG} onValueChange={(v) => setQualiteG(v as QualiteType)}>
                <SelectTrigger className={cn("bg-secondary border-border", showError && !qualiteG && "animate-border-blink")}>
                  <SelectValue placeholder="Sélectionnez une qualité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passable">Passable (roulés)</SelectItem>
                  <SelectItem value="bonne">Bonne (roulés + concassés)</SelectItem>
                  <SelectItem value="excellente">Excellente (concassés)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Diamètre maximal (Dmax)</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={dmaxG}
                  onChange={(e) => {
                    setDmaxG(e.target.value);
                    onDmaxChange?.(e.target.value);
                  }}
                  placeholder="ex: 31.5"
                  className={cn("bg-secondary border-border pr-12", showError && !dmaxG && "animate-border-blink")}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">mm</span>
              </div>
            </div>
          </div>

          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-1.5">
              <Label className="text-sm">Coefficient G' calculé</Label>
              <Input
                value={coefficientGranulaire || (computedG !== null ? computedG.toFixed(3) : "")}
                readOnly
                placeholder="—"
                className={cn("bg-muted border-border cursor-default text-lg font-semibold", showError && !coefficientGranulaire && "animate-border-blink")}
              />
            </div>
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowAbaqueG(true)}
              className="whitespace-nowrap"
            >
              Voir abaque
            </Button>
          </div>

          {/* Abaque G' Dialog */}
          <Dialog open={showAbaqueG} onOpenChange={setShowAbaqueG}>
            <DialogContent className="max-w-3xl w-[90vw] max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Abaque du coefficient granulaire G' — Dreux-Gorisse</DialogTitle>
              </DialogHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border p-2 text-left">Dmax (mm)</th>
                      <th className="border border-border p-2 text-left">Diamètre maximal (mm)</th>
                      <th className="border border-border p-2 text-center">Excellente</th>
                      <th className="border border-border p-2 text-center">Bonne</th>
                      <th className="border border-border p-2 text-center">Passable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ABAQUE_G_RANGES.map((row, i) => (
                      <tr key={row.label} className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                        <td className="border border-border p-2 font-semibold">{row.label}</td>
                        <td className="border border-border p-2 text-center">{row.excellente.toFixed(2)}</td>
                        <td className="border border-border p-2 text-center">{row.bonne.toFixed(2)}</td>
                        <td className="border border-border p-2 text-center">{row.passable.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 mt-3">
                <p className="text-sm font-medium text-foreground">Notes sur l'utilisation:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                  <li>Les valeurs de coefficient G' sont basées sur la qualité des granulats et leur diamètre maximal</li>
                  <li>Pour des granulats de qualité excellente, le coefficient sera plus élevé</li>
                  <li>Un coefficient plus élevé permet généralement un béton plus économique en ciment</li>
                  <li>La qualité est déterminée par la forme, la texture et les propriétés mécaniques des granulats</li>
                </ul>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* ═══ Coefficient de Compacité γ ═══ */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Calculateur du coefficient de compacité γ</h2>
            <Badge variant="outline" className="text-xs">Dreux-Gorisse</Badge>
          </div>

          <p className="text-xs text-muted-foreground">
            Le coefficient de compacité dépend du mode de serrage du béton et du diamètre maximal des granulats (Dmax).
            Il représente le volume de solide dans un mètre cube de béton en place.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Mode de serrage</Label>
              <Select value={serrage} onValueChange={(v) => setSerrage(v as SerrageType)}>
                <SelectTrigger className={cn("bg-secondary border-border", showError && !serrage && "animate-border-blink")}>
                  <SelectValue placeholder="Sélectionnez un mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="piquage">Piquage</SelectItem>
                  <SelectItem value="vibrationFaible">Vibration faible</SelectItem>
                  <SelectItem value="vibrationNormale">Vibration normale</SelectItem>
                  <SelectItem value="vibrationPuissante">Vibration puissante</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Diamètre maximal (Dmax)</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={dmaxC}
                  onChange={(e) => {
                    setDmaxC(e.target.value);
                    onDmaxChange?.(e.target.value);
                  }}
                  placeholder="ex: 31.5"
                  className={cn("bg-secondary border-border pr-12", showError && !dmaxC && "animate-border-blink")}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">mm</span>
              </div>
            </div>
          </div>

          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-1.5">
              <Label className="text-sm">Coefficient de compacité γ calculé</Label>
              <Input
                value={coefficientCompacite || (computedC !== null ? computedC.toFixed(3) : "")}
                readOnly
                placeholder="—"
                className={cn("bg-muted border-border cursor-default text-lg font-semibold", showError && !coefficientCompacite && "animate-border-blink")}
              />
            </div>
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowAbaqueC(true)}
              className="whitespace-nowrap"
            >
              Voir abaque
            </Button>
          </div>

          {/* Compacité info card */}
          {computedC !== null && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">Interprétation</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Volume solide :</span>
                  <span className="ml-2 font-semibold">{(computedC * 1000).toFixed(0)} L/m³</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Volume vides :</span>
                  <span className="ml-2 font-semibold">{((1 - computedC) * 1000).toFixed(0)} L/m³</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                γ = {computedC.toFixed(3)} → Le béton en place contient {(computedC * 100).toFixed(1)}% de solides
                et {((1 - computedC) * 100).toFixed(1)}% de vides (air + eau).
              </p>
            </div>
          )}

          {/* Abaque Compacité Dialog */}
          <Dialog open={showAbaqueC} onOpenChange={setShowAbaqueC}>
            <DialogContent className="max-w-4xl w-[90vw] max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Abaque du coefficient de compacité γ — Dreux-Gorisse</DialogTitle>
              </DialogHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border p-2 text-left">Dmax (mm)</th>
                      <th className="border border-border p-2 text-center">Piquage</th>
                      <th className="border border-border p-2 text-center">Vibration faible</th>
                      <th className="border border-border p-2 text-center">Vibration normale</th>
                      <th className="border border-border p-2 text-center">Vibration puissante</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPACITE_TABLE.map((row, i) => (
                      <tr key={row.dmax} className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                        <td className="border border-border p-2 font-semibold">{row.dmax}</td>
                        <td className="border border-border p-2 text-center">{row.piquage.toFixed(3)}</td>
                        <td className="border border-border p-2 text-center">{row.vibrationFaible.toFixed(3)}</td>
                        <td className="border border-border p-2 text-center">{row.vibrationNormale.toFixed(3)}</td>
                        <td className="border border-border p-2 text-center">{row.vibrationPuissante.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <Info className="w-3 h-3 inline mr-1" />
                Source : Méthode Dreux-Gorisse. Valeurs pour béton courant sans entraîneur d'air.
              </p>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
