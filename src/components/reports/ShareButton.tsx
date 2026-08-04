import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ShareDialog from "@/components/reports/ShareDialog";
import type { ShareDocumentMeta } from "@/lib/documents/DocumentShareService";
import { ensureReportArchiveUrl } from "@/lib/documents/reportArchive";

interface ShareButtonProps {
  /** Générateur du PDF officiel (optionnel — sinon partage de lien uniquement). */
  onGeneratePdf?: () => Promise<Blob | null>;
  /** Nom de fichier proposé. */
  fileName?: string;
  /** Métadonnées du document — recommandé pour un affichage riche. */
  meta?: Partial<ShareDocumentMeta>;
  /** Type de document archivé (défaut : rapport_essai). */
  documentType?: string;
  /** Identifiant métier du document — sinon déduit de l'URL courante. */
  documentId?: string;
  /** Rapport en vue paysage. */
  landscape?: boolean;
  /** Style du bouton. */
  variant?: "outline" | "default" | "ghost";
  /** Classes CSS additionnelles appliquées au bouton. */
  className?: string;
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/** Déduit l'identifiant du document à partir de la route courante. */
function inferDocumentId(): string | null {
  if (typeof window === "undefined") return null;
  const matches = window.location.pathname.match(UUID_RE);
  return matches?.length ? matches[matches.length - 1] : null;
}

/**
 * Bouton "Partager" universel.
 * Le lien partagé pointe TOUJOURS vers le fichier archivé (`document-file`),
 * jamais vers une route applicative LTPC.
 */
const ShareButton = ({
  onGeneratePdf,
  fileName,
  meta,
  documentType = "rapport_essai",
  documentId,
  landscape,
  variant = "default",
  className,
}: ShareButtonProps) => {
  const [open, setOpen] = useState(false);
  const [directUrl, setDirectUrl] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  const docName = meta?.documentName || "Rapport";
  const docNumber = meta?.documentNumber ?? null;

  useEffect(() => {
    if (!open || meta?.secureUrl) return;
    const id = documentId ?? inferDocumentId();
    if (!id) return;
    let cancelled = false;
    setResolving(true);
    ensureReportArchiveUrl({
      documentType,
      documentId: id,
      numero: docNumber,
      title: docNumber ? `${docName} ${docNumber}` : docName,
      landscape,
    })
      .then(url => { if (!cancelled && url) setDirectUrl(url); })
      .catch(err => console.error("[ShareButton] archivage du rapport impossible", err))
      .finally(() => { if (!cancelled) setResolving(false); });
    return () => { cancelled = true; };
  }, [open, meta?.secureUrl, documentType, documentId, docName, docNumber, landscape]);

  const resolvedMeta: ShareDocumentMeta = {
    documentName: docName,
    documentNumber: docNumber,
    documentDate: meta?.documentDate ?? null,
    // Lien direct vers le fichier archivé (jamais la page applicative).
    secureUrl: meta?.secureUrl ?? directUrl,
  };

  return (
    <>
      <Button
        variant="default"
        onClick={() => setOpen(true)}
        className={`bg-primary hover:bg-primary/90 text-primary-foreground border-transparent ${className ?? ""}`}
      >
        <Share2 className="h-4 w-4 mr-2" />
        Partager
      </Button>
      <ShareDialog
        open={open}
        onOpenChange={setOpen}
        meta={resolvedMeta}
        fileName={fileName}
        onGeneratePdf={onGeneratePdf}
      />
    </>
  );
};

export default ShareButton;
