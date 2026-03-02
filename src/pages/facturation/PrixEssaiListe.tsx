import { useState } from "react";
import { Plus, Trash2, FlaskConical, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { BackButton } from "@/components/ui/back-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePrixEssais, useCreatePrixEssai, useUpdatePrixEssai, useDeletePrixEssai } from "@/hooks/usePrixEssais";
import { toast } from "sonner";

const categories = [
  { value: "beton_frais", label: "Béton frais" },
  { value: "beton_durci", label: "Béton durci" },
  { value: "granulat_physique", label: "Granulat - Physique" },
  { value: "granulat_proprete", label: "Granulat - Propreté" },
  { value: "granulat_mecanique", label: "Granulat - Mécanique" },
  { value: "geotechnique", label: "Géotechnique" },
  { value: "autre", label: "Autre" },
];

const emptyForm = { nom_essai: "", code_essai: "", categorie: "beton_frais", prix_unitaire: "", unite: "essai" };

export default function PrixEssaiListe() {
  const { data, isLoading } = usePrixEssais();
  const createMutation = useCreatePrixEssai();
  const updateMutation = useUpdatePrixEssai();
  const deleteMutation = useDeletePrixEssai();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const handleOpen = (item?: any) => {
    if (item) {
      setEditId(item.id);
      setForm({ nom_essai: item.nom_essai, code_essai: item.code_essai || "", categorie: item.categorie, prix_unitaire: String(item.prix_unitaire), unite: item.unite || "essai" });
    } else {
      setEditId(null);
      setForm(emptyForm);
    }
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.nom_essai || !form.prix_unitaire) { toast.error("Nom et prix sont obligatoires"); return; }
    try {
      const payload = { ...form, prix_unitaire: parseFloat(form.prix_unitaire) };
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, ...payload });
        toast.success("Prix mis à jour");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Prix essai créé");
      }
      setOpen(false);
    } catch { toast.error("Erreur"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce prix ?")) return;
    try { await deleteMutation.mutateAsync(id); toast.success("Supprimé"); } catch { toast.error("Erreur"); }
  };

  const getCategorieLabel = (v: string) => categories.find(c => c.value === v)?.label || v;

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[{ label: "Facturation", path: "/facturation" }, { label: "Prix essais" }]} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton to="/facturation" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Prix des essais</h1>
            <p className="text-muted-foreground">Barème des prix unitaires par type d'essai</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => handleOpen()}><Plus className="h-4 w-4" />Nouveau prix</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Modifier le prix" : "Nouveau prix essai"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Nom de l'essai *</Label><Input value={form.nom_essai} onChange={e => setForm(p => ({ ...p, nom_essai: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Code essai</Label><Input value={form.code_essai} onChange={e => setForm(p => ({ ...p, code_essai: e.target.value }))} placeholder="Ex: ES, BM, LA..." /></div>
              </div>
              <div className="grid gap-2">
                <Label>Catégorie</Label>
                <Select value={form.categorie} onValueChange={v => setForm(p => ({ ...p, categorie: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Prix unitaire (DA) *</Label><Input type="number" value={form.prix_unitaire} onChange={e => setForm(p => ({ ...p, prix_unitaire: e.target.value }))} /></div>
                <div className="grid gap-2">
                  <Label>Unité</Label>
                  <Select value={form.unite} onValueChange={v => setForm(p => ({ ...p, unite: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="essai">Par essai</SelectItem>
                      <SelectItem value="echantillon">Par échantillon</SelectItem>
                      <SelectItem value="eprouvette">Par éprouvette</SelectItem>
                      <SelectItem value="forfait">Forfait</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>Enregistrer</Button>
                <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader><CardTitle className="flex items-center gap-2"><FlaskConical className="h-5 w-5" />Prix essais ({data?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : !data?.length ? (
            <div className="text-center py-12 text-muted-foreground"><FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Aucun prix configuré</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                 <TableHead>Essai</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Prix unitaire</TableHead>
                  <TableHead>Unité</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nom_essai}</TableCell>
                    <TableCell className="text-muted-foreground">{p.code_essai || "-"}</TableCell>
                    <TableCell>{getCategorieLabel(p.categorie)}</TableCell>
                    <TableCell>{Number(p.prix_unitaire).toLocaleString()} DA</TableCell>
                    <TableCell className="capitalize">{p.unite}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpen(p)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
