import { useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentRepository } from "@/lib/repositories";
import { toast } from "sonner";

interface DossierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: { mutateAsync: (data: any) => Promise<any>; isPending: boolean };
}

export function DossierFormDialog({ open, onOpenChange, onCreate }: DossierFormDialogProps) {
  const [nom, setNom] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) {
      toast.error("Le nom du document est requis");
      return;
    }

    try {
      setUploading(true);
      let documentUrl: string | null = null;
      let documentNom: string | null = null;

      if (file) {
        const filePath = `${Date.now()}_${file.name}`;
        const { publicUrl } = await DocumentRepository.uploadAdministratif(filePath, file);
        documentUrl = publicUrl;
        documentNom = file.name;
      }

      await onCreate.mutateAsync({
        titre: nom.trim(),
        document_url: documentUrl,
        document_nom: documentNom,
      });

      toast.success("Document ajouté avec succès");
      setNom("");
      setFile(null);
      onOpenChange(false);
    } catch (error) {
      toast.error("Erreur lors de l'ajout du document");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setNom("");
    setFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Nouveau document</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Nom du document */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">
              Nom du document <span className="text-destructive">*</span>
            </Label>
            <Input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Registre de commerce"
              className="bg-secondary border-0 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Upload */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Télécharger le document</Label>
            <label
              className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50 cursor-pointer transition-all duration-300"
            >
              {file ? (
                <div className="flex items-center gap-3 text-foreground">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-foreground font-medium">Cliquez pour sélectionner</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG (max 20 MB)</p>
                  </div>
                </>
              )}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              className="text-foreground hover:bg-secondary"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={uploading || onCreate.isPending}
              className="bg-primary/80 hover:bg-primary text-primary-foreground gap-2"
            >
              {(uploading || onCreate.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
              <FileText className="w-4 h-4" />
              Valider
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}