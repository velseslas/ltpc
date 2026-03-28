import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { FileText, Plus, MoreHorizontal, Eye, Pencil, Trash2, Loader2, ClipboardEdit, ArrowLeft, FileBarChart } from "lucide-react";
import { 
  useEchantillonsGranulatByType, 
  useDeleteEchantillonGranulatByType,
  EchantillonGranulatBase,
  getPrefix
} from "@/hooks/useEchantillonsGranulatFactory";

const TYPE_ESSAI_SUFFIX: Record<string, string> = {
  beton: "B",
  geotechnique: "G",
  route: "R",
};

const ESSAIS_WITH_TYPE = ["equivalent-sable", "bleu-methylene", "micro-deval", "los-angeles"];

function getTypeSuffix(echantillon: EchantillonGranulatBase, essaiType: string): string {
  if (!ESSAIS_WITH_TYPE.includes(essaiType)) return "";
  const resultats = echantillon.resultats as Record<string, unknown> | null;
  const typeEssai = (resultats?.type_essai as string) || "beton";
  return TYPE_ESSAI_SUFFIX[typeEssai] || "B";
}
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { EssaiBreadcrumb, BreadcrumbItem as BreadcrumbItemType } from "@/components/essais/EssaiBreadcrumb";
import { EchantillonFilters } from "@/components/essais/EchantillonFilters";
import { EchantillonPagination } from "@/components/essais/EchantillonPagination";
import { useTableFilters } from "@/hooks/useTableFilters";

interface EchantillonGranulatListProps {
  title: string;
  essaiType: string;
  basePath: string;
  backPath?: string;
  breadcrumbItems?: BreadcrumbItemType[];
}

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

export function EchantillonGranulatList({ title, essaiType, basePath, backPath, breadcrumbItems }: EchantillonGranulatListProps) {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [echantillonToDelete, setEchantillonToDelete] = useState<string | null>(null);

  const { data: echantillons, isLoading } = useEchantillonsGranulatByType(essaiType);
  const deleteEchantillon = useDeleteEchantillonGranulatByType(essaiType);

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
  } = useTableFilters<EchantillonGranulatBase>({
    data: echantillons,
    searchFields: [
      (e) => e.carrieres?.nom,
      "produit",
    ],
    itemsPerPage: 10,
  });

  const handleDelete = async () => {
    if (!echantillonToDelete) return;
    
    try {
      await deleteEchantillon.mutateAsync(echantillonToDelete);
      toast.success("Échantillon supprimé avec succès");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteDialogOpen(false);
      setEchantillonToDelete(null);
    }
  };

  return (
    <>
      {breadcrumbItems && <EssaiBreadcrumb items={breadcrumbItems} />}
      
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          {backPath && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(backPath)}
              className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-3xl font-display font-bold text-foreground">
            {title.split(" ")[0]} <span className="text-primary text-glow">{title.split(" ").slice(1).join(" ")}</span>
          </h1>
        </div>
        <p className={`text-muted-foreground mt-2 ${backPath ? 'ml-14' : ''}`}>
          Gérez vos échantillons pour l'essai {essaiType.replace(/-/g, " ")}
        </p>
      </div>

      {/* Search, Filters and Actions Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6 items-start lg:items-center justify-between">
        <div className="flex-1 min-w-0 w-full">
          <EchantillonFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-border">
            <FileText className="w-4 h-4 mr-2" />
            Générer état
          </Button>
          <Button 
            className="gradient-primary text-primary-foreground"
            onClick={() => navigate(`${basePath}/nouveau`)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau échantillon
          </Button>
        </div>
      </div>

      {/* Samples Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Liste des échantillons ({totalItems})
          </h2>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground w-24">N°</TableHead>
                <TableHead className="text-muted-foreground">Carrière</TableHead>
                <TableHead className="text-muted-foreground">Produit</TableHead>
                <TableHead className="text-muted-foreground">Date de réception</TableHead>
                <TableHead className="text-muted-foreground">Statut</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((echantillon) => (
                <TableRow 
                  key={echantillon.id} 
                  className="border-border hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`${basePath}/${echantillon.id}`)}
                >
                  <TableCell className="font-medium text-foreground font-mono">
                    <span className="text-primary">{getPrefix(essaiType)}{getTypeSuffix(echantillon, essaiType)}</span>-{String(echantillon.numero).padStart(3, "0")}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {echantillon.carrieres?.nom || "-"}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {echantillon.produit}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {format(new Date(echantillon.date_reception), "dd/MM/yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell>
                    {getStatutBadge(echantillon.statut)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`${basePath}/${echantillon.id}/saisie`);
                          }}
                          className="text-primary focus:text-primary"
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
                          Voir détails
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
                          <Pencil className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEchantillonToDelete(echantillon.id);
                            setDeleteDialogOpen(true);
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
              ))}
              {paginatedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun échantillon trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
        
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet échantillon ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEchantillon.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
