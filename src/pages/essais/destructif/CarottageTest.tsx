import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Plus, MoreHorizontal, Eye, Pencil, Copy, Trash2, Loader2, ClipboardEdit, FileBarChart, FileText } from "lucide-react";
import { useEchantillonsCarottage, useDeleteEchantillonCarottage, CarottageWithRelations } from "@/hooks/useEchantillonsCarottage";
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
      return <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 bg-yellow-500/10">En cours</Badge>;
    case "termine":
      return <Badge variant="outline" className="border-emerald-500/50 text-emerald-500 bg-emerald-500/10">Terminé</Badge>;
    case "a-faire":
      return <Badge variant="outline" className="border-sky-500/50 text-sky-500 bg-sky-500/10">À faire</Badge>;
    default:
      return <Badge variant="outline" className="border-muted-foreground/50 text-muted-foreground">{statut}</Badge>;
  }
};

const CarottageTest = () => {
  const navigate = useNavigate();
  const { data: echantillons, isLoading } = useEchantillonsCarottage();
  const deleteEchantillon = useDeleteEchantillonCarottage();

  const {
    searchTerm, setSearchTerm, statusFilter, setStatusFilter,
    currentPage, setCurrentPage, paginatedData, totalPages, totalItems, startIndex, endIndex,
  } = useTableFilters<CarottageWithRelations>({
    data: echantillons,
    searchFields: [
      (e) => e.clients?.nom,
      (e) => e.chantiers?.nom,
      (e) => e.ouvrage ?? undefined,
      (e) => e.partie_ouvrage ?? undefined,
    ],
    itemsPerPage: 10,
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteEchantillon.mutateAsync(id);
      toast.success("Échantillon supprimé avec succès");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-6">
      <EssaiBreadcrumb
        items={[
          { label: "Béton", path: "/essais/beton" },
          { label: "Destructif", path: "/essais/beton/destructif" },
          { label: "Carottage" },
        ]}
      />

      <div className="flex items-start gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/essais/beton/destructif")}
          className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            <span className="text-primary text-glow">Carottage</span> sur Béton
          </h1>
          <p className="text-muted-foreground mt-1">NF EN 12504-1 — Prélèvement de carottes</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex-1 min-w-0 w-full">
          <EchantillonFilters
            searchTerm={searchTerm} onSearchChange={setSearchTerm}
            statusFilter={statusFilter} onStatusChange={setStatusFilter}
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2" onClick={() => navigate("/essais/beton/destructif/carottage/etat-essais")}>
            <FileText className="h-4 w-4" /> État des essais
          </Button>
          <Button className="flex items-center gap-2" onClick={() => navigate("/essais/beton/destructif/carottage/nouveau")}>
            <Plus className="h-4 w-4" /> Nouveau échantillon
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-medium">N°</TableHead>
              <TableHead className="text-muted-foreground font-medium">Client</TableHead>
              <TableHead className="text-muted-foreground font-medium">Chantier</TableHead>
              <TableHead className="text-muted-foreground font-medium">Ouvrage</TableHead>
              <TableHead className="text-muted-foreground font-medium">Localisation</TableHead>
              <TableHead className="text-muted-foreground font-medium">Date prélèvement</TableHead>
              <TableHead className="text-muted-foreground font-medium text-center">Statut</TableHead>
              <TableHead className="text-muted-foreground font-medium text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Aucun échantillon trouvé</TableCell></TableRow>
            ) : (
              paginatedData.map((e) => (
                <TableRow key={e.id} className="border-border">
                  <TableCell className="font-medium text-foreground"><span className="text-primary">CR</span>-{String(e.numero).padStart(3, "0")}</TableCell>
                  <TableCell className="text-foreground">{e.clients?.nom ?? "-"}</TableCell>
                  <TableCell className="text-foreground">{e.chantiers?.nom ?? "-"}</TableCell>
                  <TableCell className="text-foreground">{e.ouvrage ?? "-"}</TableCell>
                  <TableCell className="text-foreground">{e.localisation ?? "-"}</TableCell>
                  <TableCell className="text-foreground">{format(new Date(e.date_prelevement), "dd/MM/yyyy", { locale: fr })}</TableCell>
                  <TableCell className="text-center">{getStatutBadge(e.statut)}</TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate(`/essais/beton/destructif/carottage/${e.id}`)}>
                          <Eye className="h-4 w-4" /> Détails
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate(`/essais/beton/destructif/carottage/${e.id}/saisie`)}>
                          <ClipboardEdit className="h-4 w-4" /> Saisie de données
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate(`/essais/beton/destructif/carottage/${e.id}/rapport`)}>
                          <FileBarChart className="h-4 w-4" /> Rapport
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate(`/essais/beton/destructif/carottage/${e.id}/modifier`)}>
                          <Pencil className="h-4 w-4" /> Modifier
                        </DropdownMenuItem>
                        <AdminOnly>
                          <ConfirmDelete
                            trigger={
                              <DropdownMenuItem className="flex items-center gap-2 text-destructive" onSelect={(ev) => ev.preventDefault()}>
                          <Trash2 className="h-4 w-4" /> Supprimer
                        </DropdownMenuItem>
                            }
                            onConfirm={() => handleDelete(e.id)}
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
        <EchantillonPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex} />
      </div>
    </div>
  );
};

export default CarottageTest;
