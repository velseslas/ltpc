import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useCreateEtalonnageMateriel, useMaterielList } from "@/hooks/useMaterielLaboratoire";
import { toast } from "sonner";

export default function MaterielEtalonnageForm() {
  const navigate = useNavigate();
  const { data: materiels } = useMaterielList();
  const createMutation = useCreateEtalonnageMateriel();
  const [form, setForm] = useState({
    materiel_id: "", date_etalonnage: new Date().toISOString().split("T")[0],
    date_prochain_etalonnage: "", organisme: "", numero_certificat: "",
    resultat: "conforme", observations: ""
  });

  const handleSubmit = async () => {
    if (!form.materiel_id) { toast.error("Sélectionnez un matériel"); return; }
    try {
      await createMutation.mutateAsync({ ...form, date_prochain_etalonnage: form.date_prochain_etalonnage || null });
      toast.success("Étalonnage ajouté");
      navigate("/materiel/etalonnage");
    } catch { toast.error("Erreur"); }
  };

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Matériel Laboratoire", path: "/materiel" },
        { label: "Étalonnage Matériel", path: "/materiel/etalonnage" },
        { label: "Nouvel Étalonnage" },
      ]} />

      <Card>
        <CardHeader><CardTitle>Nouvel Étalonnage</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Matériel *</Label>
            <Select value={form.materiel_id} onValueChange={v => setForm(p => ({ ...p, materiel_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>{materiels?.map(m => <SelectItem key={m.id} value={m.id}>{m.nom} {m.reference ? `(${m.reference})` : ""}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Date étalonnage *</Label><Input type="date" value={form.date_etalonnage} onChange={e => setForm(p => ({ ...p, date_etalonnage: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Prochain étalonnage</Label><Input type="date" value={form.date_prochain_etalonnage} onChange={e => setForm(p => ({ ...p, date_prochain_etalonnage: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Organisme</Label><Input value={form.organisme} onChange={e => setForm(p => ({ ...p, organisme: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>N° Certificat</Label><Input value={form.numero_certificat} onChange={e => setForm(p => ({ ...p, numero_certificat: e.target.value }))} /></div>
          </div>
          <div className="grid gap-2">
            <Label>Résultat</Label>
            <Select value={form.resultat} onValueChange={v => setForm(p => ({ ...p, resultat: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="conforme">Conforme</SelectItem>
                <SelectItem value="non_conforme">Non conforme</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2"><Label>Observations</Label><Textarea value={form.observations} onChange={e => setForm(p => ({ ...p, observations: e.target.value }))} /></div>
          <div className="flex gap-3 pt-4 justify-end">
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>Enregistrer</Button>
            <Button variant="outline" onClick={() => navigate("/materiel/etalonnage")}>Annuler</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
