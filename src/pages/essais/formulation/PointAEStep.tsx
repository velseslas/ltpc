import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Info, Eye, MapPin } from "lucide-react";

// ─── AFNOR Sieve Module Table ───
// Maps AFNOR module number to sieve opening (mm)
const MODULE_TO_SIEVE: { module: number; ouverture: number }[] = [
  { module: 20, ouverture: 0.08 },
  { module: 22, ouverture: 0.1 },
  { module: 23, ouverture: 0.125 },
  { module: 24, ouverture: 0.16 },
  { module: 25, ouverture: 0.2 },
  { module: 26, ouverture: 0.25 },
  { module: 27, ouverture: 0.315 },
  { module: 28, ouverture: 0.4 },
  { module: 29, ouverture: 0.5 },
  { module: 30, ouverture: 0.63 },
  { module: 31, ouverture: 0.8 },
  { module: 32, ouverture: 1 },
  { module: 33, ouverture: 1.25 },
  { module: 34, ouverture: 1.6 },
  { module: 35, ouverture: 2 },
  { module: 36, ouverture: 2.5 },
  { module: 37, ouverture: 3.15 },
  { module: 38, ouverture: 4 },
  { module: 39, ouverture: 5 },
  { module: 40, ouverture: 6.3 },
  { module: 41, ouverture: 8 },
  { module: 42, ouverture: 10 },
  { module: 43, ouverture: 12.5 },
  { module: 44, ouverture: 16 },
  { module: 45, ouverture: 20 },
  { module: 46, ouverture: 25 },
  { module: 47, ouverture: 31.5 },
  { module: 48, ouverture: 40 },
  { module: 49, ouverture: 50 },
  { module: 50, ouverture: 63 },
  { module: 51, ouverture: 80 },
];

/** Convert a sieve opening (mm) to its AFNOR module number (interpolated) */
function sieveToModule(d: number): number {
  if (d <= MODULE_TO_SIEVE[0].ouverture) return MODULE_TO_SIEVE[0].module;
  if (d >= MODULE_TO_SIEVE[MODULE_TO_SIEVE.length - 1].ouverture)
    return MODULE_TO_SIEVE[MODULE_TO_SIEVE.length - 1].module;
  for (let i = 0; i < MODULE_TO_SIEVE.length - 1; i++) {
    if (d >= MODULE_TO_SIEVE[i].ouverture && d <= MODULE_TO_SIEVE[i + 1].ouverture) {
      const ratio =
        (Math.log10(d) - Math.log10(MODULE_TO_SIEVE[i].ouverture)) /
        (Math.log10(MODULE_TO_SIEVE[i + 1].ouverture) - Math.log10(MODULE_TO_SIEVE[i].ouverture));
      return MODULE_TO_SIEVE[i].module + ratio * (MODULE_TO_SIEVE[i + 1].module - MODULE_TO_SIEVE[i].module);
    }
  }
  return 38;
}

/** Convert an AFNOR module number to sieve opening (mm) (interpolated) */
function moduleToSieve(m: number): number {
  if (m <= MODULE_TO_SIEVE[0].module) return MODULE_TO_SIEVE[0].ouverture;
  if (m >= MODULE_TO_SIEVE[MODULE_TO_SIEVE.length - 1].module)
    return MODULE_TO_SIEVE[MODULE_TO_SIEVE.length - 1].ouverture;
  for (let i = 0; i < MODULE_TO_SIEVE.length - 1; i++) {
    if (m >= MODULE_TO_SIEVE[i].module && m <= MODULE_TO_SIEVE[i + 1].module) {
      const ratio =
        (m - MODULE_TO_SIEVE[i].module) /
        (MODULE_TO_SIEVE[i + 1].module - MODULE_TO_SIEVE[i].module);
      return MODULE_TO_SIEVE[i].ouverture *
        Math.pow(MODULE_TO_SIEVE[i + 1].ouverture / MODULE_TO_SIEVE[i].ouverture, ratio);
    }
  }
  return 4;
}

