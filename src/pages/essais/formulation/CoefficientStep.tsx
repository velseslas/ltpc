import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
// Rows: Dmax values; Columns: qualité (Passable, Bonne, Excellente)
// Values from standard Dreux-Gorisse tables
const ABAQUE_G: { dmax: number; passable: number; bonne: number; excellente: number }[] = [
  { dmax: 4,    passable: 0.345, bonne: 0.370, excellente: 0.400 },
  { dmax: 6.3,  passable: 0.370, bonne: 0.400, excellente: 0.430 },
  { dmax: 8,    passable: 0.385, bonne: 0.410, excellente: 0.450 },
  { dmax: 10,   passable: 0.400, bonne: 0.425, excellente: 0.460 },
  { dmax: 12.5, passable: 0.410, bonne: 0.440, excellente: 0.475 },
  { dmax: 16,   passable: 0.425, bonne: 0.455, excellente: 0.490 },
  { dmax: 20,   passable: 0.435, bonne: 0.465, excellente: 0.505 },
  { dmax: 25,   passable: 0.445, bonne: 0.480, excellente: 0.520 },
  { dmax: 31.5, passable: 0.455, bonne: 0.490, excellente: 0.530 },
  { dmax: 40,   passable: 0.465, bonne: 0.500, excellente: 0.540 },
  { dmax: 50,   passable: 0.475, bonne: 0.510, excellente: 0.550 },
  { dmax: 63,   passable: 0.485, bonne: 0.520, excellente: 0.560 },
  { dmax: 80,   passable: 0.495, bonne: 0.530, excellente: 0.570 },
  { dmax: 100,  passable: 0.505, bonne: 0.540, excellente: 0.580 },
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

function interpolateG(dmax: number, qualite: QualiteType): number {
  if (dmax <= ABAQUE_G[0].dmax) return ABAQUE_G[0][qualite];
  if (dmax >= ABAQUE_G[ABAQUE_G.length - 1].dmax) return ABAQUE_G[ABAQUE_G.length - 1][qualite];
  for (let i = 0; i < ABAQUE_G.length - 1; i++) {
    if (dmax >= ABAQUE_G[i].dmax && dmax <= ABAQUE_G[i + 1].dmax) {
      const ratio = (dmax - ABAQUE_G[i].dmax) / (ABAQUE_G[i + 1].dmax - ABAQUE_G[i].dmax);
      return ABAQUE_G[i][qualite] + ratio * (ABAQUE_G[i + 1][qualite] - ABAQUE_G[i][qualite]);
    }
  }
  return 0;
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
}

export default function CoefficientStep({
  coefficientGranulaire,
  onCoefficientGranulaireChange,
  coefficientCompacite,
  onCoefficientCompaciteChange,
}: CoefficientStepProps) {
  // ── G' state ──
  const [qualiteG, setQualiteG] = useState<QualiteType | "">("");
  const [dmaxG, setDmaxG] = useState("");
  const [showAbaqueG, setShowAbaqueG] = useState(false);

  // ── Compacité state ──
  const [serrage, setSerrage] = useState<SerrageType | "">("");
  const [dmaxC, setDmaxC] = useState("");
  const [showAbaqueC, setShowAbaqueC] = useState(false);

  // Auto-compute G'
  const computedG = useMemo(() => {
    const d = parseFloat(dmaxG);
    if (!qualiteG || isNaN(d) || d <= 0) return null;
    return interpolateG(d, qualiteG);
  }, [qualiteG, dmaxG]);

  useEffect(() => {
    if (computedG !== null) {
      onCoefficientGranulaireChange(computedG.toFixed(3));
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
                <SelectTrigger className="bg-secondary border-border">
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
                  onChange={(e) => setDmaxG(e.target.value)}
                  placeholder="ex: 31.5"
                  className="bg-secondary border-border pr-12"
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
                className="bg-muted border-border cursor-default text-lg font-semibold"
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
                      <th className="border border-border p-2 text-center">Passable</th>
                      <th className="border border-border p-2 text-center">Bonne</th>
                      <th className="border border-border p-2 text-center">Excellente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ABAQUE_G.map((row, i) => (
                      <tr key={row.dmax} className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                        <td className="border border-border p-2 font-semibold">{row.dmax}</td>
                        <td className="border border-border p-2 text-center">{row.passable.toFixed(3)}</td>
                        <td className="border border-border p-2 text-center">{row.bonne.toFixed(3)}</td>
                        <td className="border border-border p-2 text-center">{row.excellente.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <Info className="w-3 h-3 inline mr-1" />
                Source : Méthode Dreux-Gorisse. Les valeurs intermédiaires sont interpolées linéairement.
              </p>
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
                <SelectTrigger className="bg-secondary border-border">
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
                  onChange={(e) => setDmaxC(e.target.value)}
                  placeholder="ex: 31.5"
                  className="bg-secondary border-border pr-12"
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
                className="bg-muted border-border cursor-default text-lg font-semibold"
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
