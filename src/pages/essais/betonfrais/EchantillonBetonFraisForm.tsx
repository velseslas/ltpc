import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { EssaiBreadcrumb, BreadcrumbItem } from "@/components/essais/EssaiBreadcrumb";
import { FormLoadingOverlay } from "@/components/ui/form-loading-overlay";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";
import { useChantiersByClient } from "@/hooks/useChantiers";
import { useCentralesByClient } from "@/hooks/useCentralesByClient";
import { useFormulations } from "@/hooks/useFormulations";
import { useIntervenants } from "@/hooks/useIntervenants";
import { useTechnicianOperateurLock } from "@/hooks/useTechnicianOperateurLock";
import {
  useEchantillonBetonFraisById,
  useCreateEchantillonBetonFraisByType,
  useUpdateEchantillonBetonFraisByType,
  getPrefix,
  getTableName,
} from "@/hooks/useEchantillonsBetonFraisFactory";
import { useDuplicateSource } from "@/hooks/useDuplicateEssai";
import { mergeDuplicateData } from "@/lib/duplicate-utils";

const CLASSES_RESISTANCE = [
  "C12/15", "C16/20", "C20/25", "C25/30", "C30/37", "C35/45",
  "C40/50", "C45/55", "C50/60", "C55/67", "C60/75", "C70/85",
  "C80/95", "C90/105", "C100/115",
];

const createFormSchema = (showClasseConsistance: boolean) => z.object({
  client_id: z.string().min(1, "Client requis"),
  chantier_id: z.string().min(1, "Chantier requis"),
  centrale_id: z.string().min(1, "Centrale requis"),
  formulation_id: z.string().min(1, "Formulation requise"),
  operateur_id: z.string().min(1, "Technicien requis"),
  classe_resistance: z.string().min(1, "Classe de résistance requise"),
  date_prelevement: z.string().min(1, "Date requise"),
  heure_prelevement: z.string().optional(),
  temperature_beton: z.string().optional(),
  temperature_air: z.string().optional(),
  temperature_ambiante: z.string().optional(),
  classe_consistance: showClasseConsistance
    ? z.string().min(1, "Classe de consistance requise")
    : z.string().optional(),
  observations: z.string().optional(),
  essai_convenance: z.boolean().optional(),
  essai_convenance_details: z.string().optional(),
  ouvrage: z.string().optional(),
  destination_beton: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.essai_convenance) {
    if (!data.ouvrage || data.ouvrage.trim() === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ouvrage requis", path: ["ouvrage"] });
    }
    if (!data.destination_beton || data.destination_beton.trim() === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Partie de l'ouvrage requise", path: ["destination_beton"] });
    }
  }
});

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

const CLASSES_CONSISTANCE_LIST = ["S1", "S2", "S3", "S4", "S5"];

// Define which fields are available for each test type
const getFieldsForType = (essaiType: string) => {
  switch (essaiType) {
    case "affaissement":
      return { showTemperatureBeton: true, showTemperatureAir: true, showTemperatureAmbiante: true };
    case "temperature":
      return { showTemperatureBeton: false, showTemperatureAir: false, showTemperatureAmbiante: true };
    case "temps-prise":
      return { showTemperatureBeton: true, showTemperatureAir: true, showTemperatureAmbiante: false };
    case "teneur-air":
      return { showTemperatureBeton: true, showTemperatureAir: true, showTemperatureAmbiante: false };
    default:
      return { showTemperatureBeton: true, showTemperatureAir: true, showTemperatureAmbiante: false };
  }
};

interface EchantillonBetonFraisFormProps {
  essaiType: string;
  essaiTitle: string;
  basePath: string;
  showClasseConsistance?: boolean;
}

