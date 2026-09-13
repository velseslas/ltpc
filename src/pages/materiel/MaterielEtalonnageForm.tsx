import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useCreateEtalonnageMateriel, useUpdateEtalonnageMateriel, useEtalonnageMaterielItem, useMaterielList } from "@/hooks/useMaterielLaboratoire";
import { toast } from "sonner";
import { Loader2, Upload, FileText, X } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { FormLoadingOverlay } from "@/components/ui/form-loading-overlay";
import { DocumentRepository } from "@/lib/repositories";

export default function MaterielEtalonnageForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const { data: materiels } = useMaterielList();
  const { data: existingEtalonnage, isLoading: etalonnageLoading } = useEtalonnageMaterielItem(id || "");
  const createMutation = useCreateEtalonnageMateriel();
  const updateMutation = useUpdateEtalonnageMateriel();

  const [isInitialized, setIsInitialized] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    materiel_id: "", date_etalonnage: new Date().toISOString().split("T")[0],
    date_prochain_etalonnage: "", organisme: "", numero_certificat: "",
    resultat: "conforme", observations: "",
    certificat_url: "" as string | null, certificat_nom: "" as string | null,
  });

  useEffect(() => {
    if (existingEtalonnage && !isInitialized) {
      setForm({
        materiel_id: existingEtalonnage.materiel_id || "",
        date_etalonnage: existingEtalonnage.date_etalonnage || "",
        date_prochain_etalonnage: existingEtalonnage.date_prochain_etalonnage || "",
        organisme: existingEtalonnage.organisme || "",
        numero_certificat: existingEtalonnage.numero_certificat || "",
        resultat: existingEtalonnage.resultat || "conforme",
        observations: existingEtalonnage.observations || "",
        certificat_url: (existingEtalonnage as any).certificat_url || "",
        certificat_nom: (existingEtalonnage as any).certificat_nom || "",
      });
      setIsInitialized(true);
    }
  }, [existingEtalonnage, isInitialized]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `certificat-${Date.now()}.${ext}`;
      const { publicUrl } = await DocumentRepository.uploadCertificatEtalonnage(fileName, file, { upsert: true });
      setForm(p => ({ ...p, certificat_url: publicUrl, certificat_nom: file.name }));
      toast.success("Certificat téléversé");
    } catch (err: any) {
      toast.error("Erreur lors du téléversement : " + (err.message || "inconnue"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveCertificat = () => {
    setForm(p => ({ ...p, certificat_url: "", certificat_nom: "" }));
  };

  const handleSubmit = async () => {
    if (!form.materiel_id) { toast.error("Sélectionnez un matériel"); return; }
    const payload = {
      ...form,
      date_prochain_etalonnage: form.date_prochain_etalonnage || null,
      certificat_url: form.certificat_url || null,
      certificat_nom: form.certificat_nom || null,
    };
    try {
      if (isEditing && id) {
        await updateMutation.mutateAsync({ id, ...payload });
        toast.success("Étalonnage mis à jour");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Étalonnage ajouté");
      }
      navigate("/materiel/etalonnage");
    } catch { toast.error("Erreur"); }
  };

  const isFormLoading = isEditing && (etalonnageLoading || !isInitialized);
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div data-essai-mobile className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Matériel Laboratoire", path: "/materiel" },
        { label: "Étalonnage Matériel", path: "/materiel/etalonnage" },
        { label: isEditing ? "Modifier l'Étalonnage" : "Nouvel Étalonnage" },
      ]} />

      <div className="flex items-center gap-4">
        <BackButton to="/materiel/etalonnage" />
        <h1 className="text-2xl font-semibold text-foreground">
          {isEditing ? "Modifier l'Étalonnage" : "Nouvel Étalonnage"}
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
            <div className="grid gap-2"><Label>Date étalonnage *</Label><DateInput value={form.date_etalonnage} onChange={e => setForm(p => ({ ...p, date_etalonnage: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Prochain étalonnage</Label><DateInput value={form.date_prochain_etalonnage} onChange={e => setForm(p => ({ ...p, date_prochain_etalonnage: e.target.value }))} /></div>
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

          <div className="grid gap-2">
            <Label>Certificat (PDF, image)</Label>
            {form.certificat_url ? (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <a
                  href={form.certificat_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm text-primary hover:underline truncate"
                >
                  {form.certificat_nom || "Certificat"}
                </a>
                <Button type="button" variant="ghost" size="icon" onClick={handleRemoveCertificat}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="gap-2"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? "Téléversement..." : "Téléverser un certificat"}
                </Button>
              </div>
            )}
          </div>

          <div className="grid gap-2"><Label>Observations</Label><Textarea value={form.observations} onChange={e => setForm(p => ({ ...p, observations: e.target.value }))} /></div>
          <div className="flex gap-3 pt-4 justify-end">
            <Button variant="outline" onClick={() => navigate("/materiel/etalonnage")}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Enregistrer" : "Créer l'étalonnage"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
