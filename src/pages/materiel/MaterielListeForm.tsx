import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useCreateMateriel, useUpdateMateriel, useMaterielItem } from "@/hooks/useMaterielLaboratoire";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function MaterielListeForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const createMutation = useCreateMateriel();
  const updateMutation = useUpdateMateriel();
  const { data: existing, isLoading } = useMaterielItem(id || "");

  const [form, setForm] = useState({
    nom: "", reference: "", numero_serie: "", categorie: "general",
    marque: "", modele: "", date_acquisition: "", etat: "operationnel",
    localisation: "", observations: ""
  });

  useEffect(() => {
    if (existing && isEdit) {
      setForm({
        nom: existing.nom || "",
        reference: existing.reference || "",
        numero_serie: existing.numero_serie || "",
        categorie: existing.categorie || "general",
        marque: existing.marque || "",
        modele: existing.modele || "",
        date_acquisition: existing.date_acquisition || "",
        etat: existing.etat || "operationnel",
        localisation: existing.localisation || "",
        observations: existing.observations || "",
      });
    }
  }, [existing, isEdit]);

  const handleSubmit = async () => {
    if (!form.nom) { toast.error("Le nom est obligatoire"); return; }
    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({ id, ...form, date_acquisition: form.date_acquisition || null });
        toast.success("Matériel mis à jour");
      } else {
        await createMutation.mutateAsync({ ...form, date_acquisition: form.date_acquisition || null });
        toast.success("Matériel ajouté");
      }
      navigate("/materiel/liste");
    } catch { toast.error("Erreur lors de l'enregistrement"); }
  };

  if (isEdit && isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Matériel Laboratoire", path: "/materiel" },
        { label: "Liste Matériel", path: "/materiel/liste" },
        { label: isEdit ? "Modifier" : "Nouveau Matériel" },
      ]} />

      <Card>
        <CardHeader><CardTitle>{isEdit ? "Modifier le Matériel" : "Nouveau Matériel"}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2"><Label>Nom *</Label><Input value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Référence</Label><Input value={form.reference} onChange={e => setForm(p => ({ ...p, reference: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>N° Série</Label><Input value={form.numero_serie} onChange={e => setForm(p => ({ ...p, numero_serie: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Marque</Label><Input value={form.marque} onChange={e => setForm(p => ({ ...p, marque: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Modèle</Label><Input value={form.modele} onChange={e => setForm(p => ({ ...p, modele: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Catégorie</Label>
              <Select value={form.categorie} onValueChange={v => setForm(p => ({ ...p, categorie: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Général</SelectItem>
                  <SelectItem value="compression">Compression</SelectItem>
                  <SelectItem value="granulat">Granulat</SelectItem>
                  <SelectItem value="beton_frais">Béton frais</SelectItem>
                  <SelectItem value="mesure">Mesure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>État</Label>
              <Select value={form.etat} onValueChange={v => setForm(p => ({ ...p, etat: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="operationnel">Opérationnel</SelectItem>
                  <SelectItem value="hors_service">Hors service</SelectItem>
                  <SelectItem value="en_reparation">En réparation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Date d'acquisition</Label><Input type="date" value={form.date_acquisition} onChange={e => setForm(p => ({ ...p, date_acquisition: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Localisation</Label><Input value={form.localisation} onChange={e => setForm(p => ({ ...p, localisation: e.target.value }))} /></div>
          </div>
          <div className="grid gap-2"><Label>Observations</Label><Textarea value={form.observations} onChange={e => setForm(p => ({ ...p, observations: e.target.value }))} /></div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {isEdit ? "Mettre à jour" : "Enregistrer"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/materiel/liste")}>Annuler</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
