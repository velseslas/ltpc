import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Building2, Upload, Save, Loader2, Stamp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEntreprise, useUpdateEntreprise, uploadLogo, uploadCachet } from "@/hooks/useEntreprise";
import { toast } from "sonner";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";

const Entreprise = () => {
  const navigate = useNavigate();
  const { data: entreprise, isLoading } = useEntreprise();
  const updateEntreprise = useUpdateEntreprise();
  
  const [formData, setFormData] = useState({
    nom: "",
    numero_autorisation: "",
    date_autorisation: "",
    siege_social: "",
    annexe: "",
    telephone: "",
    email: "",
    site_web: "",
    logo_url: "",
    cachet_url: "",
  });
  
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCachet, setIsUploadingCachet] = useState(false);

  useEffect(() => {
    if (entreprise) {
      setFormData({
        nom: entreprise.nom || "",
        numero_autorisation: entreprise.numero_autorisation || "",
        date_autorisation: (entreprise as any).date_autorisation || "",
        siege_social: entreprise.siege_social || "",
        annexe: entreprise.annexe || "",
        telephone: entreprise.telephone || "",
        email: entreprise.email || "",
        site_web: entreprise.site_web || "",
        logo_url: entreprise.logo_url || "",
        cachet_url: entreprise.cachet_url || "",
      });
    }
  }, [entreprise]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingLogo(true);
      const url = await uploadLogo(file);
      setFormData(prev => ({ ...prev, logo_url: url }));
      // Auto-save logo to database
      await updateEntreprise.mutateAsync({
        id: entreprise?.id,
        updates: { logo_url: url },
      });
      toast.success("Logo téléchargé et enregistré avec succès");
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Erreur lors du téléchargement du logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleCachetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingCachet(true);
      const url = await uploadCachet(file);
      setFormData(prev => ({ ...prev, cachet_url: url }));
      // Auto-save cachet to database
      await updateEntreprise.mutateAsync({
        id: entreprise?.id,
        updates: { cachet_url: url },
      });
      toast.success("Cachet téléchargé et enregistré avec succès");
    } catch (error) {
      console.error("Error uploading cachet:", error);
      toast.error("Erreur lors du téléchargement du cachet");
    } finally {
      setIsUploadingCachet(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nom.trim()) {
      toast.error("Le nom de l'entreprise est obligatoire");
      return;
    }

    // Convert empty strings to null for optional fields (keeps nom as string)
    const cleanedData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [
        key,
        key === "nom" ? value : (value === "" ? null : value),
      ])
    );

    try {
      await updateEntreprise.mutateAsync({
        id: entreprise?.id,
        updates: cleanedData,
      });
      toast.success("Informations enregistrées avec succès");
    } catch (error) {
      console.error("Error saving entreprise:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <AppBreadcrumb 
        items={[
          { label: "Paramètres", path: "/parametres" },
          { label: "Entreprise" }
        ]} 
      />

      <div className="mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/parametres")}
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Informations de l'<span className="text-primary text-glow">entreprise</span>
            </h1>
            <p className="text-muted-foreground">
              Configurez les informations de votre entreprise qui apparaîtront sur les documents officiels
            </p>
            {entreprise?.siege_social && (
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-medium">Siège Social : </span>{entreprise.siege_social}
              </p>
            )}
            {entreprise?.annexe && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Annexe : </span>{entreprise.annexe}
              </p>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-border bg-card animate-fade-in [animation-delay:100ms]">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-[240px_240px_1fr] gap-8">
              {/* Logo Section */}
              <div className="flex flex-col items-center">
                <Label className="mb-2 text-sm font-medium">Logo de l'entreprise</Label>
                <div className="w-40 h-40 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center bg-muted/30 overflow-hidden">
                  {formData.logo_url ? (
                    <img 
                      src={formData.logo_url} 
                      alt="Logo entreprise" 
                      className="w-full h-full object-contain p-4"
                    />
                  ) : (
                    <>
                      <Building2 className="w-12 h-12 text-muted-foreground/50 mb-2" />
                      <span className="text-xs text-muted-foreground">Logo</span>
                    </>
                  )}
                </div>
                <label htmlFor="logo-upload">
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={isUploadingLogo}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="mt-3 cursor-pointer"
                    disabled={isUploadingLogo}
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    {isUploadingLogo ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Télécharger
                  </Button>
                </label>
              </div>

              {/* Cachet Section */}
              <div className="flex flex-col items-center">
                <Label className="mb-2 text-sm font-medium">Cachet de l'entreprise</Label>
                <div className="w-40 h-40 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center bg-muted/30 overflow-hidden">
                  {formData.cachet_url ? (
                    <img 
                      src={formData.cachet_url} 
                      alt="Cachet entreprise" 
                      className="w-full h-full object-contain p-4"
                    />
                  ) : (
                    <>
                      <Stamp className="w-12 h-12 text-muted-foreground/50 mb-2" />
                      <span className="text-xs text-muted-foreground">Cachet</span>
                    </>
                  )}
                </div>
                <label htmlFor="cachet-upload">
                  <input
                    id="cachet-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCachetUpload}
                    disabled={isUploadingCachet}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="mt-3 cursor-pointer"
                    disabled={isUploadingCachet}
                    onClick={() => document.getElementById('cachet-upload')?.click()}
                  >
                    {isUploadingCachet ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Télécharger
                  </Button>
                </label>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom de l'entreprise</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => handleChange("nom", e.target.value)}
                    placeholder="Laboratoire Béton Pro"
                    className="bg-muted/30 border-border"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="numero_autorisation">Numéro d'autorisation</Label>
                    <Input
                      id="numero_autorisation"
                      value={formData.numero_autorisation}
                      onChange={(e) => handleChange("numero_autorisation", e.target.value)}
                      placeholder="35"
                      className="bg-muted/30 border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_autorisation">Date d'autorisation</Label>
                    <Input
                      id="date_autorisation"
                      type="date"
                      value={formData.date_autorisation}
                      onChange={(e) => handleChange("date_autorisation", e.target.value)}
                      className="bg-muted/30 border-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siege_social">Siège social</Label>
                  <Input
                    id="siege_social"
                    value={formData.siege_social}
                    onChange={(e) => handleChange("siege_social", e.target.value)}
                    placeholder="123 Avenue des Matériaux, 75001 Paris"
                    className="bg-muted/30 border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="annexe">Annexe</Label>
                  <Input
                    id="annexe"
                    value={formData.annexe}
                    onChange={(e) => handleChange("annexe", e.target.value)}
                    placeholder="456 Boulevard Principal, Alger 16000"
                    className="bg-muted/30 border-border"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="telephone">Téléphone</Label>
                    <Input
                      id="telephone"
                      value={formData.telephone}
                      onChange={(e) => handleChange("telephone", e.target.value)}
                      placeholder="0123456789"
                      className="bg-muted/30 border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="contact@betonpro.fr"
                      className="bg-muted/30 border-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site_web">Site web</Label>
                  <Input
                    id="site_web"
                    value={formData.site_web}
                    onChange={(e) => handleChange("site_web", e.target.value)}
                    placeholder="https://www.betonpro.fr"
                    className="bg-muted/30 border-border"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end mt-6 animate-fade-in [animation-delay:200ms]">
          <Button 
            type="submit" 
            disabled={updateEntreprise.isPending}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            {updateEntreprise.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </>
  );
};

export default Entreprise;
