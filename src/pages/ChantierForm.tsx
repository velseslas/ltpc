import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Building2, Loader2, AlertCircle } from "lucide-react";
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
import { useCreateChantier, useChantier, useUpdateChantier } from "@/hooks/useChantiers";
import { useClient } from "@/hooks/useClients";
import { toast } from "sonner";
import { wilayas } from "@/data/wilayas";
import { useEffect, useState } from "react";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { LocalisationPicker, type LocalisationValue } from "@/components/localisation/LocalisationPicker";


const chantierSchema = z.object({
  nom: z.string().min(1, "Le nom du chantier est requis"),
  adresse: z.string().min(1, "L'adresse est requise"),
  ville: z.string().min(1, "La wilaya est requise"),
  contact: z.string().max(100, "Maximum 100 caractères").optional(),
  telephone: z.string().max(20, "Maximum 20 caractères").optional(),
  date_debut: z.string().min(1, "La date de début est requise"),
  date_fin: z.string().optional(),
  statut: z.string().min(1, "Le statut est requis"),
});

type ChantierFormData = z.infer<typeof chantierSchema>;

const ChantierForm = () => {
  const navigate = useNavigate();
  const { chantierId } = useParams();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get("clientId");
  const isEditing = !!chantierId;
  
  const { data: client } = useClient(clientId || "");
  const { data: chantier, isLoading: chantierLoading } = useChantier(chantierId || "");
  const createChantier = useCreateChantier();
  const updateChantier = useUpdateChantier();

  const form = useForm<ChantierFormData>({
    resolver: zodResolver(chantierSchema),
    defaultValues: {
      nom: "",
      adresse: "",
      ville: "",
      contact: "",
      telephone: "",
      date_debut: "",
      date_fin: "",
      statut: "planifie",
    },
  });

  const [localisation, setLocalisation] = useState<LocalisationValue>({
    adresse_localisation: "",
    latitude: null,
    longitude: null,
  });

  // Pre-fill form when editing
  useEffect(() => {
    if (chantier && isEditing) {
      form.reset({
        nom: chantier.nom || "",
        adresse: chantier.adresse || "",
        ville: chantier.ville || "",
        contact: (chantier as any).contact || "",
        telephone: (chantier as any).telephone || "",
        date_debut: chantier.date_debut || "",
        date_fin: chantier.date_fin || "",
        statut: chantier.statut || "planifie",
      });
      setLocalisation({
        adresse_localisation: (chantier as any).adresse_localisation || "",
        latitude: (chantier as any).latitude ?? null,
        longitude: (chantier as any).longitude ?? null,
      });
    }
  }, [chantier, isEditing, form]);

  const onSubmit = async (data: ChantierFormData) => {
    const targetClientId = clientId || chantier?.client_id;
    
    if (!targetClientId) {
      toast.error("Client non spécifié");
      return;
    }

    const localisationPayload = {
      adresse_localisation: localisation.adresse_localisation.trim() || null,
      latitude: localisation.latitude,
      longitude: localisation.longitude,
    };
    
    try {
      if (isEditing && chantierId) {
        await updateChantier.mutateAsync({
          id: chantierId,
          clientId: targetClientId,
          data: {
            nom: data.nom,
            adresse: data.adresse || null,
            ville: data.ville || null,
            contact: data.contact || null,
            telephone: data.telephone || null,
            statut: data.statut,
            date_debut: data.date_debut || null,
            date_fin: data.date_fin || null,
            ...localisationPayload,
          }
        });
        toast.success("Chantier modifié avec succès");
      } else {
        await createChantier.mutateAsync({
          nom: data.nom,
          adresse: data.adresse || null,
          ville: data.ville || null,
          contact: data.contact || null,
          telephone: data.telephone || null,
          description: null,
          statut: data.statut,
          client_id: targetClientId,
          date_debut: data.date_debut || null,
          date_fin: data.date_fin || null,
          ...localisationPayload,
        });
        toast.success("Chantier créé avec succès");
      }

      navigate(`/intervenant/clients/${targetClientId}`);
    } catch (error) {
      toast.error(isEditing ? "Erreur lors de la modification du chantier" : "Erreur lors de la création du chantier");
    }
  };

  const isPending = createChantier.isPending || updateChantier.isPending;

  if (isEditing && chantierLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const backUrl = clientId 
    ? `/intervenant/clients/${clientId}` 
    : chantier?.client_id 
      ? `/intervenant/clients/${chantier.client_id}` 
      : "/intervenant/clients";

  return (
    <>
      <AppBreadcrumb 
        items={[
          { label: "Intervenants", path: "/intervenant" },
          { label: "Clients", path: "/intervenant/clients" },
          ...(client ? [{ label: client.nom, path: backUrl }] : []),
          { label: isEditing ? "Modifier Chantier" : "Nouveau Chantier" }
        ]} 
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              {isEditing ? "Modifier le" : "Nouveau"} <span className="text-primary text-glow">Chantier</span>
            </h1>
            {client && (
              <p className="text-muted-foreground text-sm">
                Pour le client: <span className="text-foreground">{client.nom}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 animate-fade-in [animation-delay:100ms]">
            <h3 className="text-lg font-medium text-foreground mb-6">Informations du chantier</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="nom">Nom du chantier <span className="text-red-700">*</span></Label>
                <Input
                  id="nom"
                  {...form.register("nom")}
                  className={`mt-1.5 ${form.formState.errors.nom ? "border-red-700 focus-visible:ring-red-700" : ""}`}
                  placeholder="Nom du chantier"
                />
                {form.formState.errors.nom && (
                  <p className="text-red-700 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {form.formState.errors.nom.message}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="adresse">Adresse <span className="text-red-700">*</span></Label>
                <Input
                  id="adresse"
                  {...form.register("adresse")}
                  className={`mt-1.5 ${form.formState.errors.adresse ? "border-red-700 focus-visible:ring-red-700" : ""}`}
                  placeholder="Adresse du chantier"
                />
                {form.formState.errors.adresse && (
                  <p className="text-red-700 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {form.formState.errors.adresse.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="contact">Contact</Label>
                <Input
                  id="contact"
                  {...form.register("contact")}
                  className="mt-1.5"
                  placeholder="Nom du contact sur site"
                />
              </div>

              <div>
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  {...form.register("telephone")}
                  className="mt-1.5"
                  placeholder="+213 XX XXX XXXX"
                />
              </div>


              <div className="md:col-span-2">
                <Label htmlFor="statut">Statut <span className="text-red-700">*</span></Label>
                <Select
                  value={form.watch("statut")}
                  onValueChange={(value) => form.setValue("statut", value)}
                >
                  <SelectTrigger className={`mt-1.5 ${form.formState.errors.statut ? "border-red-700 focus-visible:ring-red-700" : ""}`}>
                    <SelectValue placeholder="Sélectionnez un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planifie">Planifié</SelectItem>
                    <SelectItem value="en_cours">En cours</SelectItem>
                    <SelectItem value="en_pause">En pause</SelectItem>
                    <SelectItem value="termine">Terminé</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.statut && (
                  <p className="text-red-700 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {form.formState.errors.statut.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="date_debut">Date de début <span className="text-red-700">*</span></Label>
                <Input
                  id="date_debut"
                  type="date"
                  {...form.register("date_debut")}
                  className={`mt-1.5 ${form.formState.errors.date_debut ? "border-red-700 focus-visible:ring-red-700" : ""}`}
                />
                {form.formState.errors.date_debut && (
                  <p className="text-red-700 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {form.formState.errors.date_debut.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="date_fin">Date de fin</Label>
                <Input
                  id="date_fin"
                  type="date"
                  {...form.register("date_fin", {
                    onChange: (e) => {
                      const v = e.target.value;
                      if (v) {
                        const today = new Date().toISOString().slice(0, 10);
                        form.setValue("statut", v <= today ? "termine" : "planifie", { shouldDirty: true });
                      }
                    },
                  })}
                  className="mt-1.5"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="ville">Wilaya <span className="text-red-700">*</span></Label>
                <Select
                  value={form.watch("ville") || ""}
                  onValueChange={(value) => form.setValue("ville", value)}
                >
                  <SelectTrigger className={`mt-1.5 ${form.formState.errors.ville ? "border-red-700 focus-visible:ring-red-700" : ""}`}>
                    <SelectValue placeholder="Sélectionnez une wilaya" />
                  </SelectTrigger>
                  <SelectContent>
                    {wilayas.map((wilaya) => (
                      <SelectItem key={wilaya.code} value={wilaya.nom}>
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

            {/* LOT 14.1 — Localisation du chantier */}
            <div className="mt-6">
              <LocalisationPicker value={localisation} onChange={setLocalisation} />
            </div>



            {/* Actions */}
            <div className="flex flex-col-reverse md:flex-row items-stretch md:items-center justify-end gap-3 pt-4 border-t border-border mt-6">
              <Button
                type="button"
                variant="outline"
                className="h-11 md:h-10 w-full md:w-auto"
                onClick={() => navigate(backUrl)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="h-11 md:h-10 w-full md:w-auto gradient-primary text-primary-foreground"
                disabled={isPending}
              >
                {isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {isEditing ? "Modifier le chantier" : "Créer le chantier"}
              </Button>
            </div>

          </div>
        </form>
      </div>
    </>
  );
};

export default ChantierForm;
