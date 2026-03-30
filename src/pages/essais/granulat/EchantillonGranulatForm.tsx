import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { useCarrieres } from "@/hooks/useCarrieres";
import { useProduits } from "@/hooks/useProduits";
import { useIntervenants } from "@/hooks/useIntervenants";
import { useClients } from "@/hooks/useClients";
import { useChantiersByClient } from "@/hooks/useChantiers";
import { 
  useEchantillonGranulatById,
  useCreateEchantillonGranulatByType, 
  useUpdateEchantillonGranulatByType 
} from "@/hooks/useEchantillonsGranulatFactory";
import { toast } from "sonner";
import { FormLoadingOverlay } from "@/components/ui/form-loading-overlay";

const breadcrumbCategoryConfig: Record<string, { categoryPath: string; categoryLabel: string }> = {
  "equivalent-sable": { categoryPath: "/essais/granulat/proprete", categoryLabel: "Propreté" },
  "bleu-methylene": { categoryPath: "/essais/granulat/proprete", categoryLabel: "Propreté" },
  "matiere-organique": { categoryPath: "/essais/granulat/proprete", categoryLabel: "Propreté" },
  "granulometrie": { categoryPath: "/essais/granulat/physiques", categoryLabel: "Physiques" },
  "masse-volumique": { categoryPath: "/essais/granulat/physiques", categoryLabel: "Physiques" },
  "forme-granulats": { categoryPath: "/essais/granulat/physiques", categoryLabel: "Physiques" },
  "teneur-eau": { categoryPath: "/essais/granulat/physiques", categoryLabel: "Physiques" },
  "los-angeles": { categoryPath: "/essais/granulat/mecaniques", categoryLabel: "Mécaniques" },
  "micro-deval": { categoryPath: "/essais/granulat/mecaniques", categoryLabel: "Mécaniques" },
  "ecrasement": { categoryPath: "/essais/granulat/mecaniques", categoryLabel: "Mécaniques" },
  "friabilite": { categoryPath: "/essais/granulat/mecaniques", categoryLabel: "Mécaniques" },
};

