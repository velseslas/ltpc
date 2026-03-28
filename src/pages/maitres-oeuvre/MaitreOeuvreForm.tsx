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
import { wilayas } from "@/data/wilayas";
import { useMaitreOeuvre, useCreateMaitreOeuvre, useUpdateMaitreOeuvre } from "@/hooks/useMaitresOeuvre";
import { toast } from "sonner";

export default function MaitreOeuvreForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { data: existing } = useMaitreOeuvre(id);
  const createMutation = useCreateMaitreOeuvre();
  const updateMutation = useUpdateMaitreOeuvre();

  const [form, setForm] = useState({
    nom: "", contact: "", telephone: "", email: "",
    adresse: "", wilaya: "", specialite: "", statut: "actif", observations: "",
  });

  useEffect(() => {
    if (existing) {
      setForm({
        nom: existing.nom || "",
        contact: existing.contact || "",
        telephone: existing.telephone || "",
        email: existing.email || "",
        adresse: existing.adresse || "",
        wilaya: existing.ville || "",
        specialite: existing.specialite || "",
        statut: existing.statut || "actif",
        observations: existing.observations || "",
      });
    }
  }, [existing]);

  const handleSubmit = async () => {
    if (!form.nom) { toast.error("Le nom est obligatoire"); return; }
    try {
      const payload = {
        nom: form.nom, contact: form.contact, telephone: form.telephone,
        email: form.email, adresse: form.adresse, ville: form.wilaya,
        specialite: form.specialite, statut: form.statut, observations: form.observations,
      };
      if (isEdit) {
        await updateMutation.mutateAsync({ id, ...payload });
        toast.success("Maître d'œuvre mis à jour");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Maître d'œuvre créé");
      }
      navigate("/intervenant/maitres-oeuvre");
    } catch {
      toast.error("Erreur");
    }
  };

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Intervenants", path: "/intervenant" },
        { label: "Maîtres d'œuvre", path: "/intervenant/maitres-oeuvre" },
        { label: isEdit ? "Modifier" : "Nouveau" },
      ]} />
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <BackButton to="/intervenant/maitres-oeuvre" />
            {isEdit ? "Modifier le maître d'œuvre" : "Nouveau maître d'œuvre"}
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
            <div className="grid gap-2">
              <Label>Wilaya</Label>
              <Select value={form.wilaya} onValueChange={v => setForm(p => ({ ...p, wilaya: v }))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une wilaya" /></SelectTrigger>
                <SelectContent>
                  {wilayas.map(w => (
                    <SelectItem key={w.code} value={w.nom}>{w.code} - {w.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Spécialité</Label><Input value={form.specialite} onChange={e => setForm(p => ({ ...p, specialite: e.target.value }))} placeholder="Ex: Architecture, Génie civil..." /></div>
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
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button variant="outline" onClick={() => navigate("/intervenant/maitres-oeuvre")}>Annuler</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>Enregistrer</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
