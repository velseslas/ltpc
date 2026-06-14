import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderOpen, Plus, ArrowLeft, Search, Loader2, FileText, Trash2, MoreHorizontal, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useTableFilters } from "@/hooks/useTableFilters";
import { useDossierAdministratif } from "@/hooks/useDocuments";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
import { DossierFormDialog } from "@/components/documents/DossierFormDialog";
import { DocumentViewerDialog } from "@/components/documents/DocumentViewerDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AdminOnly } from "@/components/common/AdminOnly";

const DossierAdministratif = () => {
  const navigate = useNavigate();
  const { query, create, update, remove } = useDossierAdministratif();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<any>(null);

  const {
    searchTerm,
    setSearchTerm,
    paginatedData,
  } = useTableFilters({
    data: query.data,
    searchFields: ["titre", "document_nom"],
    itemsPerPage: 50,
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await remove.mutateAsync(deleteId);
      toast.success("Document supprimé");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la suppression");
    }
    setDeleteId(null);
  };

  return (
    <>
      <AppBreadcrumb items={[{ label: "Documents", path: "/documents" }, { label: "Dossier administratif LTPC BENMALEK" }]} />

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
              <span className="text-primary text-glow">Dossier</span> administratif{" "}
              <span className="text-primary text-glow">LTPC BENMALEK</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Documents officiels et pièces administratives
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
          onClick={() => setFormOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Nouveau document
        </Button>
      </div>

      {/* Document Widgets Grid */}
      <div>
        {query.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground bg-card/50 border border-dashed border-border rounded-xl">
            <FolderOpen className="w-14 h-14 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">Aucun document</p>
            <p className="text-sm mt-1">Cliquez sur "Nouveau document" pour ajouter un document scanné</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedData.map((doc: any) => (
              <div
                key={doc.id}
                onClick={() => setViewingDoc(doc)}
                className="group relative cursor-pointer rounded-xl bg-card border border-border p-5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                {/* Menu */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(doc.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-teal-500/15 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-7 h-7 text-teal-500" />
                </div>

                {/* Name */}
                <h3 className="font-semibold text-foreground text-sm leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {doc.titre}
                </h3>

                {/* Date */}
                <p className="text-xs text-muted-foreground">
                  {doc.created_at
                    ? format(new Date(doc.created_at), "dd MMM yyyy", { locale: fr })
                    : ""}
                </p>

                {/* File indicator */}
                {doc.document_url && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-primary/70">
                    <Upload className="w-3 h-3" />
                    <span className="truncate">{doc.document_nom || "Document scanné"}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <DossierFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onCreate={create}
      />

      {/* Document Viewer */}
      <DocumentViewerDialog
        open={!!viewingDoc}
        onOpenChange={(v) => { if (!v) setViewingDoc(null); }}
        document={viewingDoc}
      />

      {/* Delete Confirmation */}
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

export default DossierAdministratif;