import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { usePaiementsEspece, useDeletePaiementEspece } from "@/hooks/useFacturation";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function EspeceListe() {
  const navigate = useNavigate();
  const { data, isLoading } = usePaiementsEspece();
  const deleteMutation = useDeletePaiementEspece();

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce paiement ?")) return;
    try { await deleteMutation.mutateAsync(id); toast.success("Supprimé"); } catch { toast.error("Erreur"); }
  };

  const statutBadge = (s: string) => {
    switch (s) {
      case "recu": return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Reçu</Badge>;
      case "en_attente": return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">En attente</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Facturation", path: "/facturation" },
        { label: "Espèce" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Paiements en Espèce</h1>
          <p className="text-muted-foreground">Suivi des paiements en espèce</p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/facturation/espece/nouveau")}><Plus className="h-4 w-4" />Nouveau paiement</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Banknote className="h-5 w-5" />Espèces ({data?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : !data?.length ? (
            <div className="text-center py-12 text-muted-foreground"><Banknote className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Aucun paiement enregistré</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Reçu</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Date paiement</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.numero_recu || "—"}</TableCell>
                    <TableCell>{e.clients?.nom || "—"}</TableCell>
                    <TableCell>{e.montant?.toLocaleString()} DA</TableCell>
                    <TableCell>{format(new Date(e.date_paiement), "dd/MM/yyyy", { locale: fr })}</TableCell>
                    <TableCell>{statutBadge(e.statut)}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>
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
