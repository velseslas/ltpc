import { useEffect, useState } from "react";
import { Link2, Send, X, AlertCircle } from "lucide-react";
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
import { toast } from "sonner";
import { DocumentShareService } from "@/lib/documents/DocumentShareService";

interface LocalisationShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chantierNom?: string | null;
  adresse?: string | null;
  /** URL publique de la localisation (OpenStreetMap / Google Maps). */
  url: string | null;
}

/**
 * Dialogue de partage de la localisation, sur le même modèle que le partage
 * de rapports/documents : objet et message éditables, copie du lien ou
 * partage natif (WhatsApp, Gmail, etc.) via DocumentShareService.
 */
export function LocalisationShareDialog({
  open,
  onOpenChange,
  chantierNom,
  adresse,
  url,
}: LocalisationShareDialogProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setNotice(null);
      return;
    }
    setSubject(
      chantierNom ? `Localisation du chantier — ${chantierNom}` : "Localisation du chantier",
    );
    const lines = [
      "Bonjour,",
      "",
      chantierNom
        ? `Veuillez trouver ci-dessous la localisation du chantier « ${chantierNom} ».`
        : "Veuillez trouver ci-dessous la localisation du chantier.",
    ];
    if (adresse) {
      lines.push("", adresse);
    }
    lines.push("", "Cordialement.");
    setMessage(lines.join("\n"));
  }, [open, chantierNom, adresse]);

  const runShare = async (channel: "auto" | "copy-link") => {
    if (!url) {
      toast.error("Aucun lien de localisation disponible");
      return;
    }
    setLoading(true);
    setNotice(null);
    try {
      const result = await DocumentShareService.share(
        {
          meta: {
            documentName: chantierNom || "Localisation du chantier",
            documentNumber: null,
            documentDate: null,
            secureUrl: url,
          },
          subject,
          message,
        },
        channel,
      );

      if (result.action === "cancelled") return;

      if (!result.ok) {
        toast.error(result.message || "Erreur lors du partage");
        setNotice(result.message || "Erreur lors du partage.");
        return;
      }

      if (result.action === "shared") {
        toast.success("Localisation partagée");
        onOpenChange(false);
        return;
      }

      if (result.action === "copied") {
        toast.success("Lien copié");
        setNotice("Le lien de localisation a été copié dans le presse-papiers.");
      }
    } finally {
      setLoading(false);
    }
  };

  const hasUrl = !!url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-w-[calc(100vw-2rem)] w-full p-4 sm:p-6">
        <DialogHeader className="pr-8 sm:pr-0">
          <DialogTitle className="text-left sm:text-left leading-tight">
            Partager la localisation
          </DialogTitle>
          <DialogDescription className="text-left sm:text-left">
            Envoyez la position du chantier via le partage natif de votre appareil ou copiez le lien.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm space-y-1 overflow-hidden">
          <p className="font-medium text-foreground break-words">
            {chantierNom || "Localisation du chantier"}
          </p>
          {adresse && <p className="text-xs text-muted-foreground break-words">{adresse}</p>}
          {url && (
            <p className="text-xs text-muted-foreground break-all" title={url}>
              Lien : {url}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="localisation-share-subject">Objet du message</Label>
            <Input
              id="localisation-share-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Objet"
              className="w-full"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="localisation-share-message">Message</Label>
            <Textarea
              id="localisation-share-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full min-h-[120px] resize-y"
            />
          </div>
        </div>

        {notice && (
          <div className="rounded-md border border-border bg-muted/50 p-3 text-sm text-foreground flex gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span className="break-words">{notice}</span>
          </div>
        )}

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full sm:w-auto justify-center"
          >
            <X className="h-4 w-4 mr-2" />
            Fermer
          </Button>
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => runShare("copy-link")}
              disabled={loading || !hasUrl}
              className="w-full sm:w-auto justify-center"
            >
              <Link2 className="h-4 w-4 mr-2" />
              Copier le lien
            </Button>
            <Button
              onClick={() => runShare("auto")}
              disabled={loading || !hasUrl}
              className="gradient-primary text-primary-foreground w-full sm:w-auto justify-center"
            >
              <Send className="h-4 w-4 mr-2" />
              Partager
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default LocalisationShareDialog;
