import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { useChantiers } from "@/hooks/useChantiers";
import { useCarrieres } from "@/hooks/useCarrieres";
import {
  useEchantillonGeotechniqueById,
  useCreateEchantillonGeotechniqueByType,
  useUpdateEchantillonGeotechniqueByType,
  getGeoTableName,
} from "@/hooks/useEchantillonsGeotechniqueFactory";
import { useDuplicateSource } from "@/hooks/useDuplicateEssai";
import { toast } from "sonner";
import { FormLoadingOverlay } from "@/components/ui/form-loading-overlay";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

const formSchema = z.object({
  client_id: z.string().min(1, "Sélectionnez un client"),
  chantier_id: z.string().min(1, "Sélectionnez un chantier"),
  carriere_id: z.string().optional(),
  type_sol: z.string().min(1, "Le type de sol est requis").max(200),
  date_prelevement: z.string().min(1, "La date est requise"),
  date_essai: z.string().optional(),
  observations: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EchantillonGeotechniqueFormProps {
  essaiType: string;
  essaiTitle: string;
  basePath: string;
  categoryPath?: string;
  categoryLabel?: string;
}

// Types that show carriere field (not densitometre)
const TYPES_WITH_CARRIERE = ["teneur-eau-sol", "granulometrie-sol", "limites-atterberg", "classification-sol", "proctor-normal", "proctor-modifie", "cbr"];
// Types that show date_essai field
const TYPES_WITH_DATE_ESSAI = ["teneur-eau-sol", "granulometrie-sol", "limites-atterberg", "classification-sol", "densitometre", "proctor-normal", "proctor-modifie", "cbr"];

export default function EchantillonGeotechniqueForm({ essaiType, essaiTitle, basePath, categoryPath: propCategoryPath, categoryLabel: propCategoryLabel }: EchantillonGeotechniqueFormProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: allChantiers, isLoading: chantiersLoading } = useChantiers();
  const { data: carrieres, isLoading: carrieresLoading } = useCarrieres();
  const { data: echantillonEdit, isLoading: echantillonLoading } = useEchantillonGeotechniqueById(essaiType, id);
  const { duplicateSource, isDuplicateLoading } = useDuplicateSource<any>(getGeoTableName(essaiType));
  const echantillon: any = echantillonEdit || (!isEditing ? duplicateSource : null);

  const createEchantillon = useCreateEchantillonGeotechniqueByType(essaiType);
  const updateEchantillon = useUpdateEchantillonGeotechniqueByType(essaiType);

  const showCarriere = TYPES_WITH_CARRIERE.includes(essaiType);
  const showDateEssai = TYPES_WITH_DATE_ESSAI.includes(essaiType);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_id: "",
      chantier_id: "",
      carriere_id: "",
      type_sol: "",
      date_prelevement: new Date().toISOString().split("T")[0],
      date_essai: "",
      observations: "",
    },
  });

  const selectedClientId = form.watch("client_id");
  const chantiers = allChantiers?.filter(c => !selectedClientId || c.client_id === selectedClientId);

  const [typeMateriau, setTypeMateriau] = useState("GNT");
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  useEffect(() => {
    if (echantillon && !isFormInitialized) {
      form.setValue("client_id", echantillon.client_id || "");
      form.setValue("chantier_id", echantillon.chantier_id || "");
      form.setValue("carriere_id", echantillon.carriere_id || "");
      form.setValue("type_sol", echantillon.type_sol);
      if (isEditing) {
        form.setValue("date_prelevement", echantillon.date_prelevement);
      }
      form.setValue("date_essai", echantillon.date_essai || "");
      form.setValue("observations", echantillon.observations || "");
      const res = echantillon.resultats as Record<string, unknown> | null;
      if (res?.type_materiau) setTypeMateriau(String(res.type_materiau));
      setIsFormInitialized(true);
    }
  }, [echantillon, isEditing, form, isFormInitialized]);

  useEffect(() => {
    if (isFormInitialized && selectedClientId) {
      const currentChantier = form.getValues("chantier_id");
      const validChantier = chantiers?.find(c => c.id === currentChantier);
      if (!validChantier) {
        form.setValue("chantier_id", "");
      }
    }
  }, [selectedClientId, isFormInitialized]);

  const onSubmit = async (values: FormValues) => {
    try {
      const existingResultats = (echantillon?.resultats as Record<string, unknown>) || {};
      const data: Record<string, unknown> = {
        client_id: values.client_id,
        chantier_id: values.chantier_id,
        type_sol: values.type_sol,
        date_prelevement: values.date_prelevement,
        observations: values.observations || null,
      };

      if (showCarriere) {
        data.carriere_id = values.carriere_id || null;
      }
      if (showDateEssai) {
        data.date_essai = values.date_essai || null;
      }

      if (essaiType === "granulometrie-sol") {
        data.resultats = { ...existingResultats, type_materiau: typeMateriau };
      }

      if (isEditing && id) {
        await updateEchantillon.mutateAsync({ id, ...data } as any);
        toast.success("Échantillon modifié avec succès");
      } else {
        await createEchantillon.mutateAsync(data as any);
        toast.success("Échantillon créé avec succès");
      }
      navigate(basePath);
    } catch {
      toast.error("Une erreur est survenue");
    }
  };

  const isLoading = clientsLoading || chantiersLoading || carrieresLoading || (isEditing && echantillonLoading) || isDuplicateLoading;
  const isPending = createEchantillon.isPending || updateEchantillon.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const CATEGORY_MAP: Record<string, { path: string; label: string }> = {
    "identification": { path: "/essais/geotechnique/identification", label: "Identification" },
    "compactage": { path: "/essais/geotechnique/compactage", label: "Compactage" },
    "insitu": { path: "/essais/geotechnique/insitu", label: "In Situ" },
    "mecanique": { path: "/essais/geotechnique/mecanique", label: "Mécanique" },
  };

  const categorySegment = basePath.split("/")[3] || "";
  const categoryInfo = CATEGORY_MAP[categorySegment];
  const categoryPath = propCategoryPath || categoryInfo?.path || "/essais/geotechnique";
  const categoryLabel = propCategoryLabel || categoryInfo?.label || "Géotechnique";

  const breadcrumbItems = [
    { label: "Géotechnique", path: "/essais/geotechnique" },
    { label: categoryLabel, path: categoryPath },
    { label: essaiTitle, path: basePath },
    { label: isEditing ? "Modifier" : "Nouvel échantillon" },
  ];

  return (
    <div className="space-y-6">
      <EssaiBreadcrumb items={breadcrumbItems} />

      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(basePath)} className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            {isEditing ? "Modifier" : "Nouvel"}{" "}
            <span className="text-primary text-glow">échantillon</span>
          </h1>
          <p className="text-muted-foreground mt-1">{essaiTitle}</p>
        </div>
      </div>

      <Card className="border-border bg-card relative">
        <FormLoadingOverlay isLoading={isEditing && echantillonLoading} message="Chargement des données..." />
        <CardHeader>
          <CardTitle>Informations de l'échantillon</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder="Sélectionnez un client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover border-border">
                          {clients?.map((client) => (
                            <SelectItem key={client.id} value={client.id}>{client.nom}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="chantier_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chantier *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClientId}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder={!selectedClientId ? "Sélectionnez d'abord un client" : "Sélectionnez un chantier"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover border-border">
                          {chantiers?.length === 0 ? (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">Aucun chantier pour ce client</div>
                          ) : (
                            chantiers?.map((chantier) => (
                              <SelectItem key={chantier.id} value={chantier.id}>{chantier.nom}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {showCarriere && (
                  <FormField
                    control={form.control}
                    name="carriere_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carrière</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-border">
                              <SelectValue placeholder="Sélectionnez une carrière (optionnel)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="none">Aucune</SelectItem>
                            {carrieres?.map((carriere) => (
                              <SelectItem key={carriere.id} value={carriere.id}>{carriere.nom}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="type_sol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de sol *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Argile, Sable, Limon, Grave..." className="bg-background border-border" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_prelevement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de prélèvement *</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" className="bg-background border-border" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {showDateEssai && (
                  <FormField
                    control={form.control}
                    name="date_essai"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date d'essai</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" className="bg-background border-border" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {essaiType === "granulometrie-sol" && (
                  <div>
                    <Label className="text-sm font-medium">Type de matériau *</Label>
                    <Select value={typeMateriau} onValueChange={setTypeMateriau}>
                      <SelectTrigger className="bg-background border-border mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="GNT">GNT (Grave Non Traitée)</SelectItem>
                        <SelectItem value="Autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observations</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Observations sur l'échantillon..." className="bg-background border-border min-h-[100px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate(basePath)} className="border-border">
                  Annuler
                </Button>
                <Button type="submit" disabled={isPending} className="gradient-primary text-primary-foreground">
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
