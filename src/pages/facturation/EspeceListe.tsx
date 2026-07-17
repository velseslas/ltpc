import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PrintService } from "@/lib/print/PrintService";
import { Plus, Trash2, Banknote, Eye, Search, FileBarChart, MoreHorizontal, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { ConfirmDelete } from "@/components/common/ConfirmDelete";
import { AdminOnly } from "@/components/common/AdminOnly";
import { usePaiementsEspece, useDeletePaiementEspece } from "@/hooks/useFacturation";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function EspeceListe() {
  const navigate = useNavigate();
  const { data, isLoading } = usePaiementsEspece();
  const deleteMutation = useDeletePaiementEspece();
  const [search, setSearch] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try { await deleteMutation.mutateAsync(id); toast.success("Supprimé"); } catch { toast.error("Erreur"); }
  };

  const filtered = data?.filter((e: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (e.numero_recu?.toLowerCase().includes(s) ||
      e.clients?.nom?.toLowerCase().includes(s) ||
      e.chantiers?.nom?.toLowerCase().includes(s) ||
      e.montant?.toString().includes(s));
  });

  const statutBadge = (s: string) => {
    switch (s) {
      case "recu": return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Reçu</Badge>;
      case "en_attente": return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">En attente</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  const handlePrintPreview = () => {
    PrintService.print({ title: "Reçu de paiement", orientation: "portrait" });
  };

  const handleDownloadPreview = () => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `recu-${Date.now()}`;
    a.target = "_blank";
    a.click();
  };

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Facturation", path: "/facturation" },
        { label: "Espèce" },
      ]} />

      <div className="flex items-center gap-3">
        <BackButton to="/facturation" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Paiements en Espèce</h1>
          <p className="text-muted-foreground">Suivi des paiements en espèce</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par N° reçu, client, chantier, montant..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-11 bg-card border-border"
          />
        </div>
        <Button variant="outline" className="gap-2 shrink-0" onClick={() => navigate("/facturation/espece/etat")}>
          <FileBarChart className="h-4 w-4" />État des paiements
        </Button>
        <Button className="gap-2 shrink-0" onClick={() => navigate("/facturation/espece/nouveau")}>
          <Plus className="h-4 w-4" />Nouveau paiement
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Banknote className="h-5 w-5" />Espèces ({filtered?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : !filtered?.length ? (
            <div className="text-center py-12 text-muted-foreground"><Banknote className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Aucun paiement enregistré</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Reçu</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Chantier</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Date paiement</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.numero_recu || "—"}</TableCell>
                    <TableCell>{e.clients?.nom || "—"}</TableCell>
                    <TableCell>{e.chantiers?.nom || "—"}</TableCell>
                    <TableCell>{e.montant?.toLocaleString()} DA</TableCell>
                    <TableCell>{format(new Date(e.date_paiement), "dd/MM/yyyy", { locale: fr })}</TableCell>
                    <TableCell>{statutBadge(e.statut)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/facturation/espece/${e.id}/modifier`)}>
                            <Pencil className="h-4 w-4 mr-2" />Modifier
                          </DropdownMenuItem>
                          {e.recu_url && (
                            <DropdownMenuItem onClick={() => setPreviewUrl(e.recu_url)}>
                              <Eye className="h-4 w-4 mr-2" />Voir le reçu
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(e.id)}>
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

      {/* Receipt Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh]" data-ref="report">
          <DialogHeader>
            <DialogTitle>Aperçu du reçu</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-2 mb-2">
            <Button variant="outline" size="sm" onClick={handlePrintPreview}>Imprimer</Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPreview}>Télécharger</Button>
          </div>
          {previewUrl && (
            previewUrl.toLowerCase().endsWith(".pdf") ? (
              <iframe src={previewUrl} className="w-full h-[60vh] rounded border" />
            ) : (
              <img src={previewUrl} alt="Reçu" className="w-full max-h-[60vh] object-contain rounded" />
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
