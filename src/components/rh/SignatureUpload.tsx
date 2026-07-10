import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2, PenTool } from "lucide-react";
import { DocumentRepository } from "@/lib/repositories";
import { toast } from "sonner";

interface SignatureUploadProps {
  currentSignatureUrl: string | null;
  onSignatureChange: (url: string | null) => void;
  employeId?: string;
}

export function SignatureUpload({ currentSignatureUrl, onSignatureChange, employeId }: SignatureUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image (PNG, JPG, etc.)");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2 Mo");
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `signature-${employeId || Date.now()}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Delete old signature if exists
      if (currentSignatureUrl) {
        const oldPath = currentSignatureUrl.split("/signatures/")[1];
        if (oldPath) {
          await DocumentRepository.deleteSignature(oldPath);
        }
      }

      // Upload new signature via StorageRepository
      const { publicUrl } = await DocumentRepository.uploadSignature(filePath, file, { upsert: true });

      onSignatureChange(publicUrl);
      toast.success("Signature téléchargée avec succès");
    } catch (error) {
      console.error("Error uploading signature:", error);
      toast.error("Erreur lors du téléchargement de la signature");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveSignature = async () => {
    if (!currentSignatureUrl) return;

    try {
      const path = currentSignatureUrl.split("/signatures/")[1];
      if (path) {
        await DocumentRepository.deleteSignature(path);
      }
      onSignatureChange(null);
      toast.success("Signature supprimée");
    } catch (error) {
      console.error("Error removing signature:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <PenTool className="h-4 w-4" />
        Signature scannée
      </Label>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {currentSignatureUrl ? (
        <div className="space-y-3">
          <div className="relative border border-border rounded-lg p-4 bg-white">
            <img
              src={currentSignatureUrl}
              alt="Signature"
              className="max-h-24 mx-auto object-contain"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemoveSignature}
              className="absolute top-2 right-2 h-6 w-6 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Téléchargement...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Remplacer la signature
              </>
            )}
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full h-24 border-dashed flex flex-col gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Téléchargement...</span>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Cliquez pour télécharger une signature scannée
              </span>
              <span className="text-xs text-muted-foreground">
                PNG, JPG jusqu'à 2 Mo
              </span>
            </>
          )}
        </Button>
      )}
      
      <p className="text-xs text-muted-foreground">
        Cette signature sera automatiquement insérée dans les rapports d'essais créés par cet employé.
      </p>
    </div>
  );
}
