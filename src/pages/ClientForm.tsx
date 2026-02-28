import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Building2, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
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
import { useClient, useCreateClient, useUpdateClient } from "@/hooks/useClients";
import { toast } from "sonner";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";

const clientSchema = z.object({
  nom: z.string().min(1, "Le nom de l'entreprise est requis").max(100, "Maximum 100 caractères"),
  contact: z.string().max(100, "Maximum 100 caractères").optional(),
  email: z.string().email("Email invalide").max(255, "Maximum 255 caractères").optional().or(z.literal("")),
  telephone: z.string().max(20, "Maximum 20 caractères").optional(),
  adresse: z.string().min(1, "L'adresse est requise").max(255, "Maximum 255 caractères"),
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
  banque: z.string().max(100, "Maximum 100 caractères").optional().or(z.literal("")),
  agence: z.string().max(100, "Maximum 100 caractères").optional().or(z.literal("")),
  rib: z.string()
    .regex(/^[0-9]*$/, "Le RIB doit contenir uniquement des chiffres")
    .max(30, "Maximum 30 caractères")
    .optional()
    .or(z.literal("")),
});

type ClientFormData = z.infer<typeof clientSchema>;

import { wilayas } from "@/data/wilayas";

const ClientForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  
  const { data: client, isLoading: clientLoading } = useClient(id || "");
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nom: "",
      contact: "",
      email: "",
      telephone: "",
      adresse: "",
      ville: "",
      rc: "",
      nif: "",
      nis: "",
      article_imposition: "",
      banque: "",
      agence: "",
      rib: "",
    },
  });

  useEffect(() => {
    if (isEditMode && client) {
      // Use setTimeout to ensure the form and Select component are ready
      setTimeout(() => {
        form.reset({
          nom: client.nom || "",
          contact: client.contact || "",
          email: client.email || "",
          telephone: client.telephone || "",
          adresse: client.adresse || "",
          ville: client.ville || "",
          rc: client.ice || "",
          nif: (client as any).nif || "",
          nis: (client as any).nis || "",
          article_imposition: (client as any).article_imposition || "",
          banque: (client as any).banque || "",
          agence: (client as any).agence || "",
          rib: (client as any).rib || "",
        });
      }, 0);
    }
  }, [client, isEditMode, form]);

  const onSubmit = async (data: ClientFormData) => {
    try {
      const clientData = {
        nom: data.nom,
        contact: data.contact || null,
        email: data.email || null,
        telephone: data.telephone || null,
        adresse: data.adresse || null,
        ville: data.ville || null,
        ice: data.rc || null,
        nif: data.nif || null,
        nis: data.nis || null,
        article_imposition: data.article_imposition || null,
        banque: data.banque || null,
        agence: data.agence || null,
        rib: data.rib || null,
      };
      
      if (isEditMode && id) {
        await updateClient.mutateAsync({ id, ...clientData });
        toast.success("Client modifié avec succès");
        navigate(`/intervenant/clients/${id}`);
      } else {
        await createClient.mutateAsync(clientData);
        toast.success("Client créé avec succès");
        navigate("/intervenant/clients");
      }
    } catch (error) {
      toast.error(isEditMode ? "Erreur lors de la modification" : "Erreur lors de la création");
    }
  };

  if (isEditMode && clientLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <AppBreadcrumb 
        items={[
          { label: "Intervenants", path: "/intervenant" },
          { label: "Clients", path: "/intervenant/clients" },
          { label: isEditMode ? "Modifier" : "Nouveau" }
        ]} 
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="outline" size="icon" onClick={() => navigate(isEditMode ? `/intervenant/clients/${id}` : "/intervenant/clients")} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              {isEditMode ? "Modifier le" : "Nouveau"} <span className="text-primary text-glow">Client</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              {isEditMode ? "Modifiez les informations du client" : "Remplissez les informations du nouveau client"}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 animate-fade-in [animation-delay:100ms]">
            <h3 className="text-lg font-medium text-foreground mb-6">Informations générales</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="nom">Nom de l'entreprise <span className="text-destructive">*</span></Label>
                <Input
                  id="nom"
                  {...form.register("nom")}
                  className={`mt-1.5 ${form.formState.errors.nom ? "border-red-700 focus-visible:ring-red-700" : ""}`}
                  placeholder="Nom de l'entreprise"
                />
                {form.formState.errors.nom && (
                  <p className="text-red-700 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {form.formState.errors.nom.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="contact">Personne de contact</Label>
                <Input id="contact" {...form.register("contact")} className="mt-1.5" placeholder="Nom du contact" />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...form.register("email")} className="mt-1.5" placeholder="email@exemple.com" />
                {form.formState.errors.email && (
                  <p className="text-destructive text-sm mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="telephone">Téléphone</Label>
                <Input id="telephone" {...form.register("telephone")} className="mt-1.5" placeholder="+213 XX XXX XXXX" />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="adresse">Adresse <span className="text-destructive">*</span></Label>
                <Input
                  id="adresse"
                  {...form.register("adresse")}
                  className={`mt-1.5 ${form.formState.errors.adresse ? "border-red-700 focus-visible:ring-red-700" : ""}`}
                  placeholder="Adresse complète"
                />
                {form.formState.errors.adresse && (
                  <p className="text-red-700 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {form.formState.errors.adresse.message}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="ville">Wilaya <span className="text-destructive">*</span></Label>
                <Select
                  value={form.watch("ville") || ""}
                  onValueChange={(value) => form.setValue("ville", value)}
                >
                  <SelectTrigger className={`mt-1.5 ${form.formState.errors.ville ? "border-red-700 focus-visible:ring-red-700" : ""}`}>
                    <SelectValue placeholder="Sélectionnez une wilaya" />
                  </SelectTrigger>
                  <SelectContent>
                    {wilayas.map((wilaya) => (
                      <SelectItem key={wilaya.nom} value={wilaya.nom}>
                        {wilaya.code} - {wilaya.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.ville && (
                  <p className="text-red-700 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {form.formState.errors.ville.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Informations fiscales et bancaires */}
          <div className="bg-card border border-border rounded-xl p-6 animate-fade-in [animation-delay:200ms]">
            <h3 className="text-lg font-medium text-foreground mb-6">Informations fiscales et bancaires</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rc">RC</Label>
                <Input id="rc" {...form.register("rc")} className="mt-1.5" placeholder="Registre de Commerce" maxLength={30} />
                {form.formState.errors.rc && (
                  <p className="text-destructive text-sm mt-1">{form.formState.errors.rc.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="nif">NIF (15 chiffres)</Label>
                <Input id="nif" {...form.register("nif")} className="mt-1.5" placeholder="000000000000000" maxLength={15} />
                {form.formState.errors.nif && (
                  <p className="text-destructive text-sm mt-1">{form.formState.errors.nif.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="nis">NIS (11 chiffres)</Label>
                <Input id="nis" {...form.register("nis")} className="mt-1.5" placeholder="00000000000" maxLength={11} />
                {form.formState.errors.nis && (
                  <p className="text-destructive text-sm mt-1">{form.formState.errors.nis.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="article_imposition">Article d'imposition</Label>
                <Input id="article_imposition" {...form.register("article_imposition")} className="mt-1.5" placeholder="Numéro d'article" maxLength={30} />
                {form.formState.errors.article_imposition && (
                  <p className="text-destructive text-sm mt-1">{form.formState.errors.article_imposition.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="banque">Banque</Label>
                <Input id="banque" {...form.register("banque")} className="mt-1.5" placeholder="Nom de la banque" />
              </div>

              <div>
                <Label htmlFor="agence">Agence</Label>
                <Input id="agence" {...form.register("agence")} className="mt-1.5" placeholder="Nom de l'agence" />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="rib">RIB</Label>
                <Input id="rib" {...form.register("rib")} className="mt-1.5" placeholder="Numéro RIB" maxLength={30} />
                {form.formState.errors.rib && (
                  <p className="text-destructive text-sm mt-1">{form.formState.errors.rib.message}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-border mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(isEditMode ? `/intervenant/clients/${id}` : "/intervenant/clients")}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                className="gradient-primary text-primary-foreground"
                disabled={createClient.isPending || updateClient.isPending}
              >
                {(createClient.isPending || updateClient.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {isEditMode ? "Enregistrer les modifications" : "Créer le client"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default ClientForm;
