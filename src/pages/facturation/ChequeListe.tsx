import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Search, MoreHorizontal, Pencil, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { ConfirmDelete } from "@/components/common/ConfirmDelete";
import { AdminOnly } from "@/components/common/AdminOnly";
import { usePaiementsCheque, useDeletePaiementCheque } from "@/hooks/useFacturationCheque";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ChequeListe() {
  const navigate = useNavigate();
  const { data, isLoading } = usePaiementsCheque();
  const deleteMutation = useDeletePaiementCheque();
  const [search, setSearch] = useState("");

  const handleDelete = async (id: string) => {
    try { await deleteMutation.mutateAsync(id); toast.success("Supprimé"); } catch { toast.error("Erreur"); }
  };

  const filtered = data?.filter((e: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (e.numero_cheque?.toLowerCase().includes(s) ||
      e.banque?.toLowerCase().includes(s) ||
      e.clients?.nom?.toLowerCase().includes(s) ||
      e.montant?.toString().includes(s));
  });

  const statutBadge = (s: string) => {
    switch (s) {
      case "encaisse": return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Encaissé</Badge>;
      case "en_attente": return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">En attente</Badge>;
      case "rejete": return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Rejeté</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  return (
    <div data-essai-mobile className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Facturation", path: "/facturation" },
        { label: "Chèque" },
      ]} />

      <div className="flex items-center gap-3">
        <BackButton to="/facturation" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Paiements par Chèque</h1>
          <p className="text-muted-foreground">Suivi des paiements par chèque</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par N° chèque, banque, client, montant..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-11 bg-card border-border"
          />
        </div>
        <Button className="gap-2 shrink-0" onClick={() => navigate("/facturation/cheque/nouveau")}>
          <Plus className="h-4 w-4" />Nouveau paiement
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Chèques ({filtered?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : !filtered?.length ? (
            <div className="text-center py-12 text-muted-foreground"><CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Aucun paiement enregistré</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Chèque</TableHead>
                  <TableHead>Banque</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Date émission</TableHead>
                  <TableHead>Date échéance</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.numero_cheque || "—"}</TableCell>
                    <TableCell>{e.banque || "—"}</TableCell>
                    <TableCell>{e.clients?.nom || "—"}</TableCell>
                    <TableCell>{e.montant?.toLocaleString()} DA</TableCell>
                    <TableCell>{format(new Date(e.date_emission), "dd/MM/yyyy", { locale: fr })}</TableCell>
                    <TableCell>{e.date_echeance ? format(new Date(e.date_echeance), "dd/MM/yyyy", { locale: fr }) : "—"}</TableCell>
                    <TableCell>{statutBadge(e.statut)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/facturation/cheque/${e.id}/modifier`)}>
                            <Pencil className="h-4 w-4 mr-2" />Modifier
                          </DropdownMenuItem>
                          <AdminOnly>
                            <ConfirmDelete
                              trigger={
                                <DropdownMenuItem className="text-destructive" onSelect={(ev) => ev.preventDefault()}>
                                  <Trash2 className="h-4 w-4 mr-2" />Supprimer
                                </DropdownMenuItem>
                              }
                              onConfirm={() => handleDelete(e.id)}
                              description={`Supprimer le paiement ${e.numero_cheque || ""} ? Cette action est irréversible.`}
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