export default function EchantillonBetonFraisForm({
  essaiType,
  essaiTitle,
  basePath,
  showClasseConsistance = false,
}: EchantillonBetonFraisFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const prefix = getPrefix(essaiType);
  const fieldConfig = getFieldsForType(essaiType);
  const formSchema = useMemo(() => createFormSchema(showClasseConsistance), [showClasseConsistance]);

  const { data: echantillonEdit, isLoading: loadingEchantillon } = useEchantillonBetonFraisById(essaiType, id);
  const { duplicateSource, isDuplicateLoading } = useDuplicateSource<any>(getTableName(essaiType));
  const echantillon: any = echantillonEdit || (!isEditing ? duplicateSource : null);
  const createEchantillon = useCreateEchantillonBetonFraisByType(essaiType);
  const updateEchantillon = useUpdateEchantillonBetonFraisByType(essaiType);

  const { data: clients } = useClients();
  const { data: intervenants } = useIntervenants();
  

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_id: "",
      chantier_id: "",
      centrale_id: "",
      formulation_id: "",
      operateur_id: "",
      classe_resistance: "",
      date_prelevement: format(new Date(), "yyyy-MM-dd"),
      heure_prelevement: "",
      temperature_beton: "",
      temperature_air: "",
      temperature_ambiante: "",
      classe_consistance: "",
      observations: "",
      essai_convenance: false,
      essai_convenance_details: "",
      ouvrage: "",
      destination_beton: "",
    },
  });

  const selectedClientId = form.watch("client_id");
  const selectedCentraleId = form.watch("centrale_id");
  const operateurValue = form.watch("operateur_id");
  const { isLocked: isOperateurLocked } = useTechnicianOperateurLock(
    operateurValue ?? "",
    (id) => form.setValue("operateur_id", id),
  );
  const { data: centralesFromClient } = useCentralesByClient(selectedClientId);
  const { data: chantiersFromClient, isLoading: chantiersLoading } = useChantiersByClient(selectedClientId);
  const { data: formulationsFromCentrale, isLoading: formulationsLoading } = useFormulations(selectedCentraleId);

  // Fallback fetch by ID so saved values remain available even if filters changed
  const existingCentraleId = (echantillon as any)?.centrale_id || null;
  const existingFormulationId = (echantillon as any)?.formulation_id || null;
  const existingChantierId = (echantillon as any)?.chantier_id || null;

  const { data: existingCentrale } = useQuery({
    queryKey: ["centrale-by-id", existingCentraleId],
    queryFn: async () => {
      if (!existingCentraleId) return null;
      const { data } = await supabase.from("centrales_beton").select("id, nom, ville").eq("id", existingCentraleId).maybeSingle();
      return data;
    },
    enabled: !!existingCentraleId,
  });

  const { data: existingFormulation } = useQuery({
    queryKey: ["formulation-by-id", existingFormulationId],
    queryFn: async () => {
      if (!existingFormulationId) return null;
      const { data } = await supabase.from("formulations").select("id, nom, centrale_id").eq("id", existingFormulationId).maybeSingle();
      return data;
    },
    enabled: !!existingFormulationId,
  });

  const { data: existingChantier } = useQuery({
    queryKey: ["chantier-by-id", existingChantierId],
    queryFn: async () => {
      if (!existingChantierId) return null;
      const { data } = await supabase.from("chantiers").select("id, nom, client_id").eq("id", existingChantierId).maybeSingle();
      return data;
    },
    enabled: !!existingChantierId,
  });

  const centrales = useMemo(() => {
    const list = [...(centralesFromClient || [])];
    if (existingCentrale && !list.some((c: any) => c.id === existingCentrale.id)) list.push(existingCentrale as any);
    return list;
  }, [centralesFromClient, existingCentrale]);

  const formulations = useMemo(() => {
    const list = [...(formulationsFromCentrale || [])];
    if (existingFormulation && !list.some((f: any) => f.id === existingFormulation.id)) list.push(existingFormulation as any);
    return list;
  }, [formulationsFromCentrale, existingFormulation]);

  const chantiers = useMemo(() => {
    const list = [...(chantiersFromClient || [])];
    if (existingChantier && !list.some((c: any) => c.id === existingChantier.id)) list.push(existingChantier as any);
    return list;
  }, [chantiersFromClient, existingChantier]);

  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const [isPreFilling, setIsPreFilling] = useState(false);
  const [initStep, setInitStep] = useState(0);
  const [pendingData, setPendingData] = useState<any>(null);

  // Reset centrale and formulation when client changes
  const [prevClientId, setPrevClientId] = useState(selectedClientId);
  useEffect(() => {
    if (isFormInitialized && selectedClientId !== prevClientId) {
      form.setValue("centrale_id", "");
      form.setValue("formulation_id", "");
      setPrevClientId(selectedClientId);
    }
  }, [selectedClientId, prevClientId, isFormInitialized, form]);

  // Multi-step initialization for edit mode
  useEffect(() => {
    if (echantillon && !isFormInitialized && initStep === 0) {
      setIsPreFilling(true);
      form.setValue("client_id", echantillon.client_id || "");
      form.setValue("centrale_id", echantillon.centrale_id || "");
      setPendingData({
        chantier_id: echantillon.chantier_id,
        formulation_id: echantillon.formulation_id,
        operateur_id: echantillon.operateur_id,
        date_prelevement: echantillon.date_prelevement,
        heure_prelevement: echantillon.heure_prelevement,
        temperature_beton: echantillon.temperature_beton?.toString() || "",
        temperature_air: echantillon.temperature_air?.toString() || "",
        temperature_ambiante: echantillon.temperature_ambiante?.toString() || "",
        classe_consistance: (echantillon as any).classe_consistance || "",
        classe_resistance: (echantillon as any).classe_resistance || "",
        observations: echantillon.observations,
        essai_convenance: (echantillon as any).essai_convenance || false,
        essai_convenance_details: (echantillon as any).essai_convenance_details || "",
        ouvrage: (echantillon as any).ouvrage || "",
        destination_beton: (echantillon as any).destination_beton || "",
      });
      setInitStep(1);
    }
  }, [echantillon, isEditing, form, isFormInitialized, initStep]);

  // Step 2: Wait for dependent data to load
  useEffect(() => {
    if (initStep === 1 && pendingData && !chantiersLoading && !formulationsLoading) {
      const timer = setTimeout(() => {
        form.setValue("chantier_id", pendingData.chantier_id || "");
        form.setValue("formulation_id", pendingData.formulation_id || "");
        form.setValue("operateur_id", pendingData.operateur_id || "");
        form.setValue("date_prelevement", pendingData.date_prelevement);
        form.setValue("heure_prelevement", pendingData.heure_prelevement || "");
        form.setValue("temperature_beton", pendingData.temperature_beton);
        form.setValue("temperature_air", pendingData.temperature_air);
        form.setValue("temperature_ambiante", pendingData.temperature_ambiante);
        form.setValue("classe_consistance", pendingData.classe_consistance);
        form.setValue("classe_resistance", pendingData.classe_resistance);
        form.setValue("observations", pendingData.observations || "");
        form.setValue("essai_convenance", pendingData.essai_convenance);
        form.setValue("essai_convenance_details", pendingData.essai_convenance_details);
        form.setValue("ouvrage", pendingData.ouvrage);
        form.setValue("destination_beton", pendingData.destination_beton);

        setPrevClientId(pendingData.client_id ?? echantillon?.client_id ?? "");
        setIsFormInitialized(true);
        setIsPreFilling(false);
        setPendingData(null);
        setInitStep(0);
      }, 150);


      return () => clearTimeout(timer);
    }
  }, [initStep, pendingData, chantiersLoading, formulationsLoading, form]);

  const onSubmit = async (values: FormValues) => {
    if (showClasseConsistance && (!values.classe_consistance || values.classe_consistance.trim() === "")) {
      form.setError("classe_consistance", { type: "manual", message: "Classe de consistance requise" });
      toast.error("Classe de consistance requise");
      return;
    }
    try {

      const data: Record<string, any> = {
        client_id: values.client_id,
        chantier_id: values.chantier_id,
        centrale_id: values.centrale_id,
        formulation_id: values.formulation_id || null,
        operateur_id: values.operateur_id || null,
        classe_resistance: values.classe_resistance || null,
        date_prelevement: values.date_prelevement,
        heure_prelevement: values.heure_prelevement || null,
        observations: values.observations || null,
        essai_convenance: values.essai_convenance || false,
        essai_convenance_details: values.essai_convenance ? (values.essai_convenance_details || null) : null,
        ouvrage: values.essai_convenance ? null : (values.ouvrage || null),
        destination_beton: values.essai_convenance ? null : (values.destination_beton || null),
      };

      // Add type-specific fields
      if (fieldConfig.showTemperatureBeton) {
        data.temperature_beton = values.temperature_beton ? parseFloat(values.temperature_beton) : null;
      }
      if (fieldConfig.showTemperatureAir) {
        data.temperature_air = values.temperature_air ? parseFloat(values.temperature_air) : null;
      }
      if (fieldConfig.showTemperatureAmbiante) {
        data.temperature_ambiante = values.temperature_ambiante ? parseFloat(values.temperature_ambiante) : null;
      }
      if (showClasseConsistance) {
        data.classe_consistance = values.classe_consistance || null;
      }

      if (isEditing) {
        await updateEchantillon.mutateAsync({ id, ...data });
        toast.success("Échantillon modifié avec succès");
      } else {
        await createEchantillon.mutateAsync(mergeDuplicateData(data, duplicateSource));
        toast.success("Échantillon créé avec succès");
      }

      navigate(basePath);
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Béton", path: "/essais/beton" },
    { label: "Béton Frais", path: "/essais/beton/beton-frais" },
    { label: essaiTitle, path: basePath },
    { label: isEditing ? "Modifier" : "Nouveau" },
  ];

  if ((isEditing && loadingEchantillon) || isDuplicateLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <EssaiBreadcrumb items={breadcrumbItems} />

      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(basePath)}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">
            {isEditing ? (
              <>Modifier <span className="text-primary">{prefix}-{String(echantillon?.numero).padStart(3, "0")}</span></>
            ) : (
              <>Nouvel Échantillon <span className="text-primary">{essaiTitle}</span></>
            )}
          </h1>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-border bg-card relative">
            <FormLoadingOverlay isLoading={isPreFilling} />
            <CardHeader>
              <CardTitle className="text-lg">Informations Générales</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client <span className="text-red-700">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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

              <FormField
                control={form.control}
                name="chantier_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chantier <span className="text-red-700">*</span></FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!selectedClientId || chantiersLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un chantier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {chantiers?.map((chantier) => (
                          <SelectItem key={chantier.id} value={chantier.id}>
                            {chantier.nom}
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
                name="essai_convenance"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Essai de convenance</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch("essai_convenance") && (
                <FormField
                  control={form.control}
                  name="essai_convenance_details"
                  render={({ field }) => (
                    <FormItem className="lg:col-span-2">
                      <FormLabel>Détails de l'essai de convenance</FormLabel>
                      <FormControl>
                        <Input placeholder="Détails de l'essai de convenance..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="ouvrage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ouvrage <span className="text-red-700">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nom de l'ouvrage..." 
                        {...field} 
                        disabled={form.watch("essai_convenance")}
                        className={form.watch("essai_convenance") ? "opacity-50" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="destination_beton"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partie de l'ouvrage <span className="text-red-700">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Partie de l'ouvrage..." 
                        {...field} 
                        disabled={form.watch("essai_convenance")}
                        className={form.watch("essai_convenance") ? "opacity-50" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="centrale_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Centrale à Béton <span className="text-red-700">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une centrale" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {centrales?.map((centrale) => (
                          <SelectItem key={centrale.id} value={centrale.id}>
                            {centrale.nom}
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
                name="formulation_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Formulation <span className="text-red-700">*</span></FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!selectedCentraleId || formulationsLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une formulation" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {formulations?.map((formulation) => (
                          <SelectItem key={formulation.id} value={formulation.id}>
                            {formulation.nom}
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
                name="operateur_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Technicien <span className="text-red-700">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isOperateurLocked}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un technicien" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                name="classe_resistance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Classe de résistance <span className="text-red-700">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une classe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CLASSES_RESISTANCE.map((classe) => (
                          <SelectItem key={classe} value={classe}>
                            {classe}
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
                name="date_prelevement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de prélèvement <span className="text-red-700">*</span></FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "dd/MM/yyyy", { locale: fr })
                            ) : (
                              <span>Sélectionner une date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                          locale={fr}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="heure_prelevement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heure de prélèvement</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {fieldConfig.showTemperatureBeton && (
                <FormField
                  control={form.control}
                  name="temperature_beton"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Température béton (°C)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="Ex: 22.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {fieldConfig.showTemperatureAir && (
                <FormField
                  control={form.control}
                  name="temperature_air"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Température air (°C)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="Ex: 25.0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {fieldConfig.showTemperatureAmbiante && (
                <FormField
                  control={form.control}
                  name="temperature_ambiante"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Température ambiante (°C)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="Ex: 20.0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {showClasseConsistance && (
                <FormField
                  control={form.control}
                  name="classe_consistance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Classe de consistance *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CLASSES_CONSISTANCE_LIST.map((classe) => (
                            <SelectItem key={classe} value={classe}>
                              {classe}
                            </SelectItem>
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
                name="observations"
                render={({ field }) => (
                  <FormItem className="md:col-span-2 lg:col-span-3">
                    <FormLabel>Observations</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observations éventuelles..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate(basePath)}>
              Annuler
            </Button>
            <Button
              type="submit"
              className="gradient-primary text-primary-foreground"
              disabled={createEchantillon.isPending || updateEchantillon.isPending}
            >
              {(createEchantillon.isPending || updateEchantillon.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
