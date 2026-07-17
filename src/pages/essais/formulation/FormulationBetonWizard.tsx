import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BarChart3, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEchantillonGranulatById, getPrefix as getGranulatPrefix } from "@/hooks/useEchantillonsGranulatFactory";
import { useEntreprise } from "@/hooks/useEntreprise";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2 } from "lucide-react";

// Import report content components for popup
import EquivalentSableReportContent from "@/pages/essais/granulat/rapport/content/EquivalentSableReportContent";
import BleuMethyleneReportContent from "@/pages/essais/granulat/rapport/content/BleuMethyleneReportContent";
import MatiereOrganiqueReportContent from "@/pages/essais/granulat/rapport/content/MatiereOrganiqueReportContent";
import GranulometrieReportContent from "@/pages/essais/granulat/rapport/content/GranulometrieReportContent";
import MasseVolumiqueReportContent from "@/pages/essais/granulat/rapport/content/MasseVolumiqueReportContent";
import FormeGranulatsReportContent from "@/pages/essais/granulat/rapport/content/FormeGranulatsReportContent";
import TeneurEauReportContent from "@/pages/essais/granulat/rapport/content/TeneurEauReportContent";
import LosAngelesReportContent from "@/pages/essais/granulat/rapport/content/LosAngelesReportContent";
import MicroDevalReportContent from "@/pages/essais/granulat/rapport/content/MicroDevalReportContent";
import EcrasementReportContent from "@/pages/essais/granulat/rapport/content/EcrasementReportContent";
import FriabiliteReportContent from "@/pages/essais/granulat/rapport/content/FriabiliteReportContent";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BackButton } from "@/components/ui/back-button";
import { Separator } from "@/components/ui/separator";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import ProportionsStep from "./ProportionsStep";
import PointAEStep from "./PointAEStep";
import ConvenanceStep from "./ConvenanceStep";
import CoefficientStep from "./CoefficientStep";
import { useClients } from "@/hooks/useClients";
import { useChantiers } from "@/hooks/useChantiers";
import { useCentralesBeton } from "@/hooks/useCentralesBeton";
import { useCarrieres } from "@/hooks/useCarrieres";
import { useCimenteries } from "@/hooks/useCimenteries";
import { useAdjuvants } from "@/hooks/useAdjuvants";
import { useSourcesEau } from "@/hooks/useSourcesEau";
import { useProduits } from "@/hooks/useProduits";
import { useCreateFormulation, useUpdateFormulation, useFormulation } from "@/hooks/useFormulations";
import { useMaitresOuvrage } from "@/hooks/useMaitresOuvrage";
import { useMaitresOeuvre } from "@/hooks/useMaitresOeuvre";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { computeWeightedSandModuleFinesse } from "./dreuxGorisseCalculation";

const ABAQUE_DATA = [
  { classe: "X0", designation: "Aucun risque de corrosion ni d'attaque", ecMax: "-", resistanceMin: "C12/15", dosageCiment: "-", teneurAir: "-" },
  { classe: "XC1", designation: "Corrosion par carbonatation — Sec ou humide en permanence", ecMax: "0.65", resistanceMin: "C20/25", dosageCiment: "260", teneurAir: "-" },
  { classe: "XC2", designation: "Corrosion par carbonatation — Humide, rarement sec", ecMax: "0.60", resistanceMin: "C25/30", dosageCiment: "280", teneurAir: "-" },
  { classe: "XC3", designation: "Corrosion par carbonatation — Humidité modérée", ecMax: "0.55", resistanceMin: "C30/37", dosageCiment: "300", teneurAir: "-" },
  { classe: "XC4", designation: "Corrosion par carbonatation — Alternance humide/sec", ecMax: "0.50", resistanceMin: "C30/37", dosageCiment: "300", teneurAir: "-" },
  { classe: "XD1", designation: "Chlorures (hors mer) — Humidité modérée", ecMax: "0.55", resistanceMin: "C30/37", dosageCiment: "300", teneurAir: "-" },
  { classe: "XD2", designation: "Chlorures (hors mer) — Humide, rarement sec", ecMax: "0.55", resistanceMin: "C30/37", dosageCiment: "300", teneurAir: "-" },
  { classe: "XD3", designation: "Chlorures (hors mer) — Alternance humide/sec", ecMax: "0.45", resistanceMin: "C35/45", dosageCiment: "320", teneurAir: "-" },
  { classe: "XS1", designation: "Eau de mer — Air véhiculant du sel marin", ecMax: "0.50", resistanceMin: "C30/37", dosageCiment: "300", teneurAir: "-" },
  { classe: "XS2", designation: "Eau de mer — Immersion permanente", ecMax: "0.45", resistanceMin: "C35/45", dosageCiment: "320", teneurAir: "-" },
  { classe: "XS3", designation: "Eau de mer — Zones de marnage", ecMax: "0.45", resistanceMin: "C35/45", dosageCiment: "340", teneurAir: "-" },
  { classe: "XF1", designation: "Gel/dégel — Saturation modérée, sans déverglaçage", ecMax: "0.55", resistanceMin: "C30/37", dosageCiment: "300", teneurAir: "-" },
  { classe: "XF2", designation: "Gel/dégel — Saturation modérée, avec déverglaçage", ecMax: "0.55", resistanceMin: "C25/30", dosageCiment: "300", teneurAir: "4%" },
  { classe: "XF3", designation: "Gel/dégel — Forte saturation, sans déverglaçage", ecMax: "0.50", resistanceMin: "C30/37", dosageCiment: "320", teneurAir: "4%" },
  { classe: "XF4", designation: "Gel/dégel — Forte saturation, avec déverglaçage", ecMax: "0.45", resistanceMin: "C30/37", dosageCiment: "340", teneurAir: "4%" },
  { classe: "XA1", designation: "Attaque chimique — Faible agressivité", ecMax: "0.55", resistanceMin: "C30/37", dosageCiment: "300", teneurAir: "-" },
  { classe: "XA2", designation: "Attaque chimique — Agressivité modérée", ecMax: "0.50", resistanceMin: "C30/37", dosageCiment: "320", teneurAir: "-" },
  { classe: "XA3", designation: "Attaque chimique — Forte agressivité", ecMax: "0.45", resistanceMin: "C35/45", dosageCiment: "360", teneurAir: "-" },
];

const STEPS = [
  { number: 1, label: "Information générale" },
  { number: 2, label: "Données de base" },
  { number: 3, label: "Information matériaux" },
  { number: 4, label: "Essai" },
  { number: 5, label: "Coefficients" },
  { number: 6, label: "Calcul A et E" },
  { number: 7, label: "Calcul proportions" },
  { number: 8, label: "Essai de convenance" },
];

// Stepper component
function Stepper({ currentStep, onStepClick, errorSteps = [] }: { currentStep: number; onStepClick: (step: number) => void; errorSteps?: number[] }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, index) => {
        const hasError = errorSteps.includes(step.number);
        return (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => onStepClick(step.number)}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all cursor-pointer hover:scale-110",
                hasError
                  ? "bg-destructive/20 text-destructive border-2 border-destructive animate-ring-blink"
                  : currentStep === step.number
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : currentStep > step.number
                  ? "bg-primary/80 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {currentStep > step.number && !hasError ? (
                <Check className="w-4 h-4" />
              ) : (
                step.number
              )}
            </button>
            <span
              className={cn(
                "text-[11px] mt-1.5 text-center max-w-[100px] leading-tight",
                hasError
                  ? "text-destructive font-medium"
                  : currentStep === step.number
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div
              className={cn(
                "w-12 h-0.5 mx-1 mt-[-18px]",
                currentStep > step.number ? "bg-primary/80" : "bg-muted"
              )}
            />
          )}
        </div>
        );
      })}
    </div>
  );
}

