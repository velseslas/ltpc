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
import { ArrowLeft, Mountain, Loader2, AlertCircle } from "lucide-react";
import { useCarriere, useCreateCarriere, useUpdateCarriere } from "@/hooks/useCarrieres";
import { useToast } from "@/hooks/use-toast";
import { wilayas } from "@/data/wilayas";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";

const CarriereForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEditing = !!id;

  const { data: carriere, isLoading: isLoadingCarriere } = useCarriere(id || "");
  const createCarriere = useCreateCarriere();
  const updateCarriere = useUpdateCarriere();

  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    contact: "",
    email: "",
    telephone: "",
    adresse: "",
    ville: "",
  });

  useEffect(() => {
    if (carriere) {
      setFormData({
        nom: carriere.nom || "",
        contact: carriere.contact || "",
        email: carriere.email || "",
        telephone: carriere.telephone || "",
        adresse: carriere.adresse || "",
        ville: carriere.ville || "",
      });
    }
  }, [carriere]);

  const errors = {
    nom: submitted && !formData.nom.trim(),
    adresse: submitted && !formData.adresse.trim(),
    ville: submitted && !formData.ville,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!formData.nom.trim() || !formData.adresse.trim() || !formData.ville) {
      return;
    }

    try {
      if (isEditing && id) {
        await updateCarriere.mutateAsync({ id, ...formData });
        toast({ title: "Succès", description: "La carrière a été modifiée avec succès." });
      } else {
        await createCarriere.mutateAsync({ ...formData, type_agregat: null });
        toast({ title: "Succès", description: "La carrière a été créée avec succès." });
      }
      navigate("/intervenant/producteurs/carriere");
    } catch (error) {
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
    }
  };

  if (isEditing && isLoadingCarriere) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <AppBreadcrumb items={[
        { label: "Intervenants", path: "/intervenant" },
        { label: "Producteurs", path: "/intervenant/producteurs" },
        { label: "Carrières", path: "/intervenant/producteurs/carriere" },
        { label: isEditing ? "Modifier" : "Nouvelle carrière" }
      ]} />
    <div className="max-w-2xl mx-auto">
        <div className="mb-8">
           <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => navigate("/intervenant/producteurs/carriere")} className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Mountain className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                {isEditing ? "Modifier la" : "Nouvelle"}{" "}
                <span className="text-primary text-glow">Carrière</span>
              </h1>
              <p className="text-muted-foreground text-sm">
                {isEditing ? "Modifiez les informations" : "Ajoutez une nouvelle carrière"}
              </p>
            </div>
          </div>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Informations</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom <span className="text-red-700">*</span></Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="Nom de la carrière"
                    className={`bg-background/50 ${errors.nom ? "border-red-700 focus-visible:ring-red-700" : ""}`}
                  />
                  {errors.nom && (
                    <p className="text-red-700 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Le nom est requis
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact</Label>
                  <Input
                    id="contact"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="Personne de contact"
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemple.com"
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    placeholder="0X XX XX XX XX"
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adresse">Commune <span className="text-red-700">*</span></Label>
                  <Input
                    id="adresse"
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    placeholder="Commune"
                    className={`bg-background/50 ${errors.adresse ? "border-red-700 focus-visible:ring-red-700" : ""}`}
                  />
                  {errors.adresse && (
                    <p className="text-red-700 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      La commune est requise
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ville">Wilaya <span className="text-red-700">*</span></Label>
                  <Select
                    value={formData.ville}
                    onValueChange={(value) => setFormData({ ...formData, ville: value })}
                  >
                    <SelectTrigger className={`bg-background/50 ${errors.ville ? "border-red-700 focus-visible:ring-red-700" : ""}`}>
                      <SelectValue placeholder="Sélectionner une wilaya" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {wilayas.map((wilaya) => (
                        <SelectItem key={wilaya.code} value={wilaya.nom}>
                          {wilaya.code} - {wilaya.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.ville && (
                    <p className="text-red-700 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      La wilaya est requise
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-border mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/intervenant/producteurs/carriere")}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="gradient-primary text-primary-foreground"
                  disabled={createCarriere.isPending || updateCarriere.isPending}
                >
                  {(createCarriere.isPending || updateCarriere.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </form>
          </CardContent>
      </Card>
    </div>
    </>
  );
};

export default CarriereForm;
