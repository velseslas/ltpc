import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, Upload, X, File, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateContrat, useUpdateContrat } from "@/hooks/useContrats";
import { DocumentRepository } from "@/lib/repositories";
import { toast } from "sonner";

const contractSchema = z.object({
  titre: z.string().min(1, "Le titre est requis"),
  chantier: z.string().min(1, "Le chantier est requis"),
});

type ContractFormData = z.infer<typeof contractSchema>;

interface ContractFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
  chantiers?: { id: string; nom: string }[];
  editingContrat?: any;
}

export function ContractFormDialog({ 
  open, 
  onOpenChange,
  clientId,
  chantiers = [],
  editingContrat,
}: ContractFormDialogProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingDocName, setExistingDocName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createContrat = useCreateContrat();
  const updateContrat = useUpdateContrat();

  const isEditMode = !!editingContrat;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors: formErrors },
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      titre: "",
      chantier: "",
    },
  });

  useEffect(() => {
    if (open && editingContrat) {
      reset({
        titre: editingContrat.titre || "",
        chantier: editingContrat.chantier_id || "",
      });
      setExistingDocName(editingContrat.document_nom || null);
      setUploadedFile(null);
    } else if (!open) {
      reset({ titre: "", chantier: "" });
      setUploadedFile(null);
      setExistingDocName(null);
      setSubmitted(false);
    }
  }, [open, editingContrat, reset]);

  const titreValue = watch("titre");
  const chantierValue = watch("chantier");

  const errors = {
    titre: submitted && !titreValue?.trim(),
    chantier: submitted && !chantierValue,
    document: submitted && !uploadedFile && !existingDocName,
  };

  const uploadFile = async (file: File): Promise<{ url: string; name: string } | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${clientId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { publicUrl } = await DocumentRepository.uploadContrat(fileName, file);
    return { url: publicUrl, name: file.name };
  };

  const onSubmit = async (data: ContractFormData) => {
    setSubmitted(true);
    
    if (!uploadedFile && !existingDocName) {
      return;
    }
    
    try {
      setIsUploading(true);
      
      let documentUrl: string | null = editingContrat?.document_url || null;
      let documentNom: string | null = existingDocName;

      if (uploadedFile) {
        const result = await uploadFile(uploadedFile);
        if (result) {
          documentUrl = result.url;
          documentNom = result.name;
        }
      }

      if (isEditMode) {
        await updateContrat.mutateAsync({
          id: editingContrat.id,
          titre: data.titre,
          chantier_id: data.chantier,
          document_url: documentUrl,
          document_nom: documentNom,
        });
        toast.success("Contrat modifié avec succès");
      } else {
        await createContrat.mutateAsync({
          client_id: clientId || null,
          chantier_id: data.chantier,
          titre: data.titre,
          document_url: documentUrl,
          document_nom: documentNom,
        });
        toast.success("Contrat ajouté avec succès");
      }
      
      reset();
      setUploadedFile(null);
      setExistingDocName(null);
      setSubmitted(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving contract:', error);
      toast.error(isEditMode ? "Erreur lors de la modification" : "Erreur lors de l'ajout du contrat");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    setSubmitted(true);
    handleSubmit(onSubmit)(e);
  };

  const handleCancel = () => {
    reset();
    setUploadedFile(null);
    setExistingDocName(null);
    setSubmitted(false);
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Le fichier ne doit pas dépasser 10 MB");
        return;
      }
      setUploadedFile(file);
      setExistingDocName(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Le fichier ne doit pas dépasser 10 MB");
        return;
      }
      setUploadedFile(file);
      setExistingDocName(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = () => {
    setUploadedFile(null);
    setExistingDocName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const hasDocument = !!uploadedFile || !!existingDocName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border p-0 gap-0">
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {isEditMode ? "Modifier le contrat" : "Ajouter un contrat"}
          </h3>
        </div>

        <form onSubmit={handleFormSubmit} className="p-4">
            <div className="space-y-3">

              {/* Titre du contrat */}
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">
                  Titre du contrat <span className="text-destructive">*</span>
                </Label>
                <Input
                  {...register("titre")}
                  placeholder="Entrez le titre du contrat"
                  className={`bg-secondary border-0 text-foreground placeholder:text-muted-foreground ${errors.titre ? "border border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.titre && (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Le titre est requis
                  </p>
                )}
              </div>

              {/* Chantier associé */}
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">
                  Chantier associé <span className="text-destructive">*</span>
                </Label>
                <Select value={chantierValue} onValueChange={(value) => setValue("chantier", value)}>
                  <SelectTrigger className={`bg-secondary border-0 text-foreground ${errors.chantier ? "border border-destructive focus-visible:ring-destructive" : ""}`}>
                    <SelectValue placeholder="Sélectionnez un chantier" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {chantiers.length > 0 ? (
                      chantiers.map((chantier) => (
                        <SelectItem key={chantier.id} value={chantier.id}>
                          {chantier.nom}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="demo">Chantier démo</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {errors.chantier && (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Le chantier est requis
                  </p>
                )}
              </div>

              {/* Document du contrat */}
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">
                  Document du contrat <span className="text-destructive">*</span>
                </Label>
                
                {!hasDocument ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`
                      border-2 border-dashed rounded-lg p-5 cursor-pointer
                      transition-colors text-center
                      ${errors.document
                        ? "border-destructive bg-destructive/5" 
                        : isDragging 
                          ? "border-primary bg-primary/10" 
                          : "border-border hover:border-muted-foreground"
                      }
                    `}
                  >
                    <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-primary mb-1">
                      Cliquez pour télécharger ou glissez et déposez
                    </p>
                    <p className="text-sm text-muted-foreground">
                      PDF, JPG ou PNG (MAX. 10 MB)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                    <File className="w-8 h-8 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground truncate">
                        {uploadedFile ? uploadedFile.name : existingDocName}
                      </p>
                      {uploadedFile && (
                        <p className="text-sm text-muted-foreground">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      )}
                      {!uploadedFile && existingDocName && (
                        <p className="text-sm text-muted-foreground">Document existant</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={removeFile}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {errors.document && (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Le document est obligatoire
                  </p>
                )}
              </div>
            </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-border">
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
              disabled={isUploading || createContrat.isPending || updateContrat.isPending}
              className="bg-primary/80 hover:bg-primary text-primary-foreground gap-2"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              {isUploading ? "Téléchargement..." : isEditMode ? "Enregistrer" : "Ajouter le contrat"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
