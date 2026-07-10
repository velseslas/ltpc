import { useEffect, useMemo, useState } from "react";
import { Loader2, Download, Link2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DocumentShareService, type ShareDocumentMeta } from "@/lib/documents/DocumentShareService";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meta: ShareDocumentMeta;
  fileName?: string;
  onGeneratePdf?: () => Promise<Blob | null>;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "-";
  const units = ["o", "Ko", "Mo", "Go"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

const ShareDialog = ({ open, onOpenChange, meta, fileName, onGeneratePdf }: ShareDialogProps) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfSize, setPdfSize] = useState<number | null>(null);
  const [cachedBlob, setCachedBlob] = useState<Blob | null>(null);

  const finalFileName = useMemo(
    () => fileName || `${(meta.documentNumber || meta.documentName).replace(/\s+/g, "-")}.pdf`,
    [fileName, meta],
  );

  useEffect(() => {
    if (open) {
      setSubject(DocumentShareService.defaultSubject(meta));
      setMessage(DocumentShareService.defaultMessage(meta));
      setPdfSize(null);
      setCachedBlob(null);
    }
  }, [open, meta]);

  const ensurePdf = async (): Promise<Blob | null> => {
    if (!onGeneratePdf) return null;
    if (cachedBlob) return cachedBlob;
    const blob = await onGeneratePdf();
    if (blob) {
      setCachedBlob(blob);
      setPdfSize(blob.size);
    }
    return blob;
  };

  const runShare = async (channel: "auto" | "download" | "copy-link") => {
    setLoading(true);
    try {
      const result = await DocumentShareService.share(
        {
          meta,
          subject,
          message,
          fileName: finalFileName,
          getPdf: onGeneratePdf ? ensurePdf : undefined,
        },
        channel,
      );
      if (result.action === "cancelled") return;
      if (!result.ok) {
        toast.error(result.message || "Erreur lors du partage");
        return;
      }
      if (result.action === "downloaded") toast.success("PDF téléchargé");
      else if (result.action === "copied") toast.success("Lien copié");
      else toast.success("Document partagé");
      if (result.action !== "downloaded") onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const canShareFiles = DocumentShareService.canShareFiles();
  const canShare = DocumentShareService.canShare();
  const hasSecureLink = !!meta.secureUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Partager le rapport officiel</DialogTitle>
          <DialogDescription>
            Envoyez le document via le partage natif de votre appareil ou téléchargez le PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-foreground">{meta.documentName}</span>
            {meta.documentNumber && (
              <Badge variant="secondary" className="font-mono">{meta.documentNumber}</Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {meta.documentDate && <span>Date : {meta.documentDate}</span>}
            <span>Fichier : {finalFileName}</span>
            {pdfSize !== null && <span>Taille : {formatBytes(pdfSize)}</span>}
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="share-subject">Objet du message</Label>
            <Input
              id="share-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Objet"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="share-message">Message</Label>
            <Textarea
              id="share-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            <X className="h-4 w-4 mr-2" />Annuler
          </Button>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {hasSecureLink && (
              <Button variant="outline" onClick={() => runShare("copy-link")} disabled={loading}>
                <Link2 className="h-4 w-4 mr-2" />Copier le lien
              </Button>
            )}
            {onGeneratePdf && (
              <Button variant="outline" onClick={() => runShare("download")} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Télécharger
              </Button>
            )}
            <Button
              onClick={() => runShare("auto")}
              disabled={loading || (!canShare && !onGeneratePdf)}
              className="gradient-primary text-primary-foreground"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Partager{canShareFiles && onGeneratePdf ? " (avec PDF)" : ""}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
