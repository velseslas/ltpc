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
import { ArrowLeft, FileText, Plus, MoreHorizontal, Eye, Pencil, Trash2, Loader2, ClipboardEdit, FileBarChart, ClipboardList } from "lucide-react";
import { useEchantillonsCompression, useDeleteEchantillonCompression, EchantillonWithRelations } from "@/hooks/useEchantillonsCompression";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { AdminOnly } from "@/components/common/AdminOnly";
import { ConfirmDelete } from "@/components/common/ConfirmDelete";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { EchantillonFilters } from "@/components/essais/EchantillonFilters";
import { EchantillonPagination } from "@/components/essais/EchantillonPagination";
import { useTableFilters } from "@/hooks/useTableFilters";

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

const CompressionTest = () => {
  const navigate = useNavigate();
  const { data: echantillons, isLoading } = useEchantillonsCompression();
  const deleteEchantillon = useDeleteEchantillonCompression();

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
  } = useTableFilters<EchantillonWithRelations>({
    data: echantillons,
    searchFields: [
      (e) => e.clients?.nom,
      (e) => e.chantiers?.nom,
      (e) => e.ouvrage ?? undefined,
      (e) => e.usage ?? undefined,
    ],
    itemsPerPage: 10,
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteEchantillon.mutateAsync(id);
      toast.success("Échantillon supprimé avec succès");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-6">
        <EssaiBreadcrumb 
          items={[
            { label: "Béton", path: "/essais/beton" },
            { label: "Béton Durci", path: "/essais/beton/beton-durci" },
            { label: "Compression" }
          ]} 
        />
        
        {/* Header avec bouton retour */}
        <div className="flex items-start gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/essais/beton/beton-durci")}
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Essai de Résistance à la <span className="text-primary text-glow">Compression</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Essais sur le Béton Durci
            </p>
          </div>
        </div>

        {/* Barre de recherche, filtres et actions */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex-1 min-w-0 w-full">
            <EchantillonFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2" onClick={() => navigate("/essais/beton/beton-durci/etat-essais?type=compression&back=/essais/beton/beton-durci/compression")}>
              <FileText className="h-4 w-4" />
              État des essais
            </Button>
            <Button 
              className="flex items-center gap-2"
              onClick={() => navigate("/essais/beton/beton-durci/compression/nouveau")}
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
                <TableHead className="text-muted-foreground font-medium">Client</TableHead>
                <TableHead className="text-muted-foreground font-medium">Chantier</TableHead>
                <TableHead className="text-muted-foreground font-medium">Ouvrage</TableHead>
                <TableHead className="text-muted-foreground font-medium">Partie de l'ouvrage</TableHead>
                <TableHead className="text-muted-foreground font-medium">Date de coulage</TableHead>
                <TableHead className="text-muted-foreground font-medium text-center">Statut</TableHead>
                <TableHead className="text-muted-foreground font-medium text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Aucun échantillon trouvé
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((echantillon) => (
                  <TableRow key={echantillon.id} className="border-border">
                    <TableCell className="font-medium text-foreground">
                      <span className="text-primary">EC</span>-{String(echantillon.numero).padStart(3, "0")}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {echantillon.clients?.nom ?? "-"}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {echantillon.chantiers?.nom ?? "-"}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {echantillon.ouvrage ?? "-"}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {echantillon.usage ?? "-"}
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
                            onClick={() => navigate(`/essais/beton/beton-durci/compression/${echantillon.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex items-center gap-2"
                            onClick={() => navigate(`/essais/beton/beton-durci/compression/${echantillon.id}/saisie`)}
                          >
                            <ClipboardEdit className="h-4 w-4" />
                            Saisie de données
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex items-center gap-2"
                            onClick={() => navigate(`/essais/beton/beton-durci/compression/${echantillon.id}/bulletin`)}
                          >
                            <ClipboardList className="h-4 w-4" />
                            Bulletin d'échantillonnage
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex items-center gap-2"
                            onClick={() => navigate(`/essais/beton/beton-durci/compression/${echantillon.id}/rapport`)}
                          >
                            <FileBarChart className="h-4 w-4" />
                            Afficher rapport
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex items-center gap-2"
                            onClick={() => navigate(`/essais/beton/beton-durci/compression/${echantillon.id}/modifier`)}
                          >
                            <Pencil className="h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <AdminOnly>
                          <ConfirmDelete
                            trigger={
                              <DropdownMenuItem className="flex items-center gap-2 text-destructive" onSelect={(ev) => ev.preventDefault()}>
                            <Trash2 className="h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                            }
                            onConfirm={() => handleDelete(echantillon.id)}
                            description="Supprimer cet échantillon ? Cette action est irréversible."
                            adminOnly={false}
                          />
                        </AdminOnly>
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
      </div>
  );
};

export default CompressionTest;
