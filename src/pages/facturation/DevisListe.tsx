import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useDevis, useDeleteDevis } from "@/hooks/useFacturation";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce devis ?")) return;
    try { await deleteMutation.mutateAsync(id); toast.success("Devis supprimé"); } catch { toast.error("Erreur"); }
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
                    <TableCell>{format(new Date(d.date_emission), "dd/MM/yyyy", { locale: fr })}</TableCell>
                    <TableCell>{d.date_validite ? format(new Date(d.date_validite), "dd/MM/yyyy", { locale: fr }) : "—"}</TableCell>
                    <TableCell>{Number(d.montant_ttc).toLocaleString()} DA</TableCell>
                    <TableCell>{statutBadge(d.statut)}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>
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