// ─── K Abaque (Dreux) ───
// K depends on: vibration, forme, dosage ciment
type VibrationK = "faible" | "normale" | "puissante";
type FormeK = "roule" | "concasse";
type DosageK = "200" | "250" | "300" | "350" | "400" | "400F";

const DOSAGE_LABELS: { value: DosageK; label: string }[] = [
  { value: "200", label: "200 kg/m³" },
  { value: "250", label: "250 kg/m³" },
  { value: "300", label: "300 kg/m³" },
  { value: "350", label: "350 kg/m³" },
  { value: "400", label: "400 kg/m³" },
  { value: "400F", label: "400+ Fluide" },
];

// K values: [vibration][forme][dosage]
const K_ABAQUE: Record<VibrationK, Record<FormeK, Record<DosageK, number>>> = {
  faible: {
    roule:    { "200": -2, "250": -3, "300": -4, "350": -5, "400": -6, "400F": -7 },
    concasse: { "200": 0,  "250": -1, "300": -2, "350": -3, "400": -4, "400F": -5 },
  },
  normale: {
    roule:    { "200": -4, "250": -5, "300": -6, "350": -7, "400": -8, "400F": -9 },
    concasse: { "200": -2, "250": -3, "300": -4, "350": -5, "400": -6, "400F": -7 },
  },
  puissante: {
    roule:    { "200": -6, "250": -7, "300": -8, "350": -9, "400": -10, "400F": -11 },
    concasse: { "200": -4, "250": -5, "300": -6, "350": -7, "400": -8,  "400F": -9 },
  },
};

function lookupK(vibration: VibrationK, forme: FormeK, dosage: DosageK): number {
  return K_ABAQUE[vibration]?.[forme]?.[dosage] ?? 0;
}

// ─── xA Calculation ───
function calculateXA(dmax: number): { xA: number; method: string } {
  if (dmax <= 20) {
    return { xA: dmax / 2, method: `Dmax ≤ 20 mm → xA = Dmax / 2 = ${(dmax / 2).toFixed(1)} mm` };
  }
  // Dmax > 20: use granulometric module method
  const moduleDmax = sieveToModule(dmax);
  const moduleXA = (moduleDmax + 38) / 2;
  const xA = moduleToSieve(moduleXA);
  return {
    xA: Math.round(xA * 10) / 10,
    method: `Dmax > 20 mm → Module(Dmax) = ${moduleDmax.toFixed(1)}, Module(xA) = (${moduleDmax.toFixed(1)} + 38) / 2 = ${moduleXA.toFixed(1)} → xA ≈ ${(Math.round(xA * 10) / 10).toFixed(1)} mm`,
  };
}

// ─── Props ───
interface PointAEStepProps {
  dmax: number | null;
  mfMelange: number | null;
  dosageCiment: string; // from step 2 / step 3
  showError?: boolean;
  onPointAChange?: (xA: number, yA: number) => void;
  onVibrationChange?: (v: string) => void;
  onFormeChange?: (v: string) => void;
  vibrationValue?: string;
  formeValue?: string;
  kpValue?: string;
  onKpChange?: (v: string) => void;
}

