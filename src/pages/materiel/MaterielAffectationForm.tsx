import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useCreateAffectationMateriel, useUpdateAffectationMateriel, useAffectationMaterielItem, useMaterielList } from "@/hooks/useMaterielLaboratoire";
import { useChantiers } from "@/hooks/useChantiers";
import { useClients } from "@/hooks/useClients";
import { useIntervenants } from "@/hooks/useIntervenants";
import { wilayas } from "@/data/wilayas";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { FormLoadingOverlay } from "@/components/ui/form-loading-overlay";

export default function MaterielAffectationForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const { data: materiels } = useMaterielList();
  const { data: allChantiers } = useChantiers();
  const { data: allClients } = useClients();
  const { data: intervenants } = useIntervenants();
  const { data: existingAffectation, isLoading: affectationLoading } = useAffectationMaterielItem(id || "");
  const createMutation = useCreateAffectationMateriel();
  const updateMutation = useUpdateAffectationMateriel();

  const [isInitialized, setIsInitialized] = useState(false);
  const [form, setForm] = useState({
    materiel_id: "", wilaya: "", client_id: "", chantier_id: "",
    intervenant_id: "", date_debut: new Date().toISOString().split("T")[0],
    date_fin: "", statut: "en_cours", observations: "", quantite: "1"
  });

  // Load existing data when editing
  useEffect(() => {
    if (existingAffectation && !isInitialized && allChantiers && allClients) {
      // Find the chantier to get client_id and wilaya
      const chantier = allChantiers.find(c => c.id === existingAffectation.chantier_id);
      const client = chantier ? allClients.find(c => c.id === chantier.client_id) : null;

      setForm({
        materiel_id: existingAffectation.materiel_id || "",
        wilaya: client?.ville || "",
        client_id: chantier?.client_id || "",
        chantier_id: existingAffectation.chantier_id || "",
        intervenant_id: existingAffectation.intervenant_id || "",
        date_debut: existingAffectation.date_debut || "",
        date_fin: existingAffectation.date_fin || "",
        statut: existingAffectation.statut || "en_cours",
        observations: existingAffectation.observations || "",
        quantite: String((existingAffectation as any).quantite ?? 1),
      });
      setIsInitialized(true);
    }
  }, [existingAffectation, isInitialized, allChantiers, allClients]);

  const chantiersInWilaya = useMemo(() => {
    if (!allChantiers) return [];
    if (!form.wilaya) return allChantiers;
    return allChantiers.filter(c => c.ville === form.wilaya);
  }, [allChantiers, form.wilaya]);

  const filteredClients = useMemo(() => {
    if (!allClients) return [];
    if (!form.wilaya) return allClients;
    const clientIds = new Set(chantiersInWilaya.map(c => c.client_id).filter(Boolean));
    return allClients.filter(c => clientIds.has(c.id) || c.ville === form.wilaya);
  }, [allClients, chantiersInWilaya, form.wilaya]);

  const filteredChantiers = useMemo(() => {
    if (!form.client_id) return [];
    return chantiersInWilaya.filter(c => c.client_id === form.client_id);
  }, [chantiersInWilaya, form.client_id]);

  const [missingFields, setMissingFields] = useState<Set<string>>(new Set());

  const requiredFields: { key: keyof typeof form; label: string }[] = [
    { key: "materiel_id", label: "Matériel" },
    { key: "wilaya", label: "Wilaya" },
    { key: "client_id", label: "Client" },
    { key: "chantier_id", label: "Chantier" },
    { key: "intervenant_id", label: "Technicien" },
    { key: "date_debut", label: "Date début" },
    { key: "quantite", label: "Quantité" },
  ];

  const handleSubmit = async () => {
    const missing = new Set<string>();
    const missingLabels: string[] = [];
    requiredFields.forEach(f => {
      if (!String(form[f.key] ?? "").trim()) {
        missing.add(f.key as string);
        missingLabels.push(f.label);
      }
    });
    const qte = parseInt(form.quantite, 10);
    if (!missing.has("quantite") && (isNaN(qte) || qte < 1)) {
      missing.add("quantite");
      missingLabels.push("Quantité (≥ 1)");
    }
    if (missing.size > 0) {
      setMissingFields(missing);
      toast.error(`Champs obligatoires manquants : ${missingLabels.join(", ")}`);
      setTimeout(() => setMissingFields(new Set()), 4000);
      return;
    }
    setMissingFields(new Set());

    const payload = {
      materiel_id: form.materiel_id,
      chantier_id: form.chantier_id || null,
      intervenant_id: form.intervenant_id || null,
      date_debut: form.date_debut,
      date_fin: form.date_fin || null,
      statut: form.statut,
      observations: form.observations,
      quantite: qte,
    };
    try {
      if (isEditing && id) {
        await updateMutation.mutateAsync({ id, ...payload });
        toast.success("Affectation mise à jour");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Affectation créée");
      }
      navigate("/materiel/affectation");
    } catch { toast.error("Erreur"); }
  };

  const errClass = (key: string) => missingFields.has(key) ? "animate-border-blink border-destructive" : "";
  const Req = () => <span className="text-destructive ml-0.5">*</span>;

  const isFormLoading = isEditing && (affectationLoading || !isInitialized);
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Matériel Laboratoire", path: "/materiel" },
        { label: "Affectation Matériel", path: "/materiel/affectation" },
        { label: isEditing ? "Modifier l'Affectation" : "Nouvelle Affectation" },
      ]} />

      <div className="flex items-center gap-4">
        <BackButton to="/materiel/affectation" />
        <h1 className="text-2xl font-semibold text-foreground">
          {isEditing ? "Modifier l'Affectation" : "Nouvelle Affectation"}
        </h1>
      </div>

      <Card className="relative">
        <FormLoadingOverlay isLoading={isFormLoading} message="Chargement des données..." />
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-2">
            <Label>Matériel<Req /></Label>
            <Select value={form.materiel_id} onValueChange={v => setForm(p => ({ ...p, materiel_id: v }))}>
              <SelectTrigger className={errClass("materiel_id")}><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>{materiels?.map(m => <SelectItem key={m.id} value={m.id}>{m.nom} {m.reference ? `(${m.reference})` : ""}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Wilaya<Req /></Label>
            <Select value={form.wilaya} onValueChange={v => setForm(p => ({ ...p, wilaya: v, client_id: "", chantier_id: "" }))}>
              <SelectTrigger className={errClass("wilaya")}><SelectValue placeholder="Sélectionner une wilaya" /></SelectTrigger>
              <SelectContent>{wilayas.map(w => <SelectItem key={w.code} value={w.nom}>{w.code} - {w.nom}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Client<Req /></Label>
            <Select value={form.client_id} onValueChange={v => setForm(p => ({ ...p, client_id: v, chantier_id: "" }))} disabled={!form.wilaya}>
              <SelectTrigger className={errClass("client_id")}><SelectValue placeholder={form.wilaya ? "Sélectionner un client" : "Sélectionnez d'abord une wilaya"} /></SelectTrigger>
              <SelectContent>{filteredClients.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Chantier<Req /></Label>
            <Select value={form.chantier_id} onValueChange={v => setForm(p => ({ ...p, chantier_id: v }))} disabled={!form.client_id}>
              <SelectTrigger className={errClass("chantier_id")}><SelectValue placeholder={form.client_id ? "Sélectionner un chantier" : "Sélectionnez d'abord un client"} /></SelectTrigger>
              <SelectContent>{filteredChantiers.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Technicien<Req /></Label>
            <Select value={form.intervenant_id} onValueChange={v => setForm(p => ({ ...p, intervenant_id: v }))}>
              <SelectTrigger className={errClass("intervenant_id")}><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>{intervenants?.map(i => <SelectItem key={i.id} value={i.id}>{i.prenom} {i.nom}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Date début<Req /></Label><Input type="date" className={errClass("date_debut")} value={form.date_debut} onChange={e => setForm(p => ({ ...p, date_debut: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Date fin</Label><Input type="date" value={form.date_fin} onChange={e => setForm(p => ({ ...p, date_fin: e.target.value }))} /></div>
          </div>
          <div className="grid gap-2"><Label>Observations</Label><Textarea value={form.observations} onChange={e => setForm(p => ({ ...p, observations: e.target.value }))} /></div>
          <div className="flex gap-3 pt-4 justify-end">
            <Button variant="outline" onClick={() => navigate("/materiel/affectation")}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Enregistrer" : "Créer l'affectation"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
