import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Settings, Save, Loader2, Globe, Moon, Sun, Palette, Clock, Monitor } from "lucide-react";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useParametresSysteme, useUpsertParametresSysteme } from "@/hooks/useParametres";

const SystemeSettings = () => {
  const navigate = useNavigate();
  const { data: parametres, isLoading } = useParametresSysteme();
  const upsertParametres = useUpsertParametresSysteme();

  const [formData, setFormData] = useState({
    langue: "fr",
    fuseau_horaire: "Africa/Algiers",
    format_date: "DD/MM/YYYY",
    format_nombre: "fr-FR",
    theme: "dark",
    couleur_accent: "blue",
    logo_header: true,
    nom_application: "",
  });

  useEffect(() => {
    if (parametres) {
      setFormData({
        langue: parametres.langue,
        fuseau_horaire: parametres.fuseau_horaire,
        format_date: parametres.format_date,
        format_nombre: parametres.format_nombre,
        theme: parametres.theme,
        couleur_accent: parametres.couleur_accent,
        logo_header: parametres.logo_header,
        nom_application: parametres.nom_application || "",
      });
    }
  }, [parametres]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    await upsertParametres.mutateAsync({
      ...formData,
      nom_application: formData.nom_application || null,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <AppBreadcrumb items={[
        { label: "Paramètres", path: "/parametres" },
        { label: "Système" },
      ]} />

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
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              <span className="text-primary">Système</span>
            </h1>
            <p className="text-muted-foreground">
              Configuration générale du système
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Langue et région */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle>Langue et région</CardTitle>
            </div>
            <CardDescription>
              Paramètres de localisation de l'application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Langue</Label>
              <Select 
                value={formData.langue} 
                onValueChange={(value) => handleChange("langue", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">
                    <div className="flex items-center gap-2">
                      <span>🇫🇷</span> Français
                    </div>
                  </SelectItem>
                  <SelectItem value="ar">
                    <div className="flex items-center gap-2">
                      <span>🇩🇿</span> العربية
                    </div>
                  </SelectItem>
                  <SelectItem value="en">
                    <div className="flex items-center gap-2">
                      <span>🇬🇧</span> English
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fuseau horaire</Label>
              <Select 
                value={formData.fuseau_horaire} 
                onValueChange={(value) => handleChange("fuseau_horaire", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Algiers">Alger (UTC+1)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (UTC+1/+2)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Format date et heure */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle>Format date et nombre</CardTitle>
            </div>
            <CardDescription>
              Personnalisez l'affichage des dates et nombres
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Format de date</Label>
              <Select 
                value={formData.format_date} 
                onValueChange={(value) => handleChange("format_date", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">23/01/2025 (DD/MM/YYYY)</SelectItem>
                  <SelectItem value="MM/DD/YYYY">01/23/2025 (MM/DD/YYYY)</SelectItem>
                  <SelectItem value="YYYY-MM-DD">2025-01-23 (YYYY-MM-DD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Format de nombre</Label>
              <Select 
                value={formData.format_nombre} 
                onValueChange={(value) => handleChange("format_nombre", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr-FR">1 234,56 (Français)</SelectItem>
                  <SelectItem value="en-US">1,234.56 (Anglais)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Apparence */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle>Apparence</CardTitle>
            </div>
            <CardDescription>
              Personnalisez l'apparence de l'interface
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Thème</Label>
              <div className="flex gap-2">
                <Button
                  variant={formData.theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleChange("theme", "light")}
                  className="flex-1 gap-2"
                >
                  <Sun className="h-4 w-4" />
                  Clair
                </Button>
                <Button
                  variant={formData.theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleChange("theme", "dark")}
                  className="flex-1 gap-2"
                >
                  <Moon className="h-4 w-4" />
                  Sombre
                </Button>
                <Button
                  variant={formData.theme === "system" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleChange("theme", "system")}
                  className="flex-1 gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  Auto
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Couleur d'accent</Label>
              <div className="flex gap-2 flex-wrap">
                {["cyan", "blue", "violet", "pink", "orange", "green"].map((color) => (
                  <button
                    key={color}
                    onClick={() => handleChange("couleur_accent", color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.couleur_accent === color ? "border-foreground" : "border-transparent"
                    }`}
                    style={{ 
                      backgroundColor: color === "cyan" ? "#00d4ff" 
                        : color === "blue" ? "#3b82f6"
                        : color === "violet" ? "#8b5cf6"
                        : color === "pink" ? "#ec4899"
                        : color === "orange" ? "#f97316"
                        : "#22c55e"
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Logo dans l'en-tête</Label>
              <Switch
                checked={formData.logo_header}
                onCheckedChange={(checked) => handleChange("logo_header", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Aide et support */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Informations</CardTitle>
            <CardDescription>
              Informations sur l'application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Version</span>
                <Badge variant="outline">1.0.0</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Build</span>
                <span className="font-mono text-xs">2025.01.23</span>
              </div>
            </div>
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

export default SystemeSettings;
