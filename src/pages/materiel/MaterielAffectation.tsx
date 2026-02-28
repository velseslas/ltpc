import { useNavigate } from "react-router-dom";
import { Plus, Trash2, ArrowLeftRight, Pencil, MoreHorizontal, Eye, History, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useAffectationMateriel, useDeleteAffectationMateriel } from "@/hooks/useMaterielLaboratoire";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function MaterielAffectation() {
  const navigate = useNavigate();
  const { data, isLoading } = useAffectationMateriel();
  const deleteMutation = useDeleteAffectationMateriel();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((a: any) =>
      a.materiel_laboratoire?.nom?.toLowerCase().includes(q) ||
      a.chantiers?.nom?.toLowerCase().includes(q) ||
      a.intervenants?.nom?.toLowerCase().includes(q) ||
      a.intervenants?.prenom?.toLowerCase().includes(q) ||
      a.statut?.toLowerCase().includes(q)
    );
  }, [data, search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deleteMutation.mutateAsync(deleteId); toast.success("Supprimé"); } catch { toast.error("Erreur"); }
    setDeleteId(null);
  };

  const statutBadge = (s: string) => {
    switch (s) {
      case "en_cours": return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">En cours</Badge>;
      case "terminee": return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Terminée</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Matériel Laboratoire", path: "/materiel" },
        { label: "Affectation Matériel" },
      ]} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => navigate("/materiel")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Affectation Matériel</h1>
            <p className="text-muted-foreground">Gestion des affectations</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher une affectation..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button className="gap-2" onClick={() => navigate("/materiel/affectation/nouveau")}>
          <Plus className="h-4 w-4" />
          Nouveau
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ArrowLeftRight className="h-5 w-5" />Affectations ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : !filtered.length ? (
            <div className="text-center py-12 text-muted-foreground"><ArrowLeftRight className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{search ? "Aucun résultat" : "Aucune affectation"}</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matériel</TableHead>
                  <TableHead>Chantier</TableHead>
                  <TableHead>Technicien</TableHead>
                  <TableHead>Date début</TableHead>
                  <TableHead>Date fin</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.materiel_laboratoire?.nom || "—"}</TableCell>
                    <TableCell>{a.chantiers?.nom || "—"}</TableCell>
                    <TableCell>{a.intervenants ? `${a.intervenants.prenom} ${a.intervenants.nom}` : "—"}</TableCell>
                    <TableCell>{format(new Date(a.date_debut), "dd/MM/yyyy", { locale: fr })}</TableCell>
                    <TableCell>{a.date_fin ? format(new Date(a.date_fin), "dd/MM/yyyy", { locale: fr }) : "—"}</TableCell>
                    <TableCell>{statutBadge(a.statut)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/materiel/affectation/${a.id}`)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/materiel/affectation/${a.id}/modifier`)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate("/materiel/affectation/historique")}>
                            <History className="w-4 h-4 mr-2" />
                            Historique
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteId(a.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette affectation ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
