import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClients } from "@/hooks/useClients";
import { useChantiers } from "@/hooks/useChantiers";
import { useEntreprise } from "@/hooks/useEntreprise";
import { Building2, MapPin, User } from "lucide-react";

export interface DocumentFormData {
  titre: string;
  numero: string;
  date_document: string;
  client_id: string;
  chantier_id: string;
  observations: string;
  statut: string;
  representant: string;
  // Extra fields per type
  montant?: string;
  description?: string;
  montant_ht?: string;
  montant_ttc?: string;
  date_debut?: string;
  date_fin?: string;
}

interface DocumentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DocumentFormData) => void;
  initialData?: any;
  title: string;
  extraFields?: "engagement" | "service" | "prix" | "attestation";
  isLoading?: boolean;
}

const DocumentFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  title,
  extraFields,
  isLoading,
}: DocumentFormDialogProps) => {
  const { data: clients } = useClients();
  const { data: chantiers } = useChantiers();
  const { data: entreprise } = useEntreprise();

  const [form, setForm] = useState<DocumentFormData>({
    titre: "",
    numero: "",
    date_document: new Date().toISOString().split("T")[0],
    client_id: "",
    chantier_id: "",
    observations: "",
    statut: "brouillon",
    representant: "",
    montant: "",
    description: "",
    montant_ht: "",
    montant_ttc: "",
    date_debut: "",
    date_fin: "",
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        titre: initialData.titre || "",
        numero: initialData.numero || "",
        date_document: initialData.date_document || new Date().toISOString().split("T")[0],
        client_id: initialData.client_id || "",
        chantier_id: initialData.chantier_id || "",
        observations: initialData.observations || "",
        statut: initialData.statut || "brouillon",
        representant: initialData.representant || "",
        montant: initialData.montant?.toString() || "",
        description: initialData.description || "",
        montant_ht: initialData.montant_ht?.toString() || "",
        montant_ttc: initialData.montant_ttc?.toString() || "",
        date_debut: initialData.date_debut || "",
        date_fin: initialData.date_fin || "",
      });
    } else {
      setForm({
        titre: "",
        numero: "",
        date_document: new Date().toISOString().split("T")[0],
        client_id: "",
        chantier_id: "",
        observations: "",
        statut: "brouillon",
        representant: "",
        montant: "",
        description: "",
        montant_ht: "",
        montant_ttc: "",
        date_debut: "",
        date_fin: "",
      });
    }
  }, [initialData, open]);

  const filteredChantiers = form.client_id
    ? chantiers?.filter((c) => c.client_id === form.client_id)
    : chantiers;

  // Get unique representants from all clients
  const representants = useMemo(() => {
    if (!clients) return [];
    const reps = clients
      .map((c) => c.representant)
      .filter((r): r is string => !!r && r.trim() !== "");
    return [...new Set(reps)].sort();
  }, [clients]);

  // Auto-fill representant when client changes
  useEffect(() => {
    if (form.client_id && clients) {
      const selectedClient = clients.find((c) => c.id === form.client_id);
      if (selectedClient?.representant) {
        setForm((prev) => ({ ...prev, representant: selectedClient.representant || "" }));
      }
    }
  }, [form.client_id, clients]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Titre *</Label>
              <Input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} required />
            </div>
            <div>
              <Label>Numéro</Label>
              <Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.date_document} onChange={(e) => setForm({ ...form, date_document: e.target.value })} />
            </div>

            {/* Entreprise (Client) */}
            <div>
              <Label className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                Entreprise
              </Label>
              <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v, chantier_id: "" })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une entreprise" /></SelectTrigger>
                <SelectContent>
                  {clients?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Chantier */}
            <div>
              <Label className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                Chantier
              </Label>
              <Select value={form.chantier_id} onValueChange={(v) => setForm({ ...form, chantier_id: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un chantier" /></SelectTrigger>
                <SelectContent>
                  {filteredChantiers?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Représentant */}
            <div>
              <Label className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                Représentant
              </Label>
              <Select value={form.representant} onValueChange={(v) => setForm({ ...form, representant: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un représentant" /></SelectTrigger>
                <SelectContent>
                  {representants.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Statut */}
            <div>
              <Label>Statut</Label>
              <Select value={form.statut} onValueChange={(v) => setForm({ ...form, statut: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="brouillon">Brouillon</SelectItem>
                  <SelectItem value="envoyé">Envoyé</SelectItem>
                  <SelectItem value="accepté">Accepté</SelectItem>
                  <SelectItem value="refusé">Refusé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {extraFields === "engagement" && (
              <div>
                <Label>Montant (DA)</Label>
                <Input type="number" step="0.01" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} />
              </div>
            )}

            {extraFields === "service" && (
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            )}

            {extraFields === "prix" && (
              <>
                <div>
                  <Label>Montant HT (DA)</Label>
                  <Input type="number" step="0.01" value={form.montant_ht} onChange={(e) => setForm({ ...form, montant_ht: e.target.value })} />
                </div>
                <div>
                  <Label>Montant TTC (DA)</Label>
                  <Input type="number" step="0.01" value={form.montant_ttc} onChange={(e) => setForm({ ...form, montant_ttc: e.target.value })} />
                </div>
              </>
            )}

            {extraFields === "attestation" && (
              <>
                <div>
                  <Label>Date début</Label>
                  <Input type="date" value={form.date_debut} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} />
                </div>
                <div>
                  <Label>Date fin</Label>
                  <Input type="date" value={form.date_fin} onChange={(e) => setForm({ ...form, date_fin: e.target.value })} />
                </div>
              </>
            )}

            <div className="col-span-2">
              <Label>Observations</Label>
              <Textarea value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={isLoading}>
              {initialData ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentFormDialog;
