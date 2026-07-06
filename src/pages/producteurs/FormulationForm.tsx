import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useCarrieres } from "@/hooks/useCarrieres";
import { useCimenteries } from "@/hooks/useCimenteries";
import { useAdjuvants } from "@/hooks/useAdjuvants";
import { useSourcesEau } from "@/hooks/useSourcesEau";
import { useProduits } from "@/hooks/useProduits";
import { useFormulation, useCreateFormulation, useUpdateFormulation } from "@/hooks/useFormulations";
import { toast } from "sonner";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";

interface IngredientFieldProps {
  label: string;
  producteurType: "carriere" | "cimenterie" | "adjuvant" | "source_eau";
  producteurs: { id: string; nom: string }[];
  selectedProducteurId: string;
  selectedProduitId: string;
  quantite: string;
  onProducteurChange: (value: string) => void;
  onProduitChange: (value: string) => void;
  onQuantiteChange: (value: string) => void;
}

function IngredientField({
  label,
  producteurType,
  producteurs,
  selectedProducteurId,
  selectedProduitId,
  quantite,
  onProducteurChange,
  onProduitChange,
  onQuantiteChange,
}: IngredientFieldProps) {
  const { data: produits = [], isLoading: isLoadingProduits } = useProduits(selectedProducteurId, producteurType);
  
  // Track if initial sync is done for produit
  const [isInitialized, setIsInitialized] = useState(false);

  // Reset initialization when producteur changes
  useEffect(() => {
    if (!selectedProducteurId) {
      setIsInitialized(false);
    }
  }, [selectedProducteurId]);

  // Mark as initialized once products are loaded and we have a selected produit
  useEffect(() => {
    if (selectedProducteurId && produits.length > 0 && selectedProduitId) {
      setIsInitialized(true);
    }
  }, [selectedProducteurId, produits, selectedProduitId]);

  // Determine the display value - only show if product exists in list or still loading
  const displayProduitId = isLoadingProduits || !isInitialized 
    ? selectedProduitId 
    : (produits.some(p => p.id === selectedProduitId) ? selectedProduitId : "");

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
      <Label className="text-base font-semibold">{label}</Label>
      
      <div className="grid gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">Producteur</Label>
          <Select value={selectedProducteurId} onValueChange={onProducteurChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un producteur" />
            </SelectTrigger>
            <SelectContent>
              {producteurs.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">Produit</Label>
          <Select 
            value={displayProduitId} 
            onValueChange={onProduitChange}
            disabled={!selectedProducteurId || isLoadingProduits}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                isLoadingProduits 
                  ? "Chargement..." 
                  : selectedProducteurId 
                    ? "Sélectionner un produit" 
                    : "Sélectionner d'abord un producteur"
              } />
            </SelectTrigger>
            <SelectContent>
              {produits.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">Quantité (kg)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={quantite}
            onChange={(e) => onQuantiteChange(e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>
    </div>
  );
}

export default function FormulationForm() {
  const navigate = useNavigate();
  const { id: centraleId, formulationId } = useParams<{ id: string; formulationId: string }>();
  const isEditMode = !!formulationId;

  const { data: existingFormulation, isLoading: isLoadingFormulation } = useFormulation(formulationId || "");
  const createFormulation = useCreateFormulation();
  const updateFormulation = useUpdateFormulation();

  const { data: carrieres = [] } = useCarrieres();
  const { data: cimenteries = [] } = useCimenteries();
  const { data: adjuvants = [] } = useAdjuvants();
  const { data: sourcesEau = [] } = useSourcesEau();

  const [nom, setNom] = useState("");
  
  // Sable concassé
  const [sableConcasseProducteurId, setSableConcasseProducteurId] = useState("");
  const [sableConcasseProduitId, setSableConcasseProduitId] = useState("");
  const [sableConcasseQuantite, setSableConcasseQuantite] = useState("");
  
  // Sable fin
  const [sableFinProducteurId, setSableFinProducteurId] = useState("");
  const [sableFinProduitId, setSableFinProduitId] = useState("");
  const [sableFinQuantite, setSableFinQuantite] = useState("");
  
  // Gravillons 1
  const [gravillons1ProducteurId, setGravillons1ProducteurId] = useState("");
  const [gravillons1ProduitId, setGravillons1ProduitId] = useState("");
  const [gravillons1Quantite, setGravillons1Quantite] = useState("");
  
  // Gravier 2
  const [gravier2ProducteurId, setGravier2ProducteurId] = useState("");
  const [gravier2ProduitId, setGravier2ProduitId] = useState("");
  const [gravier2Quantite, setGravier2Quantite] = useState("");
  
  // Gravier 3
  const [gravier3ProducteurId, setGravier3ProducteurId] = useState("");
  const [gravier3ProduitId, setGravier3ProduitId] = useState("");
  const [gravier3Quantite, setGravier3Quantite] = useState("");
  
  // Ciment
  const [cimentProducteurId, setCimentProducteurId] = useState("");
  const [cimentProduitId, setCimentProduitId] = useState("");
  const [cimentQuantite, setCimentQuantite] = useState("");
  
  // Adjuvant
  const [adjuvantProducteurId, setAdjuvantProducteurId] = useState("");
  const [adjuvantProduitId, setAdjuvantProduitId] = useState("");
  const [adjuvantQuantite, setAdjuvantQuantite] = useState("");
  
  // Eau
  const [eauProducteurId, setEauProducteurId] = useState("");
  const [eauProduitId, setEauProduitId] = useState("");
  const [eauQuantite, setEauQuantite] = useState("");

  // Load existing formulation data
  useEffect(() => {
    if (existingFormulation) {
      setNom(existingFormulation.nom);
      setSableConcasseProducteurId(existingFormulation.sable_concasse_producteur_id || "");
      setSableConcasseProduitId(existingFormulation.sable_concasse_produit_id || "");
      setSableConcasseQuantite(existingFormulation.sable_concasse_quantite?.toString() || "");
      setSableFinProducteurId(existingFormulation.sable_fin_producteur_id || "");
      setSableFinProduitId(existingFormulation.sable_fin_produit_id || "");
      setSableFinQuantite(existingFormulation.sable_fin_quantite?.toString() || "");
      setGravillons1ProducteurId(existingFormulation.gravillons1_producteur_id || "");
      setGravillons1ProduitId(existingFormulation.gravillons1_produit_id || "");
      setGravillons1Quantite(existingFormulation.gravillons1_quantite?.toString() || "");
      setGravier2ProducteurId(existingFormulation.gravier2_producteur_id || "");
      setGravier2ProduitId(existingFormulation.gravier2_produit_id || "");
      setGravier2Quantite(existingFormulation.gravier2_quantite?.toString() || "");
      setGravier3ProducteurId(existingFormulation.gravier3_producteur_id || "");
      setGravier3ProduitId(existingFormulation.gravier3_produit_id || "");
      setGravier3Quantite(existingFormulation.gravier3_quantite?.toString() || "");
      setCimentProducteurId(existingFormulation.ciment_producteur_id || "");
      setCimentProduitId(existingFormulation.ciment_produit_id || "");
      setCimentQuantite(existingFormulation.ciment_quantite?.toString() || "");
      setAdjuvantProducteurId(existingFormulation.adjuvant_producteur_id || "");
      setAdjuvantProduitId(existingFormulation.adjuvant_produit_id || "");
      setAdjuvantQuantite(existingFormulation.adjuvant_quantite?.toString() || "");
      setEauProducteurId(existingFormulation.eau_producteur_id || "");
      setEauProduitId(existingFormulation.eau_produit_id || "");
      setEauQuantite(existingFormulation.eau_quantite?.toString() || "");
    }
  }, [existingFormulation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nom.trim()) {
      toast.error("Le nom de la formulation est requis");
      return;
    }

    if (!centraleId) {
      toast.error("Centrale non trouvée");
      return;
    }

    const formData = {
      centrale_id: centraleId,
      nom: nom.trim(),
      sable_concasse_producteur_id: sableConcasseProducteurId || null,
      sable_concasse_produit_id: sableConcasseProduitId || null,
      sable_concasse_quantite: sableConcasseQuantite ? parseFloat(sableConcasseQuantite) : null,
      sable_fin_producteur_id: sableFinProducteurId || null,
      sable_fin_produit_id: sableFinProduitId || null,
      sable_fin_quantite: sableFinQuantite ? parseFloat(sableFinQuantite) : null,
      gravillons1_producteur_id: gravillons1ProducteurId || null,
      gravillons1_produit_id: gravillons1ProduitId || null,
      gravillons1_quantite: gravillons1Quantite ? parseFloat(gravillons1Quantite) : null,
      gravier2_producteur_id: gravier2ProducteurId || null,
      gravier2_produit_id: gravier2ProduitId || null,
      gravier2_quantite: gravier2Quantite ? parseFloat(gravier2Quantite) : null,
      gravier3_producteur_id: gravier3ProducteurId || null,
      gravier3_produit_id: gravier3ProduitId || null,
      gravier3_quantite: gravier3Quantite ? parseFloat(gravier3Quantite) : null,
      ciment_producteur_id: cimentProducteurId || null,
      ciment_produit_id: cimentProduitId || null,
      ciment_quantite: cimentQuantite ? parseFloat(cimentQuantite) : null,
      adjuvant_producteur_id: adjuvantProducteurId || null,
      adjuvant_produit_id: adjuvantProduitId || null,
      adjuvant_quantite: adjuvantQuantite ? parseFloat(adjuvantQuantite) : null,
      eau_producteur_id: eauProducteurId || null,
      eau_produit_id: eauProduitId || null,
      eau_quantite: eauQuantite ? parseFloat(eauQuantite) : null,
    };

    try {
      if (isEditMode && formulationId) {
        await updateFormulation.mutateAsync({ id: formulationId, ...formData });
        toast.success("Formulation modifiée avec succès");
      } else {
        await createFormulation.mutateAsync(formData);
        toast.success("Formulation créée avec succès");
      }
      navigate(`/intervenant/producteurs/centrale/${centraleId}`);
    } catch (error) {
      toast.error(isEditMode ? "Erreur lors de la modification" : "Erreur lors de la création");
    }
  };

  if (isEditMode && isLoadingFormulation) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isPending = createFormulation.isPending || updateFormulation.isPending;

  return (
    <>
      <AppBreadcrumb items={[
        { label: "Intervenants", path: "/intervenant" },
        { label: "Producteurs", path: "/intervenant/producteurs" },
        { label: "Centrales à béton", path: "/intervenant/producteurs/centrale" },
        { label: "Détails", path: `/intervenant/producteurs/centrale/${centraleId}` },
        { label: isEditMode ? "Modifier formulation" : "Nouvelle formulation" }
      ]} />
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(`/intervenant/producteurs/centrale/${centraleId}`)}
          className="shrink-0 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditMode ? "Modifier la Formulation" : "Nouvelle Formulation"}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informations de la formulation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom de la formulation *</Label>
              <Input
                id="nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: B25, B30..."
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <IngredientField
                label="Sable Concassé"
                producteurType="carriere"
                producteurs={carrieres}
                selectedProducteurId={sableConcasseProducteurId}
                selectedProduitId={sableConcasseProduitId}
                quantite={sableConcasseQuantite}
                onProducteurChange={(v) => { setSableConcasseProducteurId(v); setSableConcasseProduitId(""); }}
                onProduitChange={setSableConcasseProduitId}
                onQuantiteChange={setSableConcasseQuantite}
              />

              <IngredientField
                label="Sable Fin"
                producteurType="carriere"
                producteurs={carrieres}
                selectedProducteurId={sableFinProducteurId}
                selectedProduitId={sableFinProduitId}
                quantite={sableFinQuantite}
                onProducteurChange={(v) => { setSableFinProducteurId(v); setSableFinProduitId(""); }}
                onProduitChange={setSableFinProduitId}
                onQuantiteChange={setSableFinQuantite}
              />

              <IngredientField
                label="Gravillons 1"
                producteurType="carriere"
                producteurs={carrieres}
                selectedProducteurId={gravillons1ProducteurId}
                selectedProduitId={gravillons1ProduitId}
                quantite={gravillons1Quantite}
                onProducteurChange={(v) => { setGravillons1ProducteurId(v); setGravillons1ProduitId(""); }}
                onProduitChange={setGravillons1ProduitId}
                onQuantiteChange={setGravillons1Quantite}
              />

              <IngredientField
                label="Gravier 2"
                producteurType="carriere"
                producteurs={carrieres}
                selectedProducteurId={gravier2ProducteurId}
                selectedProduitId={gravier2ProduitId}
                quantite={gravier2Quantite}
                onProducteurChange={(v) => { setGravier2ProducteurId(v); setGravier2ProduitId(""); }}
                onProduitChange={setGravier2ProduitId}
                onQuantiteChange={setGravier2Quantite}
              />

              <IngredientField
                label="Gravier 3"
                producteurType="carriere"
                producteurs={carrieres}
                selectedProducteurId={gravier3ProducteurId}
                selectedProduitId={gravier3ProduitId}
                quantite={gravier3Quantite}
                onProducteurChange={(v) => { setGravier3ProducteurId(v); setGravier3ProduitId(""); }}
                onProduitChange={setGravier3ProduitId}
                onQuantiteChange={setGravier3Quantite}
              />

              <IngredientField
                label="Ciment"
                producteurType="cimenterie"
                producteurs={cimenteries}
                selectedProducteurId={cimentProducteurId}
                selectedProduitId={cimentProduitId}
                quantite={cimentQuantite}
                onProducteurChange={(v) => { setCimentProducteurId(v); setCimentProduitId(""); }}
                onProduitChange={setCimentProduitId}
                onQuantiteChange={setCimentQuantite}
              />

              <IngredientField
                label="Adjuvant"
                producteurType="adjuvant"
                producteurs={adjuvants}
                selectedProducteurId={adjuvantProducteurId}
                selectedProduitId={adjuvantProduitId}
                quantite={adjuvantQuantite}
                onProducteurChange={(v) => { setAdjuvantProducteurId(v); setAdjuvantProduitId(""); }}
                onProduitChange={setAdjuvantProduitId}
                onQuantiteChange={setAdjuvantQuantite}
              />

              <IngredientField
                label="Eau"
                producteurType="source_eau"
                producteurs={sourcesEau}
                selectedProducteurId={eauProducteurId}
                selectedProduitId={eauProduitId}
                quantite={eauQuantite}
                onProducteurChange={(v) => { setEauProducteurId(v); setEauProduitId(""); }}
                onProduitChange={setEauProduitId}
                onQuantiteChange={setEauQuantite}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/intervenant/producteurs/centrale/${centraleId}`)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
    </>
  );
}
