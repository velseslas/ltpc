import { Download, Pencil, Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentPreviewActionsProps {
  onEdit: () => void;
  onPrint: () => void;
  onDownload: () => void;
  onShare: () => void;
}

const actionClassName = "w-full justify-center gap-2 sm:w-auto";

export function DocumentPreviewActions({
  onEdit,
  onPrint,
  onDownload,
  onShare,
}: DocumentPreviewActionsProps) {
  return (
    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
      <Button variant="outline" size="sm" onClick={onEdit} className={actionClassName}>
        <Pencil aria-hidden="true" />
        Modifier
      </Button>
      <Button variant="outline" size="sm" onClick={onShare} className={actionClassName}>
        <Share2 aria-hidden="true" />
        Partager
      </Button>
      <Button variant="secondary" size="sm" onClick={onDownload} className={actionClassName}>
        <Download aria-hidden="true" />
        Télécharger
      </Button>
      <Button size="sm" onClick={onPrint} className={actionClassName}>
        <Printer aria-hidden="true" />
        Imprimer
      </Button>
    </div>
  );
}