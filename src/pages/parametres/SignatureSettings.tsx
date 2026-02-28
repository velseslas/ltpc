import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, PenTool, Save, Loader2, Upload, Stamp, FileSignature, Users } from "lucide-react";
import { useIntervenants } from "@/hooks/useIntervenants";
import { useParametresSignature, useUpsertParametresSignature } from "@/hooks/useParametres";

const SignatureSettings = () => {
  const navigate = useNavigate();
  const { data: intervenants } = useIntervenants();
  const { data: parametres, isLoading } = useParametresSignature();
  const upsertParametres = useUpsertParametresSignature();

  const [formData, setFormData] = useState({
    signature_auto: false,
    cachet_auto: false,
    position_signature: "bas-droite",
    position_cachet: "bas-gauche",
    inclure_date: true,
    inclure_nom: true,
  });

  useEffect(() => {
    if (parametres) {
      setFormData({
        signature_auto: parametres.signature_auto,
        cachet_auto: parametres.cachet_auto,
        position_signature: parametres.position_signature,
        position_cachet: parametres.position_cachet,
        inclure_date: parametres.inclure_date,
        inclure_nom: parametres.inclure_nom,
      });
    }
  }, [parametres]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    await upsertParametres.mutateAsync(formData);
  };

  const techniciensWithSignature = intervenants?.filter(i => i.signature_url) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/parametres")}
          className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500">
            <PenTool className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              <span className="text-primary">Signature</span>
            </h1>
            <p className="text-muted-foreground">
              Gestion des signatures électroniques et cachets numériques
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration signature */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-primary" />
              <CardTitle>Signature sur les rapports</CardTitle>
            </div>
            <CardDescription>
              Configurez l'affichage des signatures sur les documents PDF
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Signature automatique</Label>
              <Switch
                checked={formData.signature_auto}
                onCheckedChange={(checked) => handleChange("signature_auto", checked)}
              />
            </div>

            {formData.signature_auto && (
              <div className="space-y-2">
                <Label>Position de la signature</Label>
                <Select 
                  value={formData.position_signature} 
                  onValueChange={(value) => handleChange("position_signature", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bas-droite">Bas droite</SelectItem>
                    <SelectItem value="bas-gauche">Bas gauche</SelectItem>
                    <SelectItem value="bas-centre">Bas centre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label>Inclure la date</Label>
              <Switch
                checked={formData.inclure_date}
                onCheckedChange={(checked) => handleChange("inclure_date", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Inclure le nom</Label>
              <Switch
                checked={formData.inclure_nom}
                onCheckedChange={(checked) => handleChange("inclure_nom", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuration cachet */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Stamp className="h-5 w-5 text-primary" />
              <CardTitle>Cachet de l'entreprise</CardTitle>
            </div>
            <CardDescription>
              Configurez l'affichage du cachet sur les documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Afficher le cachet</Label>
              <Switch
                checked={formData.cachet_auto}
                onCheckedChange={(checked) => handleChange("cachet_auto", checked)}
              />
            </div>

            {formData.cachet_auto && (
              <div className="space-y-2">
                <Label>Position du cachet</Label>
                <Select 
                  value={formData.position_cachet} 
                  onValueChange={(value) => handleChange("position_cachet", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bas-gauche">Bas gauche</SelectItem>
                    <SelectItem value="bas-droite">Bas droite</SelectItem>
                    <SelectItem value="bas-centre">Bas centre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                Le cachet est configuré dans les paramètres de l'entreprise.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/parametres/entreprise")}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Modifier le cachet
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Liste des signatures */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Signatures des employés</CardTitle>
            </div>
            <CardDescription>
              Employés ayant une signature configurée
            </CardDescription>
          </CardHeader>
          <CardContent>
            {techniciensWithSignature.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {techniciensWithSignature.map((tech) => (
                  <div 
                    key={tech.id}
                    className="p-4 rounded-lg bg-muted/30 text-center"
                  >
                    <div className="w-full h-16 bg-white rounded mb-2 flex items-center justify-center">
                      <img 
                        src={tech.signature_url!} 
                        alt={`Signature ${tech.prenom} ${tech.nom}`}
                        className="max-h-14 max-w-full object-contain"
                      />
                    </div>
                    <p className="text-sm font-medium">
                      {tech.prenom} {tech.nom}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tech.role}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <PenTool className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucune signature configurée</p>
                <Button 
                  variant="link" 
                  className="mt-2"
                  onClick={() => navigate("/rh/employes")}
                >
                  Configurer les signatures des employés
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={upsertParametres.isPending} className="gap-2">
          {upsertParametres.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Enregistrer
        </Button>
      </div>
    </div>
  );
};

export default SignatureSettings;
