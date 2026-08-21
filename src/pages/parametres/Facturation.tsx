import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Receipt, Save, Loader2 } from "lucide-react";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useParametresFacturation, useUpsertParametresFacturation } from "@/hooks/useParametres";

const Facturation = () => {
  const navigate = useNavigate();
  const { data: parametres, isLoading } = useParametresFacturation();
  const upsertParametres = useUpsertParametresFacturation();

  const [formData, setFormData] = useState({
    prefixe_facture: "FAC",
    prochain_numero_facture: 1,
    prefixe_devis: "DEV",
    prochain_numero_devis: 1,
    delai_paiement: 30,
    penalite_retard: 1.5,
    mention_legale: "",
    conditions_paiement: "",
    banque_nom: "",
    banque_iban: "",
    banque_bic: "",
    banque_rib: "",
  });

  useEffect(() => {
    if (parametres) {
      setFormData({
        prefixe_facture: parametres.prefixe_facture || "FAC",
        prochain_numero_facture: parametres.prochain_numero_facture || 1,
        prefixe_devis: parametres.prefixe_devis || "DEV",
        prochain_numero_devis: parametres.prochain_numero_devis || 1,
        delai_paiement: parametres.delai_paiement || 30,
        penalite_retard: parametres.penalite_retard || 1.5,
        mention_legale: parametres.mention_legale || "",
        conditions_paiement: parametres.conditions_paiement || "",
        banque_nom: parametres.banque_nom || "",
        banque_iban: parametres.banque_iban || "",
        banque_bic: parametres.banque_bic || "",
        banque_rib: parametres.banque_rib || "",
      });
    }
  }, [parametres]);

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    await upsertParametres.mutateAsync(formData);
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
        { label: "Facturation" },
      ]} />

      {/* Header */}
      <div className="flex items-start gap-3 sm:gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/parametres")}
          className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500">
            <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground break-words">
              <span className="text-primary">Facturation</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Modèles de facture, conditions de paiement et paramètres comptables
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Numérotation */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Numérotation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prefixe_facture">Préfixe facture</Label>
                <Input
                  id="prefixe_facture"
                  value={formData.prefixe_facture}
                  onChange={(e) => handleChange("prefixe_facture", e.target.value)}
                  placeholder="FAC"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prochain_numero_facture">Prochain numéro</Label>
                <Input
                  id="prochain_numero_facture"
                  type="number"
                  min="1"
                  value={formData.prochain_numero_facture}
                  onChange={(e) => handleChange("prochain_numero_facture", parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prefixe_devis">Préfixe devis</Label>
                <Input
                  id="prefixe_devis"
                  value={formData.prefixe_devis}
                  onChange={(e) => handleChange("prefixe_devis", e.target.value)}
                  placeholder="DEV"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prochain_numero_devis">Prochain numéro</Label>
                <Input
                  id="prochain_numero_devis"
                  type="number"
                  min="1"
                  value={formData.prochain_numero_devis}
                  onChange={(e) => handleChange("prochain_numero_devis", parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conditions de paiement */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Conditions de paiement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delai_paiement">Délai de paiement (jours)</Label>
              <Select 
                value={formData.delai_paiement.toString()} 
                onValueChange={(value) => handleChange("delai_paiement", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Paiement immédiat</SelectItem>
                  <SelectItem value="15">15 jours</SelectItem>
                  <SelectItem value="30">30 jours</SelectItem>
                  <SelectItem value="45">45 jours</SelectItem>
                  <SelectItem value="60">60 jours</SelectItem>
                  <SelectItem value="90">90 jours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="penalite_retard">Pénalité de retard (%)</Label>
              <Input
                id="penalite_retard"
                type="number"
                step="0.1"
                min="0"
                value={formData.penalite_retard}
                onChange={(e) => handleChange("penalite_retard", parseFloat(e.target.value) || 0)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Informations bancaires */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Informations bancaires</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="banque_nom">Banque</Label>
              <Input
                id="banque_nom"
                value={formData.banque_nom}
                onChange={(e) => handleChange("banque_nom", e.target.value)}
                placeholder="Nom de la banque"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="banque_iban">IBAN</Label>
              <Input
                id="banque_iban"
                value={formData.banque_iban}
                onChange={(e) => handleChange("banque_iban", e.target.value)}
                placeholder="XX00 0000 0000 0000 0000 0000 000"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="banque_bic">BIC</Label>
                <Input
                  id="banque_bic"
                  value={formData.banque_bic}
                  onChange={(e) => handleChange("banque_bic", e.target.value)}
                  placeholder="XXXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banque_rib">RIB</Label>
                <Input
                  id="banque_rib"
                  value={formData.banque_rib}
                  onChange={(e) => handleChange("banque_rib", e.target.value)}
                  placeholder="00000 00000 00000000000 00"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mentions légales */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Mentions légales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mention_legale">Mentions légales</Label>
              <Textarea
                id="mention_legale"
                value={formData.mention_legale}
                onChange={(e) => handleChange("mention_legale", e.target.value)}
                placeholder="Conditions générales de vente..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conditions_paiement">Conditions de paiement</Label>
              <Textarea
                id="conditions_paiement"
                value={formData.conditions_paiement}
                onChange={(e) => handleChange("conditions_paiement", e.target.value)}
                placeholder="Conditions de règlement..."
                rows={3}
              />
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

export default Facturation;
