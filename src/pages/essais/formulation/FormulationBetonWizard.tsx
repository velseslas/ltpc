import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import CoefficientStep from "./CoefficientStep";
import { useClients } from "@/hooks/useClients";
import { useChantiers } from "@/hooks/useChantiers";
import { useCentralesBeton } from "@/hooks/useCentralesBeton";
import { useCarrieres } from "@/hooks/useCarrieres";
import { useCimenteries } from "@/hooks/useCimenteries";
import { useAdjuvants } from "@/hooks/useAdjuvants";
import { useSourcesEau } from "@/hooks/useSourcesEau";
import { useProduits } from "@/hooks/useProduits";
import { useCreateFormulation } from "@/hooks/useFormulations";
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
  { nom: "Équivalent de Sable", table: "echantillons_equivalent_sable" as const, filter: "sable" as const, essaiType: "equivalent-sable", basePath: "/essais/granulat/proprete/equivalent-sable" },
  { nom: "Valeur au Bleu de Méthylène", table: "echantillons_bleu_methylene" as const, filter: "sable" as const, essaiType: "bleu-methylene", basePath: "/essais/granulat/proprete/bleu-methylene" },
  { nom: "Matière Organique", table: "echantillons_matiere_organique" as const, filter: "sable" as const, essaiType: "matiere-organique", basePath: "/essais/granulat/proprete/matiere-organique" },
  { nom: "Masse Volumique", table: "echantillons_masse_volumique" as const, filter: "all" as const, essaiType: "masse-volumique", basePath: "/essais/granulat/physiques/masse-volumique" },
  { nom: "Los Angeles", table: "echantillons_los_angeles" as const, filter: "gravier" as const, essaiType: "los-angeles", basePath: "/essais/granulat/mecaniques/los-angeles" },
  { nom: "Micro-Deval", table: "echantillons_micro_deval" as const, filter: "gravier" as const, essaiType: "micro-deval", basePath: "/essais/granulat/mecaniques/micro-deval" },
  { nom: "Coefficient d'Aplatissement", table: "echantillons_forme_granulats" as const, filter: "gravier" as const, essaiType: "forme-granulats", basePath: "/essais/granulat/physiques/forme-granulats" },
  { nom: "Coefficient d'Écrasement", table: "echantillons_ecrasement" as const, filter: "gravier" as const, essaiType: "ecrasement", basePath: "/essais/granulat/mecaniques/ecrasement" },
  { nom: "Friabilité", table: "echantillons_friabilite" as const, filter: "sable" as const, essaiType: "friabilite", basePath: "/essais/granulat/mecaniques/friabilite" },
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

