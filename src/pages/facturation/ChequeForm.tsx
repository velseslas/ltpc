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
import { useCreatePaiementCheque } from "@/hooks/useFacturationCheque";
import { useClients } from "@/hooks/useClients";
import { toast } from "sonner";

export default function ChequeForm() {
  const navigate = useNavigate();
  const { data: clients } = useClients();
  const createMutation = useCreatePaiementCheque();
  const [form, setForm] = useState({
    client_id: "", montant: "", date_emission: new Date().toISOString().split("T")[0],
    date_echeance: "", numero_cheque: "", banque: "", statut: "en_attente", observations: ""
  });

  const handleSubmit = async () => {
    if (!form.numero_cheque) { toast.error("Le N° chèque est obligatoire"); return; }
    if (!form.montant) { toast.error("Le montant est obligatoire"); return; }
    try {
      await createMutation.mutateAsync({
        client_id: form.client_id || null,
        montant: parseFloat(form.montant),
        date_emission: form.date_emission,
        date_echeance: form.date_echeance || null,
        numero_cheque: form.numero_cheque,
        banque: form.banque || null,
        statut: form.statut,
        observations: form.observations || null,
      });
      toast.success("Paiement enregistré");
      navigate("/facturation/cheque");
    } catch { toast.error("Erreur"); }
  };

  return (
    <div data-essai-mobile className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Facturation", path: "/facturation" },
        { label: "Chèque", path: "/facturation/cheque" },
        { label: "Nouveau Paiement" },
      ]} />

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader><CardTitle className="flex items-center gap-3"><BackButton to="/facturation/cheque" />Nouveau Paiement par Chèque</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Client</Label>
              <Select value={form.client_id} onValueChange={v => setForm(p => ({ ...p, client_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>N° Chèque *</Label><Input value={form.numero_cheque} onChange={e => setForm(p => ({ ...p, numero_cheque: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Banque</Label><Input value={form.banque} onChange={e => setForm(p => ({ ...p, banque: e.target.value }))} placeholder="Nom de la banque" /></div>
            <div className="grid gap-2"><Label>Montant (DA) *</Label><Input type="number" value={form.montant} onChange={e => setForm(p => ({ ...p, montant: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2"><Label>Date émission *</Label><DateInput value={form.date_emission} onChange={e => setForm(p => ({ ...p, date_emission: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Date échéance</Label><DateInput value={form.date_echeance} onChange={e => setForm(p => ({ ...p, date_echeance: e.target.value }))} /></div>
            <div className="grid gap-2">
              <Label>Statut</Label>
              <Select value={form.statut} onValueChange={v => setForm(p => ({ ...p, statut: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="encaisse">Encaissé</SelectItem>
                  <SelectItem value="rejete">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2"><Label>Observations</Label><Textarea value={form.observations} onChange={e => setForm(p => ({ ...p, observations: e.target.value }))} /></div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>Enregistrer</Button>
            <Button variant="outline" onClick={() => navigate("/facturation/cheque")}>Annuler</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