export default function PointAEStep({
  dmax,
  mfMelange,
  dosageCiment,
  showError = false,
  onPointAChange,
  onVibrationChange,
  onFormeChange,
  vibrationValue = "",
  formeValue = "",
  kpValue = "10",
  onKpChange,
}: PointAEStepProps) {
  const [vibration, setVibration] = useState<VibrationK | "">(vibrationValue as VibrationK | "");
  const [forme, setForme] = useState<FormeK | "">(formeValue as FormeK | "");
  const [kp, setKp] = useState(kpValue);
  const [showAbaqueK, setShowAbaqueK] = useState(false);

  useEffect(() => { if (vibrationValue) setVibration(vibrationValue as VibrationK); }, [vibrationValue]);
  useEffect(() => { if (formeValue) setForme(formeValue as FormeK); }, [formeValue]);
  useEffect(() => { if (kpValue) setKp(kpValue); }, [kpValue]);

  // Auto-detect dosage bracket
  const dosageBracket = useMemo((): DosageK | null => {
    const d = parseFloat(dosageCiment);
    if (isNaN(d) || d <= 0) return null;
    if (d <= 225) return "200";
    if (d <= 275) return "250";
    if (d <= 325) return "300";
    if (d <= 375) return "350";
    if (d <= 400) return "400";
    return "400F";
  }, [dosageCiment]);

  // Ks calculation
  const ks = useMemo(() => {
    if (mfMelange === null || mfMelange === undefined) return null;
    return Math.round(((mfMelange * 6) - 15) * 100) / 100;
  }, [mfMelange]);

  // K calculation
  const kValue = useMemo(() => {
    if (!vibration || !forme || !dosageBracket) return null;
    return lookupK(vibration, forme, dosageBracket);
  }, [vibration, forme, dosageBracket]);

  // xA calculation
  const xAResult = useMemo(() => {
    if (!dmax || dmax <= 0) return null;
    return calculateXA(dmax);
  }, [dmax]);

  // YA calculation: YA = 50 − √D + K + Ks + Kp
  const yA = useMemo(() => {
    if (!dmax || dmax <= 0 || kValue === null || ks === null) return null;
    const kpNum = parseFloat(kp) || 0;
    const raw = 50 - Math.sqrt(dmax) + kValue + ks + kpNum;
    return Math.round(raw * 100) / 100;
  }, [dmax, kValue, ks, kp]);

  // Notify parent
  useEffect(() => {
    if (xAResult && yA !== null && onPointAChange) {
      onPointAChange(xAResult.xA, yA);
    }
  }, [xAResult, yA]);

  useEffect(() => { onVibrationChange?.(vibration); }, [vibration]);
  useEffect(() => { onFormeChange?.(forme); }, [forme]);
  useEffect(() => { onKpChange?.(kp); }, [kp]);

  const kpNum = parseFloat(kp) || 0;

  return (
    <div className="space-y-6">
      {/* ═══ Paramètres d'entrée ═══ */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Paramètres de calcul</h2>
            <Badge variant="outline" className="text-xs">Dreux-Gorisse</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Dmax (depuis étape 4)</Label>
              <Input
                value={dmax ? `${dmax} mm` : "—"}
                readOnly
                className="bg-muted border-border cursor-default font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">MF mélange (depuis essais)</Label>
              <Input
                value={mfMelange !== null ? mfMelange.toFixed(2) : "—"}
                readOnly
                className="bg-muted border-border cursor-default font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Dosage ciment (depuis matériaux)</Label>
              <Input
                value={dosageCiment ? `${dosageCiment} kg/m³` : "—"}
                readOnly
                className="bg-muted border-border cursor-default font-semibold"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Coefficient K ═══ */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Coefficient K (abaque Dreux)</h2>
            <Badge variant="outline" className="text-xs">Automatique</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Vibration</Label>
              <Select value={vibration} onValueChange={(v) => setVibration(v as VibrationK)}>
                <SelectTrigger className={cn("bg-secondary border-border", showError && !vibration && "animate-border-blink")}>
                  <SelectValue placeholder="Sélectionnez la vibration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="faible">Faible</SelectItem>
                  <SelectItem value="normale">Normale</SelectItem>
                  <SelectItem value="puissante">Puissante</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Forme des granulats</Label>
              <Select value={forme} onValueChange={(v) => setForme(v as FormeK)}>
                <SelectTrigger className={cn("bg-secondary border-border", showError && !forme && "animate-border-blink")}>
                  <SelectValue placeholder="Sélectionnez la forme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="roule">Roulé</SelectItem>
                  <SelectItem value="concasse">Concassé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-1.5">
              <Label className="text-sm">Dosage ciment détecté</Label>
              <Input
                value={dosageBracket ? DOSAGE_LABELS.find(d => d.value === dosageBracket)?.label || dosageBracket : "—"}
                readOnly
                className="bg-muted border-border cursor-default"
              />
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label className="text-sm">K calculé</Label>
                <Input
                  value={kValue !== null ? kValue.toString() : "—"}
                  readOnly
                  className="bg-muted border-border cursor-default text-lg font-bold"
                />
              </div>
              <Button
                variant="outline"
                type="button"
                onClick={() => setShowAbaqueK(true)}
                className="whitespace-nowrap gap-2"
              >
                <Eye className="w-4 h-4" />
                Voir abaque K
              </Button>
            </div>
          </div>

          {/* K Abaque Dialog */}
          <Dialog open={showAbaqueK} onOpenChange={setShowAbaqueK}>
            <DialogContent className="max-w-5xl w-[95vw] max-h-[85vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Abaque du coefficient K — Dreux-Gorisse</DialogTitle>
              </DialogHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border p-2 text-left">Vibration</th>
                      <th className="border border-border p-2 text-left">Forme</th>
                      {DOSAGE_LABELS.map(d => (
                        <th key={d.value} className="border border-border p-2 text-center">{d.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(["faible", "normale", "puissante"] as VibrationK[]).map((vib) =>
                      (["roule", "concasse"] as FormeK[]).map((frm, fi) => {
                        const isCurrentRow = vibration === vib && forme === frm;
                        return (
                          <tr
                            key={`${vib}-${frm}`}
                            className={cn(
                              "transition-colors",
                              isCurrentRow ? "bg-primary/20 font-semibold" : fi % 2 === 0 ? "bg-card" : "bg-muted/30"
                            )}
                          >
                            {fi === 0 && (
                              <td className="border border-border p-2 font-semibold" rowSpan={2}>
                                {vib === "faible" ? "Faible" : vib === "normale" ? "Normale" : "Puissante"}
                              </td>
                            )}
                            <td className="border border-border p-2">
                              {frm === "roule" ? "Roulé" : "Concassé"}
                            </td>
                            {DOSAGE_LABELS.map(d => {
                              const val = K_ABAQUE[vib][frm][d.value];
                              const isCurrentCell = isCurrentRow && dosageBracket === d.value;
                              return (
                                <td
                                  key={d.value}
                                  className={cn(
                                    "border border-border p-2 text-center",
                                    isCurrentCell && "bg-primary/30 font-bold text-primary"
                                  )}
                                >
                                  {val}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4 mt-3">
                <p className="text-xs text-muted-foreground">
                  <Info className="w-3 h-3 inline mr-1" />
                  Le coefficient K est une correction appliquée à l'ordonnée du point A.
                  Il dépend du mode de vibration, de la forme des granulats et du dosage en ciment.
                  {kValue !== null && (
                    <span className="ml-1 font-semibold text-foreground">
                      Valeur actuelle : K = {kValue}
                    </span>
                  )}
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* ═══ Coefficients Ks et Kp ═══ */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6 space-y-5">
          <h2 className="text-lg font-semibold text-foreground">Corrections Ks et Kp</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ks */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-semibold">Ks — Correction sable</Label>
                <Badge variant="outline" className="text-xs">Auto</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Ks = (MF × 6) − 15
              </p>
              <Input
                value={ks !== null ? ks.toFixed(2) : "—"}
                readOnly
                className="bg-muted border-border cursor-default text-lg font-bold"
              />
              {mfMelange !== null && (
                <p className="text-xs text-muted-foreground">
                  MF = {mfMelange.toFixed(2)} → Ks = ({mfMelange.toFixed(2)} × 6) − 15 = {ks?.toFixed(2)}
                </p>
              )}
            </div>

            {/* Kp */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-semibold">Kp — Correction pompabilité</Label>
                <Badge variant="secondary" className="text-xs">Ajustable</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                0 = béton très sec — 5 = plastique — 10 = très pompable
              </p>
              <Select value={kp} onValueChange={(v) => { setKp(v); onKpChange?.(v); }}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 11 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i}{i === 0 ? " — Très sec" : i === 5 ? " — Plastique" : i === 10 ? " — Très pompable" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Résultat : Point A et Point E ═══ */}
      <Card className="border-primary/30 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Résultat — Points A et E</h2>
          </div>

          {/* xA calculation detail */}
          {xAResult && (
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground font-mono">{xAResult.method}</p>
            </div>
          )}

          {/* YA formula detail */}
          {yA !== null && kValue !== null && ks !== null && dmax && (
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground font-mono">
                YA = 50 − √{dmax} + ({kValue}) + ({ks?.toFixed(2)}) + ({kpNum})
                = 50 − {Math.sqrt(dmax).toFixed(2)} + ({kValue}) + ({ks?.toFixed(2)}) + ({kpNum})
                = {yA.toFixed(2)} %
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Point A */}
            <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-5 space-y-3">
              <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">A</span>
                Point A
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">xA (abscisse)</Label>
                  <p className="text-xl font-bold text-foreground">
                    {xAResult ? `${xAResult.xA.toFixed(1)} mm` : "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">YA (ordonnée)</Label>
                  <p className="text-xl font-bold text-foreground">
                    {yA !== null ? `${yA.toFixed(1)} %` : "—"}
                  </p>
                </div>
              </div>
              {xAResult && yA !== null && (
                <p className="text-sm font-semibold text-primary">
                  A ({xAResult.xA.toFixed(1)} mm , {yA.toFixed(1)} %)
                </p>
              )}
            </div>

            {/* Point E */}
            <div className="rounded-xl border-2 border-accent/40 bg-accent/5 p-5 space-y-3">
              <h3 className="text-sm font-bold text-accent-foreground flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold">E</span>
                Point E
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">xE (abscisse)</Label>
                  <p className="text-xl font-bold text-foreground">
                    {dmax ? `${dmax} mm` : "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">YE (ordonnée)</Label>
                  <p className="text-xl font-bold text-foreground">100 %</p>
                </div>
              </div>
              {dmax && (
                <p className="text-sm font-semibold text-muted-foreground">
                  E ({dmax} mm , 100 %)
                </p>
              )}
            </div>
          </div>

          {/* Summary card */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">Récapitulatif des coefficients</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">K :</span>
                <span className="ml-2 font-semibold">{kValue !== null ? kValue : "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Ks :</span>
                <span className="ml-2 font-semibold">{ks !== null ? ks.toFixed(2) : "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Kp :</span>
                <span className="ml-2 font-semibold">{kpNum}</span>
              </div>
              <div>
                <span className="text-muted-foreground">√Dmax :</span>
                <span className="ml-2 font-semibold">{dmax ? Math.sqrt(dmax).toFixed(2) : "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">N :</span>
                <span className="ml-2 font-semibold">
                  {mfMelange !== null ? (0.5 + mfMelange / 10).toFixed(2) : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Coefficient N display */}
          <div className="rounded-xl border-2 border-border/60 bg-muted/10 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold">Coefficient de courbe N</Label>
              <Badge variant="outline" className="text-xs">Auto • Lecture seule</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              N = 0.5 + (MF / 10)
            </p>
            <Input
              value={mfMelange !== null ? (0.5 + mfMelange / 10).toFixed(2) : "—"}
              readOnly
              className="bg-muted border-border cursor-default text-lg font-bold max-w-[200px]"
            />
            {mfMelange !== null && (
              <p className="text-xs text-muted-foreground">
                N = 0.5 + ({mfMelange.toFixed(2)} / 10) = {(0.5 + mfMelange / 10).toFixed(2)}
              </p>
            )}
          </div>

          {/* Warnings */}
          {(!dmax || !vibration || !forme || mfMelange === null) && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="text-xs text-muted-foreground space-y-1">
                {!dmax && <p>• Dmax non défini — configurez-le à l'étape 4 (Coefficients)</p>}
                {mfMelange === null && <p>• Module de finesse non disponible — sélectionnez les rapports granulométriques à l'étape 6 (Essai)</p>}
                {!vibration && <p>• Vibration non sélectionnée</p>}
                {!forme && <p>• Forme des granulats non sélectionnée</p>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
