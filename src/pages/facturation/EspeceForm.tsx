import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useCreatePaiementEspece } from "@/hooks/useFacturation";
import { useClients } from "@/hooks/useClients";
import { toast } from "sonner";

export default function EspeceForm() {
  const navigate = useNavigate();
  const { data: clients } = useClients();
  const createMutation = useCreatePaiementEspece();
  const [form, setForm] = useState({
    client_id: "", montant: "", date_paiement: new Date().toISOString().split("T")[0],
    numero_recu: "", statut: "recu", observations: ""
  });

  const handleSubmit = async () => {
    if (!form.montant) { toast.error("Le montant est obligatoire"); return; }
    try {
      await createMutation.mutateAsync({
        ...form,
        client_id: form.client_id || null,
        montant: parseFloat(form.montant),
      });
      toast.success("Paiement enregistré");
      navigate("/facturation/espece");
    } catch { toast.error("Erreur"); }
  };

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Facturation", path: "/facturation" },
        { label: "Espèce", path: "/facturation/espece" },
        { label: "Nouveau Paiement" },
      ]} />

      <Card>
        <CardHeader><CardTitle>Nouveau Paiement en Espèce</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Client</Label>
            <Select value={form.client_id} onValueChange={v => setForm(p => ({ ...p, client_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
              <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2"><Label>Montant (DA) *</Label><Input type="number" value={form.montant} onChange={e => setForm(p => ({ ...p, montant: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Date paiement *</Label><Input type="date" value={form.date_paiement} onChange={e => setForm(p => ({ ...p, date_paiement: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>N° Reçu</Label><Input value={form.numero_recu} onChange={e => setForm(p => ({ ...p, numero_recu: e.target.value }))} /></div>
          </div>
          <div className="grid gap-2">
            <Label>Statut</Label>
            <Select value={form.statut} onValueChange={v => setForm(p => ({ ...p, statut: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recu">Reçu</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2"><Label>Observations</Label><Textarea value={form.observations} onChange={e => setForm(p => ({ ...p, observations: e.target.value }))} /></div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>Enregistrer</Button>
            <Button variant="outline" onClick={() => navigate("/facturation/espece")}>Annuler</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
