import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useCreateMaintenanceMateriel, useUpdateMaintenanceMateriel, useMaintenanceMaterielItem, useMaterielList } from "@/hooks/useMaterielLaboratoire";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { FormLoadingOverlay } from "@/components/ui/form-loading-overlay";

export default function MaterielMaintenanceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const { data: materiels } = useMaterielList();
  const { data: existingMaintenance, isLoading: maintenanceLoading } = useMaintenanceMaterielItem(id || "");
  const createMutation = useCreateMaintenanceMateriel();
  const updateMutation = useUpdateMaintenanceMateriel();

  const [isInitialized, setIsInitialized] = useState(false);
  const [form, setForm] = useState({
    materiel_id: "", type_maintenance: "preventive",
    date_maintenance: new Date().toISOString().split("T")[0],
    date_prochaine_maintenance: "", description: "", cout: "",
    prestataire: "", statut: "planifie", observations: ""
  });

  useEffect(() => {
    if (existingMaintenance && !isInitialized) {
      setForm({
        materiel_id: existingMaintenance.materiel_id || "",
        type_maintenance: existingMaintenance.type_maintenance || "preventive",
        date_maintenance: existingMaintenance.date_maintenance || "",
        date_prochaine_maintenance: existingMaintenance.date_prochaine_maintenance || "",
        description: existingMaintenance.description || "",
        cout: existingMaintenance.cout ? String(existingMaintenance.cout) : "",
        prestataire: existingMaintenance.prestataire || "",
        statut: existingMaintenance.statut || "planifie",
        observations: existingMaintenance.observations || "",
      });
      setIsInitialized(true);
    }
  }, [existingMaintenance, isInitialized]);

  const handleSubmit = async () => {
    if (!form.materiel_id) { toast.error("Sélectionnez un matériel"); return; }
    const payload = {
      ...form,
      cout: form.cout ? parseFloat(form.cout) : null,
      date_prochaine_maintenance: form.date_prochaine_maintenance || null,
    };
    try {
      if (isEditing && id) {
        await updateMutation.mutateAsync({ id, ...payload });
        toast.success("Maintenance mise à jour");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Maintenance ajoutée");
      }
      navigate("/materiel/maintenance");
    } catch { toast.error("Erreur"); }
  };

  const isFormLoading = isEditing && (maintenanceLoading || !isInitialized);
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Matériel Laboratoire", path: "/materiel" },
        { label: "Maintenance Matériel", path: "/materiel/maintenance" },
        { label: isEditing ? "Modifier la Maintenance" : "Nouvelle Maintenance" },
      ]} />

      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50" onClick={() => navigate("/materiel/maintenance")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">
          {isEditing ? "Modifier la Maintenance" : "Nouvelle Maintenance"}
        </h1>
      </div>

      <Card className="relative">
        <FormLoadingOverlay isLoading={isFormLoading} message="Chargement des données..." />
        <CardContent className="pt-6 space-y-4">
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
            <Button variant="outline" onClick={() => navigate("/materiel/maintenance")}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Enregistrer" : "Créer la maintenance"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
