import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, MoreHorizontal, Eye, Edit, Copy, Trash2, ClipboardEdit, FileText, ArrowLeft, Loader2, ClipboardList } from "lucide-react";
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
import { useState } from "react";
import { EssaiBreadcrumb, BreadcrumbItem } from "@/components/essais/EssaiBreadcrumb";
import { EchantillonFilters } from "@/components/essais/EchantillonFilters";
import { EchantillonPagination } from "@/components/essais/EchantillonPagination";
import { useTableFilters } from "@/hooks/useTableFilters";
import {
  useEchantillonsBetonFraisByType,
  useDeleteEchantillonBetonFraisByType,
  getPrefix,
  EchantillonBetonFraisBase,
} from "@/hooks/useEchantillonsBetonFraisFactory";
import { AdminOnly } from "@/components/common/AdminOnly";

const getStatusBadge = (statut: string) => {
  switch (statut) {
    case "termine":
      return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Terminé</Badge>;
    case "en-cours":
      return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">En cours</Badge>;
    case "a-faire":
      return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">À faire</Badge>;
    default:
      return null;
  }
};

interface EchantillonBetonFraisListProps {
  title: string;
  essaiType: string;
  basePath: string;
  backPath?: string;
  breadcrumbItems?: BreadcrumbItem[];
}

export function EchantillonBetonFraisList({
  title,
  essaiType,
  basePath,
  backPath = "/essais/beton/beton-frais",
  breadcrumbItems,
}: EchantillonBetonFraisListProps) {
  const navigate = useNavigate();
  const { data: echantillons, isLoading } = useEchantillonsBetonFraisByType(essaiType);
  const deleteEchantillon = useDeleteEchantillonBetonFraisByType(essaiType);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const prefix = getPrefix(essaiType);

  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    paginatedData,
    totalPages,
    filteredData,
    startIndex,
    endIndex,
  } = useTableFilters<EchantillonBetonFraisBase>({
    data: echantillons,
    searchFields: [
      (e) => e.clients?.nom,
      (e) => e.chantiers?.nom,
      (e) => e.centrales_beton?.nom,
    ],
    itemsPerPage: 10,
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteEchantillon.mutateAsync(deleteId);
      toast.success("Échantillon supprimé avec succès");
      setDeleteId(null);
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const defaultBreadcrumbItems: BreadcrumbItem[] = [
    { label: "Béton", path: "/essais/beton" },
    { label: "Béton Frais", path: "/essais/beton/beton-frais" },
    { label: title },
  ];

  return (
    <>
      <EssaiBreadcrumb items={breadcrumbItems || defaultBreadcrumbItems} />

      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(backPath)}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <EchantillonFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            searchPlaceholder="Rechercher par client, chantier, centrale..."
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => navigate(`/essais/beton/beton-frais/etat-essais?type=${essaiType}&back=${basePath}`)}
          >
            <ClipboardList className="h-4 w-4" />
            État des essais
          </Button>
          <Button
            onClick={() => navigate(`${basePath}/nouveau`)}
            className="gradient-primary text-primary-foreground"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouveau
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[100px]">N°</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Chantier</TableHead>
              <TableHead>Centrale</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
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
                <TableRow
                  key={echantillon.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`${basePath}/${echantillon.id}`)}
                >
                  <TableCell className="font-medium">
                    <span className="text-primary">{prefix}</span>-{String(echantillon.numero).padStart(3, "0")}
                  </TableCell>
                  <TableCell>{echantillon.clients?.nom || "-"}</TableCell>
                  <TableCell>{echantillon.chantiers?.nom || "-"}</TableCell>
                  <TableCell>{echantillon.centrales_beton?.nom || "-"}</TableCell>
                  <TableCell>
                    {format(new Date(echantillon.date_prelevement), "dd/MM/yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell>{getStatusBadge(echantillon.statut)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`${basePath}/${echantillon.id}/saisie`);
                          }}
                          className=""
                        >
                          <ClipboardEdit className="w-4 h-4 mr-2" />
                          Saisie de données
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`${basePath}/${echantillon.id}`);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Détails
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`${basePath}/${echantillon.id}/rapport`);
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Rapport
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`${basePath}/${echantillon.id}/modifier`);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(echantillon.id);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
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
      </div>

      <EchantillonPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredData.length}
        startIndex={startIndex}
        endIndex={endIndex}
      />

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
