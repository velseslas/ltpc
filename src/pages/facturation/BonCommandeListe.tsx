import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, ShoppingCart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { ConfirmDelete } from "@/components/common/ConfirmDelete";
import { useBonsCommande, useDeleteBonCommande } from "@/hooks/useFacturation";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const statutBadge = (s: string) => {
  const map: Record<string, { label: string; cls: string }> = {
    en_attente: { label: "En attente", cls: "bg-amber-500/20 text-amber-500 border-amber-500/30" },
    confirme: { label: "Confirmé", cls: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" },
    en_cours: { label: "En cours", cls: "bg-blue-500/20 text-blue-500 border-blue-500/30" },
    termine: { label: "Terminé", cls: "bg-muted text-muted-foreground border-border" },
    annule: { label: "Annulé", cls: "bg-red-500/20 text-red-500 border-red-500/30" },
  };
  const m = map[s] || { label: s, cls: "" };
  return <Badge className={m.cls}>{m.label}</Badge>;
};

export default function BonCommandeListe() {
  const navigate = useNavigate();
  const { data, isLoading } = useBonsCommande();
  const deleteMutation = useDeleteBonCommande();
  const [search, setSearch] = useState("");

  const handleDelete = async (id: string) => {
    try { await deleteMutation.mutateAsync(id); toast.success("Supprimé"); } catch { toast.error("Erreur"); }
  };

  const filtered = data?.filter((b: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (b.numero?.toLowerCase().includes(s) ||
      (b.clients as any)?.nom?.toLowerCase().includes(s) ||
      b.statut?.toLowerCase().includes(s) ||
      String(b.montant_ttc ?? "").includes(s));
  });

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[{ label: "Facturation", path: "/facturation" }, { label: "Bons de commande" }]} />
      <div className="flex items-center gap-3">
        <BackButton to="/facturation" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bons de commande</h1>
          <p className="text-muted-foreground">Suivi des bons de commande clients</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par N° BC, client, statut, montant..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-11 bg-card border-border"
          />
        </div>
        <Button className="gap-2 shrink-0" onClick={() => navigate("/facturation/bons-commande/nouveau")}>
          <Plus className="h-4 w-4" />Nouveau bon
        </Button>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" />Bons de commande ({filtered?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : !filtered?.length ? (
            <div className="text-center py-12 text-muted-foreground"><ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Aucun bon de commande</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° BC</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant TTC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.numero}</TableCell>
                    <TableCell>{(b.clients as any)?.nom || "—"}</TableCell>
                    <TableCell>{format(new Date(b.date_commande), "dd/MM/yyyy", { locale: fr })}</TableCell>
                    <TableCell>{Number(b.montant_ttc).toLocaleString()} DA</TableCell>
                    <TableCell>{statutBadge(b.statut)}</TableCell>
                    <TableCell className="text-right">
                      <ConfirmDelete
                        trigger={<Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button>}
                        onConfirm={() => handleDelete(b.id)}
                        description={`Supprimer le bon de commande ${b.numero} ? Cette action est irréversible.`}
                      />
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
