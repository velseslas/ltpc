import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ArrowLeft, QrCode, Save, Loader2, FileText, Link2, Eye } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useParametresQRCode, useUpsertParametresQRCode } from "@/hooks/useParametres";

const QRCodeSettings = () => {
  const navigate = useNavigate();
  const { data: parametres, isLoading } = useParametresQRCode();
  const upsertParametres = useUpsertParametresQRCode();

  const [formData, setFormData] = useState({
    activer_qrcode: true,
    taille_qrcode: "medium",
    position_qrcode: "bas-droite",
    inclure_logo: false,
    couleur_qrcode: "#000000",
    url_base: "",
  });

  useEffect(() => {
    if (parametres) {
      setFormData({
        activer_qrcode: parametres.activer_qrcode,
        taille_qrcode: parametres.taille_qrcode,
        position_qrcode: parametres.position_qrcode,
        inclure_logo: parametres.inclure_logo,
        couleur_qrcode: parametres.couleur_qrcode,
        url_base: parametres.url_base || "",
      });
    }
  }, [parametres]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    await upsertParametres.mutateAsync({
      ...formData,
      url_base: formData.url_base || null,
    });
  };

  const getQRSize = () => {
    switch (formData.taille_qrcode) {
      case "small": return 80;
      case "medium": return 100;
      case "large": return 120;
      default: return 100;
    }
  };

  const generatePreviewUrl = () => {
    return formData.url_base ? `${formData.url_base}EC-001` : "https://exemple.dz/rapport/EC-001";
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/parametres")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              <span className="text-primary">QR Code</span>
            </h1>
            <p className="text-muted-foreground">
              Configuration automatique des QR codes pour documents PDF
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                <CardTitle>Configuration générale</CardTitle>
              </div>
              <CardDescription>
                Paramètres d'affichage des QR codes sur les rapports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Activer les QR codes</Label>
                  <p className="text-xs text-muted-foreground">
                    Ajouter automatiquement un QR code sur les rapports PDF
                  </p>
                </div>
                <Switch
                  checked={formData.activer_qrcode}
                  onCheckedChange={(checked) => handleChange("activer_qrcode", checked)}
                />
              </div>

              {formData.activer_qrcode && (
                <div className="space-y-2">
                  <Label htmlFor="url_base">URL de base</Label>
                  <Input
                    id="url_base"
                    value={formData.url_base}
                    onChange={(e) => handleChange("url_base", e.target.value)}
                    placeholder="https://laboratoire.dz/rapports/"
                  />
                  <p className="text-xs text-muted-foreground">
                    L'URL complète sera: {generatePreviewUrl()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {formData.activer_qrcode && (
            <>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-primary" />
                    <CardTitle>Options</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Inclure le logo</Label>
                    <Switch
                      checked={formData.inclure_logo}
                      onCheckedChange={(checked) => handleChange("inclure_logo", checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    <CardTitle>Apparence</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Select 
                        value={formData.position_qrcode} 
                        onValueChange={(value) => handleChange("position_qrcode", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="haut-droite">Haut droite</SelectItem>
                          <SelectItem value="haut-gauche">Haut gauche</SelectItem>
                          <SelectItem value="bas-droite">Bas droite</SelectItem>
                          <SelectItem value="bas-gauche">Bas gauche</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Taille</Label>
                      <Select 
                        value={formData.taille_qrcode} 
                        onValueChange={(value) => handleChange("taille_qrcode", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Petit</SelectItem>
                          <SelectItem value="medium">Moyen</SelectItem>
                          <SelectItem value="large">Grand</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="couleur_qrcode">Couleur du QR</Label>
                    <div className="flex gap-2">
                      <Input
                        id="couleur_qrcode"
                        type="color"
                        value={formData.couleur_qrcode}
                        onChange={(e) => handleChange("couleur_qrcode", e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={formData.couleur_qrcode}
                        onChange={(e) => handleChange("couleur_qrcode", e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Preview */}
        <div>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm sticky top-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>Aperçu</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {formData.activer_qrcode ? (
                <div className="flex flex-col items-center">
                  <div 
                    className="p-4 rounded-lg border bg-white"
                  >
                    <QRCodeSVG
                      value={generatePreviewUrl()}
                      size={getQRSize()}
                      bgColor="#FFFFFF"
                      fgColor={formData.couleur_qrcode}
                      level="M"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 text-center break-all">
                    {generatePreviewUrl()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Position: {formData.position_qrcode.replace("-", " ")}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <QrCode className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>QR Code désactivé</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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

export default QRCodeSettings;
