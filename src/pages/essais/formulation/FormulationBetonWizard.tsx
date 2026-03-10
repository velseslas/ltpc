import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, BarChart3, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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
import { useClients } from "@/hooks/useClients";
import { useChantiers } from "@/hooks/useChantiers";
import { useCentralesBeton } from "@/hooks/useCentralesBeton";
import { useCarrieres } from "@/hooks/useCarrieres";
import { useCimenteries } from "@/hooks/useCimenteries";
import { useAdjuvants } from "@/hooks/useAdjuvants";
import { useSourcesEau } from "@/hooks/useSourcesEau";
import { useProduits } from "@/hooks/useProduits";
import { useCreateFormulation } from "@/hooks/useFormulations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  { number: 5, label: "Calcul proportions" },
];

// Stepper component
function Stepper({ currentStep, onStepClick }: { currentStep: number; onStepClick: (step: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => onStepClick(step.number)}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all cursor-pointer hover:scale-110",
                currentStep === step.number
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : currentStep > step.number
                  ? "bg-primary/80 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {currentStep > step.number ? (
                <Check className="w-4 h-4" />
              ) : (
                step.number
              )}
            </button>
            <span
              className={cn(
                "text-[11px] mt-1.5 text-center max-w-[100px] leading-tight",
                currentStep === step.number
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
      ))}
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
}) {
  const { data: produits = [] } = useProduits(selectedProducteurId, producteurType);

  return (
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
          <SelectTrigger className="bg-secondary border-border">
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
        <Select value={selectedProduitId} onValueChange={onProduitChange} disabled={!active || !selectedProducteurId}>
          <SelectTrigger className="bg-secondary border-border">
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
  );
}

// Helper to get name by id from a list
function getNameById(list: { id: string; nom: string }[], id: string) {
  return list.find((item) => item.id === id)?.nom || "";
}

// Granulat test types
const GRANULAT_ESSAIS = [
  { nom: "Analyse Granulométrique", table: "echantillons_granulometrie" as const, filter: "all" as const },
  { nom: "Équivalent de Sable", table: "echantillons_equivalent_sable" as const, filter: "sable" as const },
  { nom: "Valeur au Bleu de Méthylène", table: "echantillons_bleu_methylene" as const, filter: "sable" as const },
  { nom: "Matière Organique", table: "echantillons_matiere_organique" as const, filter: "sable" as const },
  { nom: "Masse Volumique", table: "echantillons_masse_volumique" as const, filter: "all" as const },
  { nom: "Los Angeles", table: "echantillons_los_angeles" as const, filter: "gravier" as const },
  { nom: "Micro-Deval", table: "echantillons_micro_deval" as const, filter: "gravier" as const },
  { nom: "Coefficient d'Aplatissement", table: "echantillons_forme_granulats" as const, filter: "gravier" as const },
  { nom: "Coefficient d'Écrasement", table: "echantillons_ecrasement" as const, filter: "gravier" as const },
  { nom: "Friabilité", table: "echantillons_friabilite" as const, filter: "sable" as const },
];

type GranulatTable = typeof GRANULAT_ESSAIS[number]["table"];

