import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ArrowLeft, Shield, Save, Loader2, Lock, Key, Eye, Clock, AlertTriangle } from "lucide-react";
import { useParametresSecurite, useUpsertParametresSecurite } from "@/hooks/useParametres";

const Securite = () => {
  const navigate = useNavigate();
  const { data: parametres, isLoading } = useParametresSecurite();
  const upsertParametres = useUpsertParametresSecurite();

  const [formData, setFormData] = useState({
    longueur_mot_passe: 8,
    exiger_majuscule: true,
    exiger_chiffre: true,
    exiger_special: false,
    duree_session: 480,
    tentatives_max: 5,
    duree_blocage: 30,
    activer_2fa: false,
    journal_connexions: true,
    journal_modifications: true,
  });

  useEffect(() => {
    if (parametres) {
      setFormData({
        longueur_mot_passe: parametres.longueur_mot_passe,
        exiger_majuscule: parametres.exiger_majuscule,
        exiger_chiffre: parametres.exiger_chiffre,
        exiger_special: parametres.exiger_special,
        duree_session: parametres.duree_session,
        tentatives_max: parametres.tentatives_max,
        duree_blocage: parametres.duree_blocage,
        activer_2fa: parametres.activer_2fa,
        journal_connexions: parametres.journal_connexions,
        journal_modifications: parametres.journal_modifications,
      });
    }
  }, [parametres]);

  const handleChange = (field: string, value: string | number | boolean) => {
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
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-500">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              <span className="text-primary">Sécurité</span>
            </h1>
            <p className="text-muted-foreground">
              Paramètres de sécurité et d'authentification
            </p>
          </div>
        </div>
      </div>

      {/* Alert */}
      <Card className="border-amber-500/50 bg-amber-500/10">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
          <div>
            <p className="font-medium text-amber-500">Important</p>
            <p className="text-sm text-muted-foreground">
              Les modifications de sécurité peuvent affecter l'accès des utilisateurs. 
              Assurez-vous de bien comprendre les implications avant d'enregistrer.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Politique de mot de passe */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <CardTitle>Politique de mot de passe</CardTitle>
            </div>
            <CardDescription>
              Définissez les exigences pour les mots de passe utilisateurs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="longueur_mot_passe">Longueur minimale</Label>
              <Select 
                value={formData.longueur_mot_passe.toString()} 
                onValueChange={(value) => handleChange("longueur_mot_passe", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 caractères</SelectItem>
                  <SelectItem value="8">8 caractères</SelectItem>
                  <SelectItem value="10">10 caractères</SelectItem>
                  <SelectItem value="12">12 caractères</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Exiger une majuscule</Label>
                <Switch
                  checked={formData.exiger_majuscule}
                  onCheckedChange={(checked) => handleChange("exiger_majuscule", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Exiger un chiffre</Label>
                <Switch
                  checked={formData.exiger_chiffre}
                  onCheckedChange={(checked) => handleChange("exiger_chiffre", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Exiger un caractère spécial</Label>
                <Switch
                  checked={formData.exiger_special}
                  onCheckedChange={(checked) => handleChange("exiger_special", checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gestion des sessions */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle>Gestion des sessions</CardTitle>
            </div>
            <CardDescription>
              Configurez la durée et le comportement des sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="duree_session">Durée de session (minutes)</Label>
              <Input
                id="duree_session"
                type="number"
                min="5"
                value={formData.duree_session}
                onChange={(e) => handleChange("duree_session", parseInt(e.target.value) || 60)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Authentification */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle>Authentification</CardTitle>
            </div>
            <CardDescription>
              Options de sécurité pour la connexion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Authentification à deux facteurs (2FA)</Label>
                <p className="text-xs text-muted-foreground">
                  Exiger une vérification supplémentaire
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-amber-500 border-amber-500/50">
                  Bientôt
                </Badge>
                <Switch
                  checked={formData.activer_2fa}
                  onCheckedChange={(checked) => handleChange("activer_2fa", checked)}
                  disabled
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tentatives_max">Tentatives max</Label>
                <Input
                  id="tentatives_max"
                  type="number"
                  min="1"
                  value={formData.tentatives_max}
                  onChange={(e) => handleChange("tentatives_max", parseInt(e.target.value) || 5)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duree_blocage">Blocage (minutes)</Label>
                <Input
                  id="duree_blocage"
                  type="number"
                  min="1"
                  value={formData.duree_blocage}
                  onChange={(e) => handleChange("duree_blocage", parseInt(e.target.value) || 15)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Journalisation */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              <CardTitle>Journalisation</CardTitle>
            </div>
            <CardDescription>
              Suivi des activités et audit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Journaliser les connexions</Label>
              <Switch
                checked={formData.journal_connexions}
                onCheckedChange={(checked) => handleChange("journal_connexions", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Journaliser les modifications</Label>
              <Switch
                checked={formData.journal_modifications}
                onCheckedChange={(checked) => handleChange("journal_modifications", checked)}
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
          Enregistrer les modifications
        </Button>
      </div>
    </div>
  );
};

export default Securite;
