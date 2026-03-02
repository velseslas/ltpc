import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useCreateBonCommande } from "@/hooks/useFacturation";
import { useClients } from "@/hooks/useClients";
import { useChantiers } from "@/hooks/useChantiers";
import { toast } from "sonner";

export default function BonCommandeForm() {
  const navigate = useNavigate();
  const { data: clients } = useClients();
  const { data: chantiers } = useChantiers();
  const createMutation = useCreateBonCommande();
  const [form, setForm] = useState({
    numero: "", client_id: "", chantier_id: "",
    date_commande: new Date().toISOString().split("T")[0],
    montant_ht: "", taux_tva: "19",
    statut: "en_attente", observations: ""
  });

  const montantHT = parseFloat(form.montant_ht) || 0;
  const tauxTVA = parseFloat(form.taux_tva) || 0;
  const montantTVA = montantHT * tauxTVA / 100;
  const montantTTC = montantHT + montantTVA;

  const handleSubmit = async () => {
    if (!form.numero) { toast.error("Le numéro est obligatoire"); return; }
    try {
      await createMutation.mutateAsync({
        ...form,
        client_id: form.client_id || null,
        chantier_id: form.chantier_id || null,
        montant_ht: montantHT, taux_tva: tauxTVA,
        montant_tva: montantTVA, montant_ttc: montantTTC,
      });
      toast.success("Bon de commande créé");
      navigate("/facturation/bons-commande");
    } catch { toast.error("Erreur"); }
  };

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[{ label: "Facturation", path: "/facturation" }, { label: "Bons de commande", path: "/facturation/bons-commande" }, { label: "Nouveau" }]} />
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader><CardTitle className="flex items-center gap-3"><BackButton to="/facturation/bons-commande" />Nouveau Bon de Commande</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>N° BC *</Label><Input value={form.numero} onChange={e => setForm(p => ({ ...p, numero: e.target.value }))} /></div>
            <div className="grid gap-2">
              <Label>Statut</Label>
              <Select value={form.statut} onValueChange={v => setForm(p => ({ ...p, statut: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="confirme">Confirmé</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="termine">Terminé</SelectItem>
                  <SelectItem value="annule">Annulé</SelectItem>
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
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2"><Label>Montant HT (DA) *</Label><Input type="number" value={form.montant_ht} onChange={e => setForm(p => ({ ...p, montant_ht: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>TVA (%)</Label><Input type="number" value={form.taux_tva} onChange={e => setForm(p => ({ ...p, taux_tva: e.target.value }))} /></div>
            <div className="grid gap-2">
              <Label>Montant TTC</Label>
              <div className="h-10 flex items-center px-3 rounded-md border border-input bg-muted/50 text-foreground font-medium">{montantTTC.toLocaleString()} DA</div>
            </div>
          </div>
          <div className="grid gap-2"><Label>Date commande</Label><Input type="date" value={form.date_commande} onChange={e => setForm(p => ({ ...p, date_commande: e.target.value }))} /></div>
          <div className="grid gap-2"><Label>Observations</Label><Textarea value={form.observations} onChange={e => setForm(p => ({ ...p, observations: e.target.value }))} /></div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>Enregistrer</Button>
            <Button variant="outline" onClick={() => navigate("/facturation/bons-commande")}>Annuler</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
