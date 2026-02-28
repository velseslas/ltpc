import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Wrench, Pencil, MoreHorizontal, Eye, History, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useMaintenanceMateriel, useDeleteMaintenanceMateriel } from "@/hooks/useMaterielLaboratoire";
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

export default function MaterielMaintenance() {
  const navigate = useNavigate();
  const { data, isLoading } = useMaintenanceMateriel();
  const deleteMutation = useDeleteMaintenanceMateriel();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((m: any) =>
      m.materiel_laboratoire?.nom?.toLowerCase().includes(q) ||
      m.type_maintenance?.toLowerCase().includes(q) ||
      m.prestataire?.toLowerCase().includes(q) ||
      m.statut?.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q)
    );
  }, [data, search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deleteMutation.mutateAsync(deleteId); toast.success("Supprimé"); } catch { toast.error("Erreur"); }
    setDeleteId(null);
  };

  const typeBadge = (t: string) => {
    switch (t) {
      case "preventive": return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Préventive</Badge>;
      case "corrective": return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Corrective</Badge>;
      case "curative": return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Curative</Badge>;
      default: return <Badge variant="outline">{t}</Badge>;
    }
  };

  const statutBadge = (s: string) => {
    switch (s) {
      case "planifie": return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Planifié</Badge>;
      case "en_cours": return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">En cours</Badge>;
      case "termine": return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Terminé</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Matériel Laboratoire", path: "/materiel" },
        { label: "Maintenance Matériel" },
      ]} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => navigate("/materiel")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Maintenance Matériel</h1>
            <p className="text-muted-foreground">Planification et suivi</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2" onClick={() => navigate("/materiel/maintenance/nouveau")}>
            <Plus className="h-4 w-4" />
            Nouvelle maintenance
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" />Maintenances ({filtered.length})</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : !filtered.length ? (
            <div className="text-center py-12 text-muted-foreground"><Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{search ? "Aucun résultat" : "Aucune maintenance enregistrée"}</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matériel</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Prestataire</TableHead>
                  <TableHead>Coût</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.materiel_laboratoire?.nom || "—"}</TableCell>
                    <TableCell>{typeBadge(m.type_maintenance)}</TableCell>
                    <TableCell>{format(new Date(m.date_maintenance), "dd/MM/yyyy", { locale: fr })}</TableCell>
                    <TableCell>{m.prestataire || "—"}</TableCell>
                    <TableCell>{m.cout ? `${m.cout.toLocaleString()} DA` : "—"}</TableCell>
                    <TableCell>{statutBadge(m.statut)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/materiel/maintenance/${m.id}`)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/materiel/maintenance/${m.id}/modifier`)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate("/materiel/maintenance/historique")}>
                            <History className="w-4 h-4 mr-2" />
                            Historique
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
              Êtes-vous sûr de vouloir supprimer cette maintenance ? Cette action est irréversible.
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
