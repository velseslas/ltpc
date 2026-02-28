import { useNavigate } from "react-router-dom";
import { Plus, Trash2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { usePaiementsCheque, useDeletePaiementCheque } from "@/hooks/useFacturation";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ChequeListe() {
  const navigate = useNavigate();
  const { data, isLoading } = usePaiementsCheque();
  const deleteMutation = useDeletePaiementCheque();

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce chèque ?")) return;
    try { await deleteMutation.mutateAsync(id); toast.success("Supprimé"); } catch { toast.error("Erreur"); }
  };

  const statutBadge = (s: string) => {
    switch (s) {
      case "en_attente": return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">En attente</Badge>;
      case "encaisse": return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Encaissé</Badge>;
      case "rejete": return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Rejeté</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Facturation", path: "/facturation" },
        { label: "Chèque" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Paiements par Chèque</h1>
          <p className="text-muted-foreground">Suivi des chèques reçus</p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/facturation/cheque/nouveau")}><Plus className="h-4 w-4" />Nouveau chèque</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Chèques ({data?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : !data?.length ? (
            <div className="text-center py-12 text-muted-foreground"><CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Aucun chèque enregistré</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Chèque</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Banque</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Date émission</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.numero_cheque}</TableCell>
                    <TableCell>{c.clients?.nom || "—"}</TableCell>
                    <TableCell>{c.banque || "—"}</TableCell>
                    <TableCell>{c.montant?.toLocaleString()} DA</TableCell>
                    <TableCell>{format(new Date(c.date_emission), "dd/MM/yyyy", { locale: fr })}</TableCell>
                    <TableCell>{c.date_echeance ? format(new Date(c.date_echeance), "dd/MM/yyyy", { locale: fr }) : "—"}</TableCell>
                    <TableCell>{statutBadge(c.statut)}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>
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
