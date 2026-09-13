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
import { useCreatePaiementEspece } from "@/hooks/useFacturation";
import { useClients } from "@/hooks/useClients";
import { useChantiersByClient } from "@/hooks/useChantiers";
import { DocumentRepository } from "@/lib/repositories";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";

export default function EspeceForm() {
  const navigate = useNavigate();
  const { data: clients } = useClients();
  const createMutation = useCreatePaiementEspece();
  const [form, setForm] = useState({
    client_id: "", chantier_id: "", montant: "", date_paiement: new Date().toISOString().split("T")[0],
    numero_recu: "", statut: "recu", observations: "", recu_url: ""
  });
  const [uploading, setUploading] = useState(false);

  const { data: chantiers } = useChantiersByClient(form.client_id || "");

  const handleClientChange = (v: string) => {
    setForm(p => ({ ...p, client_id: v, chantier_id: "" }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `recus/recu-${Date.now()}.${ext}`;
      const { publicUrl } = await DocumentRepository.uploadAdministratif(path, file);
      setForm(p => ({ ...p, recu_url: publicUrl }));
      toast.success("Reçu uploadé");
    } catch { toast.error("Erreur lors de l'upload"); }
    finally { setUploading(false); }
  };

  const handleSubmit = async () => {
    if (!form.montant) { toast.error("Le montant est obligatoire"); return; }
    try {
      await createMutation.mutateAsync({
        ...form,
        client_id: form.client_id || null,
        chantier_id: form.chantier_id || null,
        montant: parseFloat(form.montant),
        recu_url: form.recu_url || null,
      });
      toast.success("Paiement enregistré");
      navigate("/facturation/espece");
    } catch { toast.error("Erreur"); }
  };

  return (
    <div data-essai-mobile className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Facturation", path: "/facturation" },
        { label: "Espèce", path: "/facturation/espece" },
        { label: "Nouveau Paiement" },
      ]} />

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader><CardTitle className="flex items-center gap-3"><BackButton to="/facturation/espece" />Nouveau Paiement en Espèce</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Client</Label>
              <Select value={form.client_id} onValueChange={handleClientChange}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Chantier</Label>
              <Select value={form.chantier_id} onValueChange={v => setForm(p => ({ ...p, chantier_id: v }))} disabled={!form.client_id}>
                <SelectTrigger><SelectValue placeholder={form.client_id ? "Sélectionner un chantier" : "Sélectionnez d'abord un client"} /></SelectTrigger>
                <SelectContent>{chantiers?.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2"><Label>Montant (DA) *</Label><Input type="number" value={form.montant} onChange={e => setForm(p => ({ ...p, montant: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Date paiement *</Label><DateInput value={form.date_paiement} onChange={e => setForm(p => ({ ...p, date_paiement: e.target.value }))} /></div>
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
          <div className="grid gap-2">
            <Label>Scanner le reçu</Label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span className="text-sm">{form.recu_url ? "Changer le fichier" : "Choisir un fichier"}</span>
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
              {form.recu_url && <span className="text-sm text-emerald-500">✓ Fichier uploadé</span>}
            </div>
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
