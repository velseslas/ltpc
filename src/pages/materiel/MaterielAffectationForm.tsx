import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useCreateAffectationMateriel, useMaterielList } from "@/hooks/useMaterielLaboratoire";
import { useChantiers } from "@/hooks/useChantiers";
import { useClients } from "@/hooks/useClients";
import { useIntervenants } from "@/hooks/useIntervenants";
import { wilayas } from "@/data/wilayas";
import { toast } from "sonner";

export default function MaterielAffectationForm() {
  const navigate = useNavigate();
  const { data: materiels } = useMaterielList();
  const { data: allChantiers } = useChantiers();
  const { data: allClients } = useClients();
  const { data: intervenants } = useIntervenants();
  const createMutation = useCreateAffectationMateriel();
  const [form, setForm] = useState({
    materiel_id: "", wilaya: "", client_id: "", chantier_id: "",
    intervenant_id: "", date_debut: new Date().toISOString().split("T")[0],
    date_fin: "", statut: "en_cours", observations: ""
  });

  const filteredClients = useMemo(() => {
    if (!allClients || !form.wilaya) return allClients || [];
    return allClients.filter(c => c.ville === form.wilaya);
  }, [allClients, form.wilaya]);

  const filteredChantiers = useMemo(() => {
    if (!allChantiers || !form.client_id) return [];
    return allChantiers.filter(c => c.client_id === form.client_id);
  }, [allChantiers, form.client_id]);

  const handleSubmit = async () => {
    if (!form.materiel_id) { toast.error("Sélectionnez un matériel"); return; }
    try {
      await createMutation.mutateAsync({
        materiel_id: form.materiel_id,
        chantier_id: form.chantier_id || null,
        intervenant_id: form.intervenant_id || null,
        date_debut: form.date_debut,
        date_fin: form.date_fin || null,
        statut: form.statut,
        observations: form.observations,
      });
      toast.success("Affectation créée");
      navigate("/materiel/affectation");
    } catch { toast.error("Erreur"); }
  };

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Matériel Laboratoire", path: "/materiel" },
        { label: "Affectation Matériel", path: "/materiel/affectation" },
        { label: "Nouvelle Affectation" },
      ]} />

      <Card>
        <CardHeader><CardTitle>Nouvelle Affectation</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Matériel *</Label>
            <Select value={form.materiel_id} onValueChange={v => setForm(p => ({ ...p, materiel_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>{materiels?.map(m => <SelectItem key={m.id} value={m.id}>{m.nom} {m.reference ? `(${m.reference})` : ""}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Wilaya</Label>
            <Select value={form.wilaya} onValueChange={v => setForm(p => ({ ...p, wilaya: v, client_id: "", chantier_id: "" }))}>
              <SelectTrigger><SelectValue placeholder="Sélectionner une wilaya" /></SelectTrigger>
              <SelectContent>{wilayas.map(w => <SelectItem key={w.code} value={w.nom}>{w.code} - {w.nom}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Client</Label>
            <Select value={form.client_id} onValueChange={v => setForm(p => ({ ...p, client_id: v, chantier_id: "" }))} disabled={!form.wilaya}>
              <SelectTrigger><SelectValue placeholder={form.wilaya ? "Sélectionner un client" : "Sélectionnez d'abord une wilaya"} /></SelectTrigger>
              <SelectContent>{filteredClients.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Chantier</Label>
            <Select value={form.chantier_id} onValueChange={v => setForm(p => ({ ...p, chantier_id: v }))} disabled={!form.client_id}>
              <SelectTrigger><SelectValue placeholder={form.client_id ? "Sélectionner un chantier" : "Sélectionnez d'abord un client"} /></SelectTrigger>
              <SelectContent>{filteredChantiers.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Technicien</Label>
            <Select value={form.intervenant_id} onValueChange={v => setForm(p => ({ ...p, intervenant_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>{intervenants?.map(i => <SelectItem key={i.id} value={i.id}>{i.prenom} {i.nom}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Date début *</Label><Input type="date" value={form.date_debut} onChange={e => setForm(p => ({ ...p, date_debut: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Date fin</Label><Input type="date" value={form.date_fin} onChange={e => setForm(p => ({ ...p, date_fin: e.target.value }))} /></div>
          </div>
          <div className="grid gap-2"><Label>Observations</Label><Textarea value={form.observations} onChange={e => setForm(p => ({ ...p, observations: e.target.value }))} /></div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>Enregistrer</Button>
            <Button variant="outline" onClick={() => navigate("/materiel/affectation")}>Annuler</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
