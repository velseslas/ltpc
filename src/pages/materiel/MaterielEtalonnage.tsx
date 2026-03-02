import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Gauge, Pencil, MoreHorizontal, Eye, History, Search } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useEtalonnageMateriel, useDeleteEtalonnageMateriel } from "@/hooks/useMaterielLaboratoire";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
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

export default function MaterielEtalonnage() {
  const navigate = useNavigate();
  const { data, isLoading } = useEtalonnageMateriel();
  const deleteMutation = useDeleteEtalonnageMateriel();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((e: any) =>
      e.materiel_laboratoire?.nom?.toLowerCase().includes(q) ||
      e.organisme?.toLowerCase().includes(q) ||
      e.numero_certificat?.toLowerCase().includes(q) ||
      e.resultat?.toLowerCase().includes(q)
    );
  }, [data, search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deleteMutation.mutateAsync(deleteId); toast.success("Supprimé"); } catch { toast.error("Erreur"); }
    setDeleteId(null);
  };

  const resultatBadge = (r: string) => {
    switch (r) {
      case "conforme": return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Conforme</Badge>;
      case "non_conforme": return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Non conforme</Badge>;
      default: return <Badge variant="outline">{r}</Badge>;
    }
  };

  const echeanceBadge = (date: string | null) => {
    if (!date) return <span className="text-muted-foreground">—</span>;
    const days = differenceInDays(new Date(date), new Date());
    if (days < 0) return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Échu</Badge>;
    if (days <= 30) return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">{days}j</Badge>;
    return <span className="text-muted-foreground">{format(new Date(date), "dd/MM/yyyy", { locale: fr })}</span>;
  };

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Matériel Laboratoire", path: "/materiel" },
        { label: "Étalonnage Matériel" },
      ]} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton to="/materiel" />
          <div>
            <h1 className="text-2xl font-bold">Étalonnage Matériel</h1>
            <p className="text-muted-foreground">Suivi des étalonnages</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un étalonnage..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button className="gap-2" onClick={() => navigate("/materiel/etalonnage/nouveau")}>
          <Plus className="h-4 w-4" />
          Nouveau
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Gauge className="h-5 w-5" />Étalonnages ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : !filtered.length ? (
            <div className="text-center py-12 text-muted-foreground"><Gauge className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{search ? "Aucun résultat" : "Aucun étalonnage enregistré"}</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matériel</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Organisme</TableHead>
                  <TableHead>N° Certificat</TableHead>
                  <TableHead>Résultat</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.materiel_laboratoire?.nom || "—"}</TableCell>
                    <TableCell>{format(new Date(e.date_etalonnage), "dd/MM/yyyy", { locale: fr })}</TableCell>
                    <TableCell>{e.organisme || "—"}</TableCell>
                    <TableCell>{e.numero_certificat || "—"}</TableCell>
                    <TableCell>{resultatBadge(e.resultat)}</TableCell>
                    <TableCell>{echeanceBadge(e.date_prochain_etalonnage)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/materiel/etalonnage/${e.id}`)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/materiel/etalonnage/${e.id}/modifier`)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate("/materiel/etalonnage/historique")}>
                            <History className="w-4 h-4 mr-2" />
                            Historique
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteId(e.id)}
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
              Êtes-vous sûr de vouloir supprimer cet étalonnage ? Cette action est irréversible.
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
