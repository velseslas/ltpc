import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2, ShoppingCart, Phone, Mail, MapPin, Briefcase, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrestataire, useBonsCommandePrestataire, useDeleteBonCommandePrestataire } from "@/hooks/usePrestataires";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const statutBadge = (s: string) => {
  const map: Record<string, { label: string; cls: string }> = {
    brouillon: { label: "Brouillon", cls: "bg-muted text-muted-foreground border-border" },
    envoye: { label: "Envoyé", cls: "bg-blue-500/20 text-blue-500 border-blue-500/30" },
    confirme: { label: "Confirmé", cls: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" },
    en_cours: { label: "En cours", cls: "bg-amber-500/20 text-amber-500 border-amber-500/30" },
    termine: { label: "Terminé", cls: "bg-muted text-muted-foreground border-border" },
    annule: { label: "Annulé", cls: "bg-red-500/20 text-red-500 border-red-500/30" },
  };
  const m = map[s] || { label: s, cls: "" };
  return <Badge className={m.cls}>{m.label}</Badge>;
};

export default function PrestataireDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: prestataire, isLoading } = usePrestataire(id);
  const { data: allBons } = useBonsCommandePrestataire();
  const deleteBon = useDeleteBonCommandePrestataire();

  const bons = allBons?.filter((b: any) => b.prestataire_id === id) || [];

  const handleDeleteBon = async (bonId: string) => {
    if (!confirm("Supprimer ce bon de commande ?")) return;
    try { await deleteBon.mutateAsync(bonId); toast.success("Supprimé"); } catch { toast.error("Erreur"); }
  };

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-64" /><Skeleton className="h-48 w-full" /></div>;
  }

  if (!prestataire) {
    return <div className="text-center py-12 text-muted-foreground">Prestataire non trouvé</div>;
  }

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Intervenants", path: "/intervenant" },
        { label: "Prestataires", path: "/intervenant/prestataires" },
        { label: prestataire.nom },
      ]} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton to="/intervenant/prestataires" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">{prestataire.nom}</h1>
            <p className="text-muted-foreground">{prestataire.specialite || "Prestataire"}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate(`/intervenant/prestataires/${id}/modifier`)}>Modifier</Button>
      </div>

      {/* Info card */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" />Informations</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {prestataire.contact && <div><p className="text-sm text-muted-foreground">Contact</p><p className="font-medium text-foreground">{prestataire.contact}</p></div>}
            {prestataire.telephone && <div><p className="text-sm text-muted-foreground">Téléphone</p><p className="font-medium text-foreground flex items-center gap-2"><Phone className="h-4 w-4" />{prestataire.telephone}</p></div>}
            {prestataire.email && <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium text-foreground flex items-center gap-2"><Mail className="h-4 w-4" />{prestataire.email}</p></div>}
            {prestataire.adresse && <div><p className="text-sm text-muted-foreground">Adresse</p><p className="font-medium text-foreground">{prestataire.adresse}</p></div>}
            {prestataire.ville && <div><p className="text-sm text-muted-foreground">Ville</p><p className="font-medium text-foreground flex items-center gap-2"><MapPin className="h-4 w-4" />{prestataire.ville}</p></div>}
            {prestataire.observations && <div className="md:col-span-3"><p className="text-sm text-muted-foreground">Observations</p><p className="font-medium text-foreground">{prestataire.observations}</p></div>}
          </div>
        </CardContent>
      </Card>

      {/* Bons de commande */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" />Bons de commande ({bons.length})</CardTitle>
          <Button className="gap-2" onClick={() => navigate(`/intervenant/prestataires/${id}/bon-commande/nouveau`)}>
            <Plus className="h-4 w-4" />Nouveau BC
          </Button>
        </CardHeader>
        <CardContent>
          {bons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun bon de commande pour ce prestataire</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° BC</TableHead>
                  <TableHead>Objet</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant TTC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bons.map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.numero}</TableCell>
                    <TableCell>{b.objet || "—"}</TableCell>
                    <TableCell>{format(new Date(b.date_commande), "dd/MM/yyyy", { locale: fr })}</TableCell>
                    <TableCell>{Number(b.montant_ttc).toLocaleString()} DA</TableCell>
                    <TableCell>{statutBadge(b.statut)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteBon(b.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