const formSchema = z.object({
  client_id: z.string().optional(),
  chantier_id: z.string().optional(),
  carriere_id: z.string().min(1, "Sélectionnez une carrière"),
  produit: z.string().min(1, "Sélectionnez un produit"),
  operateur_id: z.string().optional(),
  date_reception: z.string().min(1, "La date de réception est requise"),
  date_essai: z.string().optional(),
  observations: z.string().max(500, "Maximum 500 caractères").optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EchantillonGranulatFormProps {
  essaiType: string;
  essaiTitle: string;
  basePath: string;
}

export default function EchantillonGranulatForm({ essaiType, essaiTitle, basePath }: EchantillonGranulatFormProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const { data: carrieres, isLoading: carrieresLoading } = useCarrieres();
  const { data: intervenants } = useIntervenants();
  const { data: clients } = useClients();
  const { data: echantillon, isLoading: echantillonLoading } = useEchantillonGranulatById(essaiType, id);
  
  const createEchantillon = useCreateEchantillonGranulatByType(essaiType);
  const updateEchantillon = useUpdateEchantillonGranulatByType(essaiType);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_id: "",
      chantier_id: "",
      carriere_id: "",
      produit: "",
      operateur_id: "",
      date_reception: new Date().toISOString().split("T")[0],
      date_essai: "",
      observations: "",
    },
  });

  const selectedClientId = form.watch("client_id");
  const selectedCarriereId = form.watch("carriere_id");
  const { data: chantiers } = useChantiersByClient(selectedClientId || "");
  const { data: produits, isLoading: produitsLoading } = useProduits(selectedCarriereId, "carriere");
  
  // Track if form has been initialized with edit data
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const [lastCarriereId, setLastCarriereId] = useState("");
  const [lastClientId, setLastClientId] = useState("");
  const [isPreFilling, setIsPreFilling] = useState(false);
  const [initStep, setInitStep] = useState(0);
  const [pendingProduit, setPendingProduit] = useState<string | null>(null);

  // Reset produit when carriere changes (only after form is initialized)
  useEffect(() => {
    if (isFormInitialized && selectedCarriereId && selectedCarriereId !== lastCarriereId && initStep === 0) {
      form.setValue("produit", "");
      setLastCarriereId(selectedCarriereId);
    }
  }, [selectedCarriereId, form, isFormInitialized, lastCarriereId, initStep]);

  // Reset chantier when client changes (only after form is initialized)
  useEffect(() => {
    if (isFormInitialized && selectedClientId !== lastClientId && initStep === 0) {
      form.setValue("chantier_id", "");
      setLastClientId(selectedClientId || "");
    }
  }, [selectedClientId, form, isFormInitialized, lastClientId, initStep]);

  // Multi-step initialization for edit mode
  useEffect(() => {
    if (echantillon && isEditing && !isFormInitialized) {
      setIsPreFilling(true);
      
      if (initStep === 0) {
        form.setValue("client_id", (echantillon as any).client_id || "");
        setLastClientId((echantillon as any).client_id || "");
        form.setValue("carriere_id", echantillon.carriere_id || "");
        setLastCarriereId(echantillon.carriere_id || "");
        setPendingProduit(echantillon.produit);
        setInitStep(1);
      }
    }
  }, [echantillon, isEditing, form, isFormInitialized, initStep]);

  // Step 2: Wait for products to load, then set the produit
  useEffect(() => {
    if (initStep === 1 && pendingProduit && !produitsLoading && produits) {
      const timer = setTimeout(() => {
        form.setValue("produit", pendingProduit);
        form.setValue("chantier_id", (echantillon as any)?.chantier_id || "");
        
        if (echantillon) {
          form.setValue("date_reception", echantillon.date_reception);
          form.setValue("date_essai", (echantillon as any).date_essai || "");
          form.setValue("observations", echantillon.observations || "");
          form.setValue("operateur_id", echantillon.operateur_id || "");
        }
        
        setIsFormInitialized(true);
        setIsPreFilling(false);
        setPendingProduit(null);
        setInitStep(0);
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [initStep, pendingProduit, produitsLoading, produits, form, echantillon]);

  const onSubmit = async (values: FormValues) => {
    try {
      const data = {
        client_id: values.client_id || null,
        chantier_id: values.chantier_id || null,
        carriere_id: values.carriere_id,
        produit: values.produit,
        operateur_id: values.operateur_id || null,
        date_reception: values.date_reception,
        date_essai: values.date_essai || null,
        observations: values.observations || null,
      };

      if (isEditing && id) {
        await updateEchantillon.mutateAsync({ id, ...data });
        toast.success("Échantillon modifié avec succès");
      } else {
        await createEchantillon.mutateAsync(data);
        toast.success("Échantillon créé avec succès");
      }
      navigate(basePath);
    } catch (error) {
      toast.error("Une erreur est survenue");
    }
  };

  const isLoading = carrieresLoading || (isEditing && echantillonLoading);
  const isPending = createEchantillon.isPending || updateEchantillon.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const config = breadcrumbCategoryConfig[essaiType];
  const breadcrumbItems = config ? [
    { label: "Granulat", path: "/essais/granulat" },
    { label: config.categoryLabel, path: config.categoryPath },
    { label: essaiTitle, path: basePath },
    { label: isEditing ? "Modifier" : "Nouveau" }
  ] : [];

  return (
    <div className="space-y-6">
      <EssaiBreadcrumb items={breadcrumbItems} />

      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton to={basePath} />
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            {isEditing ? "Modifier" : "Nouvel"}{" "}
            <span className="text-primary text-glow">échantillon</span>
          </h1>
          <p className="text-muted-foreground mt-1">{essaiTitle}</p>
        </div>
      </div>

      {/* Form */}
      <Card className="border-border bg-card relative">
        <FormLoadingOverlay 
          isLoading={isEditing && (echantillonLoading || isPreFilling)} 
          message="Chargement des données de l'échantillon..." 
        />
        <CardHeader>
          <CardTitle>Informations de l'échantillon</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Entreprise (Client) */}
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entreprise</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder="Sélectionnez une entreprise" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover border-border">
                          {clients?.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Chantier filtered by client */}
                <FormField
                  control={form.control}
                  name="chantier_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chantier</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={!selectedClientId}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder={
                              !selectedClientId 
                                ? "Sélectionnez d'abord une entreprise" 
                                : "Sélectionnez un chantier"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover border-border">
                          {chantiers?.length === 0 ? (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              Aucun chantier pour cette entreprise
                            </div>
                          ) : (
                            chantiers?.map((chantier) => (
                              <SelectItem key={chantier.id} value={chantier.id}>
                                {chantier.nom}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="carriere_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carrière *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder="Sélectionnez une carrière" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover border-border">
                          {carrieres?.map((carriere) => (
                            <SelectItem key={carriere.id} value={carriere.id}>
                              {carriere.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="produit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produit *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={!selectedCarriereId}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder={
                              !selectedCarriereId 
                                ? "Sélectionnez d'abord une carrière" 
                                : produitsLoading 
                                  ? "Chargement..." 
                                  : "Sélectionnez un produit"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover border-border">
                          {produits?.length === 0 ? (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              Aucun produit pour cette carrière
                            </div>
                          ) : (
                            produits?.map((produit) => (
                              <SelectItem key={produit.id} value={produit.nom}>
                                {produit.nom}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="operateur_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Technicien</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder="Sélectionnez un technicien" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover border-border">
                          {intervenants?.map((intervenant) => (
                            <SelectItem key={intervenant.id} value={intervenant.id}>
                              {intervenant.prenom} {intervenant.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_reception"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de réception *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          className="bg-background border-border"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_essai"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d'essai</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          className="bg-background border-border"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observations</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Observations sur l'échantillon..."
                        className="bg-background border-border min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(basePath)}
                  className="border-border"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="gradient-primary text-primary-foreground"
                >
                  {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? "Modifier" : "Créer"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
