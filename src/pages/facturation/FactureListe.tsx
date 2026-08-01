import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, MoreHorizontal, Eye, Pencil, Trash2, ClipboardEdit, FileOutput, Search, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BackButton } from "@/components/ui/back-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { ConfirmDelete } from "@/components/common/ConfirmDelete";
import { AdminOnly } from "@/components/common/AdminOnly";
import { useFactures, useDeleteFacture } from "@/hooks/useFacturation";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const statutBadge = (s: string) => {
  const map: Record<string, { label: string; cls: string }> = {
    payee: { label: "Payée", cls: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" },
    impayee: { label: "Impayée", cls: "bg-red-500/20 text-red-500 border-red-500/30" },
  };
  const m = map[s] || { label: "Impayée", cls: "bg-red-500/20 text-red-500 border-red-500/30" };
  return <Badge className={m.cls}>{m.label}</Badge>;
};

export default function FactureListe() {
  const navigate = useNavigate();
  const { data, isLoading } = useFactures();
  const deleteMutation = useDeleteFacture();
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("tous");

  const handleDelete = async (id: string) => {
    try { await deleteMutation.mutateAsync(id); toast.success("Facture supprimée"); } catch { toast.error("Erreur"); }
  };

  const filtered = data?.filter((f: any) => {
    if (modeFilter !== "tous" && (f.mode_paiement || "") !== modeFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (f.numero?.toLowerCase().includes(s) ||
      (f.clients as any)?.nom?.toLowerCase().includes(s) ||
      (f.chantiers as any)?.nom?.toLowerCase().includes(s) ||
      f.statut?.toLowerCase().includes(s) ||
      String(f.montant_ttc ?? "").includes(s));
  });

  return (
    <div data-essai-mobile className="space-y-6">
      <AppBreadcrumb items={[{ label: "Facturation", path: "/facturation" }, { label: "Factures" }]} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <BackButton to="/facturation" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Factures</h1>
            <p className="text-muted-foreground">Gestion des factures clients</p>
          </div>
        </div>
        <Select value={modeFilter} onValueChange={setModeFilter}>
          <SelectTrigger className="w-full sm:w-[200px] sm:ml-auto"><SelectValue placeholder="Mode de paiement" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les modes</SelectItem>
            <SelectItem value="cheque">Chèque</SelectItem>
            <SelectItem value="espece">Espèce</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par N° facture, client, chantier, statut, montant..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-11 bg-card border-border"
          />
        </div>
        <Button variant="outline" className="gap-2 shrink-0" onClick={() => navigate("/facturation/factures/etat")}>
          <ListFilter className="h-4 w-4" />État des factures
        </Button>
        <Button className="gap-2 shrink-0" onClick={() => navigate("/facturation/factures/nouveau")}>
          <Plus className="h-4 w-4" />Nouvelle facture
        </Button>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Factures ({filtered?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : !filtered?.length ? (
            <div className="text-center py-12 text-muted-foreground"><FileText className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Aucune facture</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Facture</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Chantier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant TTC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((f: any) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.numero}</TableCell>
                    <TableCell>{(f.clients as any)?.nom || "—"}</TableCell>
                    <TableCell>{(f.chantiers as any)?.nom || "—"}</TableCell>
                    <TableCell>{format(new Date(f.date_emission), "dd/MM/yyyy", { locale: fr })}</TableCell>
                    <TableCell>{Number((f.mode_paiement || "") === "espece" ? f.montant_ht : f.montant_ttc).toLocaleString()} DA</TableCell>
                    <TableCell>{statutBadge(f.statut)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/facturation/factures/${f.id}/apercu`)}>
                            <FileOutput className="h-4 w-4 mr-2" />Facture
                          </DropdownMenuItem>
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
