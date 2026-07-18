import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useCreatePoste, useUpdatePoste, usePoste } from "@/hooks/usePostes";
import { useToast } from "@/hooks/use-toast";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";

const departements = [
  "Technique",
  "Ingénierie",
  "Administration",
  "Direction",
  "Qualité",
  "Commercial",
  "Logistique",
];

const niveauxExperience = [
  "Débutant",
  "Junior (1-3 ans)",
  "Confirmé (3-5 ans)",
  "Senior (5-10 ans)",
  "Expert (+10 ans)",
];

const typesContrat = ["CDI", "CDD", "Stage", "Alternance", "Freelance"];

export default function PosteForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEditing = !!id;

  const { data: poste, isLoading: isLoadingPoste } = usePoste(id || "");
  const createPoste = useCreatePoste();
  const updatePoste = useUpdatePoste();

  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    departement: "",
    salaire_moyen: "",
    competences: "",
    niveau_experience: "",
    type_contrat: "",
    notes: "",
  });

  useEffect(() => {
    if (poste) {
      setFormData({
        nom: poste.nom || "",
        description: poste.description || "",
        departement: poste.departement || "",
        salaire_moyen: poste.salaire_moyen?.toString() || "",
        competences: poste.competences?.join(", ") || "",
        niveau_experience: poste.niveau_experience || "",
        type_contrat: poste.type_contrat || "",
        notes: poste.notes || "",
      });
    }
  }, [poste]);

  const errors = {
    nom: submitted && !formData.nom.trim(),
    departement: submitted && !formData.departement,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!formData.nom.trim() || !formData.departement) {
      return;
    }

    const competencesArray = formData.competences
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const data = {
      nom: formData.nom.trim(),
      description: formData.description.trim() || null,
      departement: formData.departement || null,
      salaire_moyen: (() => {
        if (!formData.salaire_moyen) return null;
        const parsed = parseInt(formData.salaire_moyen);
        return isNaN(parsed) ? null : parsed;
      })(),
      competences: competencesArray.length > 0 ? competencesArray : null,
      niveau_experience: formData.niveau_experience || null,
      type_contrat: formData.type_contrat || null,
      notes: formData.notes.trim() || null,
    };

    try {
      if (isEditing) {
        await updatePoste.mutateAsync({ id, ...data });
        toast({
          title: "Poste modifié",
          description: "Le poste a été modifié avec succès.",
        });
      } else {
        await createPoste.mutateAsync(data);
        toast({
          title: "Poste créé",
          description: "Le poste a été créé avec succès.",
        });
      }
      navigate("/rh/postes");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  if (isEditing && isLoadingPoste) {
    return (
      <div data-essai-mobile className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
        <AppBreadcrumb items={[
          { label: "Ressources Humaines", path: "/rh" },
          { label: "Postes", path: "/rh/postes" },
          { label: isEditing ? "Modifier" : "Nouveau" }
        ]} />

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
            onClick={() => navigate("/rh/postes")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Modifier le Poste" : "Créer un Nouveau Poste"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="border-border/50">
            <CardContent className="p-6 space-y-6">
              <h2 className="text-lg font-semibold">Informations Générales</h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">
                    Nom du poste <span className="text-red-700">*</span>
                  </Label>
                  <Input
                    id="nom"
                    placeholder="Ex: Technicien Laboratoire Mobile"
                    value={formData.nom}
                    onChange={(e) =>
                      setFormData({ ...formData, nom: e.target.value })
                    }
                    className={`bg-card ${errors.nom ? "border-red-700 focus-visible:ring-red-700" : ""}`}
                  />
                  {errors.nom && (
                    <p className="text-red-700 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Le nom du poste est requis
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description du poste</Label>
                  <Textarea
                    id="description"
                    placeholder="Description détaillée des responsabilités..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="bg-card min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="departement">
                      Département <span className="text-red-700">*</span>
                    </Label>
                    <Select
                      value={formData.departement}
                      onValueChange={(value) =>
                        setFormData({ ...formData, departement: value })
                      }
                    >
                      <SelectTrigger className={`bg-card ${errors.departement ? "border-red-700 focus-visible:ring-red-700" : ""}`}>
                        <SelectValue placeholder="Sélectionner un département" />
                      </SelectTrigger>
                      <SelectContent>
                        {departements.map((dep) => (
                          <SelectItem key={dep} value={dep}>
                            {dep}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.departement && (
                      <p className="text-red-700 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Le département est requis
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salaire">Salaire moyen (DA)</Label>
                    <Input
                      id="salaire"
                      type="number"
                      placeholder="Ex: 80000"
                      value={formData.salaire_moyen}
                      onChange={(e) =>
                        setFormData({ ...formData, salaire_moyen: e.target.value })
                      }
                      className="bg-card"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6 space-y-6">
              <h2 className="text-lg font-semibold">Exigences du Poste</h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="competences">Compétences requises</Label>
                  <Textarea
                    id="competences"
                    placeholder="Ex: Essais matériaux, Contrôle qualité, Rapport technique (séparées par des virgules)"
                    value={formData.competences}
                    onChange={(e) =>
                      setFormData({ ...formData, competences: e.target.value })
                    }
                    className="bg-card min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="niveau">Niveau d'expérience</Label>
                    <Select
                      value={formData.niveau_experience}
                      onValueChange={(value) =>
                        setFormData({ ...formData, niveau_experience: value })
                      }
                    >
                      <SelectTrigger className="bg-card">
                        <SelectValue placeholder="Sélectionner le niveau" />
                      </SelectTrigger>
                      <SelectContent>
                        {niveauxExperience.map((niveau) => (
                          <SelectItem key={niveau} value={niveau}>
                            {niveau}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contrat">Type de contrat</Label>
                    <Select
                      value={formData.type_contrat}
                      onValueChange={(value) =>
                        setFormData({ ...formData, type_contrat: value })
                      }
                    >
                      <SelectTrigger className="bg-card">
                        <SelectValue placeholder="Type de contrat" />
                      </SelectTrigger>
                      <SelectContent>
                        {typesContrat.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes additionnelles</Label>
                  <Textarea
                    id="notes"
                    placeholder="Informations supplémentaires sur le poste..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="bg-card min-h-[100px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/rh/postes")}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createPoste.isPending || updatePoste.isPending}
            >
              {(createPoste.isPending || updatePoste.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {isEditing ? "Modifier le poste" : "Créer le poste"}
            </Button>
          </div>
        </form>
    </div>
  );
}