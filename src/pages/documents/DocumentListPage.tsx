import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ArrowLeft, Plus, Search, MoreHorizontal, Pencil, Trash2, FileText, Calendar, Building2, MapPin, Loader2 } from "lucide-react";
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
import { AdminOnly } from "@/components/common/AdminOnly";

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
  extraFields?: "engagement" | "service" | "prix" | "attestation" | "contract";
  extraColumns?: { header: string; render: (item: any) => React.ReactNode }[];
  onItemClick?: (item: any) => void;
}

const statusBadge = (statut: string) => {
  const map: Record<string, { label: string; className: string }> = {
    brouillon: { label: "Brouillon", className: "bg-muted text-muted-foreground" },
    envoyé: { label: "Envoyé", className: "bg-primary/20 text-primary border-primary/30" },
    accepté: { label: "Accepté", className: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" },
    refusé: { label: "Refusé", className: "bg-destructive/20 text-destructive border-destructive/30" },
  };
  const s = map[statut] || { label: statut, className: "bg-muted text-muted-foreground" };
  return <Badge className={s.className}>{s.label}</Badge>;
};

const DocumentListPage = ({ title, icon: Icon, iconColor, useHook, extraFields, extraColumns, onItemClick }: DocumentListPageProps) => {
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
    itemsPerPage: 9,
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
      if (extraFields === "contract") {
        payload.numero = data.numero;
        payload.representant = data.representant;
        payload.montant_ht = parseFloat(data.montant_ht || "0");
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

      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="outline"
            size="icon"
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
            onClick={() => navigate("/documents")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              {title.split(" ").map((word, i) => (
                <span key={i} className={i % 2 === 0 ? "text-primary text-glow" : ""}>
                  {word}{" "}
                </span>
              ))}
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestion et suivi des documents
            </p>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un document..."
            className="pl-10 bg-card border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          className="gap-2 gradient-primary text-primary-foreground"
          onClick={() => { setEditItem(null); setFormOpen(true); }}
        >
          <Plus className="hidden md:inline-block w-4 h-4" />
          Nouveau
        </Button>
      </div>

      {/* Cards Grid */}
      <div>
        {query.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Icon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun document trouvé</p>
            <p className="text-sm mt-1">Cliquez sur "Nouveau" pour ajouter un document</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedData.map((item: any) => (
              <div
                key={item.id}
                className={`rounded-xl bg-card border border-border p-6 hover:border-primary/50 transition-all duration-300 group ${onItemClick ? "cursor-pointer" : ""}`}
                onClick={() => onItemClick?.(item)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {item.titre}
                      </h3>
                      {item.numero && (
                        <p className="text-xs text-muted-foreground font-mono">N° {item.numero}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
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
                </div>

                {/* Details */}
                <div className="space-y-2.5 text-sm mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {item.date_document
                        ? format(new Date(item.date_document), "dd MMM yyyy", { locale: fr })
                        : "Non renseigné"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.clients?.nom || "Aucun client"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.chantiers?.nom || "Aucun chantier"}</span>
                  </div>

                  {/* Extra columns rendered as additional details */}
                  {extraColumns?.map((col) => (
                    <div key={col.header} className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">
                        {col.header}: <span className="text-foreground">{col.render(item)}</span>
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-border/50">
                  {statusBadge(item.statut)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
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

      <DocumentFormDialog
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditItem(null); }}
        onSubmit={handleSubmit}
        initialData={editItem}
        title={editItem ? `Modifier - ${title}` : `Nouveau - ${title}`}
        extraFields={extraFields}
        isLoading={create.isPending || update.isPending}
        existingItems={query.data || []}
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
