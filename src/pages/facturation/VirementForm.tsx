import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useCreatePaiementVirement, useFactures } from "@/hooks/useFacturation";
import { useClients } from "@/hooks/useClients";
import { toast } from "sonner";

export default function VirementForm() {
  const navigate = useNavigate();
  const { data: clients } = useClients();
  const { data: factures } = useFactures();
  const createMutation = useCreatePaiementVirement();
  const [form, setForm] = useState({
    client_id: "", facture_id: "", montant: "",
    date_virement: new Date().toISOString().split("T")[0],
    reference_virement: "", banque: "", statut: "en_attente", observations: ""
  });

  const handleSubmit = async () => {
    if (!form.montant) { toast.error("Le montant est obligatoire"); return; }
    try {
      await createMutation.mutateAsync({
        ...form,
        client_id: form.client_id || null,
        facture_id: form.facture_id || null,
        montant: parseFloat(form.montant),
      });
      toast.success("Virement enregistré");
      navigate("/facturation/virements");
    } catch { toast.error("Erreur"); }
  };

  return (
    <div data-essai-mobile className="space-y-6">
      <AppBreadcrumb items={[{ label: "Facturation", path: "/facturation" }, { label: "Virements", path: "/facturation/virements" }, { label: "Nouveau" }]} />
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader><CardTitle className="flex items-center gap-3"><BackButton to="/facturation/virements" />Nouveau Virement</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Client</Label>
              <Select value={form.client_id} onValueChange={v => setForm(p => ({ ...p, client_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{clients?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Facture liée</Label>
              <Select value={form.facture_id} onValueChange={v => setForm(p => ({ ...p, facture_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{factures?.map((f: any) => <SelectItem key={f.id} value={f.id}>{f.numero}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2"><Label>Montant (DA) *</Label><Input type="number" value={form.montant} onChange={e => setForm(p => ({ ...p, montant: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Date virement</Label><DateInput value={form.date_virement} onChange={e => setForm(p => ({ ...p, date_virement: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Référence</Label><Input value={form.reference_virement} onChange={e => setForm(p => ({ ...p, reference_virement: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Banque</Label><Input value={form.banque} onChange={e => setForm(p => ({ ...p, banque: e.target.value }))} /></div>
            <div className="grid gap-2">
              <Label>Statut</Label>
              <Select value={form.statut} onValueChange={v => setForm(p => ({ ...p, statut: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="recu">Reçu</SelectItem>
                  <SelectItem value="rejete">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2"><Label>Observations</Label><Textarea value={form.observations} onChange={e => setForm(p => ({ ...p, observations: e.target.value }))} /></div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>Enregistrer</Button>
            <Button variant="outline" onClick={() => navigate("/facturation/virements")}>Annuler</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
