import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ValidationMessage } from "@/components/ui/validation-message";
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
import {
  calculateXA as calculateXACore,
  sieveToModule as sieveToModuleCore,
  moduleToSieve as moduleToSieveCore,
} from "./engine/pointAxAbscissa";

// ─── Sieve / Module helpers (délégués au module unique) ───
const sieveToModule = sieveToModuleCore;
const moduleToSieve = moduleToSieveCore;

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

// ─── xA Calculation (source unique : engine/pointAxAbscissa) ───
function calculateXA(dmax: number): { xA: number; method: string } {
  const r = calculateXACore(dmax);
  return { xA: r.xA, method: r.method };
}

// ─── Props ───
interface PointAEStepProps {
  dmax: number | null;
  mfMelange: number | null;
  mfSable1: number | null;
  mfSable2: number | null;
  mfIdeal: string;
  onMfIdealChange?: (v: string) => void;
  dosageCiment: string; // from step 2 / step 3
  showError?: boolean;
  // Phase 6 : onPointAChange retiré — le Point A officiel provient exclusivement de calcResult.pointA (moteur).
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
  mfSable1,
  mfSable2,
  mfIdeal,
  onMfIdealChange,
  dosageCiment,
  showError = false,
  
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
  // Use mfIdeal for all calculations instead of mfMelange
  const mfForCalc = useMemo(() => {
    const v = parseFloat(mfIdeal);
    return isNaN(v) || v <= 0 ? null : v;
  }, [mfIdeal]);

  const ks = useMemo(() => {
    if (mfForCalc === null) return null;
    return Math.round(((mfForCalc * 6) - 15) * 100) / 100;
  }, [mfForCalc]);

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

  // Phase 6 : plus de notification au parent — le moteur est source unique du Point A.

  useEffect(() => { onVibrationChange?.(vibration); }, [vibration]);
  useEffect(() => { onFormeChange?.(forme); }, [forme]);
  useEffect(() => { onKpChange?.(kp); }, [kp]);

  const kpNum = parseFloat(kp) || 0;

  return (
    <div className="space-y-6">
      {/* Warnings - displayed at top */}
      {(!dmax || !vibration || !forme || mfForCalc === null) && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground space-y-1">
            {!dmax && <p>• Dmax non défini — configurez-le à l'étape 4 (Coefficients)</p>}
            {mfForCalc === null && <p>• MF idéal non saisi</p>}
            {!vibration && <p>• Vibration non sélectionnée</p>}
            {!forme && <p>• Forme des granulats non sélectionnée</p>}
          </div>
        </div>
      )}

      {/* ═══ Paramètres d'entrée ═══ */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Paramètres de calcul</h2>
            <Badge variant="outline" className="text-xs">Dreux-Gorisse</Badge>
          </div>

          <p className="text-xs text-muted-foreground">Les champs marqués d'un astérisque sont obligatoires <span className="text-destructive">*</span></p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Dmax (depuis étape 5)</Label>
              <Input
                value={dmax ? `${dmax} mm` : "—"}
                readOnly
                className="bg-muted border-border cursor-default font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Dosage ciment (depuis données de base)</Label>
              <Input
                value={dosageCiment ? `${dosageCiment} kg/m³` : "—"}
                readOnly
                className="bg-muted border-border cursor-default font-semibold"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Calcul Module de Finesse Mélange (Mf) ═══ */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Calcul module de finesse mélange (Mf)</h2>
            <Badge variant="outline" className="text-xs">Importé + Saisie</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">MF Sable 1 (importé depuis essai)</Label>
              <Input
                value={mfSable1 !== null && mfSable1 !== undefined ? mfSable1.toFixed(2) : "—"}
                readOnly
                className="bg-muted border-border cursor-default font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">MF Sable 2 (importé depuis essai)</Label>
              <Input
                value={mfSable2 !== null && mfSable2 !== undefined ? mfSable2.toFixed(2) : "—"}
                readOnly
                className="bg-muted border-border cursor-default font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">
                MF idéal <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="Saisir le MF idéal (2.2 - 2.8)"
                value={mfIdeal}
                onChange={(e) => onMfIdealChange?.(e.target.value)}
                className={cn(
                  "bg-secondary border-border",
                  showError && !mfIdeal.trim() && "animate-border-blink",
                  mfIdeal.trim() && (parseFloat(mfIdeal) < 2.2 || parseFloat(mfIdeal) > 2.8) && "animate-border-blink"
                )}
              />
              <ValidationMessage show={showError && !mfIdeal.trim()} />
              {mfIdeal.trim() && (parseFloat(mfIdeal) < 2.2 || parseFloat(mfIdeal) > 2.8) && (
                <p className="text-xs text-destructive font-medium">
                  ⚠️ Le MF idéal doit être compris entre 2.2 et 2.8
                </p>
              )}
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
              <Label className="text-sm">Vibration <span className="text-destructive">*</span></Label>
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
              <ValidationMessage show={showError && !vibration} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Forme des granulats <span className="text-destructive">*</span></Label>
              <Select value={forme} onValueChange={(v) => setForme(v as FormeK)}>
                <SelectTrigger className={cn("bg-secondary border-border", showError && !forme && "animate-border-blink")}>
                  <SelectValue placeholder="Sélectionnez la forme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="roule">Roulé</SelectItem>
                  <SelectItem value="concasse">Concassé</SelectItem>
                </SelectContent>
              </Select>
              <ValidationMessage show={showError && !forme} />
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
              {mfForCalc !== null && (
                <p className="text-xs text-muted-foreground">
                  MF idéal = {mfForCalc.toFixed(2)} → Ks = ({mfForCalc.toFixed(2)} × 6) − 15 = {ks?.toFixed(2)}
                </p>
              )}
            </div>

            {/* Kp */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-semibold">Kp — Correction pompabilité <span className="text-destructive">*</span></Label>
                <Badge variant="secondary" className="text-xs">Ajustable</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                0 = béton très sec — 5 = plastique — 10 = très pompable
              </p>
              <Select value={kp} onValueChange={(v) => { setKp(v); onKpChange?.(v); }}>
                <SelectTrigger className={cn("bg-secondary border-border", showError && !kp.trim() && "animate-border-blink")}>
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
                  {mfForCalc !== null ? (0.5 + mfForCalc / 10).toFixed(2) : "—"}
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
              value={mfForCalc !== null ? (0.5 + mfForCalc / 10).toFixed(2) : "—"}
              readOnly
              className="bg-muted border-border cursor-default text-lg font-bold max-w-[200px]"
            />
            {mfForCalc !== null && (
              <p className="text-xs text-muted-foreground">
                N = 0.5 + ({mfForCalc.toFixed(2)} / 10) = {(0.5 + mfForCalc / 10).toFixed(2)}
              </p>
            )}
          </div>


        </CardContent>
      </Card>
    </div>
  );
}
