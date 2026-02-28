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
import { ArrowLeft, Building, Loader2, AlertCircle } from "lucide-react";
import { useCentraleBeton, useCreateCentraleBeton, useUpdateCentraleBeton } from "@/hooks/useCentralesBeton";
import { useToast } from "@/hooks/use-toast";
import { wilayas } from "@/data/wilayas";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";

const CentraleBetonForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEditing = !!id;

  const { data: centrale, isLoading: isLoadingCentrale } = useCentraleBeton(id || "");
  const createCentrale = useCreateCentraleBeton();
  const updateCentrale = useUpdateCentraleBeton();

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
    if (centrale) {
      setFormData({
        nom: centrale.nom || "",
        contact: centrale.contact || "",
        email: centrale.email || "",
        telephone: centrale.telephone || "",
        adresse: centrale.adresse || "",
        ville: centrale.ville || "",
      });
    }
  }, [centrale]);

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
        await updateCentrale.mutateAsync({ id, ...formData });
        toast({ title: "Succès", description: "La centrale a été modifiée avec succès." });
      } else {
        await createCentrale.mutateAsync({ ...formData, capacite: null });
        toast({ title: "Succès", description: "La centrale a été créée avec succès." });
      }
      navigate("/intervenant/producteurs/centrale");
    } catch (error) {
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
    }
  };

  if (isEditing && isLoadingCentrale) {
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
        { label: "Centrales à béton", path: "/intervenant/producteurs/centrale" },
        { label: isEditing ? "Modifier" : "Nouvelle centrale" }
      ]} />
    <div className="max-w-2xl mx-auto">
        <div className="mb-8">
           <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => navigate("/intervenant/producteurs/centrale")} className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Building className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                {isEditing ? "Modifier la" : "Nouvelle"}{" "}
                <span className="text-primary text-glow">Centrale à Béton</span>
              </h1>
              <p className="text-muted-foreground text-sm">
                {isEditing ? "Modifiez les informations" : "Ajoutez une nouvelle centrale à béton"}
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
                    placeholder="Nom de la centrale"
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
                  onClick={() => navigate("/intervenant/producteurs/centrale")}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="gradient-primary text-primary-foreground"
                  disabled={createCentrale.isPending || updateCentrale.isPending}
                >
                  {(createCentrale.isPending || updateCentrale.isPending) && (
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

export default CentraleBetonForm;