function GranulatEssaiRow({ essaiNom, table, carriereId, produitNom, carriereNom, essaiType, essaiTitle, basePath, granulatKey, onDensityExtracted, onModuleFinesseExtracted }: {
  essaiNom: string; table: GranulatTable; carriereId: string; produitNom: string; carriereNom: string; essaiType: string; essaiTitle: string; basePath: string;
  granulatKey?: string;
  onDensityExtracted?: (key: string, density: number) => void;
  onModuleFinesseExtracted?: (key: string, moduleFinesse: number) => void;
}) {
  const { data: samples = [] } = useGranulatSamples(table, carriereId);
  const filtered = samples.filter((s: any) => s.produit === produitNom);
  const [selectedRapport, setSelectedRapport] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMsg, setDialogMsg] = useState("");
  const [dialogType, setDialogType] = useState<"warning" | "info">("info");
  const [showRapport, setShowRapport] = useState(false);

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
            <p>Opérateur: {echantillon.intervenants ? `${echantillon.intervenants.prenom} ${echantillon.intervenants.nom}` : "-"}</p>
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
                      />
                    ))}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}

      {/* Ciment */}
      {cimentActive && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
         <CardContent className="p-6 space-y-5">
            <h2 className="text-lg font-bold text-foreground">Essais sur le Ciment</h2>
            {cimentProducteurId && cimentProduitId ? (
              <>
                <h3 className="text-sm font-semibold text-primary">
                  Ciment ({cimentProduitNom}) — {cimentProducteurNom}
                </h3>
                <Separator className="bg-border/50" />
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-muted/10">
                  
                  <Select><SelectTrigger className="bg-secondary border-border flex-1"><SelectValue placeholder="Résistance du Ciment" /></SelectTrigger>
                    <SelectContent><SelectItem value="__none" disabled>Aucun rapport disponible</SelectItem></SelectContent></Select>
                  <Button variant="outline" size="sm" className="text-xs border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50 whitespace-nowrap" onClick={() => setStaticDialogOpen(true)}>Rapport</Button>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-muted/10">
                  
                  <Select><SelectTrigger className="bg-secondary border-border flex-1"><SelectValue placeholder="Temps de Prise" /></SelectTrigger>
                    <SelectContent><SelectItem value="__none" disabled>Aucun rapport disponible</SelectItem></SelectContent></Select>
                  <Button variant="outline" size="sm" className="text-xs border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50 whitespace-nowrap" onClick={() => setStaticDialogOpen(true)}>Rapport</Button>
                </div>
              </>
            ) : (
              <p className="text-xs italic p-3 text-muted-foreground">Veuillez sélectionner une cimenterie et un produit à l'étape 3.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Eau */}
      {eauActive && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6 space-y-5">
            <h2 className="text-lg font-bold text-foreground">Essais sur l'Eau</h2>
            {eauProducteurId && eauProduitId ? (
              <>
                <h3 className="text-sm font-semibold text-primary">
                  Eau ({eauProduitNom}) — {eauProducteurNom}
                </h3>
                <Separator className="bg-border/50" />
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-muted/10">
                  
                  <Select><SelectTrigger className="bg-secondary border-border flex-1"><SelectValue placeholder="Analyse Chimique de l'Eau" /></SelectTrigger>
                    <SelectContent><SelectItem value="__none" disabled>Aucun rapport disponible</SelectItem></SelectContent></Select>
                  <Button variant="outline" size="sm" className="text-xs border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50 whitespace-nowrap" onClick={() => setStaticDialogOpen(true)}>Rapport</Button>
                </div>
              </>
            ) : (
              <p className="text-xs italic p-3 text-muted-foreground">Veuillez sélectionner une source d'eau et un produit à l'étape 3.</p>
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
  const [currentStep, setCurrentStep] = useState(1);
  const [errorSteps, setErrorSteps] = useState<number[]>([]);
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
  const [pointACoords, setPointACoords] = useState<{ xA: number; yA: number } | null>(null);

  // Step 5 - essai
  const [affaissementCible, setAffaissementCible] = useState("");
  const [resistanceCible, setResistanceCible] = useState("");

  // Step 5 - données granulats importées depuis les rapports
  const [granulatDensites, setGranulatDensites] = useState<Record<string, number>>({});
  const [granulatModuleFinesse, setGranulatModuleFinesse] = useState<Record<string, number>>({});
  const handleDensityExtracted = (key: string, density: number) => {
    setGranulatDensites(prev => ({ ...prev, [key]: density }));
  };
  const handleModuleFinesseExtracted = (key: string, moduleFinesse: number) => {
    setGranulatModuleFinesse(prev => ({ ...prev, [key]: moduleFinesse }));
  };

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
  const { data: carrieres = [] } = useCarrieres();
  const { data: cimenteries = [] } = useCimenteries();
  const { data: adjuvants = [] } = useAdjuvants();
  const { data: sourcesEau = [] } = useSourcesEau();
  const createFormulation = useCreateFormulation();
  const { data: maitresOuvrage = [] } = useMaitresOuvrage();
  const { data: maitresOeuvre = [] } = useMaitresOeuvre();

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



  // Compute which steps have incomplete mandatory fields (for blinking step indicators)
  const stepIncomplete = useMemo(() => {
    const incomplete: number[] = [];
    if (!(nom.trim().length > 0 && centraleId.length > 0 && clientId.length > 0 && chantierId.length > 0 && maitreOuvrageId.length > 0 && maitreOeuvreId.length > 0)) incomplete.push(1);
    if (!(calcEau.trim().length > 0 && calcCiment.trim().length > 0 && calcRatioGS.trim().length > 0 && resistance28j.trim().length > 0 && slumpSouhaite.trim().length > 0 && classeExposition.trim().length > 0)) incomplete.push(2);
    if (!(coefficientGranulaire.trim().length > 0 && coefficientCompacite.trim().length > 0 && dmaxUtilisateur.trim().length > 0)) incomplete.push(5);
    if (!(vibrationAE.trim().length > 0 && formeAE.trim().length > 0 && kpAE.trim().length > 0 && mfIdeal.trim().length > 0)) incomplete.push(6);
    return incomplete;
  }, [nom, centraleId, clientId, chantierId, maitreOuvrageId, maitreOeuvreId, calcEau, calcCiment, calcRatioGS, resistance28j, slumpSouhaite, classeExposition, coefficientGranulaire, coefficientCompacite, dmaxUtilisateur, vibrationAE, formeAE, kpAE, mfImporteEtape6, mfIdeal]);

  // Merge dynamic incomplete steps with errorSteps from ProportionsStep
  const allErrorSteps = useMemo(() => {
    const merged = new Set([...errorSteps, ...stepIncomplete]);
    return Array.from(merged);
  }, [errorSteps, stepIncomplete]);

  const canGoNext = () => {
    switch (currentStep) {
      case 1: return nom.trim().length > 0 && centraleId.length > 0 && clientId.length > 0 && chantierId.length > 0 && maitreOuvrageId.length > 0 && maitreOeuvreId.length > 0;
      case 2: return calcEau.trim().length > 0 && calcCiment.trim().length > 0 && calcRatioGS.trim().length > 0 && resistance28j.trim().length > 0 && slumpSouhaite.trim().length > 0 && classeExposition.trim().length > 0;
      case 3: return true;
      case 4: return true;
      case 5: return coefficientGranulaire.trim().length > 0 && coefficientCompacite.trim().length > 0 && dmaxUtilisateur.trim().length > 0;
      case 6: return vibrationAE.trim().length > 0 && formeAE.trim().length > 0 && kpAE.trim().length > 0 && mfIdeal.trim().length > 0;
      case 7: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 7) {
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

    try {
      await createFormulation.mutateAsync({
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
      });

      toast.success("Formulation créée avec succès");
      navigate("/essais/beton/formulation");
    } catch {
      toast.error("Erreur lors de la création");
    }
  };


  return (
    <div className="space-y-6 animate-fade-in">
      <EssaiBreadcrumb items={[
        { label: "Béton", path: "/essais/beton" },
        { label: "Formulation", path: "/essais/beton/formulation" },
        { label: "Nouvelle formulation de béton" },
      ]} />

      <div className="flex items-center gap-4">
        <BackButton to="/essais/beton/formulation" />
        <h1 className="text-3xl font-display font-bold text-foreground">
          Nouvelle <span className="text-primary text-glow">Formulation de Béton</span>
        </h1>
      </div>

      <Stepper currentStep={currentStep} onStepClick={(step) => { setCurrentStep(step); window.scrollTo({ top: 0, behavior: 'smooth' }); }} errorSteps={allErrorSteps} />

      {/* Step 1 */}
      <div className={currentStep === 1 ? "" : "hidden"}>
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6 space-y-5">
            <h2 className="text-lg font-semibold text-foreground">Informations générales</h2>
            <p className="text-xs text-muted-foreground">Tous les champs sont obligatoires <span className="text-destructive">*</span></p>
            <div className="space-y-2">
              <Label>Nom de la formulation <span className="text-destructive">*</span></Label>
              <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="ex: Béton C25/30 pour fondations" className={cn("bg-secondary border-border", nom.trim().length === 0 && "animate-border-blink")} />
            </div>
            <div className="space-y-2">
              <Label>Centrale à béton <span className="text-destructive">*</span></Label>
              <Select value={centraleId} onValueChange={setCentraleId}>
                <SelectTrigger className={cn("bg-secondary border-border", centraleId.length === 0 && "animate-border-blink")}><SelectValue placeholder="Sélectionnez une centrale" /></SelectTrigger>
                <SelectContent>{centrales.map((c: any) => (<SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nom de l'entreprise <span className="text-destructive">*</span></Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className={cn("bg-secondary border-border", clientId.length === 0 && "animate-border-blink")}><SelectValue placeholder="Sélectionnez une entreprise" /></SelectTrigger>
                <SelectContent>{clients.map((c: any) => (<SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Chantier <span className="text-destructive">*</span></Label>
              <Select value={chantierId} onValueChange={setChantierId}>
                <SelectTrigger className={cn("bg-secondary border-border", chantierId.length === 0 && "animate-border-blink")}><SelectValue placeholder="Sélectionnez un chantier" /></SelectTrigger>
                <SelectContent>{clientChantiers.map((c: any) => (<SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Maître d'ouvrage <span className="text-destructive">*</span></Label>
              <Select value={maitreOuvrageId} onValueChange={setMaitreOuvrageId}>
                <SelectTrigger className={cn("bg-secondary border-border", maitreOuvrageId.length === 0 && "animate-border-blink")}><SelectValue placeholder="Sélectionnez un maître d'ouvrage" /></SelectTrigger>
                <SelectContent>{maitresOuvrage.map((m: any) => (<SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Maître d'œuvre <span className="text-destructive">*</span></Label>
              <Select value={maitreOeuvreId} onValueChange={setMaitreOeuvreId}>
                <SelectTrigger className={cn("bg-secondary border-border", maitreOeuvreId.length === 0 && "animate-border-blink")}><SelectValue placeholder="Sélectionnez un maître d'œuvre" /></SelectTrigger>
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
                  className={cn("bg-secondary border-border", !calcEau.trim() && "animate-border-blink")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Ciment (kg/m³) <span className="text-destructive">*</span></Label>
                <Input
                  type="number" step="1" min="0"
                  value={calcCiment}
                  onChange={(e) => setCalcCiment(e.target.value)}
                  placeholder="ex: 350"
                  className={cn("bg-secondary border-border", !calcCiment.trim() && "animate-border-blink")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Rapport G/S <span className="text-destructive">*</span></Label>
                <Input
                  type="number" step="0.1" min="0.1"
                  value={calcRatioGS}
                  onChange={(e) => setCalcRatioGS(e.target.value)}
                  placeholder="ex: 1.8"
                  className={cn("bg-secondary border-border", !calcRatioGS.trim() && "animate-border-blink")}
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
                  <Input type="number" step="0.1" min="0" value={resistance28j} onChange={(e) => setResistance28j(e.target.value)} placeholder="0.0" className={cn("bg-secondary border-border pr-14", !resistance28j.trim() && "animate-border-blink")} />
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
                  <Input type="number" step="1" min="0" value={slumpSouhaite} onChange={(e) => setSlumpSouhaite(e.target.value)} placeholder="0" className={cn("bg-secondary border-border pr-14", !slumpSouhaite.trim() && "animate-border-blink")} />
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
          onPointAChange={(xA, yA) => setPointACoords({ xA, yA })}
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
          granulatLabels={granulatLabels}
          mfMelangeStocke={mfIdeal ? parseFloat(mfIdeal) || null : null}
          dMaxUser={dmaxUtilisateur ? parseFloat(dmaxUtilisateur) : null}
          pointAOverride={pointACoords}
          calcEau={calcEau}
          calcCiment={calcCiment}
          calcRatioGS={calcRatioGS}
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
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={createFormulation.isPending}
            className="gap-2 gradient-primary text-primary-foreground"
          >
            {createFormulation.isPending ? "Création..." : "Créer la formulation"}
          </Button>
        )}
      </div>
    </div>
  );
}