function useGranulatSamples(table: GranulatTable, carriereId: string) {
  return useQuery({
    queryKey: ["formulation-essai", table, carriereId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select("id, numero, produit, statut, date_reception")
        .eq("carriere_id", carriereId)
        .order("numero", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!carriereId,
  });
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

function GranulatEssaiRow({ essaiNom, table, carriereId, produitNom }: {
  essaiNom: string; table: GranulatTable; carriereId: string; produitNom: string;
}) {
  const { data: samples = [] } = useGranulatSamples(table, carriereId);
  const filtered = samples.filter((s: any) => s.produit === produitNom);
  const [selectedRapport, setSelectedRapport] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMsg, setDialogMsg] = useState("");
  const [dialogType, setDialogType] = useState<"warning" | "info">("info");

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
    // TODO: navigate to rapport
  };

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground ml-1">{essaiNom}</span>
      <div className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-muted/10">
        <Select value={selectedRapport} onValueChange={setSelectedRapport}>
          <SelectTrigger className="bg-secondary border-border flex-1">
            <SelectValue placeholder={`Sélectionner rapport`} />
          </SelectTrigger>
          <SelectContent>
            {filtered.length === 0 ? (
              <SelectItem value="__none" disabled>Aucun rapport disponible</SelectItem>
            ) : (
              filtered.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>
                  N°{s.numero} — {s.date_reception} — {s.statut}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="text-xs border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50 whitespace-nowrap" onClick={handleVoirRapport}>
          Voir rapport
        </Button>
      </div>
      <RapportMessageDialog open={dialogOpen} onClose={() => setDialogOpen(false)} message={dialogMsg} type={dialogType} />
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
}: {
  sable1Active: boolean; sable2Active: boolean; gravier1Active: boolean; gravier2Active: boolean; gravier3Active: boolean;
  cimentActive: boolean; eauActive: boolean;
  sable1ProducteurId: string; sable1ProduitId: string; sable2ProducteurId: string; sable2ProduitId: string;
  gravier1ProducteurId: string; gravier1ProduitId: string; gravier2ProducteurId: string; gravier2ProduitId: string;
  gravier3ProducteurId: string; gravier3ProduitId: string; cimentProducteurId: string; cimentProduitId: string;
  eauProducteurId: string; eauProduitId: string;
  carrieres: { id: string; nom: string }[]; cimenteries: { id: string; nom: string }[]; sourcesEau: { id: string; nom: string }[];
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
    { label: "Sable 1", active: sable1Active, producteurId: sable1ProducteurId, produitId: sable1ProduitId, produits: sable1Produits },
    { label: "Sable 2", active: sable2Active, producteurId: sable2ProducteurId, produitId: sable2ProduitId, produits: sable2Produits },
    { label: "Gravier 1", active: gravier1Active, producteurId: gravier1ProducteurId, produitId: gravier1ProduitId, produits: gravier1Produits },
    { label: "Gravier 2", active: gravier2Active, producteurId: gravier2ProducteurId, produitId: gravier2ProduitId, produits: gravier2Produits },
    { label: "Gravier 3", active: gravier3Active, producteurId: gravier3ProducteurId, produitId: gravier3ProduitId, produits: gravier3Produits },
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
      produitNom: mat.produits.find((p: any) => p.id === mat.produitId)?.nom || "",
      producteurNom: getNameById(carrieres, mat.producteurId),
      carriereId: mat.producteurId,
    }));

  return (
    <div className="space-y-6">
      {/* Granulats — organisé par type d'essai */}
      {hasAnyActiveGranulat && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6 space-y-6">
            <h2 className="text-lg font-bold text-foreground">Essais sur les Granulats</h2>

            {resolvedGranulats.length === 0 ? (
              <p className="text-xs text-muted-foreground italic p-3">
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
                  <Button variant="outline" size="sm" className="text-xs border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50 whitespace-nowrap" onClick={() => setStaticDialogOpen(true)}>Voir rapport</Button>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-muted/10">
                  
                  <Select><SelectTrigger className="bg-secondary border-border flex-1"><SelectValue placeholder="Temps de Prise" /></SelectTrigger>
                    <SelectContent><SelectItem value="__none" disabled>Aucun rapport disponible</SelectItem></SelectContent></Select>
                  <Button variant="outline" size="sm" className="text-xs border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50 whitespace-nowrap" onClick={() => setStaticDialogOpen(true)}>Voir rapport</Button>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground italic p-3">Veuillez sélectionner une cimenterie et un produit à l'étape 3.</p>
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
                  <Button variant="outline" size="sm" className="text-xs border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50 whitespace-nowrap" onClick={() => setStaticDialogOpen(true)}>Voir rapport</Button>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground italic p-3">Veuillez sélectionner une source d'eau et un produit à l'étape 3.</p>
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

  // Step 1
  const [nom, setNom] = useState("");
  const [clientId, setClientId] = useState("");
  const [chantierId, setChantierId] = useState("");
  const [centraleId, setCentraleId] = useState("");

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

  // Step 4 - coefficient granulaire
  const [coefficientGranulaire, setCoefficientGranulaire] = useState("");

  // Step 5 - essai
  const [affaissementCible, setAffaissementCible] = useState("");
  const [resistanceCible, setResistanceCible] = useState("");

  // Step 2 - données de base
  const [resistance28j, setResistance28j] = useState("");
  const [slumpSouhaite, setSlumpSouhaite] = useState("");
  const [classeExposition, setClasseExposition] = useState("");
  const [showAbaque, setShowAbaque] = useState(false);

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

  const clientChantiers = chantierId ? chantiers : chantiers.filter((c: any) => !clientId || c.client_id === clientId);

  // Calculations for step 6
  const sables = (parseFloat(sableConcasseQte) || 0) + (parseFloat(sableFinQte) || 0);
  const graviers = (parseFloat(gravillons1Qte) || 0) + (parseFloat(gravier2Qte) || 0) + (parseFloat(gravier3Qte) || 0);
  const ciment = parseFloat(cimentQte) || 0;
  const eau = parseFloat(eauQte) || 0;
  const adjuvant = parseFloat(adjuvantQte) || 0;
  const total = sables + graviers + ciment + adjuvant + eau;
  const ratioGS = sables > 0 ? (graviers / sables).toFixed(2) : "-";
  const ratioEC = ciment > 0 ? (eau / ciment).toFixed(2) : "-";

  const canGoNext = () => {
    switch (currentStep) {
      case 1: return nom.trim() !== "" && centraleId !== "";
      case 2: return true;
      case 3: return true;
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6 space-y-5">
              <h2 className="text-lg font-semibold text-foreground">Informations client</h2>

              <div className="space-y-2">
                <Label>Nom de la formulation <span className="text-destructive">*</span></Label>
                <Input
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="ex: Béton C25/30 pour fondations"
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <Label>Nom de l'entreprise</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Sélectionnez une entreprise" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Chantier</Label>
                <Select value={chantierId} onValueChange={setChantierId}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Sélectionnez un chantier" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientChantiers.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Centrale à béton <span className="text-destructive">*</span></Label>
                <Select value={centraleId} onValueChange={setCentraleId}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Sélectionnez une centrale" />
                  </SelectTrigger>
                  <SelectContent>
                    {centrales.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6 space-y-5">
              <h2 className="text-lg font-semibold text-foreground">Données de base</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Résistance souhaitée à 28 j</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={resistance28j}
                      onChange={(e) => setResistance28j(e.target.value)}
                      placeholder="0.0"
                      className="bg-secondary border-border pr-14"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">MPa</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Classe de résistance</Label>
                  <Input
                    value={classeResistanceAuto}
                    readOnly
                    placeholder="—"
                    className="bg-muted border-border cursor-default"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Slump souhaité</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      value={slumpSouhaite}
                      onChange={(e) => setSlumpSouhaite(e.target.value)}
                      placeholder="0"
                      className="bg-secondary border-border pr-14"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">mm</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Classe rhéologique</Label>
                  <Input
                    value={classeRheologiqueAuto}
                    readOnly
                    placeholder="—"
                    className="bg-muted border-border cursor-default"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-1.5">
                  <Label className="text-sm">Classe d'exposition</Label>
                  <Input
                    value={classeExposition}
                    readOnly
                    placeholder="Sélectionnez depuis l'abaque"
                    className="bg-muted border-border cursor-default"
                  />
                </div>

                <Button variant="outline" className="gap-2 w-fit" type="button" onClick={() => setShowAbaque(true)}>
                  <BarChart3 className="w-4 h-4" />
                  Voir abaque
                </Button>
              </div>

              {/* Abaque Dialog */}
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
                          <tr
                            key={row.classe}
                            className={cn(
                              "cursor-pointer transition-colors hover:bg-primary/10",
                              classeExposition === row.classe && "bg-primary/20 font-medium",
                              i % 2 === 0 ? "bg-card" : "bg-muted/30"
                            )}
                            onClick={() => {
                              setClasseExposition(row.classe);
                              setShowAbaque(false);
                            }}
                          >
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
        );

      case 3:
        return (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Information matériaux</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <IngredientCard
                  label="Sable 1"
                  producteurLabel="Carrière"
                  active={sable1Active}
                  onToggle={setSable1Active}
                  producteurType="carriere"
                  producteurs={carrieres}
                  selectedProducteurId={sableConcasseProducteurId}
                  selectedProduitId={sableConcasseProduitId}
                  onProducteurChange={setSableConcasseProducteurId}
                  onProduitChange={setSableConcasseProduitId}
                />
                <IngredientCard
                  label="Sable 2"
                  producteurLabel="Carrière"
                  active={sable2Active}
                  onToggle={setSable2Active}
                  producteurType="carriere"
                  producteurs={carrieres}
                  selectedProducteurId={sableFinProducteurId}
                  selectedProduitId={sableFinProduitId}
                  onProducteurChange={setSableFinProducteurId}
                  onProduitChange={setSableFinProduitId}
                />
                <IngredientCard
                  label="Gravier 1"
                  producteurLabel="Carrière"
                  active={gravier1Active}
                  onToggle={setGravier1Active}
                  producteurType="carriere"
                  producteurs={carrieres}
                  selectedProducteurId={gravillons1ProducteurId}
                  selectedProduitId={gravillons1ProduitId}
                  onProducteurChange={setGravillons1ProducteurId}
                  onProduitChange={setGravillons1ProduitId}
                />
                <IngredientCard
                  label="Gravier 2"
                  producteurLabel="Carrière"
                  active={gravier2Active}
                  onToggle={setGravier2Active}
                  producteurType="carriere"
                  producteurs={carrieres}
                  selectedProducteurId={gravier2ProducteurId}
                  selectedProduitId={gravier2ProduitId}
                  onProducteurChange={setGravier2ProducteurId}
                  onProduitChange={setGravier2ProduitId}
                />
                <IngredientCard
                  label="Gravier 3"
                  producteurLabel="Carrière"
                  active={gravier3Active}
                  onToggle={setGravier3Active}
                  producteurType="carriere"
                  producteurs={carrieres}
                  selectedProducteurId={gravier3ProducteurId}
                  selectedProduitId={gravier3ProduitId}
                  onProducteurChange={setGravier3ProducteurId}
                  onProduitChange={setGravier3ProduitId}
                />
                <IngredientCard
                  label="Ciment"
                  producteurLabel="Cimenterie"
                  active={cimentActive}
                  onToggle={setCimentActive}
                  producteurType="cimenterie"
                  producteurs={cimenteries}
                  selectedProducteurId={cimentProducteurId}
                  selectedProduitId={cimentProduitId}
                  onProducteurChange={setCimentProducteurId}
                  onProduitChange={setCimentProduitId}
                />
                <IngredientCard
                  label="Adjuvant"
                  producteurLabel="Fournisseur"
                  active={adjuvantActive}
                  onToggle={setAdjuvantActive}
                  producteurType="adjuvant"
                  producteurs={adjuvants}
                  selectedProducteurId={adjuvantProducteurId}
                  selectedProduitId={adjuvantProduitId}
                  onProducteurChange={setAdjuvantProducteurId}
                  onProduitChange={setAdjuvantProduitId}
                />
                <IngredientCard
                  label="Eau"
                  producteurLabel="Source d'eau"
                  active={eauActive}
                  onToggle={setEauActive}
                  producteurType="source_eau"
                  producteurs={sourcesEau}
                  selectedProducteurId={eauProducteurId}
                  selectedProduitId={eauProduitId}
                  onProducteurChange={setEauProducteurId}
                  onProduitChange={setEauProduitId}
                />
              </div>
            </CardContent>
          </Card>
        );



      case 4:
        return <EssaiStep
          sable1Active={sable1Active}
          sable2Active={sable2Active}
          gravier1Active={gravier1Active}
          gravier2Active={gravier2Active}
          gravier3Active={gravier3Active}
          cimentActive={cimentActive}
          eauActive={eauActive}
          sable1ProducteurId={sableConcasseProducteurId}
          sable1ProduitId={sableConcasseProduitId}
          sable2ProducteurId={sableFinProducteurId}
          sable2ProduitId={sableFinProduitId}
          gravier1ProducteurId={gravillons1ProducteurId}
          gravier1ProduitId={gravillons1ProduitId}
          gravier2ProducteurId={gravier2ProducteurId}
          gravier2ProduitId={gravier2ProduitId}
          gravier3ProducteurId={gravier3ProducteurId}
          gravier3ProduitId={gravier3ProduitId}
          cimentProducteurId={cimentProducteurId}
          cimentProduitId={cimentProduitId}
          eauProducteurId={eauProducteurId}
          eauProduitId={eauProduitId}
          carrieres={carrieres}
          cimenteries={cimenteries}
          sourcesEau={sourcesEau}
        />;

      case 5:
        return (
          <ProportionsStep
            sableConcasseQte={sableConcasseQte}
            sableFinQte={sableFinQte}
            gravillons1Qte={gravillons1Qte}
            gravier2Qte={gravier2Qte}
            gravier3Qte={gravier3Qte}
            cimentQte={cimentQte}
            adjuvantQte={adjuvantQte}
            eauQte={eauQte}
            sable1Active={sable1Active}
            sable2Active={sable2Active}
            gravier1Active={gravier1Active}
            gravier2Active={gravier2Active}
            gravier3Active={gravier3Active}
            coefficientGranulaire={coefficientGranulaire}
            classeRheologique={classeRheologiqueAuto}
          />
        );

      default:
        return null;
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

      <Stepper currentStep={currentStep} onStepClick={(step) => setCurrentStep(step)} />

      {renderStep()}

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

        {currentStep < 5 ? (
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
