import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Bell, Save, Loader2, Mail, Smartphone } from "lucide-react";
import { useParametresNotifications, useUpsertParametresNotifications } from "@/hooks/useParametres";

const NotificationsSettings = () => {
  const navigate = useNavigate();
  const { data: parametres, isLoading } = useParametresNotifications();
  const upsertParametres = useUpsertParametresNotifications();

  const [formData, setFormData] = useState({
    email_nouveaux_essais: true,
    email_resultats: true,
    email_alertes: true,
    email_rapports: false,
    push_nouveaux_essais: false,
    push_resultats: true,
    push_alertes: true,
    push_rappels: false,
    sms_alertes_critiques: false,
    sms_rappels_urgents: false,
  });

  useEffect(() => {
    if (parametres) {
      setFormData({
        email_nouveaux_essais: parametres.email_nouveaux_essais,
        email_resultats: parametres.email_resultats,
        email_alertes: parametres.email_alertes,
        email_rapports: parametres.email_rapports,
        push_nouveaux_essais: parametres.push_nouveaux_essais,
        push_resultats: parametres.push_resultats,
        push_alertes: parametres.push_alertes,
        push_rappels: parametres.push_rappels,
        sms_alertes_critiques: parametres.sms_alertes_critiques,
        sms_rappels_urgents: parametres.sms_rappels_urgents,
      });
    }
  }, [parametres]);

  const handleChange = (field: string, value: boolean) => {
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
          variant="outline"
          size="icon"
          onClick={() => navigate("/parametres")}
          className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              <span className="text-primary">Notifications</span>
            </h1>
            <p className="text-muted-foreground">
              Configurer les alertes et les notifications
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications Email */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle>Notifications par email</CardTitle>
            </div>
            <CardDescription>
              Choisissez les notifications à recevoir par email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Nouveaux essais</Label>
              <Switch
                checked={formData.email_nouveaux_essais}
                onCheckedChange={(checked) => handleChange("email_nouveaux_essais", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Résultats d'essais</Label>
              <Switch
                checked={formData.email_resultats}
                onCheckedChange={(checked) => handleChange("email_resultats", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Alertes</Label>
              <Switch
                checked={formData.email_alertes}
                onCheckedChange={(checked) => handleChange("email_alertes", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Rapports</Label>
              <Switch
                checked={formData.email_rapports}
                onCheckedChange={(checked) => handleChange("email_rapports", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications Push */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>Notifications push</CardTitle>
            </div>
            <CardDescription>
              Notifications dans l'application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Nouveaux essais</Label>
              <Switch
                checked={formData.push_nouveaux_essais}
                onCheckedChange={(checked) => handleChange("push_nouveaux_essais", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Résultats</Label>
              <Switch
                checked={formData.push_resultats}
                onCheckedChange={(checked) => handleChange("push_resultats", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Alertes</Label>
              <Switch
                checked={formData.push_alertes}
                onCheckedChange={(checked) => handleChange("push_alertes", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Rappels</Label>
              <Switch
                checked={formData.push_rappels}
                onCheckedChange={(checked) => handleChange("push_rappels", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications SMS */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              <CardTitle>Notifications SMS</CardTitle>
            </div>
            <CardDescription>
              Recevoir les alertes urgentes par SMS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <Label>Alertes critiques</Label>
                  <p className="text-xs text-muted-foreground">
                    Recevoir les alertes critiques par SMS
                  </p>
                </div>
                <Switch
                  checked={formData.sms_alertes_critiques}
                  onCheckedChange={(checked) => handleChange("sms_alertes_critiques", checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <Label>Rappels urgents</Label>
                  <p className="text-xs text-muted-foreground">
                    Rappels urgents par SMS
                  </p>
                </div>
                <Switch
                  checked={formData.sms_rappels_urgents}
                  onCheckedChange={(checked) => handleChange("sms_rappels_urgents", checked)}
                />
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

export default NotificationsSettings;
