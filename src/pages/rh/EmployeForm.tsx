import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignatureUpload } from "@/components/rh/SignatureUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, X, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useIntervenant,
  useCreateIntervenant,
  useUpdateIntervenant,
} from "@/hooks/useIntervenants";
import { usePostes } from "@/hooks/usePostes";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";

const EmployeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEditing = !!id;

  const { data: employe, isLoading: isLoadingEmploye } = useIntervenant(id || "");
  const { data: postes } = usePostes();
  const createEmploye = useCreateIntervenant();
  const updateEmploye = useUpdateIntervenant();

  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    date_naissance: "",
    cin: "",
    cnas: "",
    email: "",
    telephone: "",
    adresse: "",
    role: "Technicien",
    poste_id: "",
    specialite: "",
    date_embauche: "",
    salaire: "",
    notes: "",
    departement: "",
    statut: "active",
    signature_url: "" as string | null,
  });

  useEffect(() => {
    if (employe) {
      setFormData({
        nom: employe.nom || "",
        prenom: employe.prenom || "",
        date_naissance: (employe as any).date_naissance || "",
        cin: (employe as any).cin || "",
        cnas: (employe as any).cnas || "",
        email: employe.email || "",
        telephone: employe.telephone || "",
        adresse: (employe as any).adresse || "",
        role: employe.role || "Technicien",
        poste_id: (employe as any).poste_id || "",
        specialite: (employe as any).specialite || "",
        date_embauche: employe.date_embauche || "",
        salaire: (employe as any).salaire?.toString() || "",
        notes: (employe as any).notes || "",
        departement: employe.departement || "",
        statut: employe.statut || "active",
        signature_url: (employe as any).signature_url || null,
      });
    }
  }, [employe]);

  const errors = {
    nom: submitted && !formData.nom.trim(),
    prenom: submitted && !formData.prenom.trim(),
    email: submitted && !formData.email.trim(),
    telephone: submitted && !formData.telephone.trim(),
    poste_id: submitted && !formData.poste_id,
    date_embauche: submitted && !formData.date_embauche,
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!formData.nom.trim() || !formData.prenom.trim() || !formData.email.trim() || !formData.telephone.trim() || !formData.poste_id || !formData.date_embauche) {
      return;
    }

    try {
      const dataToSubmit = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email || null,
        telephone: formData.telephone || null,
        role: formData.role,
        departement: formData.departement || null,
        statut: formData.statut,
        date_embauche: formData.date_embauche || null,
        date_naissance: formData.date_naissance || null,
        cin: formData.cin || null,
        cnas: formData.cnas || null,
        adresse: formData.adresse || null,
        poste_id: formData.poste_id || null,
        specialite: formData.specialite || null,
        salaire: formData.salaire ? parseInt(formData.salaire) : null,
        notes: formData.notes || null,
        signature_url: formData.signature_url || null,
      };

      if (isEditing && id) {
        await updateEmploye.mutateAsync({ id, ...dataToSubmit });
        toast({
          title: "Employé modifié",
          description: "Les informations ont été mises à jour avec succès.",
        });
      } else {
        await createEmploye.mutateAsync(dataToSubmit);
        toast({
          title: "Employé créé",
          description: "Le nouvel employé a été ajouté avec succès.",
        });
      }
      navigate("/rh/employes");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement.",
        variant: "destructive",
      });
    }
  };

  const isSubmitting = createEmploye.isPending || updateEmploye.isPending;

  if (isEditing && isLoadingEmploye) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
        <AppBreadcrumb items={[
          { label: "Ressources Humaines", path: "/rh" },
          { label: "Employés", path: "/rh/employes" },
          { label: isEditing ? "Modifier" : "Nouveau" }
        ]} />

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
            onClick={() => navigate("/rh/employes")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isEditing ? "Modifier l'employé" : "Nouvel employé"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing
                ? "Modifiez les informations de l'employé"
                : "Ajoutez un nouvel employé à l'équipe"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Informations Personnelles */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Informations Personnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nom">
                      Nom <span className="text-red-700">*</span>
                    </Label>
                    <Input
                      id="nom"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      placeholder="Nom"
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
                    <Label htmlFor="prenom">
                      Prénom <span className="text-red-700">*</span>
                    </Label>
                    <Input
                      id="prenom"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleChange}
                      placeholder="Prénom"
                      className={`bg-background/50 ${errors.prenom ? "border-red-700 focus-visible:ring-red-700" : ""}`}
                    />
                    {errors.prenom && (
                      <p className="text-red-700 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Le prénom est requis
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_naissance">Date de naissance</Label>
                  <Input
                    id="date_naissance"
                    name="date_naissance"
                    type="date"
                    value={formData.date_naissance}
                    onChange={handleChange}
                    className="bg-background/50"
                  />
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cin">CIN</Label>
                    <Input
                      id="cin"
                      name="cin"
                      value={formData.cin}
                      onChange={handleChange}
                      placeholder="Numéro CIN"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnas">CNAS</Label>
                    <Input
                      id="cnas"
                      name="cnas"
                      value={formData.cnas}
                      onChange={handleChange}
                      placeholder="Numéro CNAS"
                      className="bg-background/50"
                    />
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-red-700">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@exemple.com"
                      className={`bg-background/50 ${errors.email ? "border-red-700 focus-visible:ring-red-700" : ""}`}
                    />
                    {errors.email && (
                      <p className="text-red-700 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        L'email est requis
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telephone">
                      Téléphone <span className="text-red-700">*</span>
                    </Label>
                    <Input
                      id="telephone"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      placeholder="0555123456"
                      className={`bg-background/50 ${errors.telephone ? "border-red-700 focus-visible:ring-red-700" : ""}`}
                    />
                    {errors.telephone && (
                      <p className="text-red-700 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Le téléphone est requis
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adresse">Adresse</Label>
                  <Textarea
                    id="adresse"
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleChange}
                    placeholder="Adresse complète..."
                    className="bg-background/50 min-h-[80px]"
                  />
                </div>

                {/* Signature Upload */}
                <SignatureUpload
                  currentSignatureUrl={formData.signature_url}
                  onSignatureChange={(url) => setFormData(prev => ({ ...prev, signature_url: url }))}
                  employeId={id}
                />
              </CardContent>
            </Card>

            {/* Informations Professionnelles */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Informations Professionnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="poste_id">
                    Poste <span className="text-red-700">*</span>
                  </Label>
                  <Select
                    value={formData.poste_id}
                    onValueChange={(value) => handleSelectChange("poste_id", value)}
                  >
                    <SelectTrigger className={`bg-background/50 ${errors.poste_id ? "border-red-700 focus-visible:ring-red-700" : ""}`}>
                      <SelectValue placeholder="Sélectionner un poste" />
                    </SelectTrigger>
                    <SelectContent>
                      {postes?.map((poste) => (
                        <SelectItem key={poste.id} value={poste.id}>
                          {poste.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.poste_id && (
                    <p className="text-red-700 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Le poste est requis
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialite">Spécialité</Label>
                  <Select
                    value={formData.specialite}
                    onValueChange={(value) => handleSelectChange("specialite", value)}
                  >
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Sélectionner une spécialité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Béton et Agrégats">Béton et Agrégats</SelectItem>
                      <SelectItem value="Essais Mécaniques">Essais Mécaniques</SelectItem>
                      <SelectItem value="Contrôle Qualité">Contrôle Qualité</SelectItem>
                      <SelectItem value="Gestion Laboratoire">Gestion Laboratoire</SelectItem>
                      <SelectItem value="Essais Géotechniques">Essais Géotechniques</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date_embauche">
                      Date d'embauche <span className="text-red-700">*</span>
                    </Label>
                    <Input
                      id="date_embauche"
                      name="date_embauche"
                      type="date"
                      value={formData.date_embauche}
                      onChange={handleChange}
                      className={`bg-background/50 ${errors.date_embauche ? "border-red-700 focus-visible:ring-red-700" : ""}`}
                    />
                    {errors.date_embauche && (
                      <p className="text-red-700 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        La date d'embauche est requise
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salaire">Salaire (DA)</Label>
                    <Input
                      id="salaire"
                      name="salaire"
                      type="number"
                      value={formData.salaire}
                      onChange={handleChange}
                      placeholder="Ex: 80000"
                      className="bg-background/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="statut">Statut</Label>
                  <Select
                    value={formData.statut}
                    onValueChange={(value) => handleSelectChange("statut", value)}
                  >
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="mission">En mission</SelectItem>
                      <SelectItem value="conge">En congé</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Informations supplémentaires..."
                    className="bg-background/50 min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/rh/employes")}
              disabled={isSubmitting}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Enregistrer
            </Button>
          </div>
        </form>
    </div>
  );
};

export default EmployeForm;