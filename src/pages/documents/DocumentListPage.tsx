import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ArrowLeft, Plus, Search, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useTableFilters } from "@/hooks/useTableFilters";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import DocumentFormDialog, { type DocumentFormData } from "./DocumentFormDialog";
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

interface DocumentListPageProps {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  useHook: () => {
    query: { data: any[] | undefined; isLoading: boolean };
    create: { mutateAsync: (data: any) => Promise<any>; isPending: boolean };
    update: { mutateAsync: (data: any) => Promise<any>; isPending: boolean };
    remove: { mutateAsync: (id: string) => Promise<any>; isPending: boolean };
  };
  extraFields?: "engagement" | "service" | "prix" | "attestation";
  extraColumns?: { header: string; render: (item: any) => React.ReactNode }[];
}

const statusBadge = (statut: string) => {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    brouillon: { label: "Brouillon", variant: "secondary" },
    envoyé: { label: "Envoyé", variant: "default" },
    accepté: { label: "Accepté", variant: "outline" },
    refusé: { label: "Refusé", variant: "destructive" },
  };
  const s = map[statut] || { label: statut, variant: "secondary" as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
};

const DocumentListPage = ({ title, icon: Icon, iconColor, useHook, extraFields, extraColumns }: DocumentListPageProps) => {
  const navigate = useNavigate();
  const { query, create, update, remove } = useHook();
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const {
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    paginatedData,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
  } = useTableFilters({
    data: query.data,
    searchFields: ["titre", "numero", (item: any) => item.clients?.nom, (item: any) => item.chantiers?.nom],
    itemsPerPage: 10,
  });

  const handleSubmit = async (data: DocumentFormData) => {
    try {
      const payload: any = {
        titre: data.titre,
        numero: data.numero || null,
        date_document: data.date_document,
        client_id: data.client_id || null,
        chantier_id: data.chantier_id || null,
        observations: data.observations || null,
        statut: data.statut,
      };

      if (extraFields === "engagement") payload.montant = data.montant ? parseFloat(data.montant) : null;
      if (extraFields === "service") payload.description = data.description || null;
      if (extraFields === "prix") {
        payload.montant_ht = data.montant_ht ? parseFloat(data.montant_ht) : null;
        payload.montant_ttc = data.montant_ttc ? parseFloat(data.montant_ttc) : null;
      }
      if (extraFields === "attestation") {
        payload.date_debut = data.date_debut || null;
        payload.date_fin = data.date_fin || null;
      }

      if (editItem) {
        await update.mutateAsync({ id: editItem.id, ...payload });
        toast.success("Document modifié avec succès");
      } else {
        await create.mutateAsync(payload);
        toast.success("Document créé avec succès");
      }
      setFormOpen(false);
      setEditItem(null);
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await remove.mutateAsync(deleteId);
      toast.success("Document supprimé");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
    setDeleteId(null);
  };

  return (
    <>
      <AppBreadcrumb items={[{ label: "Documents", path: "/documents" }, { label: title }]} />

      <div className="mb-6 flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate("/documents")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-display font-bold text-foreground">
          {title.split(" ").map((word, i) => (
            <span key={i} className={i % 2 === 0 ? "text-primary text-glow" : ""}>
              {word}{" "}
            </span>
          ))}
        </h1>
      </div>

      <div className="space-y-6">

        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => { setEditItem(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau
          </Button>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>N°</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Chantier</TableHead>
                {extraColumns?.map((col) => (
                  <TableHead key={col.header}>{col.header}</TableHead>
                ))}
                <TableHead>Statut</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                <TableRow>
                  <TableCell colSpan={7 + (extraColumns?.length || 0)} className="text-center py-8 text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7 + (extraColumns?.length || 0)} className="text-center py-8 text-muted-foreground">
                    Aucun document trouvé
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.titre}</TableCell>
                    <TableCell>{item.numero || "—"}</TableCell>
                    <TableCell>
                      {item.date_document
                        ? format(new Date(item.date_document), "dd/MM/yyyy", { locale: fr })
                        : "—"}
                    </TableCell>
                    <TableCell>{item.clients?.nom || "—"}</TableCell>
                    <TableCell>{item.chantiers?.nom || "—"}</TableCell>
                    {extraColumns?.map((col) => (
                      <TableCell key={col.header}>{col.render(item)}</TableCell>
                    ))}
                    <TableCell>{statusBadge(item.statut)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditItem(item); setFormOpen(true); }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(item.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {startIndex}–{endIndex} sur {totalItems}
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={page === currentPage}
                      onClick={() => setCurrentPage(page)}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      <DocumentFormDialog
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditItem(null); }}
        onSubmit={handleSubmit}
        initialData={editItem}
        title={editItem ? `Modifier - ${title}` : `Nouveau - ${title}`}
        extraFields={extraFields}
        isLoading={create.isPending || update.isPending}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le document sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DocumentListPage;
