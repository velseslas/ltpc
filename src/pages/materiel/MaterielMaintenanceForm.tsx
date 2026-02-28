import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useCreateMaintenanceMateriel, useMaterielList } from "@/hooks/useMaterielLaboratoire";
import { toast } from "sonner";

export default function MaterielMaintenanceForm() {
  const navigate = useNavigate();
  const { data: materiels } = useMaterielList();
  const createMutation = useCreateMaintenanceMateriel();
  const [form, setForm] = useState({
    materiel_id: "", type_maintenance: "preventive",
    date_maintenance: new Date().toISOString().split("T")[0],
    date_prochaine_maintenance: "", description: "", cout: "",
    prestataire: "", statut: "planifie", observations: ""
  });

  const handleSubmit = async () => {
    if (!form.materiel_id) { toast.error("Sélectionnez un matériel"); return; }
    try {
      await createMutation.mutateAsync({
        ...form,
        cout: form.cout ? parseFloat(form.cout) : null,
        date_prochaine_maintenance: form.date_prochaine_maintenance || null,
      });
      toast.success("Maintenance ajoutée");
      navigate("/materiel/maintenance");
    } catch { toast.error("Erreur"); }
  };

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Matériel Laboratoire", path: "/materiel" },
        { label: "Maintenance Matériel", path: "/materiel/maintenance" },
        { label: "Nouvelle Maintenance" },
      ]} />

      <Card>
        <CardHeader><CardTitle>Nouvelle Maintenance</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Matériel *</Label>
            <Select value={form.materiel_id} onValueChange={v => setForm(p => ({ ...p, materiel_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>{materiels?.map(m => <SelectItem key={m.id} value={m.id}>{m.nom} {m.reference ? `(${m.reference})` : ""}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={form.type_maintenance} onValueChange={v => setForm(p => ({ ...p, type_maintenance: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventive">Préventive</SelectItem>
                  <SelectItem value="corrective">Corrective</SelectItem>
                  <SelectItem value="curative">Curative</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Statut</Label>
              <Select value={form.statut} onValueChange={v => setForm(p => ({ ...p, statut: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planifie">Planifié</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="termine">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Date maintenance *</Label><Input type="date" value={form.date_maintenance} onChange={e => setForm(p => ({ ...p, date_maintenance: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Prochaine maintenance</Label><Input type="date" value={form.date_prochaine_maintenance} onChange={e => setForm(p => ({ ...p, date_prochaine_maintenance: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Prestataire</Label><Input value={form.prestataire} onChange={e => setForm(p => ({ ...p, prestataire: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Coût (DA)</Label><Input type="number" value={form.cout} onChange={e => setForm(p => ({ ...p, cout: e.target.value }))} /></div>
          </div>
          <div className="grid gap-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
          <div className="grid gap-2"><Label>Observations</Label><Textarea value={form.observations} onChange={e => setForm(p => ({ ...p, observations: e.target.value }))} /></div>
          <div className="flex gap-3 pt-4 justify-end">
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>Enregistrer</Button>
            <Button variant="outline" onClick={() => navigate("/materiel/maintenance")}>Annuler</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
