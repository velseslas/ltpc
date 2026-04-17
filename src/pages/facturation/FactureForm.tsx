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
import { useCreateFacture, useFactures } from "@/hooks/useFacturation";
import { useClients } from "@/hooks/useClients";
import { useChantiers } from "@/hooks/useChantiers";
import { toast } from "sonner";

export default function FactureForm() {
  const navigate = useNavigate();
  const { data: clients } = useClients();
  const { data: chantiers } = useChantiers();
  const { data: factures } = useFactures();
  const createMutation = useCreateFacture();
  const [form, setForm] = useState({
    numero: "", client_id: "", chantier_id: "",
    date_emission: new Date().toISOString().split("T")[0],
    date_echeance: "", statut: "impayee", observations: ""
  });

  // Auto-generate numero
  useEffect(() => {
    if (factures) {
      const year = new Date().getFullYear();
      const prefix = `FAC-${year}-`;
      const existing = factures
        .filter((f: any) => f.numero?.startsWith(prefix))
        .map((f: any) => parseInt(f.numero.replace(prefix, "")) || 0);
      const next = (existing.length > 0 ? Math.max(...existing) : 0) + 1;
      setForm(p => ({ ...p, numero: `${prefix}${String(next).padStart(3, "0")}` }));
    }
  }, [factures]);

  const handleSubmit = async () => {
    if (!form.numero) { toast.error("Le numéro est obligatoire"); return; }
    try {
      await createMutation.mutateAsync({
        ...form,
        client_id: form.client_id || null,
        chantier_id: form.chantier_id || null,
        date_echeance: form.date_echeance || null,
        montant_ht: 0,
        taux_tva: 0,
        montant_tva: 0,
        montant_ttc: 0,
      });
      toast.success("Facture créée");
      navigate("/facturation/factures");
    } catch { toast.error("Erreur"); }
  };

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[{ label: "Facturation", path: "/facturation" }, { label: "Factures", path: "/facturation/factures" }, { label: "Nouvelle" }]} />
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader><CardTitle className="flex items-center gap-3"><BackButton to="/facturation/factures" />Nouvelle Facture</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>N° Facture</Label>
              <Input value={form.numero} readOnly className="bg-muted/50" />
            </div>
            <div className="grid gap-2">
              <Label>Statut</Label>
              <Select value={form.statut} onValueChange={v => setForm(p => ({ ...p, statut: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="payee">Payée</SelectItem>
                  <SelectItem value="impayee">Impayée</SelectItem>
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
            <div className="grid gap-2"><Label>Date échéance</Label><Input type="date" value={form.date_echeance} onChange={e => setForm(p => ({ ...p, date_echeance: e.target.value }))} /></div>
          </div>
          <div className="grid gap-2"><Label>Observations</Label><Textarea value={form.observations} onChange={e => setForm(p => ({ ...p, observations: e.target.value }))} /></div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>Enregistrer</Button>
            <Button variant="outline" onClick={() => navigate("/facturation/factures")}>Annuler</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
