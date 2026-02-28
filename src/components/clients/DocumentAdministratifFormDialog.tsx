import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FolderOpen, Upload, X, File, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateDocumentAdministratif, useUpdateDocumentAdministratif } from "@/hooks/useDocumentsAdministratifs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const docSchema = z.object({
  titre: z.string().min(1, "Le titre est requis"),
});

type DocFormData = z.infer<typeof docSchema>;

interface DocumentAdministratifFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
  editingDoc?: any;
}

export function DocumentAdministratifFormDialog({ 
  open, 
  onOpenChange,
  clientId,
  editingDoc,
}: DocumentAdministratifFormDialogProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingDocName, setExistingDocName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createDoc = useCreateDocumentAdministratif();
  const updateDoc = useUpdateDocumentAdministratif();

  const isEditMode = !!editingDoc;

  const {
    register,
    handleSubmit,
    reset,
    watch,
  } = useForm<DocFormData>({
    resolver: zodResolver(docSchema),
    defaultValues: { titre: "" },
  });

  useEffect(() => {
    if (open && editingDoc) {
      reset({ titre: editingDoc.titre || "" });
      setExistingDocName(editingDoc.document_nom || null);
      setUploadedFile(null);
    } else if (!open) {
      reset({ titre: "" });
      setUploadedFile(null);
      setExistingDocName(null);
      setSubmitted(false);
    }
  }, [open, editingDoc, reset]);

  const titreValue = watch("titre");

  const errors = {
    titre: submitted && !titreValue?.trim(),
    document: submitted && !uploadedFile && !existingDocName,
  };

  const uploadFile = async (file: File): Promise<{ url: string; name: string } | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${clientId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('documents-administratifs')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Erreur lors du téléchargement du fichier');
    }

    const { data } = supabase.storage
      .from('documents-administratifs')
      .getPublicUrl(fileName);

    return { url: data.publicUrl, name: file.name };
  };

  const onSubmit = async (data: DocFormData) => {
    setSubmitted(true);
    if (!uploadedFile && !existingDocName) return;
    
    try {
      setIsUploading(true);

      let documentUrl: string | null = editingDoc?.document_url || null;
      let documentNom: string | null = existingDocName;

      if (uploadedFile) {
        const result = await uploadFile(uploadedFile);
        if (result) {
          documentUrl = result.url;
          documentNom = result.name;
        }
      }

      if (isEditMode) {
        await updateDoc.mutateAsync({
          id: editingDoc.id,
          titre: data.titre,
          document_url: documentUrl,
          document_nom: documentNom,
        });
        toast.success("Document modifié avec succès");
      } else {
        await createDoc.mutateAsync({
          client_id: clientId || "",
          titre: data.titre,
          document_url: documentUrl,
          document_nom: documentNom,
        });
        toast.success("Document ajouté avec succès");
      }
      
      reset();
      setUploadedFile(null);
      setExistingDocName(null);
      setSubmitted(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error(isEditMode ? "Erreur lors de la modification" : "Erreur lors de l'ajout du document");
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

  const removeFile = () => {
    setUploadedFile(null);
    setExistingDocName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const hasDocument = !!uploadedFile || !!existingDocName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-card border-border p-0 gap-0">
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            {isEditMode ? "Modifier le document" : "Ajouter un document administratif"}
          </h3>
        </div>

        <form onSubmit={handleFormSubmit} className="p-5">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-muted-foreground">
                Titre du document <span className="text-destructive">*</span>
              </Label>
              <Input
                {...register("titre")}
                placeholder="Entrez le titre du document"
                className={`bg-secondary border-0 text-foreground placeholder:text-muted-foreground ${errors.titre ? "border border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {errors.titre && (
                <p className="text-destructive text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Le titre est requis
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">
                Document <span className="text-destructive">*</span>
              </Label>
              
              {!hasDocument ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  className={`
                    border-2 border-dashed rounded-lg p-8 cursor-pointer
                    transition-colors text-center
                    ${errors.document
                      ? "border-destructive bg-destructive/5" 
                      : isDragging 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-muted-foreground"
                    }
                  `}
                >
                  <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
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
                <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
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
                  <Button type="button" variant="ghost" size="icon" onClick={removeFile} className="text-muted-foreground hover:text-destructive">
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

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={handleCancel} className="text-foreground hover:bg-secondary">
              Annuler
            </Button>
            <Button type="submit" disabled={isUploading || createDoc.isPending || updateDoc.isPending} className="bg-primary/80 hover:bg-primary text-primary-foreground gap-2">
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderOpen className="w-4 h-4" />}
              {isUploading ? "Téléchargement..." : isEditMode ? "Enregistrer" : "Ajouter le document"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
