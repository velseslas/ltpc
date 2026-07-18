import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Microscope, Eye, Pencil, MoreHorizontal, Search, ClipboardList } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useMaterielList, useDeleteMateriel } from "@/hooks/useMaterielLaboratoire";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
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
import { AdminOnly } from "@/components/common/AdminOnly";

const etatBadge = (etat: string) => {
  switch (etat) {
    case "operationnel": return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Opérationnel</Badge>;
    case "hors_service": return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Hors service</Badge>;
    case "en_reparation": return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">En réparation</Badge>;
    default: return <Badge variant="outline">{etat}</Badge>;
  }
};

export default function MaterielListe() {
  const navigate = useNavigate();
  const { data, isLoading } = useMaterielList();
  const deleteMutation = useDeleteMateriel();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(m =>
      m.nom?.toLowerCase().includes(q) ||
      m.reference?.toLowerCase().includes(q) ||
      m.categorie?.toLowerCase().includes(q) ||
      m.marque?.toLowerCase().includes(q) ||
      m.localisation?.toLowerCase().includes(q) ||
      m.numero_serie?.toLowerCase().includes(q)
    );
  }, [data, search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Matériel supprimé");
    } catch {
      toast.error("Erreur");
    }
    setDeleteId(null);
  };

  return (
    <div data-essai-mobile className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Matériel Laboratoire", path: "/materiel" },
        { label: "Liste Matériel" },
      ]} />


      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton to="/materiel" />
          <div>
            <h1 className="text-2xl font-bold">Liste du Matériel</h1>
            <p className="text-muted-foreground">Inventaire complet</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un matériel..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" className="gap-2" onClick={() => navigate("/materiel/inventaire")}>
          <ClipboardList className="h-4 w-4" />
          Inventaire
        </Button>
        <Button className="gap-2" onClick={() => navigate("/materiel/liste/nouveau")}><Plus className="h-4 w-4" />Nouveau</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Microscope className="h-5 w-5" />Matériel ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : !filtered.length ? (
            <div className="text-center py-12 text-muted-foreground"><Microscope className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{search ? "Aucun résultat" : "Aucun matériel enregistré"}</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Marque</TableHead>
                  <TableHead>État</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.nom}</TableCell>
                    <TableCell>{m.reference || "—"}</TableCell>
                    <TableCell className="capitalize">{m.categorie?.replace("_", " ")}</TableCell>
                    <TableCell>{m.marque || "—"}</TableCell>
                    <TableCell>{etatBadge(m.etat)}</TableCell>
                    <TableCell>{(m as any).quantite ?? 1}</TableCell>
                    <TableCell>{m.localisation || "—"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/materiel/liste/${m.id}`)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/materiel/liste/${m.id}/modifier`)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteId(m.id)}
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
              Êtes-vous sûr de vouloir supprimer ce matériel ? Cette action est irréversible.
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
