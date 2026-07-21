import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ShareDialog from "@/components/reports/ShareDialog";
import type { ShareDocumentMeta } from "@/lib/documents/DocumentShareService";

interface ShareButtonProps {
  /** Générateur du PDF officiel (optionnel — sinon partage de lien uniquement). */
  onGeneratePdf?: () => Promise<Blob | null>;
  /** Nom de fichier proposé. */
  fileName?: string;
  /** Métadonnées du document — recommandé pour un affichage riche. */
  meta?: Partial<ShareDocumentMeta>;
  /** Style du bouton. */
  variant?: "outline" | "default" | "ghost";
  /** Classes CSS additionnelles appliquées au bouton. */
  className?: string;
}

/**
 * Bouton "Partager" universel.
 * Ouvre ShareDialog qui délègue à DocumentShareService (point d'entrée unique).
 * Compatible Web / PWA / Capacitor (via provider abstrait).
 */
const ShareButton = ({ onGeneratePdf, fileName, meta, variant = "outline", className }: ShareButtonProps) => {
  const [open, setOpen] = useState(false);

  const resolvedMeta: ShareDocumentMeta = {
    documentName: meta?.documentName || "Rapport",
    documentNumber: meta?.documentNumber ?? null,
    documentDate: meta?.documentDate ?? null,
    secureUrl: meta?.secureUrl ?? (typeof window !== "undefined" ? window.location.href : null),
  };

  return (
    <>
      <Button
        variant="default"
        onClick={() => setOpen(true)}
        className={`bg-blue-600 hover:bg-blue-700 text-white border-transparent ${className ?? ""}`}
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
