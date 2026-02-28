import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";
import { useIntervenants } from "@/hooks/useIntervenants";
import { useClients } from "@/hooks/useClients";
import { useChantiersByClient } from "@/hooks/useChantiers";
import { useCreateAffectation, useUpdateAffectation, useAffectation } from "@/hooks/useAffectations";
import { toast } from "sonner";
import { FormLoadingOverlay } from "@/components/ui/form-loading-overlay";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";

export default function AffectationForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const { data: intervenants, isLoading: intervenantsLoading } = useIntervenants();
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: existingAffectation, isLoading: affectationLoading } = useAffectation(id || "");
  const createAffectation = useCreateAffectation();
  const updateAffectation = useUpdateAffectation();

  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    intervenant_id: "",
    client_id: "",
    chantier_id: "",
    date_debut: "",
    date_fin: "",
    notes: "",
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastClientId, setLastClientId] = useState("");
  const [isPreFilling, setIsPreFilling] = useState(false);

  // Get chantiers filtered by selected client
  const { data: chantiers } = useChantiersByClient(formData.client_id);

  // Load existing data when editing
  useEffect(() => {
    if (existingAffectation && !isInitialized) {
      setIsPreFilling(true);
      setTimeout(() => {
        setFormData({
          intervenant_id: existingAffectation.intervenant_id,
          client_id: existingAffectation.client_id,
          chantier_id: existingAffectation.chantier_id,
          date_debut: existingAffectation.date_debut || "",
          date_fin: existingAffectation.date_fin || "",
          notes: existingAffectation.notes || "",
        });
        setLastClientId(existingAffectation.client_id);
        setIsInitialized(true);
        setIsPreFilling(false);
      }, 100);
    }
  }, [existingAffectation, isInitialized]);

  // Reset chantier when client changes (only after initialization and if client actually changed)
  useEffect(() => {
    if (isInitialized && formData.client_id && formData.client_id !== lastClientId) {
      setFormData(prev => ({ ...prev, chantier_id: "" }));
      setLastClientId(formData.client_id);
    }
  }, [formData.client_id, isInitialized, lastClientId]);

  const errors = {
    intervenant_id: submitted && !formData.intervenant_id,
    client_id: submitted && !formData.client_id,
    chantier_id: submitted && !formData.chantier_id,
    date_debut: submitted && !formData.date_debut,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!formData.intervenant_id || !formData.client_id || !formData.chantier_id || !formData.date_debut) {
      return;
    }

    try {
      if (isEditing && id) {
        await updateAffectation.mutateAsync({
          id,
          ...formData,
          date_fin: formData.date_fin || null,
          notes: formData.notes || null,
        });
        toast.success("Affectation mise à jour avec succès");
      } else {
        await createAffectation.mutateAsync({
          ...formData,
          date_fin: formData.date_fin || null,
          notes: formData.notes || null,
        });
        toast.success("Affectation créée avec succès");
      }
      navigate("/rh/affectations");
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
      console.error(error);
    }
  };

  const isFormLoading = isEditing && (intervenantsLoading || clientsLoading || affectationLoading || isPreFilling);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
        <AppBreadcrumb items={[
          { label: "Ressources Humaines", path: "/rh" },
          { label: "Affectations", path: "/rh/affectations" },
          { label: isEditing ? "Modifier" : "Nouvelle" }
        ]} />

        <h1 className="text-2xl font-semibold text-foreground">
          {isEditing ? "Modifier l'Affectation" : "Nouvelle Affectation"}
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="relative">
            <FormLoadingOverlay 
              isLoading={isFormLoading} 
              message="Chargement des données de l'affectation..." 
            />
            <CardContent className="pt-6 space-y-6">
              {/* Technicien */}
              <div className="space-y-2">
                <Label htmlFor="intervenant_id">
                  Technicien <span className="text-red-700">*</span>
                </Label>
                <Select
                  value={formData.intervenant_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, intervenant_id: value }))}
                >
                  <SelectTrigger className={errors.intervenant_id ? "border-red-700 focus-visible:ring-red-700" : ""}>
                    <SelectValue placeholder="Sélectionner un technicien" />
                  </SelectTrigger>
                  <SelectContent>
                    {intervenants?.map(intervenant => (
                      <SelectItem key={intervenant.id} value={intervenant.id}>
                        {intervenant.prenom} {intervenant.nom} - {intervenant.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.intervenant_id && (
                  <p className="text-red-700 text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Le technicien est requis
                  </p>
                )}
              </div>

              {/* Client */}
              <div className="space-y-2">
                <Label htmlFor="client_id">
                  Client <span className="text-red-700">*</span>
                </Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
                >
                  <SelectTrigger className={errors.client_id ? "border-red-700 focus-visible:ring-red-700" : ""}>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.nom} - {client.ville || "N/A"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.client_id && (
                  <p className="text-red-700 text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Le client est requis
                  </p>
                )}
              </div>

              {/* Chantier - filtered by client */}
              <div className="space-y-2">
                <Label htmlFor="chantier_id">
                  Chantier <span className="text-red-700">*</span>
                </Label>
                <Select
                  value={formData.chantier_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, chantier_id: value }))}
                  disabled={!formData.client_id}
                >
                  <SelectTrigger className={errors.chantier_id ? "border-red-700 focus-visible:ring-red-700" : ""}>
                    <SelectValue placeholder={formData.client_id ? "Sélectionner un chantier" : "Sélectionnez d'abord un client"} />
                  </SelectTrigger>
                  <SelectContent>
                    {chantiers?.map(chantier => (
                      <SelectItem key={chantier.id} value={chantier.id}>
                        {chantier.nom}
                      </SelectItem>
                    ))}
                    {chantiers?.length === 0 && (
                      <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                        Aucun chantier pour ce client
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {errors.chantier_id && (
                  <p className="text-red-700 text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Le chantier est requis
                  </p>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_debut">
                    Date de début <span className="text-red-700">*</span>
                  </Label>
                  <Input
                    id="date_debut"
                    type="date"
                    value={formData.date_debut}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_debut: e.target.value }))}
                    className={errors.date_debut ? "border-red-700 focus-visible:ring-red-700" : ""}
                  />
                  {errors.date_debut && (
                    <p className="text-red-700 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      La date de début est requise
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_fin">Date de fin</Label>
                  <Input
                    id="date_fin"
                    type="date"
                    value={formData.date_fin}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_fin: e.target.value }))}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Instructions spéciales, équipements requis..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate("/rh/affectations")}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit"
                  disabled={createAffectation.isPending || updateAffectation.isPending}
                >
                  {(createAffectation.isPending || updateAffectation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {isEditing ? "Enregistrer" : "Créer l'affectation"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
    </div>
  );
}