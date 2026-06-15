import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, MoreHorizontal, Eye, Pencil, Copy, Trash2, Loader2, ClipboardEdit, FileBarChart, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { toast } from "sonner";
import { EchantillonFilters } from "@/components/essais/EchantillonFilters";
import { EchantillonPagination } from "@/components/essais/EchantillonPagination";
import { useTableFilters } from "@/hooks/useTableFilters";
import { 
  useChantierEchantillons, 
  useDeleteChantierEchantillon,
  EchantillonChantier 
} from "@/hooks/useChantierEchantillons";
import { AdminOnly } from "@/components/common/AdminOnly";

const getStatutBadge = (statut: string) => {
  switch (statut) {
    case "en-cours":
      return (
        <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 bg-yellow-500/10">
          En cours
        </Badge>
      );
    case "termine":
      return (
        <Badge variant="outline" className="border-emerald-500/50 text-emerald-500 bg-emerald-500/10">
          Terminé
        </Badge>
      );
    case "a-faire":
      return (
        <Badge variant="outline" className="border-sky-500/50 text-sky-500 bg-sky-500/10">
          À faire
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="border-muted-foreground/50 text-muted-foreground">
          {statut}
        </Badge>
      );
  }
};

interface ChantierEchantillonsListProps {
  chantierId: string;
}

export function ChantierEchantillonsList({ chantierId }: ChantierEchantillonsListProps) {
  const navigate = useNavigate();
  const { data: echantillons, isLoading } = useChantierEchantillons(chantierId);
  const deleteEchantillon = useDeleteChantierEchantillon();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    paginatedData,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
  } = useTableFilters<EchantillonChantier>({
    data: echantillons,
    searchFields: [
      (e) => e.ouvrage ?? undefined,
      (e) => e.usage ?? undefined,
      (e) => e.centrales_beton?.nom,
      (e) => e.formulations?.nom,
    ],
    itemsPerPage: 10,
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteEchantillon.mutateAsync({ id: deleteId, chantierId });
      toast.success("Échantillon supprimé avec succès");
      setDeleteId(null);
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <>
      {/* Header et actions */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
        <EchantillonFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          searchPlaceholder="Rechercher un échantillon..."
        />
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => navigate(`/laboratoires-mobiles/chantier/${chantierId}/etat-coulages`)}
          >
            <ClipboardList className="h-4 w-4" />
            État des coulages
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={() => navigate(`/laboratoires-mobiles/chantier/${chantierId}/echantillon/nouveau`)}
          >
            <Plus className="h-4 w-4" />
            Nouveau échantillon
          </Button>
        </div>
      </div>

      {/* Tableau des échantillons */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-medium">N°</TableHead>
              <TableHead className="text-muted-foreground font-medium">Ouvrage</TableHead>
              <TableHead className="text-muted-foreground font-medium">Partie de l'ouvrage</TableHead>
              <TableHead className="text-muted-foreground font-medium">Centrale</TableHead>
              <TableHead className="text-muted-foreground font-medium">Date de coulage</TableHead>
              <TableHead className="text-muted-foreground font-medium text-center">Statut</TableHead>
              <TableHead className="text-muted-foreground font-medium text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Aucun échantillon trouvé
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((echantillon) => (
                <TableRow key={echantillon.id} className="border-border">
                  <TableCell className="font-medium text-foreground">
                    <span className="text-primary">EC</span>-{String((echantillon as any).numero_chantier || echantillon.numero).padStart(3, "0")}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {echantillon.ouvrage ?? "-"}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {echantillon.usage ?? "-"}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {echantillon.centrales_beton?.nom ?? "-"}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {echantillon.date_coulage 
                      ? format(new Date(echantillon.date_coulage), "dd/MM/yyyy", { locale: fr })
                      : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatutBadge(echantillon.statut)}
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="flex items-center gap-2"
                          onClick={() => navigate(`/laboratoires-mobiles/chantier/${chantierId}/echantillon/${echantillon.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                          Détails
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center gap-2"
                          onClick={() => navigate(`/laboratoires-mobiles/chantier/${chantierId}/echantillon/${echantillon.id}/saisie`)}
                        >
                          <ClipboardEdit className="h-4 w-4" />
                          Saisie de données
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center gap-2"
                          onClick={() => navigate(`/laboratoires-mobiles/chantier/${chantierId}/echantillon/${echantillon.id}/bulletin`)}
                        >
                          <ClipboardList className="h-4 w-4" />
                          Bulletin d'échantillonnage
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center gap-2"
                          onClick={() => navigate(`/laboratoires-mobiles/chantier/${chantierId}/echantillon/${echantillon.id}/rapport`)}
                        >
                          <FileBarChart className="h-4 w-4" />
                          Rapport
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center gap-2"
                          onClick={() => navigate(`/laboratoires-mobiles/chantier/${chantierId}/echantillon/nouveau?duplicateFrom=${echantillon.id}`)}
                        >
                          <Copy className="h-4 w-4" />
                          Dupliquer
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center gap-2"
                          onClick={() => navigate(`/laboratoires-mobiles/chantier/${chantierId}/echantillon/${echantillon.id}/modifier`)}
                        >
                          <Pencil className="h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center gap-2 text-destructive"
                          onClick={() => setDeleteId(echantillon.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {/* Pagination */}
        <EchantillonPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={endIndex}
        />
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet échantillon ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteEchantillon.isPending}
            >
              {deleteEchantillon.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