// Ingredient card with active/inactive toggle
function IngredientCard({
  label,
  producteurLabel = "Producteur",
  active,
  onToggle,
  producteurType,
  producteurs,
  selectedProducteurId,
  selectedProduitId,
  onProducteurChange,
  onProduitChange,
  quantite,
  onQuantiteChange,
  quantiteUnit = "kg",
  showError = false,
  expectedMaterialType,
  allSelectedProduitIds = [],
}: {
  label: string;
  producteurLabel?: string;
  active: boolean;
  onToggle: (v: boolean) => void;
  producteurType: "carriere" | "cimenterie" | "adjuvant" | "source_eau";
  producteurs: { id: string; nom: string }[];
  selectedProducteurId: string;
  selectedProduitId: string;
  onProducteurChange: (v: string) => void;
  onProduitChange: (v: string) => void;
  quantite: string;
  onQuantiteChange: (v: string) => void;
  quantiteUnit?: string;
  showError?: boolean;
  expectedMaterialType?: "sable" | "gravier";
  allSelectedProduitIds?: string[];
}) {
  const { data: produits = [] } = useProduits(selectedProducteurId, producteurType);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);

  const handleProduitChange = (produitId: string) => {
    const produit = produits.find((p: any) => p.id === produitId);
    if (produit && expectedMaterialType) {
      const nomLower = produit.nom.toLowerCase();
      if (expectedMaterialType === "sable" && (nomLower.includes("gravier") || nomLower.includes("gravillon"))) {
        setAlertMessage(`Le produit "${produit.nom}" semble être un gravier. Veuillez sélectionner un produit de type sable pour ${label}.`);
        setAlertOpen(true);
        return;
      }
      if (expectedMaterialType === "gravier" && nomLower.includes("sable")) {
        setAlertMessage(`Le produit "${produit.nom}" semble être un sable. Veuillez sélectionner un produit de type gravier pour ${label}.`);
        setAlertOpen(true);
        return;
      }
    }
    if (produitId && allSelectedProduitIds.includes(produitId)) {
      const produitNom = produit?.nom || produitId;
      setAlertMessage(`Le produit "${produitNom}" est déjà sélectionné dans un autre composant. Veuillez choisir un produit différent.`);
      setAlertOpen(true);
      return;
    }
    onProduitChange(produitId);
  };

  return (
    <>
    <div className={cn(
      "p-4 rounded-lg border space-y-3 transition-opacity",
      active ? "border-border/50 bg-muted/20" : "border-border/30 bg-muted/5 opacity-60"
    )}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">{label}</Label>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs", active ? "text-primary" : "text-muted-foreground")}>
            {active ? "Actif" : "Inactif"}
          </span>
          <Switch checked={active} onCheckedChange={onToggle} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{producteurLabel}</Label>
        <Select value={selectedProducteurId} onValueChange={onProducteurChange} disabled={!active}>
          <SelectTrigger className={cn("bg-secondary border-border", showError && active && !selectedProducteurId && "animate-border-blink")}>
            <SelectValue placeholder={active ? `Choisir ${producteurLabel.toLowerCase()}` : "Composant inactif"} />
          </SelectTrigger>
          <SelectContent>
            {producteurs.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Produit</Label>
        <Select value={selectedProduitId} onValueChange={handleProduitChange} disabled={!active || !selectedProducteurId}>
          <SelectTrigger className={cn("bg-secondary border-border", showError && active && selectedProducteurId && !selectedProduitId && "animate-border-blink")}>
            <SelectValue placeholder={!active ? "Composant inactif" : !selectedProducteurId ? `Sélectionnez d'abord une ${producteurLabel.toLowerCase()}` : "Sélectionner un produit"} />
          </SelectTrigger>
          <SelectContent>
            {produits.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
    <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Attention
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{alertMessage}</p>
        <DialogFooter>
          <Button onClick={() => setAlertOpen(false)}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

// Helper to get name by id from a list
function getNameById(list: { id: string; nom: string }[], id: string) {
  return list.find((item) => item.id === id)?.nom || "";
}

// Granulat test types
const GRANULAT_ESSAIS = [
  { nom: "Analyse Granulométrique", table: "echantillons_granulometrie" as const, filter: "all" as const, essaiType: "granulometrie", basePath: "/essais/granulat/physiques/granulometrie" },
  { nom: "Masse Volumique", table: "echantillons_masse_volumique" as const, filter: "all" as const, essaiType: "masse-volumique", basePath: "/essais/granulat/physiques/masse-volumique" },
  { nom: "Équivalent de Sable", table: "echantillons_equivalent_sable" as const, filter: "sable" as const, essaiType: "equivalent-sable", basePath: "/essais/granulat/proprete/equivalent-sable" },
  { nom: "Valeur au Bleu de Méthylène", table: "echantillons_bleu_methylene" as const, filter: "sable" as const, essaiType: "bleu-methylene", basePath: "/essais/granulat/proprete/bleu-methylene" },
  { nom: "Los Angeles", table: "echantillons_los_angeles" as const, filter: "gravier" as const, essaiType: "los-angeles", basePath: "/essais/granulat/mecaniques/los-angeles" },
  { nom: "Micro-Deval", table: "echantillons_micro_deval" as const, filter: "gravier" as const, essaiType: "micro-deval", basePath: "/essais/granulat/mecaniques/micro-deval" },
  { nom: "Coefficient d'Aplatissement", table: "echantillons_forme_granulats" as const, filter: "gravier" as const, essaiType: "forme-granulats", basePath: "/essais/granulat/physiques/forme-granulats" },
];

type GranulatTable = typeof GRANULAT_ESSAIS[number]["table"];

function useGranulatSamples(table: GranulatTable, carriereId: string) {
  return useQuery({
    queryKey: ["formulation-essai", table, carriereId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select("id, numero, produit, statut, date_reception, resultats")
        .eq("carriere_id", carriereId)
        .order("numero", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!carriereId,
  });
}

interface GranulatImportedData {
  densiteEffective?: number;
  absorption?: number;
  moduleFinesse?: number;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function computeEffectiveDensityFromMv(masseVolumique: number, absorption: number | null): number {
  if (absorption === null || absorption <= 0) return masseVolumique;
  const ratio = 1 - absorption / 100;
  return ratio > 0 ? masseVolumique / ratio : masseVolumique;
}

// Extract densité effective + absorption from masse volumique report resultats
function extractMvDataFromReport(resultats: Record<string, unknown>): Pick<GranulatImportedData, "densiteEffective" | "absorption"> | null {
  const fractionKeys = ["sable", "gravier", "gravier_4_8", "gravier_8_16", "gravier_16_25"];
  for (const key of fractionKeys) {
    const module = resultats[key];
    if (module && typeof module === "object" && !Array.isArray(module)) {
      const data = module as Record<string, unknown>;
      const absorption = readNumber(data.absorption) ?? readNumber(resultats.absorption);
      const densiteEffective = readNumber(data.densite_effective);
      const densiteSeche = readNumber(data.densite_seche);

      if (densiteEffective && densiteEffective > 0) {
        return { densiteEffective: densiteEffective * 1000, absorption: absorption ?? undefined };
      }
      if (densiteSeche && densiteSeche > 0) {
        return {
          densiteEffective: computeEffectiveDensityFromMv(densiteSeche, absorption) * 1000,
          absorption: absorption ?? undefined,
        };
      }
    }
  }
  return null;
}

function extractModuleFinesseFromReport(resultats: Record<string, unknown>): Pick<GranulatImportedData, "moduleFinesse"> | null {
  const moduleFinesse = readNumber(resultats.module_finesse);
  if (moduleFinesse && moduleFinesse > 0) {
    return { moduleFinesse };
  }
  return null;
}

// Phase 6 sous-phase 2a : extraction de la courbe granulométrique réelle
// depuis un rapport `echantillons_granulometrie.resultats.tamis`.
// Renvoie null si aucune donnée exploitable — la sous-phase 2b transformera
// cette absence en erreur bloquante (suppression de `generateDemoCurve`).
export type ExtractedCurvePoint = { ouverture: number; pourcentageTamisat: number };

function extractCurveFromReport(resultats: Record<string, unknown>): ExtractedCurvePoint[] | null {
  const tamis = resultats?.tamis;
  if (!Array.isArray(tamis) || tamis.length === 0) return null;
  const points: ExtractedCurvePoint[] = [];
  for (const raw of tamis) {
    if (!raw || typeof raw !== "object") continue;
    const t = raw as Record<string, unknown>;
    const ouverture = asFiniteNumber(t.ouverture);
    const passant = asFiniteNumber(t.passant);
    if (ouverture == null || ouverture <= 0 || passant == null) continue;
    points.push({ ouverture, pourcentageTamisat: passant });
  }
  if (points.length === 0) return null;
  return points.sort((a, b) => a.ouverture - b.ouverture);
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatNumberInput(value: unknown): string {
  const parsed = asFiniteNumber(value);
  return parsed == null ? "" : String(parsed);
}

function sumNumbers(values: unknown[]): number {
  return values.reduce<number>((total, value) => total + (asFiniteNumber(value) ?? 0), 0);
}

function deriveRatioGSFromFormulation(f: any): string {
  const sableTotal = sumNumbers([f.sable_concasse_quantite, f.sable_fin_quantite]);
  const gravierTotal = sumNumbers([f.gravillons1_quantite, f.gravier2_quantite, f.gravier3_quantite]);
  return sableTotal > 0 && gravierTotal > 0 ? (gravierTotal / sableTotal).toFixed(2) : "";
}

function deriveResistanceFromNameOrCement(f: any): string {
  const name = String(f.nom || "");
  const classMatch = name.match(/C\s*(\d{2})\s*\/\s*(\d{2})/i);
  if (classMatch?.[2]) return classMatch[2];

  const dosageFromName = asFiniteNumber(name.match(/(\d{3})\s*(?:kg|kilos?)/i)?.[1]);
  const dosageCiment = asFiniteNumber(f.ciment_calcule) ?? asFiniteNumber(f.ciment_quantite) ?? dosageFromName;
  if (dosageCiment == null) return "25";
  if (dosageCiment >= 380) return "35";
  if (dosageCiment >= 340) return "30";
  if (dosageCiment >= 300) return "25";
  if (dosageCiment >= 250) return "20";
  return "18";
}

function hasSlotData(f: any, prefix: string): boolean {
  return Boolean(f[`${prefix}_producteur_id`] || f[`${prefix}_produit_id`] || asFiniteNumber(f[`${prefix}_quantite`]) != null);
}

function deriveDmaxFromFormulation(f: any): number {
  if (hasSlotData(f, "gravier3")) return 25;
  if (hasSlotData(f, "gravier2")) return 15;
  if (hasSlotData(f, "gravillons1")) return 8;
  if (hasSlotData(f, "sable_concasse")) return 4;
  if (hasSlotData(f, "sable_fin")) return 1;
  return 20;
}

function deriveDmaxFromProductName(name?: string | null): number | null {
  const values = String(name || "")
    .match(/\d+(?:[,.]\d+)?/g)
    ?.map((value) => Number(value.replace(",", ".")))
    .filter((value) => Number.isFinite(value));
  return values?.length ? Math.max(...values) : null;
}

function deriveDefaultCoefficientGranulaire(dmax: number): string {
  if (dmax < 12.5) return "0.45";
  if (dmax < 20) return "0.50";
  return "0.55";
}

function deriveDefaultCoefficientCompacite(dmax: number): string {
  const table = [
    { dmax: 4, value: 0.76 },
    { dmax: 6.3, value: 0.77 },
    { dmax: 8, value: 0.775 },
    { dmax: 10, value: 0.78 },
    { dmax: 12.5, value: 0.785 },
    { dmax: 16, value: 0.79 },
    { dmax: 20, value: 0.795 },
    { dmax: 25, value: 0.8 },
    { dmax: 31.5, value: 0.805 },
    { dmax: 40, value: 0.81 },
  ];

  if (dmax <= table[0].dmax) return table[0].value.toFixed(3);
  for (let i = 0; i < table.length - 1; i++) {
    const current = table[i];
    const next = table[i + 1];
    if (dmax >= current.dmax && dmax <= next.dmax) {
      const ratio = (dmax - current.dmax) / (next.dmax - current.dmax);
      return (current.value + ratio * (next.value - current.value)).toFixed(3);
    }
  }
  return table[table.length - 1].value.toFixed(3);
}

function RapportMessageDialog({ open, onClose, message, type }: { open: boolean; onClose: () => void; message: string; type: "warning" | "info" }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "warning" ? (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            ) : (
              <Info className="w-5 h-5 text-primary" />
            )}
            {type === "warning" ? "Rapport indisponible" : "Sélection requise"}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground py-2">{message}</p>
        <DialogFooter>
          <Button onClick={onClose}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GranulatEssaiRow({ essaiNom, table, carriereId, produitNom, carriereNom, essaiType, essaiTitle, basePath, granulatKey, onDensityExtracted, onModuleFinesseExtracted, onCurveExtracted }: {
  essaiNom: string; table: GranulatTable; carriereId: string; produitNom: string; carriereNom: string; essaiType: string; essaiTitle: string; basePath: string;
  granulatKey?: string;
  onDensityExtracted?: (key: string, density: number) => void;
  onModuleFinesseExtracted?: (key: string, moduleFinesse: number) => void;
  onCurveExtracted?: (key: string, curve: ExtractedCurvePoint[]) => void;
}) {
  const { data: samples = [] } = useGranulatSamples(table, carriereId);
  const filtered = samples.filter((s: any) => s.produit === produitNom);
  const [selectedRapport, setSelectedRapport] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMsg, setDialogMsg] = useState("");
  const [dialogType, setDialogType] = useState<"warning" | "info">("info");
  const [showRapport, setShowRapport] = useState(false);
  const autoSelected = useRef(false);

  // Auto-select most recent completed report (with results) so values import automatically
  useEffect(() => {
    if (autoSelected.current || selectedRapport || filtered.length === 0) return;
    const best = filtered.find((s: any) => s.resultats && s.statut === "termine") || filtered.find((s: any) => s.resultats);
    if (best) {
      autoSelected.current = true;
      setSelectedRapport(best.id);
      if (granulatKey && best.resultats) {
        if (essaiType === "masse-volumique" && onDensityExtracted) {
          const mvData = extractMvDataFromReport(best.resultats as Record<string, unknown>);
          if (mvData?.densiteEffective) onDensityExtracted(granulatKey, mvData.densiteEffective);
        }
        if (essaiType === "granulometrie" && onModuleFinesseExtracted) {
          const mfData = extractModuleFinesseFromReport(best.resultats as Record<string, unknown>);
          if (mfData?.moduleFinesse) onModuleFinesseExtracted(granulatKey, mfData.moduleFinesse);
        }
        if (essaiType === "granulometrie" && onCurveExtracted) {
          const curve = extractCurveFromReport(best.resultats as Record<string, unknown>);
          if (curve) onCurveExtracted(granulatKey, curve);
        }
      }
    }
  }, [filtered, selectedRapport, granulatKey, essaiType, onDensityExtracted, onModuleFinesseExtracted, onCurveExtracted]);

  // When a MV report is selected, extract density and call back
  const handleReportSelect = (reportId: string) => {
    setSelectedRapport(reportId);
    const sample = filtered.find((s: any) => s.id === reportId);
    if (!sample?.resultats || !granulatKey || !reportId) return;

    if (essaiType === "masse-volumique" && onDensityExtracted) {
      const mvData = extractMvDataFromReport(sample.resultats as Record<string, unknown>);
      if (mvData?.densiteEffective) {
        onDensityExtracted(granulatKey, mvData.densiteEffective);
      }
    }

    if (essaiType === "granulometrie" && onModuleFinesseExtracted) {
      const mfData = extractModuleFinesseFromReport(sample.resultats as Record<string, unknown>);
      if (mfData?.moduleFinesse) {
        onModuleFinesseExtracted(granulatKey, mfData.moduleFinesse);
      }
    }

    if (essaiType === "granulometrie" && onCurveExtracted) {
      const curve = extractCurveFromReport(sample.resultats as Record<string, unknown>);
      if (curve) onCurveExtracted(granulatKey, curve);
    }
  };

  // Get the prefix for this essai type
  const prefixMap: Record<string, string> = {
    "granulometrie": "GR", "equivalent-sable": "ES", "bleu-methylene": "BM",
    "matiere-organique": "MO", "masse-volumique": "MV", "los-angeles": "LA",
    "micro-deval": "MD", "forme-granulats": "FG", "ecrasement": "EC", "friabilite": "FR",
  };
  const prefix = prefixMap[essaiType] || "ECH";

  const handleVoirRapport = () => {
    if (filtered.length === 0) {
      setDialogMsg("Aucun rapport disponible pour cet essai dans la base de données.");
      setDialogType("warning");
      setDialogOpen(true);
      return;
    }
    if (!selectedRapport) {
      setDialogMsg("Veuillez sélectionner un rapport avant de le consulter.");
      setDialogType("info");
      setDialogOpen(true);
      return;
    }
    setShowRapport(true);
  };

  const selectedSample = filtered.find((s: any) => s.id === selectedRapport);

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground ml-1">{essaiNom}</span>
      <div className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-muted/10">
        <Select value={selectedRapport} onValueChange={handleReportSelect}>
          <SelectTrigger className="bg-secondary border-border flex-1">
            <SelectValue placeholder={`Sélectionner rapport`} />
          </SelectTrigger>
          <SelectContent>
            {filtered.length === 0 ? (
              <SelectItem value="__none" disabled>Aucun rapport disponible</SelectItem>
            ) : (
              filtered.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>
                  {prefix}-{String(s.numero).padStart(3, "0")} — {carriereNom} — {s.produit}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="text-xs border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50 whitespace-nowrap" onClick={handleVoirRapport}>
          Rapport
        </Button>
      </div>
      <RapportMessageDialog open={dialogOpen} onClose={() => setDialogOpen(false)} message={dialogMsg} type={dialogType} />
      
      {/* Rapport popup */}
      <Dialog open={showRapport} onOpenChange={setShowRapport}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              Rapport {selectedSample ? `${prefix}-${String(selectedSample.numero).padStart(3, "0")}` : ""} — {essaiTitle}
            </DialogTitle>
          </DialogHeader>
          {selectedRapport && showRapport && (
            <RapportPopupContent essaiType={essaiType} sampleId={selectedRapport} essaiTitle={essaiTitle} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const reportContentMap: Record<string, React.ComponentType<{ resultats: Record<string, unknown> }>> = {
  "equivalent-sable": EquivalentSableReportContent,
  "bleu-methylene": BleuMethyleneReportContent,
  "matiere-organique": MatiereOrganiqueReportContent,
  "granulometrie": GranulometrieReportContent,
  "masse-volumique": MasseVolumiqueReportContent,
  "forme-granulats": FormeGranulatsReportContent,
  "teneur-eau": TeneurEauReportContent,
  "los-angeles": LosAngelesReportContent,
  "micro-deval": MicroDevalReportContent,
  "ecrasement": EcrasementReportContent,
  "friabilite": FriabiliteReportContent,
};

function RapportPopupContent({ essaiType, sampleId, essaiTitle }: { essaiType: string; sampleId: string; essaiTitle: string }) {
  const { data: echantillon, isLoading } = useEchantillonGranulatById(essaiType, sampleId);
  const { data: entreprise } = useEntreprise();
  const prefix = getGranulatPrefix(essaiType);
  const ReportContent = reportContentMap[essaiType];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!echantillon) {
    return <p className="text-center text-muted-foreground py-8">Échantillon non trouvé</p>;
  }

  const resultats = (echantillon.resultats as Record<string, unknown>) || {};

  return (
    <div className="bg-white text-black p-6 rounded-lg" style={{ fontFamily: "Arial, sans-serif" }}>
      <ReportHeader
        entreprise={entreprise}
        verificationUrl=""
        title={`RAPPORT D'ESSAI - ${essaiTitle.toUpperCase()}`}
        subtitle=""
      />

      <div className="mb-6">
        <h3 className="font-bold text-sm mb-2 underline text-black">Identification de l'échantillon</h3>
        <table className="w-full border-collapse border border-black text-sm">
          <tbody>
            <tr>
              <td className="border border-black px-3 py-1.5 font-medium w-1/3 text-black">N° Échantillon</td>
              <td className="border border-black px-3 py-1.5 text-black">{prefix}-{String(echantillon.numero).padStart(3, "0")}</td>
            </tr>
            <tr>
              <td className="border border-black px-3 py-1.5 font-medium text-black">Carrière / Fournisseur</td>
              <td className="border border-black px-3 py-1.5 text-black">{echantillon.carrieres?.nom || "-"}</td>
            </tr>
            <tr>
              <td className="border border-black px-3 py-1.5 font-medium text-black">Produit</td>
              <td className="border border-black px-3 py-1.5 text-black">{echantillon.produit}</td>
            </tr>
            <tr>
              <td className="border border-black px-3 py-1.5 font-medium text-black">Date de réception</td>
              <td className="border border-black px-3 py-1.5 text-black">
                {format(new Date(echantillon.date_reception), "dd/MM/yyyy", { locale: fr })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {ReportContent && <ReportContent resultats={resultats} />}

      <div className="mt-6 pt-4 border-t border-gray-300">
        <div className="flex justify-between items-end">
          <div className="text-sm text-gray-600">
            <p>Technicien: {echantillon.intervenants ? `${echantillon.intervenants.prenom} ${echantillon.intervenants.nom}` : "-"}</p>
          </div>
          <div className="text-center">
            {entreprise?.cachet_url ? (
              <img src={entreprise.cachet_url} alt="Cachet" className="max-h-16 object-contain" />
            ) : (
              <p className="text-sm font-medium">Signature et cachet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EssaiStep({
  sable1Active, sable2Active, gravier1Active, gravier2Active, gravier3Active, cimentActive, eauActive,
  sable1ProducteurId, sable1ProduitId, sable2ProducteurId, sable2ProduitId,
  gravier1ProducteurId, gravier1ProduitId, gravier2ProducteurId, gravier2ProduitId,
  gravier3ProducteurId, gravier3ProduitId, cimentProducteurId, cimentProduitId,
  eauProducteurId, eauProduitId,
  carrieres, cimenteries, sourcesEau,
  showError = false,
  onDensityExtracted,
  onModuleFinesseExtracted,
  onCurveExtracted,
}: {
  sable1Active: boolean; sable2Active: boolean; gravier1Active: boolean; gravier2Active: boolean; gravier3Active: boolean;
  cimentActive: boolean; eauActive: boolean;
  sable1ProducteurId: string; sable1ProduitId: string; sable2ProducteurId: string; sable2ProduitId: string;
  gravier1ProducteurId: string; gravier1ProduitId: string; gravier2ProducteurId: string; gravier2ProduitId: string;
  gravier3ProducteurId: string; gravier3ProduitId: string; cimentProducteurId: string; cimentProduitId: string;
  eauProducteurId: string; eauProduitId: string;
  carrieres: { id: string; nom: string }[]; cimenteries: { id: string; nom: string }[]; sourcesEau: { id: string; nom: string }[];
  showError?: boolean;
  onDensityExtracted?: (key: string, density: number) => void;
  onModuleFinesseExtracted?: (key: string, moduleFinesse: number) => void;
  onCurveExtracted?: (key: string, curve: ExtractedCurvePoint[]) => void;
}) {
  const [staticDialogOpen, setStaticDialogOpen] = useState(false);
  // Get product names
  const { data: sable1Produits = [] } = useProduits(sable1ProducteurId, "carriere");
  const { data: sable2Produits = [] } = useProduits(sable2ProducteurId, "carriere");
  const { data: gravier1Produits = [] } = useProduits(gravier1ProducteurId, "carriere");
  const { data: gravier2Produits = [] } = useProduits(gravier2ProducteurId, "carriere");
  const { data: gravier3Produits = [] } = useProduits(gravier3ProducteurId, "carriere");
  const { data: cimentProduits = [] } = useProduits(cimentProducteurId, "cimenterie");
  const { data: eauProduits = [] } = useProduits(eauProducteurId, "source_eau");

  // Build granulat materials list - show all active ones
  const granulatMaterials = [
    { label: "Sable 1", granulatKey: "sableConcasse", active: sable1Active, producteurId: sable1ProducteurId, produitId: sable1ProduitId, produits: sable1Produits },
    { label: "Sable 2", granulatKey: "sableFin", active: sable2Active, producteurId: sable2ProducteurId, produitId: sable2ProduitId, produits: sable2Produits },
    { label: "Gravier 1", granulatKey: "gravillons1", active: gravier1Active, producteurId: gravier1ProducteurId, produitId: gravier1ProduitId, produits: gravier1Produits },
    { label: "Gravier 2", granulatKey: "gravier2", active: gravier2Active, producteurId: gravier2ProducteurId, produitId: gravier2ProduitId, produits: gravier2Produits },
    { label: "Gravier 3", granulatKey: "gravier3", active: gravier3Active, producteurId: gravier3ProducteurId, produitId: gravier3ProduitId, produits: gravier3Produits },
  ].filter((m) => m.active);

  const hasAnyActiveGranulat = granulatMaterials.length > 0;

  const cimentProduitNom = cimentProduits.find((p: any) => p.id === cimentProduitId)?.nom || "";
  const cimentProducteurNom = getNameById(cimenteries, cimentProducteurId);
  const eauProduitNom = eauProduits.find((p: any) => p.id === eauProduitId)?.nom || "";
  const eauProducteurNom = getNameById(sourcesEau, eauProducteurId);

  // Build resolved materials with names
  const resolvedGranulats = granulatMaterials
    .filter((m) => m.producteurId && m.produitId)
    .map((mat) => ({
      label: mat.label,
      granulatKey: mat.granulatKey,
      produitNom: mat.produits.find((p: any) => p.id === mat.produitId)?.nom || "",
      producteurNom: getNameById(carrieres, mat.producteurId),
      carriereId: mat.producteurId,
    }));

  return (
    <div className="space-y-6">
      {/* Granulats — organisé par type d'essai */}
      {hasAnyActiveGranulat && (
        <Card className={cn("border-border/50 bg-card/80 backdrop-blur-sm", showError && resolvedGranulats.length === 0 && "animate-border-blink")}>
          <CardContent className="p-6 space-y-6">
            <h2 className="text-lg font-bold text-foreground">Essais sur les Granulats</h2>

            {resolvedGranulats.length === 0 ? (
              <p className={cn("text-xs italic p-3", showError ? "text-destructive font-medium" : "text-muted-foreground")}>
                Veuillez sélectionner une carrière et un produit à l'étape 3 pour voir les rapports d'essais.
              </p>
            ) : (
              GRANULAT_ESSAIS.map((essai) => {
                const materialsForEssai = essai.filter === "sable"
                  ? resolvedGranulats.filter((m) => m.label.toLowerCase().startsWith("sable"))
                  : essai.filter === "gravier"
                  ? resolvedGranulats.filter((m) => m.label.toLowerCase().startsWith("gravier"))
                  : resolvedGranulats;
                if (materialsForEssai.length === 0) return null;
                return (
                  <div key={essai.table} className="space-y-2">
                    <h3 className="text-sm font-semibold text-primary">{essai.nom}</h3>
                    <Separator className="bg-border/50" />
                    {materialsForEssai.map((mat) => (
                      <GranulatEssaiRow
                        key={`${essai.table}-${mat.label}`}
                        essaiNom={`${mat.label} (${mat.produitNom}) — ${mat.producteurNom}`}
                        table={essai.table}
                        carriereId={mat.carriereId}
                        produitNom={mat.produitNom}
                        carriereNom={mat.producteurNom}
                        essaiType={essai.essaiType}
                        essaiTitle={essai.nom}
                        basePath={essai.basePath}
                        granulatKey={mat.granulatKey}
                        onDensityExtracted={onDensityExtracted}
                        onModuleFinesseExtracted={onModuleFinesseExtracted}
                        onCurveExtracted={onCurveExtracted}
                      />
                    ))}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}

      {granulatMaterials.length === 0 && !cimentActive && !eauActive && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6 text-center text-muted-foreground">
            Aucun matériau actif sélectionné. Veuillez configurer les matériaux à l'étape 3.
          </CardContent>
        </Card>
      )}
      <RapportMessageDialog open={staticDialogOpen} onClose={() => setStaticDialogOpen(false)} message="Aucun rapport disponible pour cet essai dans la base de données." type="warning" />
    </div>
  );
}

export default function FormulationBetonWizard() {
  const navigate = useNavigate();
  const { formulationId } = useParams<{ formulationId?: string }>();
  const [searchParams] = useSearchParams();
  const duplicateFromId = searchParams.get("duplicateFrom") || "";
  const isEdit = !!formulationId;
  const isDuplicating = !isEdit && !!duplicateFromId;
  const sourceId = formulationId || duplicateFromId;
  const { data: existingFormulation, isLoading: isLoadingFormulation, error: formulationError, refetch: refetchFormulation } = useFormulation(sourceId || "");
  const formulationToEdit = useMemo(() => {
    if (!existingFormulation) return null;
    const src = Array.isArray(existingFormulation) ? existingFormulation[0] ?? null : existingFormulation;
    if (!src) return null;
    if (isDuplicating) {
      // Strip identifiers so a fresh row is created on save
      const { id: _id, created_at: _c, updated_at: _u, numero: _n, ...rest } = src as any;
      return { ...rest, nom: rest?.nom ? `${rest.nom} (copie)` : "" };
    }
    return src;
  }, [existingFormulation, isDuplicating]);
  const editInitialized = useRef(false);
  const [debugOpen, setDebugOpen] = useState(true);

  // Log + retry on auth errors when editing
  useEffect(() => {
    if (isEdit && formulationError) {
      console.error("[FormulationWizard] Erreur chargement formulation:", formulationError);
      const timer = setTimeout(() => refetchFormulation(), 1500);
      return () => clearTimeout(timer);
    }
  }, [isEdit, formulationError, refetchFormulation]);
  const [currentStep, setCurrentStep] = useState(1);
  const [errorSteps, setErrorSteps] = useState<number[]>([]);
  const [attemptedSteps, setAttemptedSteps] = useState<Set<number>>(new Set());
  const wasAttempted = (n: number) => attemptedSteps.has(n);
  // Step 1
  const [nom, setNom] = useState("");
  const [clientId, setClientId] = useState("");
  const [chantierId, setChantierId] = useState("");
  const [centraleId, setCentraleId] = useState("");
  const [maitreOuvrageId, setMaitreOuvrageId] = useState("");
  const [maitreOeuvreId, setMaitreOeuvreId] = useState("");

  // Step 3 - producteurs/produits + active toggles
  const [sable1Active, setSable1Active] = useState(true);
  const [sable2Active, setSable2Active] = useState(false);
  const [gravier1Active, setGravier1Active] = useState(true);
  const [gravier2Active, setGravier2Active] = useState(false);
  const [gravier3Active, setGravier3Active] = useState(false);
  const [cimentActive, setCimentActive] = useState(true);
  const [adjuvantActive, setAdjuvantActive] = useState(true);
  const [eauActive, setEauActive] = useState(true);

  const [sableConcasseProducteurId, setSableConcasseProducteurId] = useState("");
  const [sableConcasseProduitId, setSableConcasseProduitId] = useState("");
  const [sableFinProducteurId, setSableFinProducteurId] = useState("");
  const [sableFinProduitId, setSableFinProduitId] = useState("");
  const [gravillons1ProducteurId, setGravillons1ProducteurId] = useState("");
  const [gravillons1ProduitId, setGravillons1ProduitId] = useState("");
  const [gravier2ProducteurId, setGravier2ProducteurId] = useState("");
  const [gravier2ProduitId, setGravier2ProduitId] = useState("");
  const [gravier3ProducteurId, setGravier3ProducteurId] = useState("");
  const [gravier3ProduitId, setGravier3ProduitId] = useState("");
  const [cimentProducteurId, setCimentProducteurId] = useState("");
  const [cimentProduitId, setCimentProduitId] = useState("");
  const [adjuvantProducteurId, setAdjuvantProducteurId] = useState("");
  const [adjuvantProduitId, setAdjuvantProduitId] = useState("");
  const [eauProducteurId, setEauProducteurId] = useState("");
  const [eauProduitId, setEauProduitId] = useState("");

  // Step 3 - quantities
  const [sableConcasseQte, setSableConcasseQte] = useState("");
  const [sableFinQte, setSableFinQte] = useState("");
  const [gravillons1Qte, setGravillons1Qte] = useState("");
  const [gravier2Qte, setGravier2Qte] = useState("");
  const [gravier3Qte, setGravier3Qte] = useState("");
  const [cimentQte, setCimentQte] = useState("");
  const [adjuvantQte, setAdjuvantQte] = useState("");
  const [eauQte, setEauQte] = useState("");

  // Step 4 - coefficients
  const [coefficientGranulaire, setCoefficientGranulaire] = useState("");
  const [coefficientCompacite, setCoefficientCompacite] = useState("");
  const [dmaxUtilisateur, setDmaxUtilisateur] = useState("");
  const [mfCorrectionNeeded, setMfCorrectionNeeded] = useState(false);

  // Step 5 - Calcul A et E
  const [vibrationAE, setVibrationAE] = useState("");
  const [formeAE, setFormeAE] = useState("");
  const [kpAE, setKpAE] = useState("10");
  const [mfIdeal, setMfIdeal] = useState("");
  // Phase 6 : pointACoords / setPointACoords supprimés — Point A affiché via calcResult.pointA uniquement.

  // Step 5 - essai
  const [affaissementCible, setAffaissementCible] = useState("");
  const [resistanceCible, setResistanceCible] = useState("");

  // Step 5 - données granulats importées depuis les rapports
  const [granulatDensites, setGranulatDensites] = useState<Record<string, number>>({});
  const [granulatModuleFinesse, setGranulatModuleFinesse] = useState<Record<string, number>>({});
  // Phase 6 / 2a : courbes granulométriques réelles extraites des rapports GR
  const [granulatCurves, setGranulatCurves] = useState<Record<string, ExtractedCurvePoint[]>>({});
  const handleDensityExtracted = (key: string, density: number) => {
    setGranulatDensites(prev => ({ ...prev, [key]: density }));
  };
  const handleModuleFinesseExtracted = (key: string, moduleFinesse: number) => {
    setGranulatModuleFinesse(prev => ({ ...prev, [key]: moduleFinesse }));
  };
  const handleCurveExtracted = (key: string, curve: ExtractedCurvePoint[]) => {
    setGranulatCurves(prev => ({ ...prev, [key]: curve }));
  };

  // Phase 6/8 : nettoyage automatique — un granulat désactivé OU dont le produit change
  // NE DOIT PAS conserver ses courbes / densités / MF / quantités / ids en mémoire.
  useEffect(() => {
    const activeMap: Record<string, string | null> = {
      sableConcasse: sable1Active ? (sableConcasseProduitId || null) : null,
      sableFin: sable2Active ? (sableFinProduitId || null) : null,
      gravillons1: gravier1Active ? (gravillons1ProduitId || null) : null,
      gravier2: gravier2Active ? (gravier2ProduitId || null) : null,
      gravier3: gravier3Active ? (gravier3ProduitId || null) : null,
    };
    // Sur désactivation → suppression totale des données du granulat.
    setGranulatCurves(prev => {
      const next = { ...prev };
      let changed = false;
      for (const k of Object.keys(next)) {
        if (activeMap[k] === null || activeMap[k] === undefined) {
          delete next[k]; changed = true;
        }
      }
      return changed ? next : prev;
    });
    setGranulatDensites(prev => {
      const next = { ...prev };
      let changed = false;
      for (const k of Object.keys(next)) {
        if (activeMap[k] === null || activeMap[k] === undefined) {
          delete next[k]; changed = true;
        }
      }
      return changed ? next : prev;
    });
    setGranulatModuleFinesse(prev => {
      const next = { ...prev };
      let changed = false;
      for (const k of Object.keys(next)) {
        if (activeMap[k] === null || activeMap[k] === undefined) {
          delete next[k]; changed = true;
        }
      }
      return changed ? next : prev;
    });
    // Phase 8 : quantités + ids fantômes → purge quand le slot est inactif.
    if (!sable1Active) { setSableConcasseQte(""); setSableConcasseProducteurId(""); setSableConcasseProduitId(""); }
    if (!sable2Active) { setSableFinQte(""); setSableFinProducteurId(""); setSableFinProduitId(""); }
    if (!gravier1Active) { setGravillons1Qte(""); setGravillons1ProducteurId(""); setGravillons1ProduitId(""); }
    if (!gravier2Active) { setGravier2Qte(""); setGravier2ProducteurId(""); setGravier2ProduitId(""); }
    if (!gravier3Active) { setGravier3Qte(""); setGravier3ProducteurId(""); setGravier3ProduitId(""); }
  }, [
    sable1Active, sable2Active, gravier1Active, gravier2Active, gravier3Active,
    sableConcasseProduitId, sableFinProduitId, gravillons1ProduitId, gravier2ProduitId, gravier3ProduitId,
  ]);

  const mfImporteEtape6 = useMemo(() => {
    const sableConcasseMf = granulatModuleFinesse.sableConcasse;
    const sableFinMf = granulatModuleFinesse.sableFin;

    if (sable1Active && (!(typeof sableConcasseMf === "number") || sableConcasseMf <= 0)) return null;
    if (sable2Active && (!(typeof sableFinMf === "number") || sableFinMf <= 0)) return null;

    const sableConcasseVolumeReel = (() => {
      const masse = parseFloat(sableConcasseQte) || 0;
      const densite = granulatDensites.sableConcasse ?? 0;
      return masse > 0 && densite > 0 ? masse / densite : 0;
    })();

    const sableFinVolumeReel = (() => {
      const masse = parseFloat(sableFinQte) || 0;
      const densite = granulatDensites.sableFin ?? 0;
      return masse > 0 && densite > 0 ? masse / densite : 0;
    })();

    const volumeTotalReel = sableConcasseVolumeReel + sableFinVolumeReel;

    if (volumeTotalReel > 0) {
      return computeWeightedSandModuleFinesse([
        {
          active: sable1Active,
          moduleFinesse: sableConcasseMf,
          proportion: sableConcasseVolumeReel,
        },
        {
          active: sable2Active,
          moduleFinesse: sableFinMf,
          proportion: sableFinVolumeReel,
        },
      ]);
    }

    if (sable1Active && sable2Active) {
      return computeWeightedSandModuleFinesse([
        { active: true, moduleFinesse: sableConcasseMf, proportion: 0.7 },
        { active: true, moduleFinesse: sableFinMf, proportion: 0.3 },
      ]);
    }

    if (sable1Active) {
      return computeWeightedSandModuleFinesse([
        { active: true, moduleFinesse: sableConcasseMf, proportion: 1 },
      ]);
    }

    if (sable2Active) {
      return computeWeightedSandModuleFinesse([
        { active: true, moduleFinesse: sableFinMf, proportion: 1 },
      ]);
    }

    return null;
  }, [sable1Active, sable2Active, sableConcasseQte, sableFinQte, granulatDensites, granulatModuleFinesse]);

  // Step 2 - données de base
  const [resistance28j, setResistance28j] = useState("");
  const [slumpSouhaite, setSlumpSouhaite] = useState("");
  const [classeExposition, setClasseExposition] = useState("");
  const [showAbaque, setShowAbaque] = useState(false);
  const [calcEau, setCalcEau] = useState("");
  const [calcCiment, setCalcCiment] = useState("");
  const [calcRatioGS, setCalcRatioGS] = useState("");
  const [calcAdjuvant, setCalcAdjuvant] = useState("");

  // Auto-derived fields
  const classeResistanceAuto = useMemo(() => {
    const r = parseFloat(resistance28j);
    if (isNaN(r) || r <= 0) return "";
    if (r <= 20) return "C16/20";
    if (r <= 25) return "C20/25";
    if (r <= 30) return "C25/30";
    if (r <= 37) return "C30/37";
    if (r <= 45) return "C35/45";
    if (r <= 50) return "C40/50";
    if (r <= 55) return "C45/55";
    return "C50/60";
  }, [resistance28j]);

  // Warning: cement insufficient for resistance class
  const cimentWarning = useMemo(() => {
    const cimentVal = parseFloat(calcCiment);
    if (!classeResistanceAuto || isNaN(cimentVal) || cimentVal <= 0) return null;
    // Find matching ABAQUE row by resistanceMin
    const row = ABAQUE_DATA.find(r => r.resistanceMin === classeResistanceAuto);
    if (!row || row.dosageCiment === "-") return null;
    const dosageMin = parseFloat(row.dosageCiment);
    if (isNaN(dosageMin)) return null;
    if (cimentVal < dosageMin) {
      return `Le dosage en ciment (${cimentVal} kg/m³) est inférieur au minimum requis (${dosageMin} kg/m³) pour la classe ${classeResistanceAuto}.`;
    }
    return null;
  }, [calcCiment, classeResistanceAuto]);

  const classeRheologiqueAuto = useMemo(() => {
    const s = parseFloat(slumpSouhaite);
    if (isNaN(s) || s < 10) return "";
    if (s <= 40) return "S1 (10-40 mm)";
    if (s <= 90) return "S2 (50-90 mm)";
    if (s <= 150) return "S3 (100-150 mm)";
    if (s <= 210) return "S4 (160-210 mm)";
    return "S5 (≥ 220 mm)";
  }, [slumpSouhaite]);

  // Step 6 - calcul proportions (auto-calculated)

  const { data: clients = [] } = useClients();
  const { data: chantiers = [] } = useChantiers();
  const { data: centrales = [] } = useCentralesBeton();
  const { data: centralesByChantier = [] } = useQuery({
    queryKey: ["centrales_by_chantier_or_client", chantierId, clientId],
    queryFn: async () => {
      // 1) Try centrales linked directly to this chantier
      let list: any[] = [];
      if (chantierId) {
        const { data } = await supabase
          .from("client_centrales")
          .select("centrale_id, centrales_beton:centrale_id(id, nom)")
          .eq("chantier_id", chantierId);
        list = (data || []).map((r: any) => r.centrales_beton).filter(Boolean);
      }
      // 2) Fallback: centrales linked to the client
      if (list.length === 0 && clientId) {
        const { data } = await supabase
          .from("client_centrales")
          .select("centrale_id, centrales_beton:centrale_id(id, nom)")
          .eq("client_id", clientId);
        list = (data || []).map((r: any) => r.centrales_beton).filter(Boolean);
      }
      return Array.from(new Map(list.map((c: any) => [c.id, c])).values());
    },
    enabled: !!chantierId || !!clientId,
  });
  const filteredCentrales = (chantierId || clientId)
    ? ((centralesByChantier as any[]).length > 0 ? centralesByChantier : centrales)
    : centrales;
  const mergedCentrales = useMemo(() => {
    const list = [...(filteredCentrales as any[])];
    const existing = (centrales as any[]).find((c) => c.id === centraleId);
    if (centraleId && existing && !list.some((c: any) => c.id === centraleId)) list.push(existing);
    return list;
  }, [filteredCentrales, centrales, centraleId]);
  const { data: carrieres = [] } = useCarrieres();
  const { data: cimenteries = [] } = useCimenteries();
  const { data: adjuvants = [] } = useAdjuvants();
  const { data: sourcesEau = [] } = useSourcesEau();
  const createFormulation = useCreateFormulation();
  const updateFormulation = useUpdateFormulation();

  // Pre-fill state when editing an existing formulation
  useEffect(() => {
    if (!formulationToEdit || editInitialized.current) return;
    const f: any = formulationToEdit;
    setNom(f.nom || "");
    setClientId(f.client_id || "");
    setChantierId(f.chantier_id || "");
    setCentraleId(f.centrale_id || "");
    setMaitreOuvrageId(f.maitre_ouvrage_id || "");
    setMaitreOeuvreId(f.maitre_oeuvre_id || "");

    setSableConcasseProducteurId(f.sable_concasse_producteur_id || "");
    setSableConcasseProduitId(f.sable_concasse_produit_id || "");
    setSableConcasseQte(f.sable_concasse_quantite != null ? String(f.sable_concasse_quantite) : "");
    setSableFinProducteurId(f.sable_fin_producteur_id || "");
    setSableFinProduitId(f.sable_fin_produit_id || "");
    setSableFinQte(f.sable_fin_quantite != null ? String(f.sable_fin_quantite) : "");
    setGravillons1ProducteurId(f.gravillons1_producteur_id || "");
    setGravillons1ProduitId(f.gravillons1_produit_id || "");
    setGravillons1Qte(f.gravillons1_quantite != null ? String(f.gravillons1_quantite) : "");
    setGravier2ProducteurId(f.gravier2_producteur_id || "");
    setGravier2ProduitId(f.gravier2_produit_id || "");
    setGravier2Qte(f.gravier2_quantite != null ? String(f.gravier2_quantite) : "");
    setGravier3ProducteurId(f.gravier3_producteur_id || "");
    setGravier3ProduitId(f.gravier3_produit_id || "");
    setGravier3Qte(f.gravier3_quantite != null ? String(f.gravier3_quantite) : "");
    setCimentProducteurId(f.ciment_producteur_id || "");
    setCimentProduitId(f.ciment_produit_id || "");
    setCimentQte(f.ciment_quantite != null ? String(f.ciment_quantite) : "");
    setAdjuvantProducteurId(f.adjuvant_producteur_id || "");
    setAdjuvantProduitId(f.adjuvant_produit_id || "");
    setAdjuvantQte(f.adjuvant_quantite != null ? String(f.adjuvant_quantite) : "");
    setEauProducteurId(f.eau_producteur_id || "");
    setEauProduitId(f.eau_produit_id || "");
    setEauQte(f.eau_quantite != null ? String(f.eau_quantite) : "");

    // Activate sections based on the source data (covers duplicate + edit)
    // Phase 8 : actif = producteur ET produit renseignés (la seule règle).
    setSable1Active(!!(f.sable_concasse_producteur_id && f.sable_concasse_produit_id));
    setSable2Active(!!(f.sable_fin_producteur_id && f.sable_fin_produit_id));
    setGravier1Active(!!(f.gravillons1_producteur_id && f.gravillons1_produit_id));
    setGravier2Active(!!(f.gravier2_producteur_id && f.gravier2_produit_id));
    setGravier3Active(!!(f.gravier3_producteur_id && f.gravier3_produit_id));
    setCimentActive(!!(f.ciment_producteur_id && f.ciment_produit_id));
    setAdjuvantActive(!!(f.adjuvant_producteur_id && f.adjuvant_produit_id));
    setEauActive(!!(f.eau_producteur_id && f.eau_produit_id));

    const initialEau = formatNumberInput(f.eau_calculee) || formatNumberInput(f.eau_quantite);
    const initialCiment = formatNumberInput(f.ciment_calcule) || formatNumberInput(f.ciment_quantite);
    const initialRatioGS = formatNumberInput(f.ratio_gs) || deriveRatioGSFromFormulation(f);
    const initialResistance = formatNumberInput(f.resistance_28j) || deriveResistanceFromNameOrCement(f);
    const initialSlump = formatNumberInput(f.slump_souhaite) || "70";
    const initialClasseExposition = f.classe_exposition || "XC1";
    const initialDmax = formatNumberInput(f.dmax_utilisateur) || String(deriveDmaxFromFormulation(f));

    setResistance28j(initialResistance);
    setSlumpSouhaite(initialSlump);
    setClasseExposition(initialClasseExposition);
    setAffaissementCible(initialSlump);
    setResistanceCible(initialResistance);

    setCalcEau(initialEau);
    setCalcCiment(initialCiment);
    setCalcRatioGS(initialRatioGS);
    setCalcAdjuvant(formatNumberInput((f as any).adjuvant_calcule) || "");


    setCoefficientGranulaire(formatNumberInput(f.coefficient_granulaire) || deriveDefaultCoefficientGranulaire(Number(initialDmax)));
    setCoefficientCompacite(formatNumberInput(f.coefficient_compacite) || deriveDefaultCoefficientCompacite(Number(initialDmax)));
    setDmaxUtilisateur(initialDmax);

    setVibrationAE(f.vibration_ae || "normale");
    setFormeAE(f.forme_ae || "concasse");
    setKpAE(f.kp_ae != null ? String(f.kp_ae) : "0");
    const sableMfFallback = (() => {
      const mfRaw = f.granulat_module_finesse;
      if (mfRaw && typeof mfRaw === "object") {
        const candidates = [mfRaw.sableConcasse, mfRaw.sableFin].map(asFiniteNumber).filter((v): v is number => v != null && v > 0);
        if (candidates.length) return candidates.reduce((a, b) => a + b, 0) / candidates.length;
      }
      return 2.5;
    })();
    setMfIdeal(formatNumberInput(f.mf_ideal) || sableMfFallback.toFixed(2));

    if (f.granulat_densites) setGranulatDensites(f.granulat_densites);
    if (f.granulat_module_finesse) setGranulatModuleFinesse(f.granulat_module_finesse);

    editInitialized.current = true;
  }, [formulationToEdit]);

  const { data: maitresOuvrage = [] } = useMaitresOuvrage();
  const { data: maitresOeuvre = [] } = useMaitresOeuvre();

  // Auto-deduce client/chantier from centrale when missing in edit mode
  const autoDeducedRefs = useRef({ clientChantier: false, moa: false, moe: false });
  useEffect(() => {
    if ((!isEdit && !isDuplicating) || !formulationToEdit || !centraleId) return;
    if (autoDeducedRefs.current.clientChantier) return;
    if (clientId && chantierId) { autoDeducedRefs.current.clientChantier = true; return; }
    (async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      let resolvedClient = clientId;
      let resolvedChantier = chantierId;
      // 1) Try client_centrales link
      const { data: cc } = await supabase
        .from("client_centrales")
        .select("client_id, chantier_id")
        .eq("centrale_id", centraleId)
        .limit(1)
        .maybeSingle();
      if (cc) {
        if (!resolvedClient && cc.client_id) resolvedClient = cc.client_id;
        if (!resolvedChantier && cc.chantier_id) resolvedChantier = cc.chantier_id;
      }
      // 2) Fallback: any other formulation on same centrale with populated refs
      if (!resolvedClient || !resolvedChantier) {
        const { data: sibling } = await supabase
          .from("formulations")
          .select("client_id, chantier_id, maitre_ouvrage_id, maitre_oeuvre_id")
          .eq("centrale_id", centraleId)
          .not("client_id", "is", null)
          .limit(1)
          .maybeSingle();
        if (sibling) {
          if (!resolvedClient && sibling.client_id) resolvedClient = sibling.client_id;
          if (!resolvedChantier && sibling.chantier_id) resolvedChantier = sibling.chantier_id;
          if (sibling.maitre_ouvrage_id && !maitreOuvrageId) setMaitreOuvrageId(sibling.maitre_ouvrage_id);
          if (sibling.maitre_oeuvre_id && !maitreOeuvreId) setMaitreOeuvreId(sibling.maitre_oeuvre_id);
        }
      }
      if (resolvedClient && !clientId) setClientId(resolvedClient);
      if (resolvedChantier && !chantierId) setChantierId(resolvedChantier);
      autoDeducedRefs.current.clientChantier = true;
    })();
  }, [isEdit, isDuplicating, formulationToEdit, centraleId, clientId, chantierId, maitreOuvrageId, maitreOeuvreId]);

  // Auto-deduce maître d'ouvrage / maître d'œuvre from client links (with fallback to first available)
  useEffect(() => {
    if ((!isEdit && !isDuplicating) || !clientId) return;
    if (!autoDeducedRefs.current.moa && !maitreOuvrageId) {
      (async () => {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data } = await supabase
          .from("client_maitres_ouvrage")
          .select("maitre_ouvrage_id")
          .eq("client_id", clientId)
          .limit(1)
          .maybeSingle();
        if (data?.maitre_ouvrage_id) {
          setMaitreOuvrageId(data.maitre_ouvrage_id);
        } else if (maitresOuvrage.length > 0) {
          setMaitreOuvrageId(maitresOuvrage[0].id);
        }
        autoDeducedRefs.current.moa = true;
      })();
    }
    if (!autoDeducedRefs.current.moe && !maitreOeuvreId) {
      (async () => {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data } = await supabase
          .from("client_maitres_oeuvre")
          .select("maitre_oeuvre_id")
          .eq("client_id", clientId)
          .limit(1)
          .maybeSingle();
        if (data?.maitre_oeuvre_id) {
          setMaitreOeuvreId(data.maitre_oeuvre_id);
        } else if (maitresOeuvre.length > 0) {
          setMaitreOeuvreId(maitresOeuvre[0].id);
        }
        autoDeducedRefs.current.moe = true;
      })();
    }
  }, [isEdit, isDuplicating, clientId, maitreOuvrageId, maitreOeuvreId, maitresOuvrage, maitresOeuvre]);

  // Resolve product names for labels
  const { data: sable1ProduitsWiz = [] } = useProduits(sableConcasseProducteurId, "carriere");
  const { data: sable2ProduitsWiz = [] } = useProduits(sableFinProducteurId, "carriere");
  const { data: gravier1ProduitsWiz = [] } = useProduits(gravillons1ProducteurId, "carriere");
  const { data: gravier2ProduitsWiz = [] } = useProduits(gravier2ProducteurId, "carriere");
  const { data: gravier3ProduitsWiz = [] } = useProduits(gravier3ProducteurId, "carriere");

  const granulatLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    const s1Name = sable1ProduitsWiz.find((p: any) => p.id === sableConcasseProduitId)?.nom;
    if (s1Name) labels["sableConcasse"] = `Sable ${s1Name}`;
    const s2Name = sable2ProduitsWiz.find((p: any) => p.id === sableFinProduitId)?.nom;
    if (s2Name) labels["sableFin"] = `Sable ${s2Name}`;
    const g1Name = gravier1ProduitsWiz.find((p: any) => p.id === gravillons1ProduitId)?.nom;
    if (g1Name) labels["gravillons1"] = `Gravier ${g1Name}`;
    const g2Name = gravier2ProduitsWiz.find((p: any) => p.id === gravier2ProduitId)?.nom;
    if (g2Name) labels["gravier2"] = `Gravier ${g2Name}`;
    const g3Name = gravier3ProduitsWiz.find((p: any) => p.id === gravier3ProduitId)?.nom;
    if (g3Name) labels["gravier3"] = `Gravier ${g3Name}`;
    return labels;
  }, [sable1ProduitsWiz, sable2ProduitsWiz, gravier1ProduitsWiz, gravier2ProduitsWiz, gravier3ProduitsWiz,
      sableConcasseProduitId, sableFinProduitId, gravillons1ProduitId, gravier2ProduitId, gravier3ProduitId]);

  const clientChantiers = chantierId ? chantiers : chantiers.filter((c: any) => !clientId || c.client_id === clientId);



  // Compute which steps have incomplete mandatory fields (only after user attempted to advance)
  const stepIncomplete = useMemo(() => {
    const incomplete: number[] = [];
    if (wasAttempted(1) && !(nom.trim().length > 0 && centraleId.length > 0 && clientId.length > 0 && chantierId.length > 0)) incomplete.push(1);
    if (wasAttempted(2) && !(calcEau.trim().length > 0 && calcCiment.trim().length > 0 && calcRatioGS.trim().length > 0 && resistance28j.trim().length > 0 && slumpSouhaite.trim().length > 0 && classeExposition.trim().length > 0)) incomplete.push(2);
    if (wasAttempted(5) && !(coefficientGranulaire.trim().length > 0 && coefficientCompacite.trim().length > 0 && dmaxUtilisateur.trim().length > 0)) incomplete.push(5);
    if (wasAttempted(6) && !(vibrationAE.trim().length > 0 && formeAE.trim().length > 0 && kpAE.trim().length > 0 && mfIdeal.trim().length > 0)) incomplete.push(6);
    return incomplete;
  }, [attemptedSteps, nom, centraleId, clientId, chantierId, calcEau, calcCiment, calcRatioGS, resistance28j, slumpSouhaite, classeExposition, coefficientGranulaire, coefficientCompacite, dmaxUtilisateur, vibrationAE, formeAE, kpAE, mfImporteEtape6, mfIdeal]);

  // Merge dynamic incomplete steps with errorSteps from ProportionsStep
  const allErrorSteps = useMemo(() => {
    const merged = new Set([...errorSteps, ...stepIncomplete]);
    return Array.from(merged);
  }, [errorSteps, stepIncomplete]);

  const canGoNext = () => {
    switch (currentStep) {
      case 1: return nom.trim().length > 0 && centraleId.length > 0 && clientId.length > 0 && chantierId.length > 0;
      case 2: return calcEau.trim().length > 0 && calcCiment.trim().length > 0 && calcRatioGS.trim().length > 0 && resistance28j.trim().length > 0 && slumpSouhaite.trim().length > 0 && classeExposition.trim().length > 0;
      case 3: return true;
      case 4: return true;
      case 5: return coefficientGranulaire.trim().length > 0 && coefficientCompacite.trim().length > 0 && dmaxUtilisateur.trim().length > 0;
      case 6: return vibrationAE.trim().length > 0 && formeAE.trim().length > 0 && kpAE.trim().length > 0 && mfIdeal.trim().length > 0;
      case 7: return true;
      case 8: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (!canGoNext()) {
      setAttemptedSteps(prev => new Set(prev).add(currentStep));
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    if (currentStep < 8) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!centraleId || !nom.trim()) {
      toast.error("Veuillez remplir les informations requises");
      return;
    }

    const payload = {
      centrale_id: centraleId,
      nom: nom.trim(),
      sable_concasse_producteur_id: sableConcasseProducteurId || null,
      sable_concasse_produit_id: sableConcasseProduitId || null,
      sable_concasse_quantite: sableConcasseQte ? parseFloat(sableConcasseQte) : null,
      sable_fin_producteur_id: sableFinProducteurId || null,
      sable_fin_produit_id: sableFinProduitId || null,
      sable_fin_quantite: sableFinQte ? parseFloat(sableFinQte) : null,
      gravillons1_producteur_id: gravillons1ProducteurId || null,
      gravillons1_produit_id: gravillons1ProduitId || null,
      gravillons1_quantite: gravillons1Qte ? parseFloat(gravillons1Qte) : null,
      gravier2_producteur_id: gravier2ProducteurId || null,
      gravier2_produit_id: gravier2ProduitId || null,
      gravier2_quantite: gravier2Qte ? parseFloat(gravier2Qte) : null,
      gravier3_producteur_id: gravier3ProducteurId || null,
      gravier3_produit_id: gravier3ProduitId || null,
      gravier3_quantite: gravier3Qte ? parseFloat(gravier3Qte) : null,
      ciment_producteur_id: cimentProducteurId || null,
      ciment_produit_id: cimentProduitId || null,
      ciment_quantite: cimentQte ? parseFloat(cimentQte) : null,
      adjuvant_producteur_id: adjuvantProducteurId || null,
      adjuvant_produit_id: adjuvantProduitId || null,
      adjuvant_quantite: adjuvantQte ? parseFloat(adjuvantQte) : null,
      eau_producteur_id: eauProducteurId || null,
      eau_produit_id: eauProduitId || null,
      eau_quantite: eauQte ? parseFloat(eauQte) : null,
      client_id: clientId || null,
      chantier_id: chantierId || null,
      maitre_ouvrage_id: maitreOuvrageId || null,
      maitre_oeuvre_id: maitreOeuvreId || null,
      resistance_28j: resistance28j ? parseFloat(resistance28j) : null,
      slump_souhaite: slumpSouhaite ? parseFloat(slumpSouhaite) : null,
      classe_exposition: classeExposition || null,
      eau_calculee: calcEau ? parseFloat(calcEau) : null,
      ciment_calcule: calcCiment ? parseFloat(calcCiment) : null,
      ratio_gs: calcRatioGS ? parseFloat(calcRatioGS) : null,
      adjuvant_calcule: calcAdjuvant ? parseFloat(calcAdjuvant) : null,
      coefficient_granulaire: coefficientGranulaire ? parseFloat(coefficientGranulaire) : null,
      coefficient_compacite: coefficientCompacite ? parseFloat(coefficientCompacite) : null,
      dmax_utilisateur: dmaxUtilisateur ? parseFloat(dmaxUtilisateur) : null,
      vibration_ae: vibrationAE || null,
      forme_ae: formeAE || null,
      kp_ae: kpAE ? parseFloat(kpAE) : null,
      mf_ideal: mfIdeal ? parseFloat(mfIdeal) : null,
      granulat_densites: Object.keys(granulatDensites).length > 0 ? granulatDensites : null,
      granulat_module_finesse: Object.keys(granulatModuleFinesse).length > 0 ? granulatModuleFinesse : null,
    };

    try {
      if (isEdit && formulationId) {
        await updateFormulation.mutateAsync({ id: formulationId, ...payload });
        toast.success("Formulation modifiée avec succès");
      } else {
        await createFormulation.mutateAsync(payload);
        toast.success("Formulation créée avec succès");
      }
      navigate("/essais/beton/formulation");
    } catch {
      toast.error(isEdit ? "Erreur lors de la modification" : "Erreur lors de la création");
    }
  };


  // Block UI in edit mode until the formulation is loaded so all fields can be pre-filled
  if ((isEdit || isDuplicating) && (isLoadingFormulation || (!formulationToEdit && !formulationError))) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Chargement de la formulation…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <EssaiBreadcrumb items={[
        { label: "Béton", path: "/essais/beton" },
        { label: "Formulation", path: "/essais/beton/formulation" },
        { label: isEdit ? "Modifier l'étude" : "Nouvelle formulation de béton" },
      ]} />

      <div className="flex items-center gap-4">
        <BackButton to="/essais/beton/formulation" />
        <h1 className="text-3xl font-display font-bold text-foreground">
          {isEdit ? <>Modifier l'<span className="text-primary text-glow">étude de formulation</span></> : <>Nouvelle <span className="text-primary text-glow">Formulation de Béton</span></>}
        </h1>
      </div>

      <Stepper currentStep={currentStep} onStepClick={(step) => { setCurrentStep(step); window.scrollTo({ top: 0, behavior: 'smooth' }); }} errorSteps={allErrorSteps} />

      {/* Step 1 */}
      <div className={currentStep === 1 ? "" : "hidden"}>
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6 space-y-5">
          <h2 className="text-lg font-semibold text-foreground">Informations générales</h2>
            <p className="text-xs text-muted-foreground">Les champs marqués d'un astérisque sont obligatoires <span className="text-destructive">*</span></p>
            <div className="space-y-2">
              <Label>Nom de la formulation <span className="text-destructive">*</span></Label>
              <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="ex: Béton C25/30 pour fondations" className={cn("bg-secondary border-border", wasAttempted(1) && nom.trim().length === 0 && "animate-border-blink")} />
            </div>
            <div className="space-y-2">
              <Label>Nom de l'entreprise <span className="text-destructive">*</span></Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className={cn("bg-secondary border-border", wasAttempted(1) && clientId.length === 0 && "animate-border-blink")}><SelectValue placeholder="Sélectionnez une entreprise" /></SelectTrigger>
                <SelectContent>{clients.map((c: any) => (<SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Chantier <span className="text-destructive">*</span></Label>
              <Select value={chantierId} onValueChange={(v) => { setChantierId(v); setCentraleId(""); }}>
                <SelectTrigger className={cn("bg-secondary border-border", wasAttempted(1) && chantierId.length === 0 && "animate-border-blink")}><SelectValue placeholder="Sélectionnez un chantier" /></SelectTrigger>
                <SelectContent>{clientChantiers.map((c: any) => (<SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Centrale à béton <span className="text-destructive">*</span></Label>
              <Select value={centraleId} onValueChange={setCentraleId} disabled={!chantierId}>
                <SelectTrigger className={cn("bg-secondary border-border", wasAttempted(1) && centraleId.length === 0 && "animate-border-blink")}><SelectValue placeholder={chantierId ? "Sélectionnez une centrale" : "Sélectionnez d'abord un chantier"} /></SelectTrigger>
                <SelectContent>
                  {mergedCentrales.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">Aucune centrale liée à ce chantier</div>
                  ) : mergedCentrales.map((c: any) => (<SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Maître d'ouvrage</Label>
              <Select value={maitreOuvrageId} onValueChange={setMaitreOuvrageId}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Sélectionnez un maître d'ouvrage" /></SelectTrigger>
                <SelectContent>{maitresOuvrage.map((m: any) => (<SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Maître d'œuvre</Label>
              <Select value={maitreOeuvreId} onValueChange={setMaitreOeuvreId}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Sélectionnez un maître d'œuvre" /></SelectTrigger>
                <SelectContent>{maitresOeuvre.map((m: any) => (<SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Step 2 */}
      <div className={currentStep === 2 ? "" : "hidden"}>
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6 space-y-5">
            <h2 className="text-lg font-semibold text-foreground">Données de base</h2>
            <p className="text-xs text-muted-foreground">Tous les champs sont obligatoires <span className="text-destructive">*</span></p>

            <h3 className="text-md font-semibold text-foreground">Paramètres de formulation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Eau (kg/m³) <span className="text-destructive">*</span></Label>
                <Input
                  type="number" step="1" min="0"
                  value={calcEau}
                  onChange={(e) => setCalcEau(e.target.value)}
                  placeholder="ex: 185"
                  className={cn("bg-secondary border-border", wasAttempted(2) && !calcEau.trim() && "animate-border-blink")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Ciment (kg/m³) <span className="text-destructive">*</span></Label>
                <Input
                  type="number" step="1" min="0"
                  value={calcCiment}
                  onChange={(e) => setCalcCiment(e.target.value)}
                  placeholder="ex: 350"
                  className={cn("bg-secondary border-border", wasAttempted(2) && !calcCiment.trim() && "animate-border-blink")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Rapport G/S <span className="text-destructive">*</span></Label>
                <Input
                  type="number" step="0.1" min="0.1"
                  value={calcRatioGS}
                  onChange={(e) => setCalcRatioGS(e.target.value)}
                  placeholder="ex: 1.8"
                  className={cn("bg-secondary border-border", wasAttempted(2) && !calcRatioGS.trim() && "animate-border-blink")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Adjuvant (L/m³)</Label>
                <Input
                  type="number" step="0.1" min="0"
                  value={calcAdjuvant}
                  onChange={(e) => setCalcAdjuvant(e.target.value)}
                  placeholder="ex: 3.5"
                  className="bg-secondary border-border"
                />
              </div>
              {cimentWarning && (
                <div className="col-span-full flex items-start gap-2 p-3 rounded-md border border-amber-500/50 bg-amber-500/10 text-sm text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{cimentWarning}</span>
                </div>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Résistance souhaitée à 28 j <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input type="number" step="0.1" min="0" value={resistance28j} onChange={(e) => setResistance28j(e.target.value)} placeholder="0.0" className={cn("bg-secondary border-border pr-14", wasAttempted(2) && !resistance28j.trim() && "animate-border-blink")} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">MPa</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Classe de résistance</Label>
                <Input value={classeResistanceAuto} readOnly placeholder="—" className="bg-muted border-border cursor-default" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Slump souhaité <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input type="number" step="1" min="0" value={slumpSouhaite} onChange={(e) => setSlumpSouhaite(e.target.value)} placeholder="0" className={cn("bg-secondary border-border pr-14", wasAttempted(2) && !slumpSouhaite.trim() && "animate-border-blink")} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">mm</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Classe rhéologique</Label>
                <Input value={classeRheologiqueAuto} readOnly placeholder="—" className="bg-muted border-border cursor-default" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div className="space-y-1.5">
                <Label className="text-sm">Classe d'exposition <span className="text-destructive">*</span></Label>
                <Input value={classeExposition} readOnly placeholder="Sélectionnez depuis l'abaque" className={cn("bg-muted border-border cursor-default", !classeExposition.trim() && "animate-border-blink")} />
              </div>
              <Button variant="outline" className="gap-2 w-fit" type="button" onClick={() => setShowAbaque(true)}>
                <BarChart3 className="w-4 h-4" />
                Voir abaque
              </Button>
            </div>
            <Dialog open={showAbaque} onOpenChange={setShowAbaque}>
              <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg">Abaque des classes d'exposition — EN 206</DialogTitle>
                </DialogHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border p-2 text-left">Classe</th>
                        <th className="border border-border p-2 text-left">Désignation</th>
                        <th className="border border-border p-2 text-center">E/C max</th>
                        <th className="border border-border p-2 text-center">Résistance min (MPa)</th>
                        <th className="border border-border p-2 text-center">Dosage ciment min (kg/m³)</th>
                        <th className="border border-border p-2 text-center">Teneur air (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ABAQUE_DATA.map((row, i) => (
                        <tr key={row.classe} className={cn("cursor-pointer transition-colors hover:bg-primary/10", classeExposition === row.classe && "bg-primary/20 font-medium", i % 2 === 0 ? "bg-card" : "bg-muted/30")} onClick={() => { setClasseExposition(row.classe); setShowAbaque(false); }}>
                          <td className="border border-border p-2 font-semibold">{row.classe}</td>
                          <td className="border border-border p-2">{row.designation}</td>
                          <td className="border border-border p-2 text-center">{row.ecMax}</td>
                          <td className="border border-border p-2 text-center">{row.resistanceMin}</td>
                          <td className="border border-border p-2 text-center">{row.dosageCiment}</td>
                          <td className="border border-border p-2 text-center">{row.teneurAir}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Cliquez sur une ligne pour sélectionner la classe d'exposition</p>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Step 3 */}
      <div className={currentStep === 3 ? "" : "hidden"}>
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Information matériaux</h2>
            {(() => {
              const allProduitIds = [
                sableConcasseProduitId, sableFinProduitId, gravillons1ProduitId,
                gravier2ProduitId, gravier3ProduitId, cimentProduitId, adjuvantProduitId, eauProduitId
              ].filter(Boolean);
              const getOtherIds = (currentId: string) => allProduitIds.filter(id => id && id !== currentId);
              return null;
            })()}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <IngredientCard label="Sable 1" producteurLabel="Carrière" active={sable1Active} onToggle={setSable1Active} producteurType="carriere" producteurs={carrieres} selectedProducteurId={sableConcasseProducteurId} selectedProduitId={sableConcasseProduitId} onProducteurChange={setSableConcasseProducteurId} onProduitChange={setSableConcasseProduitId} quantite={sableConcasseQte} onQuantiteChange={setSableConcasseQte} showError={errorSteps.includes(3)} expectedMaterialType="sable" allSelectedProduitIds={[sableFinProduitId, gravillons1ProduitId, gravier2ProduitId, gravier3ProduitId, cimentProduitId, adjuvantProduitId, eauProduitId].filter(Boolean)} />
              <IngredientCard label="Sable 2" producteurLabel="Carrière" active={sable2Active} onToggle={setSable2Active} producteurType="carriere" producteurs={carrieres} selectedProducteurId={sableFinProducteurId} selectedProduitId={sableFinProduitId} onProducteurChange={setSableFinProducteurId} onProduitChange={setSableFinProduitId} quantite={sableFinQte} onQuantiteChange={setSableFinQte} showError={errorSteps.includes(3)} expectedMaterialType="sable" allSelectedProduitIds={[sableConcasseProduitId, gravillons1ProduitId, gravier2ProduitId, gravier3ProduitId, cimentProduitId, adjuvantProduitId, eauProduitId].filter(Boolean)} />
              <IngredientCard label="Gravier 1" producteurLabel="Carrière" active={gravier1Active} onToggle={setGravier1Active} producteurType="carriere" producteurs={carrieres} selectedProducteurId={gravillons1ProducteurId} selectedProduitId={gravillons1ProduitId} onProducteurChange={setGravillons1ProducteurId} onProduitChange={setGravillons1ProduitId} quantite={gravillons1Qte} onQuantiteChange={setGravillons1Qte} showError={errorSteps.includes(3)} expectedMaterialType="gravier" allSelectedProduitIds={[sableConcasseProduitId, sableFinProduitId, gravier2ProduitId, gravier3ProduitId, cimentProduitId, adjuvantProduitId, eauProduitId].filter(Boolean)} />
              <IngredientCard label="Gravier 2" producteurLabel="Carrière" active={gravier2Active} onToggle={setGravier2Active} producteurType="carriere" producteurs={carrieres} selectedProducteurId={gravier2ProducteurId} selectedProduitId={gravier2ProduitId} onProducteurChange={setGravier2ProducteurId} onProduitChange={setGravier2ProduitId} quantite={gravier2Qte} onQuantiteChange={setGravier2Qte} showError={errorSteps.includes(3)} expectedMaterialType="gravier" allSelectedProduitIds={[sableConcasseProduitId, sableFinProduitId, gravillons1ProduitId, gravier3ProduitId, cimentProduitId, adjuvantProduitId, eauProduitId].filter(Boolean)} />
              <IngredientCard label="Gravier 3" producteurLabel="Carrière" active={gravier3Active} onToggle={setGravier3Active} producteurType="carriere" producteurs={carrieres} selectedProducteurId={gravier3ProducteurId} selectedProduitId={gravier3ProduitId} onProducteurChange={setGravier3ProducteurId} onProduitChange={setGravier3ProduitId} quantite={gravier3Qte} onQuantiteChange={setGravier3Qte} showError={errorSteps.includes(3)} expectedMaterialType="gravier" allSelectedProduitIds={[sableConcasseProduitId, sableFinProduitId, gravillons1ProduitId, gravier2ProduitId, cimentProduitId, adjuvantProduitId, eauProduitId].filter(Boolean)} />
              <IngredientCard label="Ciment" producteurLabel="Cimenterie" active={cimentActive} onToggle={setCimentActive} producteurType="cimenterie" producteurs={cimenteries} selectedProducteurId={cimentProducteurId} selectedProduitId={cimentProduitId} onProducteurChange={setCimentProducteurId} onProduitChange={setCimentProduitId} quantite={cimentQte} onQuantiteChange={setCimentQte} showError={errorSteps.includes(3)} allSelectedProduitIds={[sableConcasseProduitId, sableFinProduitId, gravillons1ProduitId, gravier2ProduitId, gravier3ProduitId, adjuvantProduitId, eauProduitId].filter(Boolean)} />
              <IngredientCard label="Adjuvant" producteurLabel="Fournisseur" active={adjuvantActive} onToggle={setAdjuvantActive} producteurType="adjuvant" producteurs={adjuvants} selectedProducteurId={adjuvantProducteurId} selectedProduitId={adjuvantProduitId} onProducteurChange={setAdjuvantProducteurId} onProduitChange={setAdjuvantProduitId} quantite={adjuvantQte} onQuantiteChange={setAdjuvantQte} showError={errorSteps.includes(3)} allSelectedProduitIds={[sableConcasseProduitId, sableFinProduitId, gravillons1ProduitId, gravier2ProduitId, gravier3ProduitId, cimentProduitId, eauProduitId].filter(Boolean)} />
              <IngredientCard label="Eau" producteurLabel="Source d'eau" active={eauActive} onToggle={setEauActive} producteurType="source_eau" producteurs={sourcesEau} selectedProducteurId={eauProducteurId} selectedProduitId={eauProduitId} onProducteurChange={setEauProducteurId} onProduitChange={setEauProduitId} quantite={eauQte} onQuantiteChange={setEauQte} quantiteUnit="L" showError={errorSteps.includes(3)} allSelectedProduitIds={[sableConcasseProduitId, sableFinProduitId, gravillons1ProduitId, gravier2ProduitId, gravier3ProduitId, cimentProduitId, adjuvantProduitId].filter(Boolean)} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Step 4 - Essai */}
      <div className={currentStep === 4 ? "" : "hidden"}>
        <EssaiStep
          sable1Active={sable1Active} sable2Active={sable2Active} gravier1Active={gravier1Active} gravier2Active={gravier2Active} gravier3Active={gravier3Active} cimentActive={cimentActive} eauActive={eauActive}
          sable1ProducteurId={sableConcasseProducteurId} sable1ProduitId={sableConcasseProduitId} sable2ProducteurId={sableFinProducteurId} sable2ProduitId={sableFinProduitId}
          gravier1ProducteurId={gravillons1ProducteurId} gravier1ProduitId={gravillons1ProduitId} gravier2ProducteurId={gravier2ProducteurId} gravier2ProduitId={gravier2ProduitId}
          gravier3ProducteurId={gravier3ProducteurId} gravier3ProduitId={gravier3ProduitId} cimentProducteurId={cimentProducteurId} cimentProduitId={cimentProduitId}
          eauProducteurId={eauProducteurId} eauProduitId={eauProduitId} carrieres={carrieres} cimenteries={cimenteries} sourcesEau={sourcesEau}
          showError={errorSteps.includes(4)}
          onDensityExtracted={handleDensityExtracted}
          onModuleFinesseExtracted={handleModuleFinesseExtracted}
          onCurveExtracted={handleCurveExtracted}
        />
      </div>

      {/* Step 5 - Coefficients */}
      <div className={currentStep === 5 ? "" : "hidden"}>
        <CoefficientStep
          coefficientGranulaire={coefficientGranulaire}
          onCoefficientGranulaireChange={setCoefficientGranulaire}
          coefficientCompacite={coefficientCompacite}
          onCoefficientCompaciteChange={setCoefficientCompacite}
          dmaxValue={dmaxUtilisateur}
          onDmaxChange={setDmaxUtilisateur}
          showError={allErrorSteps.includes(5)}
        />
      </div>

      {/* Step 6 - Calcul A et E */}
      <div className={currentStep === 6 ? "" : "hidden"}>
        <PointAEStep
          dmax={dmaxUtilisateur ? parseFloat(dmaxUtilisateur) : null}
          mfMelange={mfImporteEtape6}
          mfSable1={granulatModuleFinesse.sableConcasse ?? null}
          mfSable2={granulatModuleFinesse.sableFin ?? null}
          mfIdeal={mfIdeal}
          onMfIdealChange={setMfIdeal}
          dosageCiment={calcCiment}
          showError={allErrorSteps.includes(6)}
          /* Phase 6 : onPointAChange retiré — PointAEStep reste informatif seul, calcResult.pointA fait autorité. */
          vibrationValue={vibrationAE}
          onVibrationChange={setVibrationAE}
          formeValue={formeAE}
          onFormeChange={setFormeAE}
          kpValue={kpAE}
          onKpChange={setKpAE}
        />
      </div>

      {/* Step 7 - Calcul proportions */}
      <div className={currentStep === 7 ? "" : "hidden"}>
        <ProportionsStep
          sableConcasseQte={sableConcasseQte} sableFinQte={sableFinQte} gravillons1Qte={gravillons1Qte} gravier2Qte={gravier2Qte} gravier3Qte={gravier3Qte}
          cimentQte={cimentQte} adjuvantQte={adjuvantQte} eauQte={eauQte}
          sable1Active={sable1Active} sable2Active={sable2Active} gravier1Active={gravier1Active} gravier2Active={gravier2Active} gravier3Active={gravier3Active}
          coefficientGranulaire={coefficientGranulaire} coefficientCompacite={coefficientCompacite} classeRheologique={classeRheologiqueAuto}
          granulatDensites={granulatDensites}
          granulatModuleFinesse={granulatModuleFinesse}
          granulatCurveByKey={granulatCurves}
          granulatLabels={granulatLabels}
          mfMelangeStocke={mfIdeal ? parseFloat(mfIdeal) || null : null}
          dMaxUser={dmaxUtilisateur ? parseFloat(dmaxUtilisateur) : null}
          calcEau={calcEau}
          calcCiment={calcCiment}
          calcRatioGS={calcRatioGS}
          calcAdjuvant={calcAdjuvant}
          onStepErrors={setErrorSteps}
          onMfCorrectionNeeded={setMfCorrectionNeeded}
          validationData={{
            resistance28j,
            slumpSouhaite,
            classeExposition,
            coefficientGranulaire,
            coefficientCompacite,
            // Minimum materials: at least 1 sable, 1 gravier, ciment, eau must be active
            minimumMaterialsValid: (() => {
              const hasAnySable = (sable1Active && !!sableConcasseProducteurId && !!sableConcasseProduitId) || (sable2Active && !!sableFinProducteurId && !!sableFinProduitId);
              const hasAnyGravier = (gravier1Active && !!gravillons1ProducteurId && !!gravillons1ProduitId) || (gravier2Active && !!gravier2ProducteurId && !!gravier2ProduitId) || (gravier3Active && !!gravier3ProducteurId && !!gravier3ProduitId);
              const hasCiment = cimentActive && !!cimentProducteurId && !!cimentProduitId;
              const hasEau = eauActive && !!eauProducteurId && !!eauProduitId;
              return hasAnySable && hasAnyGravier && hasCiment && hasEau;
            })(),
            minimumMaterialsMissing: (() => {
              const missing: string[] = [];
              const hasAnySable = (sable1Active && !!sableConcasseProducteurId && !!sableConcasseProduitId) || (sable2Active && !!sableFinProducteurId && !!sableFinProduitId);
              const hasAnyGravier = (gravier1Active && !!gravillons1ProducteurId && !!gravillons1ProduitId) || (gravier2Active && !!gravier2ProducteurId && !!gravier2ProduitId) || (gravier3Active && !!gravier3ProducteurId && !!gravier3ProduitId);
              const hasCiment = cimentActive && !!cimentProducteurId && !!cimentProduitId;
              const hasEau = eauActive && !!eauProducteurId && !!eauProduitId;
              if (!hasAnySable) missing.push("Au moins 1 Sable actif avec carrière et produit");
              if (!hasAnyGravier) missing.push("Au moins 1 Gravier actif avec carrière et produit");
              if (!hasCiment) missing.push("Ciment actif avec cimenterie et produit");
              if (!hasEau) missing.push("Eau active avec source et produit");
              return missing;
            })(),
            materialsValid: (() => {
              const activeItems = [
                { active: sable1Active, hasData: !!sableConcasseProducteurId && !!sableConcasseProduitId, label: "Sable 1" },
                { active: sable2Active, hasData: !!sableFinProducteurId && !!sableFinProduitId, label: "Sable 2" },
                { active: gravier1Active, hasData: !!gravillons1ProducteurId && !!gravillons1ProduitId, label: "Gravier 1" },
                { active: gravier2Active, hasData: !!gravier2ProducteurId && !!gravier2ProduitId, label: "Gravier 2" },
                { active: gravier3Active, hasData: !!gravier3ProducteurId && !!gravier3ProduitId, label: "Gravier 3" },
                { active: cimentActive, hasData: !!cimentProducteurId && !!cimentProduitId, label: "Ciment" },
                { active: eauActive, hasData: !!eauProducteurId && !!eauProduitId, label: "Eau" },
              ];
              return activeItems.filter(i => i.active && !i.hasData).length === 0;
            })(),
            missingMaterials: (() => {
              const activeItems = [
                { active: sable1Active, hasData: !!sableConcasseProducteurId && !!sableConcasseProduitId, label: "Sable 1" },
                { active: sable2Active, hasData: !!sableFinProducteurId && !!sableFinProduitId, label: "Sable 2" },
                { active: gravier1Active, hasData: !!gravillons1ProducteurId && !!gravillons1ProduitId, label: "Gravier 1" },
                { active: gravier2Active, hasData: !!gravier2ProducteurId && !!gravier2ProduitId, label: "Gravier 2" },
                { active: gravier3Active, hasData: !!gravier3ProducteurId && !!gravier3ProduitId, label: "Gravier 3" },
                { active: cimentActive, hasData: !!cimentProducteurId && !!cimentProduitId, label: "Ciment" },
                { active: eauActive, hasData: !!eauProducteurId && !!eauProduitId, label: "Eau" },
              ];
              return activeItems.filter(i => i.active && !i.hasData).map(i => `${i.label} (Producteur / Produit)`);
            })(),
            // Step 5 - Essais: check that active granulats have producteur+produit configured
            essaisValid: (() => {
              const granulatsConfigured = [
                { active: sable1Active, hasData: !!sableConcasseProducteurId && !!sableConcasseProduitId, label: "Sable 1" },
                { active: sable2Active, hasData: !!sableFinProducteurId && !!sableFinProduitId, label: "Sable 2" },
                { active: gravier1Active, hasData: !!gravillons1ProducteurId && !!gravillons1ProduitId, label: "Gravier 1" },
                { active: gravier2Active, hasData: !!gravier2ProducteurId && !!gravier2ProduitId, label: "Gravier 2" },
                { active: gravier3Active, hasData: !!gravier3ProducteurId && !!gravier3ProduitId, label: "Gravier 3" },
              ];
              const cimentConfigured = cimentActive && !!cimentProducteurId && !!cimentProduitId;
              const eauConfigured = eauActive && !!eauProducteurId && !!eauProduitId;
              const activeGranulats = granulatsConfigured.filter(g => g.active);
              const allGranulatsConfigured = activeGranulats.every(g => g.hasData);
              return allGranulatsConfigured && cimentConfigured && eauConfigured;
            })(),
            essaisMissing: (() => {
              const missing: string[] = [];
              const granulatsConfigured = [
                { active: sable1Active, hasData: !!sableConcasseProducteurId && !!sableConcasseProduitId, label: "Sable 1" },
                { active: sable2Active, hasData: !!sableFinProducteurId && !!sableFinProduitId, label: "Sable 2" },
                { active: gravier1Active, hasData: !!gravillons1ProducteurId && !!gravillons1ProduitId, label: "Gravier 1" },
                { active: gravier2Active, hasData: !!gravier2ProducteurId && !!gravier2ProduitId, label: "Gravier 2" },
                { active: gravier3Active, hasData: !!gravier3ProducteurId && !!gravier3ProduitId, label: "Gravier 3" },
              ];
              granulatsConfigured.filter(g => g.active && !g.hasData).forEach(g => missing.push(`${g.label} — carrière/produit non configuré`));
              if (!(cimentActive && !!cimentProducteurId && !!cimentProduitId)) missing.push("Ciment — cimenterie/produit non configuré");
              if (!(eauActive && !!eauProducteurId && !!eauProduitId)) missing.push("Eau — source/produit non configuré");
              return missing;
            })(),
          }}
          onQuantityChange={(key, value) => {
            const setters: Record<string, (v: string) => void> = {
              sableConcasse: setSableConcasseQte,
              sableFin: setSableFinQte,
              gravillons1: setGravillons1Qte,
              gravier2: setGravier2Qte,
              gravier3: setGravier3Qte,
              ciment: setCimentQte,
              eau: setEauQte,
            };
            setters[key]?.(value);
          }}
        />
      </div>

      {/* Step 8 - Essai de convenance */}
      <div className={currentStep === 8 ? "" : "hidden"}>
        <ConvenanceStep formulationId={formulationId} clientId={clientId} chantierId={chantierId} />
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 1}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Précédent
        </Button>

        {currentStep < 7 ? (
          <Button
            onClick={handleNext}
            disabled={!canGoNext()}
            className="gap-2 gradient-primary text-primary-foreground"
          >
            Suivant
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : currentStep === 7 ? (
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={createFormulation.isPending || updateFormulation.isPending}
              className="gap-2 gradient-primary text-primary-foreground"
            >
              {isEdit
                ? (updateFormulation.isPending ? "Modification..." : "Enregistrer les modifications")
                : (createFormulation.isPending ? "Création..." : "Créer la formulation")}
            </Button>
            <Button
              variant="outline"
              onClick={handleNext}
              className="gap-2"
            >
              Suivant
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => navigate("/essais/beton/formulation")}
            className="gap-2"
          >
            Terminer
          </Button>
        )}
      </div>
    </div>
  );
}
