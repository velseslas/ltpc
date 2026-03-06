import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";
import { wilayas } from "@/data/wilayas";
import { useCentralesBeton } from "@/hooks/useCentralesBeton";
import { useChantiers } from "@/hooks/useChantiers";
import { useAddClientCentrale, useUpdateClientCentrale, ClientCentrale } from "@/hooks/useClientCentrales";
import { toast } from "sonner";
import { FormLoadingOverlay } from "@/components/ui/form-loading-overlay";

interface CentraleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  editingCentrale?: ClientCentrale | null;
}

export function CentraleFormDialog({ open, onOpenChange, clientId, editingCentrale }: CentraleFormDialogProps) {
  const [selectedWilayaChantier, setSelectedWilayaChantier] = useState<string>("");
  const [selectedWilayaCentrale, setSelectedWilayaCentrale] = useState<string>("");
  const [selectedCentrale, setSelectedCentrale] = useState<string>("");
  const [selectedChantier, setSelectedChantier] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPreFilling, setIsPreFilling] = useState(false);
  const [initStep, setInitStep] = useState<"idle" | "wilaya" | "fields" | "done">("idle");
  const [submitted, setSubmitted] = useState(false);
  
  const { data: centrales, isLoading: centralesLoading } = useCentralesBeton();
  const { data: chantiers, isLoading: chantiersLoading } = useChantiers();
  const addClientCentrale = useAddClientCentrale();
  const updateClientCentrale = useUpdateClientCentrale();

  const isEditing = !!editingCentrale;

  // Filter centrales by selected wilaya centrale
  const filteredCentrales = centrales?.filter(
    (centrale) => centrale.ville === selectedWilayaCentrale
  ) || [];

  // Filter chantiers by selected wilaya chantier
  const filteredChantiers = chantiers?.filter(
    (chantier) => chantier.ville === selectedWilayaChantier && chantier.client_id === clientId
  ) || [];

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedWilayaChantier("");
      setSelectedWilayaCentrale("");
      setSelectedCentrale("");
      setSelectedChantier("");
      setIsInitialized(false);
      setInitStep("idle");
      setSubmitted(false);
    }
  }, [open]);

  // Step 1: Set wilayas first when editing
  useEffect(() => {
    if (open && editingCentrale && !centralesLoading && !chantiersLoading && centrales && chantiers && initStep === "idle") {
      setIsPreFilling(true);
      const centraleWilaya = editingCentrale.centrales_beton?.ville || "";
      // Find chantier wilaya from the linked chantier
      const chantier = chantiers.find(c => c.id === editingCentrale.chantier_id);
      const chantierWilaya = chantier?.ville || "";
      setSelectedWilayaCentrale(centraleWilaya);
      setSelectedWilayaChantier(chantierWilaya);
      setInitStep("wilaya");
    }
  }, [open, editingCentrale, centralesLoading, chantiersLoading, centrales, chantiers, initStep]);

  // Step 2: Once wilaya is set and filtered lists are updated, set the dependent fields
  useEffect(() => {
    if (initStep === "wilaya" && (selectedWilayaCentrale || selectedWilayaChantier) && editingCentrale) {
      const timer = setTimeout(() => {
        setSelectedCentrale(editingCentrale.centrale_id);
        setSelectedChantier(editingCentrale.chantier_id || "");
        setInitStep("done");
        setIsInitialized(true);
        setIsPreFilling(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [initStep, selectedWilayaCentrale, selectedWilayaChantier, editingCentrale]);

  const handleWilayaChantierChange = (value: string) => {
    setSelectedWilayaChantier(value);
    if (isInitialized) {
      setSelectedChantier("");
    }
  };

  const handleWilayaCentraleChange = (value: string) => {
    setSelectedWilayaCentrale(value);
    if (isInitialized) {
      setSelectedCentrale("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    
    if (!selectedWilayaChantier || !selectedWilayaCentrale || !selectedCentrale || !selectedChantier) {
      return;
    }

    try {
      if (isEditing) {
        await updateClientCentrale.mutateAsync({
          id: editingCentrale.id,
          clientId,
          centraleId: selectedCentrale,
          chantierId: selectedChantier || undefined,
        });
        toast.success("Centrale modifiée avec succès");
      } else {
        await addClientCentrale.mutateAsync({
          clientId,
          centraleId: selectedCentrale,
          chantierId: selectedChantier || undefined,
        });
        toast.success("Centrale ajoutée avec succès");
      }
      onOpenChange(false);
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Cette centrale est déjà associée à ce client");
      } else {
        toast.error(isEditing ? "Erreur lors de la modification" : "Erreur lors de l'ajout de la centrale");
      }
    }
  };

  const isPending = addClientCentrale.isPending || updateClientCentrale.isPending;
  const isFormLoading = isEditing && (centralesLoading || chantiersLoading || isPreFilling);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier la Centrale à Béton" : "Ajouter une Centrale à Béton"}</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <FormLoadingOverlay 
            isLoading={isFormLoading} 
            message="Chargement des données du formulaire..." 
          />
          
          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Wilaya Chantier Select */}
          <div className="space-y-2">
            <Label htmlFor="wilayaChantier">Wilaya Chantier <span className="text-red-700">*</span></Label>
            <Select value={selectedWilayaChantier} onValueChange={handleWilayaChantierChange}>
              <SelectTrigger id="wilayaChantier" className={submitted && !selectedWilayaChantier ? "border-red-700" : ""}>
                <SelectValue placeholder="Sélectionner une wilaya" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] z-[9999] bg-popover">
                {wilayas.map((wilaya) => (
                  <SelectItem key={wilaya.code} value={wilaya.nom}>
                    {wilaya.code} - {wilaya.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {submitted && !selectedWilayaChantier && (
              <p className="text-red-700 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                La wilaya est requise
              </p>
            )}
          </div>

          {/* Chantier Select */}
          <div className="space-y-2">
            <Label htmlFor="chantier">Chantier <span className="text-red-700">*</span></Label>
            <Select 
              value={selectedChantier} 
              onValueChange={setSelectedChantier}
              disabled={!selectedWilayaChantier || chantiersLoading}
            >
              <SelectTrigger id="chantier" className={submitted && !selectedChantier ? "border-red-700" : ""}>
                <SelectValue placeholder={
                  !selectedWilayaChantier 
                    ? "Sélectionner d'abord une wilaya chantier" 
                    : chantiersLoading 
                    ? "Chargement..." 
                    : filteredChantiers.length === 0 
                    ? "Aucun chantier dans cette wilaya"
                    : "Sélectionner un chantier"
                } />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] z-[9999] bg-popover">
                {filteredChantiers.map((chantier) => (
                  <SelectItem key={chantier.id} value={chantier.id}>
                    {chantier.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {submitted && !selectedChantier && (
              <p className="text-red-700 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Le chantier est requis
              </p>
            )}
          </div>

          {/* Wilaya Centrale Select */}
          <div className="space-y-2">
            <Label htmlFor="wilayaCentrale">Wilaya Centrale à Béton <span className="text-red-700">*</span></Label>
            <Select value={selectedWilayaCentrale} onValueChange={handleWilayaCentraleChange}>
              <SelectTrigger id="wilayaCentrale" className={submitted && !selectedWilayaCentrale ? "border-red-700" : ""}>
                <SelectValue placeholder="Sélectionner une wilaya" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] z-[9999] bg-popover">
                {wilayas.map((wilaya) => (
                  <SelectItem key={wilaya.code} value={wilaya.nom}>
                    {wilaya.code} - {wilaya.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {submitted && !selectedWilayaCentrale && (
              <p className="text-red-700 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                La wilaya est requise
              </p>
            )}
          </div>

          {/* Centrale Select */}
          <div className="space-y-2">
            <Label htmlFor="centrale">Centrale à Béton <span className="text-red-700">*</span></Label>
            <Select 
              value={selectedCentrale} 
              onValueChange={setSelectedCentrale}
              disabled={!selectedWilayaCentrale || centralesLoading}
            >
              <SelectTrigger id="centrale" className={submitted && !selectedCentrale ? "border-red-700" : ""}>
                <SelectValue placeholder={
                  !selectedWilayaCentrale 
                    ? "Sélectionner d'abord une wilaya centrale" 
                    : centralesLoading 
                    ? "Chargement..." 
                    : filteredCentrales.length === 0 
                    ? "Aucune centrale dans cette wilaya"
                    : "Sélectionner une centrale"
                } />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] z-[9999] bg-popover">
                {filteredCentrales.map((centrale) => (
                  <SelectItem key={centrale.id} value={centrale.id}>
                    {centrale.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {submitted && !selectedCentrale && (
              <p className="text-red-700 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                La centrale est requise
              </p>
            )}
            {selectedWilayaCentrale && filteredCentrales.length === 0 && !centralesLoading && (
              <p className="text-xs text-muted-foreground">
                Aucune centrale disponible dans cette wilaya
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isPending}
              className="gradient-primary text-primary-foreground"
            >
              {isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {isEditing ? "Modifier" : "Ajouter"}
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
