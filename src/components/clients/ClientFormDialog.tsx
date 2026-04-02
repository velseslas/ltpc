import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, FileText, Save } from "lucide-react";
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
import { useCreateClient, useUpdateClient, Client } from "@/hooks/useClients";
import { wilayas } from "@/data/wilayas";
import { toast } from "sonner";

const clientSchema = z.object({
  nom: z.string().min(1, "Le nom est requis").max(100, "Maximum 100 caractères"),
  representant: z.string().max(100, "Maximum 100 caractères").optional(),
  contact: z.string().min(1, "La personne de contact est requise").max(100, "Maximum 100 caractères"),
  email: z.string().email("Email invalide").max(255, "Maximum 255 caractères").optional().or(z.literal("")),
  telephone: z.string().min(1, "Le téléphone est requis").max(20, "Maximum 20 caractères"),
  adresse: z.string().max(255, "Maximum 255 caractères").optional(),
  commune: z.string().min(1, "La commune est requise").max(100, "Maximum 100 caractères"),
  ville: z.string().min(1, "La wilaya est requise"),
  rc: z.string()
    .regex(/^[0-9A-Za-z\s\-\/]*$/, "Format invalide (chiffres, lettres, espaces, tirets)")
    .max(30, "Maximum 30 caractères")
    .optional()
    .or(z.literal("")),
  nif: z.string()
    .regex(/^[0-9]*$/, "Le NIF doit contenir uniquement des chiffres")
    .refine((val) => !val || val.length === 0 || val.length === 15, "Le NIF doit contenir 15 chiffres")
    .optional()
    .or(z.literal("")),
  nis: z.string()
    .regex(/^[0-9]*$/, "Le NIS doit contenir uniquement des chiffres")
    .refine((val) => !val || val.length === 0 || val.length === 11, "Le NIS doit contenir 11 chiffres")
    .optional()
    .or(z.literal("")),
  article_imposition: z.string()
    .regex(/^[0-9A-Za-z\s\-\/]*$/, "Format invalide")
    .max(30, "Maximum 30 caractères")
    .optional()
    .or(z.literal("")),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  mode?: "create" | "edit";
}

export function ClientFormDialog({ 
  open, 
  onOpenChange, 
  client,
  mode = "create" 
}: ClientFormDialogProps) {
  const [activeTab, setActiveTab] = useState<"info" | "contrats">("info");
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  const isEditMode = mode === "edit" && client;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nom: "",
      contact: "",
      email: "",
      telephone: "",
      adresse: "",
      commune: "",
      ville: "",
      rc: "",
      nif: "",
      nis: "",
      article_imposition: "",
    },
  });

  // Pre-fill form when editing
  useEffect(() => {
    if (open && isEditMode && client) {
      // Parse address to extract commune
      const adresseParts = client.adresse?.split(", ") || [];
      const commune = adresseParts.length > 1 ? adresseParts[adresseParts.length - 1] : adresseParts[0] || "";
      const adresse = adresseParts.length > 1 ? adresseParts.slice(0, -1).join(", ") : "";

      // Use setTimeout to ensure the form is ready before setting values
      setTimeout(() => {
        reset({
          nom: client.nom || "",
          contact: client.contact || "",
          email: client.email || "",
          telephone: client.telephone || "",
          adresse: adresse,
          commune: commune,
          ville: client.ville || "",
          rc: client.ice || "",
          nif: (client as any).nif || "",
          nis: (client as any).nis || "",
          article_imposition: (client as any).article_imposition || "",
        });
      }, 0);
    } else if (!open) {
      reset({
        nom: "",
        contact: "",
        email: "",
        telephone: "",
        adresse: "",
        commune: "",
        ville: "",
        rc: "",
        nif: "",
        nis: "",
        article_imposition: "",
      });
    }
  }, [isEditMode, client, open, reset]);

  const onSubmit = async (data: ClientFormData) => {
    try {
      const clientData = {
        nom: data.nom,
        contact: data.contact,
        email: data.email || null,
        telephone: data.telephone,
        adresse: data.adresse ? `${data.adresse}, ${data.commune}` : data.commune,
        ville: data.ville,
        ice: data.rc || null,
        nif: data.nif || null,
        nis: data.nis || null,
        article_imposition: data.article_imposition || null,
      };

      if (isEditMode && client) {
        await updateClient.mutateAsync({
          id: client.id,
          ...clientData,
        });
        toast.success("Client modifié avec succès");
      } else {
        await createClient.mutateAsync(clientData);
        toast.success("Client ajouté avec succès");
      }
      
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(isEditMode ? "Erreur lors de la modification" : "Erreur lors de l'ajout du client");
    }
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  const selectedVille = watch("ville");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-card border-border p-0 gap-0">
        {/* Tabs */}
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <button
            onClick={() => setActiveTab("info")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "info"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Informations générales
          </button>
          <button
            onClick={() => setActiveTab("contrats")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === "contrats"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="w-4 h-4" />
            Contrats
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {activeTab === "info" && (
            <div className="space-y-6">
              {/* Section: Informations de l'entreprise */}
              <div>
                <h3 className="text-lg font-medium text-muted-foreground mb-4">
                  Informations de l'entreprise
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">
                      Nom du client <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      {...register("nom")}
                      placeholder="Nom de l'entreprise"
                      className="bg-secondary border-0 text-foreground placeholder:text-muted-foreground"
                    />
                    {errors.nom && (
                      <p className="text-sm text-destructive">{errors.nom.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">
                      Personne de contact <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      {...register("contact")}
                      placeholder="Nom et prénom"
                      className="bg-secondary border-0 text-foreground placeholder:text-muted-foreground"
                    />
                    {errors.contact && (
                      <p className="text-sm text-destructive">{errors.contact.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section: Coordonnées */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">
                  Coordonnées
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Email</Label>
                    <Input
                      {...register("email")}
                      type="email"
                      placeholder="contact@entreprise.com"
                      className="bg-secondary border-0 text-foreground placeholder:text-muted-foreground"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">
                      Téléphone <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      {...register("telephone")}
                      placeholder="0123456789"
                      className="bg-secondary border-0 text-foreground placeholder:text-muted-foreground"
                    />
                    {errors.telephone && (
                      <p className="text-sm text-destructive">{errors.telephone.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section: Adresse */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">
                  Adresse
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Adresse</Label>
                    <Input
                      {...register("adresse")}
                      placeholder="Numéro et nom de rue"
                      className="bg-secondary border-0 text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">
                        Commune <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        {...register("commune")}
                        placeholder="Commune"
                        className="bg-secondary border-0 text-foreground placeholder:text-muted-foreground"
                      />
                      {errors.commune && (
                        <p className="text-sm text-destructive">{errors.commune.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">
                        Wilaya <span className="text-destructive">*</span>
                      </Label>
                      <Select 
                        value={selectedVille}
                        onValueChange={(value) => setValue("ville", value)}
                      >
                        <SelectTrigger className="bg-secondary border-0 text-foreground">
                          <SelectValue placeholder="Sélectionnez une wilaya" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {wilayas.map((wilaya) => (
                            <SelectItem key={wilaya.nom} value={wilaya.nom}>
                              {wilaya.code} - {wilaya.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.ville && (
                        <p className="text-sm text-destructive">{errors.ville.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">RC</Label>
                      <Input
                        {...register("rc")}
                        placeholder="Registre de Commerce"
                        className="bg-secondary border-0 text-foreground placeholder:text-muted-foreground"
                        maxLength={30}
                      />
                      {errors.rc && (
                        <p className="text-sm text-destructive">{errors.rc.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">NIF (15 chiffres)</Label>
                      <Input
                        {...register("nif")}
                        placeholder="000000000000000"
                        className="bg-secondary border-0 text-foreground placeholder:text-muted-foreground"
                        maxLength={15}
                      />
                      {errors.nif && (
                        <p className="text-sm text-destructive">{errors.nif.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">NIS (11 chiffres)</Label>
                      <Input
                        {...register("nis")}
                        placeholder="00000000000"
                        className="bg-secondary border-0 text-foreground placeholder:text-muted-foreground"
                        maxLength={11}
                      />
                      {errors.nis && (
                        <p className="text-sm text-destructive">{errors.nis.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Article d'imposition</Label>
                      <Input
                        {...register("article_imposition")}
                        placeholder="Numéro d'article"
                        className="bg-secondary border-0 text-foreground placeholder:text-muted-foreground"
                        maxLength={30}
                      />
                      {errors.article_imposition && (
                        <p className="text-sm text-destructive">{errors.article_imposition.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "contrats" && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun contrat pour ce client</p>
              <p className="text-sm mt-1">
                {isEditMode 
                  ? "Accédez à l'onglet Contrats depuis la page de détail du client"
                  : "Enregistrez d'abord le client pour ajouter des contrats"
                }
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-border">
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
              disabled={createClient.isPending || updateClient.isPending}
              className="bg-primary/80 hover:bg-primary text-primary-foreground gap-2"
            >
              {isEditMode ? (
                <>
                  <Save className="w-4 h-4" />
                  Enregistrer
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Ajouter le client
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
