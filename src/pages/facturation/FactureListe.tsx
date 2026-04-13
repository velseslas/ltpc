import { useNavigate } from "react-router-dom";
import { Plus, FileText, MoreHorizontal, Eye, Pencil, Trash2, ClipboardEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useFactures, useDeleteFacture } from "@/hooks/useFacturation";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const statutBadge = (s: string) => {
  const map: Record<string, { label: string; cls: string }> = {
    brouillon: { label: "Brouillon", cls: "bg-muted text-muted-foreground border-border" },
    envoyee: { label: "Envoyée", cls: "bg-blue-500/20 text-blue-500 border-blue-500/30" },
    en_attente: { label: "En attente", cls: "bg-amber-500/20 text-amber-500 border-amber-500/30" },
    payee: { label: "Payée", cls: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" },
    annulee: { label: "Annulée", cls: "bg-red-500/20 text-red-500 border-red-500/30" },
  };
  const m = map[s] || { label: s, cls: "" };
  return <Badge className={m.cls}>{m.label}</Badge>;
};

export default function FactureListe() {
  const navigate = useNavigate();
  const { data, isLoading } = useFactures();
  const deleteMutation = useDeleteFacture();

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette facture ?")) return;
    try { await deleteMutation.mutateAsync(id); toast.success("Facture supprimée"); } catch { toast.error("Erreur"); }
  };

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[{ label: "Facturation", path: "/facturation" }, { label: "Factures" }]} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton to="/facturation" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Factures</h1>
            <p className="text-muted-foreground">Gestion des factures clients</p>
          </div>
        </div>
        <Button className="gap-2" onClick={() => navigate("/facturation/factures/nouveau")}><Plus className="h-4 w-4" />Nouvelle facture</Button>
      </div>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Factures ({data?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : !data?.length ? (
            <div className="text-center py-12 text-muted-foreground"><FileText className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Aucune facture</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Facture</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant TTC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((f: any) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.numero}</TableCell>
                    <TableCell>{(f.clients as any)?.nom || "—"}</TableCell>
                    <TableCell>{format(new Date(f.date_emission), "dd/MM/yyyy", { locale: fr })}</TableCell>
                    <TableCell>{Number(f.montant_ttc).toLocaleString()} DA</TableCell>
                    <TableCell>{statutBadge(f.statut)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/facturation/factures/${f.id}/saisie`)}>
                            <ClipboardEdit className="h-4 w-4 mr-2" />Saisie de données
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/facturation/factures/${f.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />Détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/facturation/factures/${f.id}/modifier`)}>
                            <Pencil className="h-4 w-4 mr-2" />Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(f.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />Supprimer
                          </DropdownMenuItem>
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
