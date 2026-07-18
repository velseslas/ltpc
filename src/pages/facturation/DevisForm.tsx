import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useCreateDevis, useDevis } from "@/hooks/useFacturation";
import { useClients } from "@/hooks/useClients";
import { useChantiers } from "@/hooks/useChantiers";
import { toast } from "sonner";

export default function DevisForm() {
  const navigate = useNavigate();
  const { data: clients } = useClients();
  const { data: chantiers } = useChantiers();
  const { data: devis } = useDevis();
  const createMutation = useCreateDevis();
  const [form, setForm] = useState({
    numero: "", client_id: "", chantier_id: "",
    date_emission: new Date().toISOString().split("T")[0],
    date_validite: "", statut: "brouillon", observations: ""
  });

  // Auto-generate numero
  useEffect(() => {
    if (devis) {
      const year = new Date().getFullYear();
      const prefix = `DEV-${year}-`;
      const existing = devis
        .filter((d: any) => d.numero?.startsWith(prefix))
        .map((d: any) => parseInt(d.numero.replace(prefix, "")) || 0);
      const next = (existing.length > 0 ? Math.max(...existing) : 0) + 1;
      setForm(p => ({ ...p, numero: `${prefix}${String(next).padStart(3, "0")}` }));
    }
  }, [devis]);

  const handleSubmit = async () => {
    if (!form.numero) { toast.error("Le numéro est obligatoire"); return; }
    try {
      await createMutation.mutateAsync({
        ...form,
        client_id: form.client_id || null,
        chantier_id: form.chantier_id || null,
        date_validite: form.date_validite || null,
        montant_ht: 0,
        taux_tva: 0,
        montant_tva: 0,
        montant_ttc: 0,
      });
      toast.success("Devis créé");
      navigate("/facturation/devis");
    } catch { toast.error("Erreur"); }
  };

  return (
    <div data-essai-mobile className="space-y-6">
      <AppBreadcrumb items={[{ label: "Facturation", path: "/facturation" }, { label: "Devis", path: "/facturation/devis" }, { label: "Nouveau" }]} />
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader><CardTitle className="flex items-center gap-3"><BackButton to="/facturation/devis" />Nouveau Devis</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>N° Devis</Label>
              <Input value={form.numero} readOnly className="bg-muted/50" />
            </div>
            <div className="grid gap-2">
              <Label>Statut</Label>
              <Select value={form.statut} onValueChange={v => setForm(p => ({ ...p, statut: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="brouillon">Brouillon</SelectItem>
                  <SelectItem value="envoye">Envoyé</SelectItem>
                  <SelectItem value="accepte">Accepté</SelectItem>
                  <SelectItem value="refuse">Refusé</SelectItem>
                  <SelectItem value="expire">Expiré</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Client</Label>
              <Select value={form.client_id} onValueChange={v => setForm(p => ({ ...p, client_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{clients?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Chantier</Label>
              <Select value={form.chantier_id} onValueChange={v => setForm(p => ({ ...p, chantier_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{chantiers?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Date émission *</Label><Input type="date" value={form.date_emission} onChange={e => setForm(p => ({ ...p, date_emission: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Date validité</Label><Input type="date" value={form.date_validite} onChange={e => setForm(p => ({ ...p, date_validite: e.target.value }))} /></div>
          </div>
          <div className="grid gap-2"><Label>Observations</Label><Textarea value={form.observations} onChange={e => setForm(p => ({ ...p, observations: e.target.value }))} /></div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>Enregistrer</Button>
            <Button variant="outline" onClick={() => navigate("/facturation/devis")}>Annuler</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
