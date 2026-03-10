import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, BarChart3, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STEPS = [
  { number: 1, label: "Information générale" },
  { number: 2, label: "Données de base" },
  { number: 3, label: "Information matériaux" },
  { number: 4, label: "Coefficient granulaire" },
  { number: 5, label: "Essai" },
  { number: 6, label: "Calcul proportions" },
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

// Ingredient selector for step 2
function IngredientSelect({
  label,
  producteurType,
  producteurs,
  selectedProducteurId,
  selectedProduitId,
  onProducteurChange,
  onProduitChange,
}: {
  label: string;
  producteurType: "carriere" | "cimenterie" | "adjuvant" | "source_eau";
  producteurs: { id: string; nom: string }[];
  selectedProducteurId: string;
  selectedProduitId: string;
  onProducteurChange: (v: string) => void;
  onProduitChange: (v: string) => void;
}) {
  const { data: produits = [], isLoading } = useProduits(selectedProducteurId, producteurType);

  return (
    <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-muted/20">
      <Label className="text-sm font-semibold">{label}</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Producteur</Label>
          <Select value={selectedProducteurId} onValueChange={onProducteurChange}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Sélectionner" />
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
          <Select
            value={selectedProduitId}
            onValueChange={onProduitChange}
            disabled={!selectedProducteurId || isLoading}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder={isLoading ? "Chargement..." : "Sélectionner"} />
            </SelectTrigger>
            <SelectContent>
              {produits.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
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

  // Step 2 - producteurs/produits
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
  const [classeResistance, setClasseResistance] = useState("");
  const [classeExposition, setClasseExposition] = useState("");
  const [classeRheologique, setClasseRheologique] = useState("");
  const [showAbaque, setShowAbaque] = useState(false);

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
      case 6: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1);
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
                  <Select value={classeResistance} onValueChange={setClasseResistance}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Sélectionnez une classe" />
                    </SelectTrigger>
                    <SelectContent>
                      {["C16/20", "C20/25", "C25/30", "C30/37", "C35/45", "C40/50", "C45/55", "C50/60"].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5">
                  <Label className="text-sm">Classe d'exposition</Label>
                  <Select value={classeExposition} onValueChange={setClasseExposition}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Sélectionnez une classe..." />
                    </SelectTrigger>
                    <SelectContent>
                      {["X0", "XC1", "XC2", "XC3", "XC4", "XD1", "XD2", "XD3", "XS1", "XS2", "XS3", "XF1", "XF2", "XF3", "XF4", "XA1", "XA2", "XA3"].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" className="gap-2" type="button" onClick={() => setShowAbaque(true)}>
                  <BarChart3 className="w-4 h-4" />
                  Voir abaque
                </Button>

                <div className="space-y-1.5">
                  <Label className="text-sm">Classe rhéologique</Label>
                  <Select value={classeRheologique} onValueChange={setClasseRheologique}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Sélectionnez une classe" />
                    </SelectTrigger>
                    <SelectContent>
                      {["S1", "S2", "S3", "S4", "S5"].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Abaque Dialog */}
              <Dialog open={showAbaque} onOpenChange={setShowAbaque}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle>Abaque des classes d'exposition — EN 206</DialogTitle>
                  </DialogHeader>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
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
              <p className="text-sm text-muted-foreground mb-2">Sélectionnez les producteurs et produits pour chaque composant</p>

              <IngredientSelect
                label="Sable concassé"
                producteurType="carriere"
                producteurs={carrieres}
                selectedProducteurId={sableConcasseProducteurId}
                selectedProduitId={sableConcasseProduitId}
                onProducteurChange={setSableConcasseProducteurId}
                onProduitChange={setSableConcasseProduitId}
              />
              <IngredientSelect
                label="Sable fin"
                producteurType="carriere"
                producteurs={carrieres}
                selectedProducteurId={sableFinProducteurId}
                selectedProduitId={sableFinProduitId}
                onProducteurChange={setSableFinProducteurId}
                onProduitChange={setSableFinProduitId}
              />
              <IngredientSelect
                label="Gravillons 1"
                producteurType="carriere"
                producteurs={carrieres}
                selectedProducteurId={gravillons1ProducteurId}
                selectedProduitId={gravillons1ProduitId}
                onProducteurChange={setGravillons1ProducteurId}
                onProduitChange={setGravillons1ProduitId}
              />
              <IngredientSelect
                label="Gravier 2"
                producteurType="carriere"
                producteurs={carrieres}
                selectedProducteurId={gravier2ProducteurId}
                selectedProduitId={gravier2ProduitId}
                onProducteurChange={setGravier2ProducteurId}
                onProduitChange={setGravier2ProduitId}
              />
              <IngredientSelect
                label="Gravier 3"
                producteurType="carriere"
                producteurs={carrieres}
                selectedProducteurId={gravier3ProducteurId}
                selectedProduitId={gravier3ProduitId}
                onProducteurChange={setGravier3ProducteurId}
                onProduitChange={setGravier3ProduitId}
              />
              <IngredientSelect
                label="Ciment"
                producteurType="cimenterie"
                producteurs={cimenteries}
                selectedProducteurId={cimentProducteurId}
                selectedProduitId={cimentProduitId}
                onProducteurChange={setCimentProducteurId}
                onProduitChange={setCimentProduitId}
              />
              <IngredientSelect
                label="Adjuvant"
                producteurType="adjuvant"
                producteurs={adjuvants}
                selectedProducteurId={adjuvantProducteurId}
                selectedProduitId={adjuvantProduitId}
                onProducteurChange={setAdjuvantProducteurId}
                onProduitChange={setAdjuvantProduitId}
              />
              <IngredientSelect
                label="Eau"
                producteurType="source_eau"
                producteurs={sourcesEau}
                selectedProducteurId={eauProducteurId}
                selectedProduitId={eauProduitId}
                onProducteurChange={setEauProducteurId}
                onProduitChange={setEauProduitId}
              />
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6 space-y-5">
              <h2 className="text-lg font-semibold text-foreground">Coefficient granulaire</h2>
              <p className="text-sm text-muted-foreground">Paramètres de correction granulaire</p>

              <div className="space-y-2">
                <Label>Coefficient granulaire (G)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={coefficientGranulaire}
                  onChange={(e) => setCoefficientGranulaire(e.target.value)}
                  placeholder="ex: 0.55"
                  className="bg-secondary border-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-lg bg-primary/10 text-center">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Rapport G/S</p>
                  <p className="text-xl font-bold text-primary">{ratioGS}</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 text-center">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Rapport E/C</p>
                  <p className="text-xl font-bold text-primary">{ratioEC}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6 space-y-5">
              <h2 className="text-lg font-semibold text-foreground">Essai</h2>
              <p className="text-sm text-muted-foreground">Paramètres de l'essai de convenance</p>

              <div className="space-y-2">
                <Label>Affaissement cible (cm)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={affaissementCible}
                  onChange={(e) => setAffaissementCible(e.target.value)}
                  placeholder="ex: 8"
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <Label>Résistance cible (MPa)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={resistanceCible}
                  onChange={(e) => setResistanceCible(e.target.value)}
                  placeholder="ex: 25"
                  className="bg-secondary border-border"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6 space-y-5">
              <h2 className="text-lg font-semibold text-foreground">Calcul des proportions</h2>
              <p className="text-sm text-muted-foreground">Récapitulatif de la formulation pour 1 m³</p>

              <div className="space-y-3">
                {[
                  { label: "Sable concassé", value: sableConcasseQte, unit: "kg" },
                  { label: "Sable fin", value: sableFinQte, unit: "kg" },
                  { label: "Gravillons 1", value: gravillons1Qte, unit: "kg" },
                  { label: "Gravier 2", value: gravier2Qte, unit: "kg" },
                  { label: "Gravier 3", value: gravier3Qte, unit: "kg" },
                  { label: "Ciment", value: cimentQte, unit: "kg" },
                  { label: "Adjuvant", value: adjuvantQte, unit: "kg" },
                  { label: "Eau", value: eauQte, unit: "L" },
                ].filter(({ value }) => value && parseFloat(value) > 0)
                  .map(({ label, value, unit }) => (
                    <div key={label} className="flex justify-between items-center py-2 border-b border-border/30">
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className="font-semibold text-foreground">{parseFloat(value).toFixed(1)} {unit}</span>
                    </div>
                  ))
                }

                <div className="flex justify-between items-center py-3 border-t-2 border-primary/30">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-lg font-bold text-primary">{total.toFixed(1)} kg</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="p-3 rounded-lg bg-primary/10 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase">G/S</p>
                  <p className="text-lg font-bold text-primary">{ratioGS}</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase">E/C</p>
                  <p className="text-lg font-bold text-primary">{ratioEC}</p>
                </div>
                <div className="p-3 rounded-lg bg-accent/50 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase">Coeff. G</p>
                  <p className="text-lg font-bold text-foreground">{coefficientGranulaire || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
        { label: "Nouvelle formule" },
      ]} />

      <div className="flex items-center gap-4">
        <BackButton to="/essais/beton/formulation" />
        <h1 className="text-3xl font-display font-bold text-foreground">
          Nouvelle <span className="text-primary text-glow">Formule</span>
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

        {currentStep < 6 ? (
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
