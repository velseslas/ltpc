import { Printer, Download, Share2, X, FileText, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DocumentViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    titre: string;
    document_url: string | null;
    document_nom: string | null;
    created_at: string;
  } | null;
}

export function DocumentViewerDialog({ open, onOpenChange, document }: DocumentViewerDialogProps) {
  if (!document) return null;

  const hasFile = !!document.document_url;
  const isPdf = document.document_nom?.toLowerCase().endsWith(".pdf");
  const isImage = document.document_nom?.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/);

  const handlePrint = () => {
    if (!document.document_url) return;
    const printWindow = window.open(document.document_url, "_blank");
    if (printWindow) {
      printWindow.addEventListener("load", () => {
        printWindow.print();
      });
    }
  };

  const handleDownload = () => {
    if (!document.document_url) return;
    const link = window.document.createElement("a");
    link.href = document.document_url;
    link.download = document.document_nom || "document";
    link.target = "_blank";
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!document.document_url) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.titre,
          url: document.document_url,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(document.document_url);
      toast.success("Lien copié dans le presse-papiers");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 bg-card border-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-teal-500/15 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-teal-500" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground truncate">{document.titre}</h2>
              {document.document_nom && (
                <p className="text-xs text-muted-foreground truncate">{document.document_nom}</p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          {hasFile && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrint}
                className="gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Imprimer</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Télécharger</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Partager</span>
              </Button>
            </div>
          )}
        </div>

        {/* Content viewer */}
        <div className="flex-1 overflow-auto bg-secondary/30">
          {!hasFile ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <FileText className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Aucun fichier associé</p>
              <p className="text-sm mt-1">Ce document n'a pas de fichier scanné</p>
            </div>
          ) : isPdf ? (
            <iframe
              src={document.document_url!}
              className="w-full h-full border-0"
              title={document.titre}
            />
          ) : isImage ? (
            <div className="flex items-center justify-center h-full p-6">
              <img
                src={document.document_url!}
                alt={document.titre}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
              <FileText className="w-16 h-16 opacity-30" />
              <p className="text-lg font-medium">Aperçu non disponible</p>
              <Button
                variant="outline"
                onClick={() => window.open(document.document_url!, "_blank")}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Ouvrir dans un nouvel onglet
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}