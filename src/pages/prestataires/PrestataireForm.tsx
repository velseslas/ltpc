import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { usePrestataire, useCreatePrestataire, useUpdatePrestataire } from "@/hooks/usePrestataires";
import { toast } from "sonner";

export default function PrestataireForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { data: existing } = usePrestataire(id);
  const createMutation = useCreatePrestataire();
  const updateMutation = useUpdatePrestataire();

  const [form, setForm] = useState({
    nom: "", contact: "", telephone: "", email: "",
    adresse: "", ville: "", specialite: "", statut: "actif", observations: "",
  });

  useEffect(() => {
    if (existing) {
      setForm({
        nom: existing.nom || "",
        contact: existing.contact || "",
        telephone: existing.telephone || "",
        email: existing.email || "",
        adresse: existing.adresse || "",
        ville: existing.ville || "",
        specialite: existing.specialite || "",
        statut: existing.statut || "actif",
        observations: existing.observations || "",
      });
    }
  }, [existing]);

  const handleSubmit = async () => {
    if (!form.nom) { toast.error("Le nom est obligatoire"); return; }
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id, ...form });
        toast.success("Prestataire mis à jour");
      } else {
        await createMutation.mutateAsync(form);
        toast.success("Prestataire créé");
      }
      navigate("/intervenant/prestataires");
    } catch {
      toast.error("Erreur");
    }
  };

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Intervenants", path: "/intervenant" },
        { label: "Prestataires", path: "/intervenant/prestataires" },
        { label: isEdit ? "Modifier" : "Nouveau" },
      ]} />
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <BackButton to="/intervenant/prestataires" />
            {isEdit ? "Modifier le prestataire" : "Nouveau prestataire"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Nom *</Label><Input value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Contact</Label><Input value={form.contact} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Téléphone</Label><Input value={form.telephone} onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Adresse</Label><Input value={form.adresse} onChange={e => setForm(p => ({ ...p, adresse: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Ville</Label><Input value={form.ville} onChange={e => setForm(p => ({ ...p, ville: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Spécialité</Label><Input value={form.specialite} onChange={e => setForm(p => ({ ...p, specialite: e.target.value }))} placeholder="Ex: Géotechnique, Transport..." /></div>
            <div className="grid gap-2">
              <Label>Statut</Label>
              <Select value={form.statut} onValueChange={v => setForm(p => ({ ...p, statut: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="inactif">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2"><Label>Observations</Label><Textarea value={form.observations} onChange={e => setForm(p => ({ ...p, observations: e.target.value }))} /></div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>Enregistrer</Button>
            <Button variant="outline" onClick={() => navigate("/intervenant/prestataires")}>Annuler</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
