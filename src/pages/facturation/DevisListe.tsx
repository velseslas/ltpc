import { useNavigate } from "react-router-dom";
import { Plus, Receipt, MoreHorizontal, Eye, Pencil, Trash2, ClipboardEdit, FileOutput, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { ConfirmDelete } from "@/components/common/ConfirmDelete";
import { AdminOnly } from "@/components/common/AdminOnly";
import { useDevis, useDeleteDevis } from "@/hooks/useFacturation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";

const statutBadge = (s: string) => {
  const map: Record<string, { label: string; cls: string }> = {
    brouillon: { label: "Brouillon", cls: "bg-muted text-muted-foreground border-border" },
    envoye: { label: "Envoyé", cls: "bg-blue-500/20 text-blue-500 border-blue-500/30" },
    accepte: { label: "Accepté", cls: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" },
    refuse: { label: "Refusé", cls: "bg-red-500/20 text-red-500 border-red-500/30" },
    expire: { label: "Expiré", cls: "bg-amber-500/20 text-amber-500 border-amber-500/30" },
  };
  const m = map[s] || { label: s, cls: "" };
  return <Badge className={m.cls}>{m.label}</Badge>;
};

export default function DevisListe() {
  const navigate = useNavigate();
  const { data, isLoading } = useDevis();
  const deleteMutation = useDeleteDevis();
  const [converting, setConverting] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const handleDelete = async (id: string) => {
    try { await deleteMutation.mutateAsync(id); toast.success("Devis supprimé"); } catch { toast.error("Erreur"); }
  };

  const handleConvertToFacture = async (devisId: string) => {
    setConverting(devisId);
    try {
      const { data: devis, error } = await supabase
        .from("devis")
        .select("*, lignes_devis(*)")
        .eq("id", devisId)
        .single();
      if (error || !devis) throw error;

      const year = new Date().getFullYear();
      const prefix = `FAC-${year}-`;
      const { data: factures } = await supabase.from("factures").select("numero").like("numero", `${prefix}%`);
      const existing = (factures || []).map((f: any) => parseInt(f.numero.replace(prefix, "")) || 0);
      const next = (existing.length > 0 ? Math.max(...existing) : 0) + 1;
      const numero = `${prefix}${String(next).padStart(3, "0")}`;

      const { data: newFacture, error: facErr } = await supabase.from("factures").insert({
        numero,
        client_id: devis.client_id,
        chantier_id: devis.chantier_id,
        date_emission: new Date().toISOString().split("T")[0],
        statut: "brouillon",
        observations: devis.observations,
        montant_ht: devis.montant_ht,
        taux_tva: devis.taux_tva,
        montant_tva: devis.montant_tva,
        montant_ttc: devis.montant_ttc,
      }).select().single();
      if (facErr) throw facErr;

      const lignes = ((devis as any).lignes_devis || []).sort((a: any, b: any) => a.ordre - b.ordre);
      for (let i = 0; i < lignes.length; i++) {
        const l = lignes[i];
        await supabase.from("lignes_facture").insert({
          facture_id: newFacture.id,
          description: l.description,
          quantite: l.quantite,
          prix_unitaire: l.prix_unitaire,
          montant: l.montant,
          ordre: i + 1,
        });
      }

      toast.success(`Facture ${numero} créée depuis le devis`);
      navigate(`/facturation/factures/${newFacture.id}/apercu`);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la conversion");
    } finally {
      setConverting(null);
    }
  };

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[{ label: "Facturation", path: "/facturation" }, { label: "Devis" }]} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton to="/facturation" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Devis</h1>
            <p className="text-muted-foreground">Génération et gestion des devis</p>
          </div>
        </div>
        <Button className="gap-2" onClick={() => navigate("/facturation/devis/nouveau")}><Plus className="h-4 w-4" />Nouveau devis</Button>
      </div>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" />Devis ({data?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : !data?.length ? (
            <div className="text-center py-12 text-muted-foreground"><Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Aucun devis</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Devis</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Chantier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Validité</TableHead>
                  <TableHead>Montant TTC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.numero}</TableCell>
                    <TableCell>{(d.clients as any)?.nom || "—"}</TableCell>
                    <TableCell>{(d.chantiers as any)?.nom || "—"}</TableCell>
                    <TableCell>{format(new Date(d.date_emission), "dd/MM/yyyy", { locale: fr })}</TableCell>
                    <TableCell>{d.date_validite ? format(new Date(d.date_validite), "dd/MM/yyyy", { locale: fr }) : "—"}</TableCell>
                    <TableCell>{Number(d.montant_ttc).toLocaleString()} DA</TableCell>
                    <TableCell>{statutBadge(d.statut)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={converting === d.id}><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/facturation/devis/${d.id}/apercu`)}>
                            <FileOutput className="h-4 w-4 mr-2" />Devis
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/facturation/devis/${d.id}/saisie`)}>
                            <ClipboardEdit className="h-4 w-4 mr-2" />Saisie de données
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/facturation/devis/${d.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />Détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/facturation/devis/${d.id}/modifier`)}>
                            <Pencil className="h-4 w-4 mr-2" />Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleConvertToFacture(d.id)} disabled={converting === d.id}>
                            <FileText className="h-4 w-4 mr-2" />Convertir en facture
                          </DropdownMenuItem>
                          <AdminOnly>
                            <ConfirmDelete
                              trigger={
                                <DropdownMenuItem className="text-destructive" onSelect={(ev) => ev.preventDefault()}>
                                  <Trash2 className="h-4 w-4 mr-2" />Supprimer
                                </DropdownMenuItem>
                              }
                              onConfirm={() => handleDelete(d.id)}
                              description={`Supprimer le devis ${d.numero} ? Cette action est irréversible.`}
                              adminOnly={false}
                            />
                          </AdminOnly>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
