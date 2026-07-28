import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ArrowLeft, CalendarIcon, Save, Loader2, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useChantier } from "@/hooks/useChantiers";
import { useClient } from "@/hooks/useClients";
import { useCentralesForSample } from "@/hooks/useChantierCentrales";
import { useMergedById } from "@/hooks/useExistingDropdownEntities";
import { useFormulations } from "@/hooks/useFormulations";
import { useCreateChantierEchantillon } from "@/hooks/useChantierEchantillons";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { useLaboratoiresMobiles } from "@/hooks/useLaboratoiresMobiles";
import { useDuplicateSource } from "@/hooks/useDuplicateEssai";

const CONDITIONS_CURE = [
  { value: "standard", label: "Cure standard (20°C, 95% HR)" },
  { value: "acceleree", label: "Cure accélérée" },
  { value: "chantier", label: "Cure chantier" },
];

const TYPES_EPROUVETTE = [
  { value: "cube", label: "Cube" },
  { value: "cylindre", label: "Cylindre" },
];

const DIMENSIONS_EPROUVETTE = {
  cube: [
    { value: "15x15x15", label: "Cubique 15×15×15" },
    { value: "10x10x10", label: "Cubique 10×10×10" },
  ],
  cylindre: [
    { value: "16x32", label: "Cylindrique 16×32" },
    { value: "11x22", label: "Cylindrique 11×22" },
  ],
};

const JOURS_ESSAI = [
  { value: 1, label: "1 jour" },
  { value: 3, label: "3 jours" },
  { value: 7, label: "7 jours" },
  { value: 14, label: "14 jours" },
  { value: 28, label: "28 jours" },
];

const HEURES_ESSAI = [
  { value: 8, label: "8 heures" },
  { value: 10, label: "10 heures" },
  { value: 12, label: "12 heures" },
  { value: 16, label: "16 heures" },
  { value: 24, label: "24 heures" },
];


const CLASSES_CONSISTANCE = [
  { value: "S1", label: "S1 (10-40 mm)" },
  { value: "S2", label: "S2 (50-90 mm)" },
  { value: "S3", label: "S3 (100-150 mm)" },
  { value: "S4", label: "S4 (160-210 mm)" },
  { value: "S5", label: "S5 (≥220 mm)" },
];

const CLASSES_RESISTANCE = [
  { value: "C12/15", label: "C12/15" },
  { value: "C16/20", label: "C16/20" },
  { value: "C20/25", label: "C20/25" },
  { value: "C25/30", label: "C25/30" },
  { value: "C30/37", label: "C30/37" },
  { value: "C35/45", label: "C35/45" },
  { value: "C40/50", label: "C40/50" },
  { value: "C45/55", label: "C45/55" },
  { value: "C50/60", label: "C50/60" },
  { value: "C55/67", label: "C55/67" },
  { value: "C60/75", label: "C60/75" },
  { value: "C70/85", label: "C70/85" },
  { value: "C80/95", label: "C80/95" },
  { value: "C90/105", label: "C90/105" },
  { value: "C100/115", label: "C100/115" },
];

const MODES_COULAGE = [
  { value: "pompe", label: "Pompe à béton" },
  { value: "benne", label: "Benne" },
  { value: "autre", label: "Autre" },
];

interface JourEssai {
  jour: number;
  selected: boolean;
  nombre: number;
}

interface HeureEssai {
  heure: number;
  selected: boolean;
  nombre: number;
}

type EcheanceEssai = { jour: number; nombre: number; unite?: string; heures?: number };


export default function ChantierEchantillonForm() {
  const navigate = useNavigate();
  const { chantierId, echantillonId } = useParams();
  const isEditMode = Boolean(echantillonId);

  const { data: chantier, isLoading: isLoadingChantier } = useChantier(chantierId || "");
  const { data: client } = useClient(chantier?.client_id || "");
  const createEchantillon = useCreateChantierEchantillon();
  const queryClient = useQueryClient();

  // Form state
  const [centraleId, setCentraleId] = useState("");
  const [formulationId, setFormulationId] = useState("");
  const [ouvrage, setOuvrage] = useState("");
  const [destinationBeton, setDestinationBeton] = useState("");
  const [conditionCure, setConditionCure] = useState("standard");
  const [dateCoulage, setDateCoulage] = useState<Date | undefined>();
  const [typeEprouvette, setTypeEprouvette] = useState("cube");
  const [dimensionEprouvette, setDimensionEprouvette] = useState("15x15x15");
  const [nombreEprouvettes, setNombreEprouvettes] = useState("6");
  const [joursEssai, setJoursEssai] = useState<JourEssai[]>(
    JOURS_ESSAI.map((j) => ({ 
      jour: j.value, 
      selected: j.value === 7 || j.value === 28, 
      nombre: (j.value === 7 || j.value === 28) ? 3 : 0 
    }))
  );
  const [autreJour, setAutreJour] = useState("");
  const [autreJourNombre, setAutreJourNombre] = useState(0);
  const [autreJourSelected, setAutreJourSelected] = useState(false);
  const [heuresEssai, setHeuresEssai] = useState<HeureEssai[]>(
    HEURES_ESSAI.map((h) => ({
      heure: h.value,
      selected: h.value === 12,
      nombre: h.value === 12 ? 1 : 0,
    }))
  );
  const [autreHeure, setAutreHeure] = useState("");
  const [autreHeureNombre, setAutreHeureNombre] = useState(0);
  const [autreHeureSelected, setAutreHeureSelected] = useState(false);

  const [temperatureBeton, setTemperatureBeton] = useState("");
  const [temperatureAir, setTemperatureAir] = useState("");
  const [classeConsistance, setClasseConsistance] = useState("");
  const [classeResistance, setClasseResistance] = useState("");
  const [modeCoulage, setModeCoulage] = useState("");
  const [essaiConvenance, setEssaiConvenance] = useState(false);
  const [essaiConvenanceDetails, setEssaiConvenanceDetails] = useState("");
  const [mentionEprouvettesLabo, setMentionEprouvettesLabo] = useState(true);
  
  const [etuvage, setEtuvage] = useState("non");
  const [showError, setShowError] = useState(false);

  // Data fetching
  const { data: centralesByChantier = [], isLoading: isLoadingCentrales } = useCentralesForSample(chantier?.client_id || "", chantierId || "");
  // Fetch existing echantillon for edit mode
  const { data: editEchantillon, isLoading: isLoadingEchantillon } = useQuery({
    queryKey: ["echantillon-chantier", echantillonId],
    queryFn: async () => {
      if (!echantillonId) return null;
      const { data, error } = await supabase
        .from("echantillons_compression")
        .select("*")
        .eq("id", echantillonId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!echantillonId,
  });
  const { duplicateSource, isDuplicateLoading } = useDuplicateSource<any>("echantillons_compression");
  const existingEchantillon: any = editEchantillon || (!isEditMode ? duplicateSource : null);
  // Pre-warm the centrale/formulation dropdowns using the persisted IDs so the
  // Select label shows immediately, even before centralesByChantier resolves.
  const effectiveCentraleId = centraleId || existingEchantillon?.centrale_id || null;
  const centrales = useMergedById("centrales_beton", effectiveCentraleId, centralesByChantier, "id, nom, ville");
  const { data: formulations = [], isLoading: isLoadingFormulations } = useFormulations(effectiveCentraleId || "");
  const { data: labos } = useLaboratoiresMobiles();

  const selectedCentrale = useMemo(
    () => centrales.find((centrale) => centrale.id === centraleId),
    [centrales, centraleId]
  );

  const selectedFormulation = useMemo(
    () => formulations.find((formulation) => formulation.id === formulationId),
    [formulations, formulationId]
  );

  // Get the responsable_id (technician) assigned to this chantier's lab
  const responsableId = useMemo(() => {
    if (!labos || !chantierId) return null;
    const labo = labos.find(l => l.chantier_id === chantierId);
    return labo?.responsable_id || null;
  }, [labos, chantierId]);

  // Initialize form with existing data
  useEffect(() => {
    if (existingEchantillon) {
      setCentraleId(existingEchantillon.centrale_id || "");
      setOuvrage(existingEchantillon.ouvrage || "");
      setDestinationBeton(existingEchantillon.destination_beton || "");
      setConditionCure(existingEchantillon.condition_cure || "standard");
      setDateCoulage(existingEchantillon.date_coulage ? parseISO(existingEchantillon.date_coulage) : undefined);
      setTypeEprouvette(existingEchantillon.type_eprouvette || "cube");
      setDimensionEprouvette(existingEchantillon.dimension_eprouvette || "15x15x15");
      setNombreEprouvettes(String(existingEchantillon.nombre_eprouvettes || 6));
      setConditionCure(existingEchantillon.condition_cure || "standard");
      setDateCoulage(existingEchantillon.date_coulage ? parseISO(existingEchantillon.date_coulage) : undefined);
      setTypeEprouvette(existingEchantillon.type_eprouvette || "cube");
      setDimensionEprouvette(existingEchantillon.dimension_eprouvette || "15x15x15");
      setNombreEprouvettes(String(existingEchantillon.nombre_eprouvettes || 6));
      setTemperatureBeton(existingEchantillon.temperature_beton?.toString() || "");
      setTemperatureAir(existingEchantillon.temperature_air?.toString() || "");
      setClasseConsistance(existingEchantillon.classe_consistance || "");
      setClasseResistance((existingEchantillon as { classe_resistance?: string }).classe_resistance || "");
      setModeCoulage(existingEchantillon.mode_coulage || "");
      setEssaiConvenance((existingEchantillon as { essai_convenance?: boolean }).essai_convenance || false);
      setEssaiConvenanceDetails((existingEchantillon as { essai_convenance_details?: string }).essai_convenance_details || "");
      setMentionEprouvettesLabo((existingEchantillon as { mention_eprouvettes_labo?: boolean }).mention_eprouvettes_labo ?? true);
      
      setEtuvage((existingEchantillon as any).etuvage || "non");
      
      // Parse jours_essai (jours + heures)
      const savedEcheances = existingEchantillon.jours_essai as EcheanceEssai[] | null;
      if (savedEcheances && Array.isArray(savedEcheances)) {
        const savedJours = savedEcheances.filter((e) => e.unite !== "heures");
        const savedHeures = savedEcheances.filter((e) => e.unite === "heures");
        const standardJours = [1, 3, 7, 14, 28];
        const standardHeures = [8, 10, 12, 16, 24];

        setJoursEssai(
          JOURS_ESSAI.map((j) => {
            const found = savedJours.find((sj) => sj.jour === j.value);
            return { jour: j.value, selected: !!found, nombre: found?.nombre || 0 };
          })
        );

        const autreJourData = savedJours.find((sj) => !standardJours.includes(sj.jour));
        if (autreJourData) {
          setAutreJourSelected(true);
          setAutreJour(String(autreJourData.jour));
          setAutreJourNombre(autreJourData.nombre);
        }

        setHeuresEssai(
          HEURES_ESSAI.map((h) => {
            const found = savedHeures.find((sh) => sh.heures === h.value);
            return { heure: h.value, selected: !!found, nombre: found?.nombre || 0 };
          })
        );

        const autreHeureData = savedHeures.find((sh) => !standardHeures.includes(sh.heures ?? 0));
        if (autreHeureData) {
          setAutreHeureSelected(true);
          setAutreHeure(String(autreHeureData.heures));
          setAutreHeureNombre(autreHeureData.nombre);
        }
      }

    }
  }, [existingEchantillon]);

  // Set formulationId after formulations are loaded
  useEffect(() => {
    if (existingEchantillon && !isLoadingFormulations && formulations.length > 0) {
      const savedFormulationId = existingEchantillon.formulation_id || "";
      if (savedFormulationId) {
        const formulationExists = formulations.some(f => f.id === savedFormulationId);
        if (formulationExists) {
          setFormulationId(savedFormulationId);
        }
      }
    }
  }, [existingEchantillon, formulations, isLoadingFormulations]);

  // Calculate total distributed
  const totalDistribue = useMemo(() => {
    const joursTotal = joursEssai.reduce((sum, j) => sum + (j.selected ? j.nombre : 0), 0);
    const autreTotal = autreJourSelected ? autreJourNombre : 0;
    const heuresTotal = heuresEssai.reduce((sum, h) => sum + (h.selected ? h.nombre : 0), 0);
    const autreHeureTotal = autreHeureSelected ? autreHeureNombre : 0;
    return joursTotal + autreTotal + heuresTotal + autreHeureTotal;
  }, [joursEssai, autreJourSelected, autreJourNombre, heuresEssai, autreHeureSelected, autreHeureNombre]);

  // Handle centrale change - reset formulation
  const handleCentraleChange = (value: string) => {
    setCentraleId(value === "none" ? "" : value);
    setFormulationId("");
  };

  // Handle jour essai toggle
  const handleJourToggle = (index: number, checked: boolean) => {
    setJoursEssai((prev) =>
      prev.map((j, i) => (i === index ? { ...j, selected: checked } : j))
    );
  };

  // Handle jour nombre change
  const handleJourNombreChange = (index: number, value: string) => {
    const nombre = parseInt(value) || 0;
    setJoursEssai((prev) =>
      prev.map((j, i) => (i === index ? { ...j, nombre } : j))
    );
  };

  const handleHeureToggle = (index: number, checked: boolean) => {
    setHeuresEssai((prev) => prev.map((h, i) => (i === index ? { ...h, selected: checked } : h)));
  };

  const handleHeureNombreChange = (index: number, value: string) => {
    const nombre = parseInt(value) || 0;
    setHeuresEssai((prev) => prev.map((h, i) => (i === index ? { ...h, nombre } : h)));
  };


  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const missingFields: string[] = [];
    if (!essaiConvenance && !ouvrage) missingFields.push("Ouvrage");
    if (!essaiConvenance && !destinationBeton) missingFields.push("Partie de l'ouvrage");
    if (!centraleId || centraleId === "none") missingFields.push("Centrale à béton");
    if (!formulationId) missingFields.push("Formulation");
    if (!classeConsistance || classeConsistance === "none") missingFields.push("Classe de consistance");
    if (!classeResistance || classeResistance === "none") missingFields.push("Classe de résistance");
    if (!modeCoulage || modeCoulage === "none") missingFields.push("Mode de coulage");
    if (!dateCoulage) missingFields.push("Date de coulage");
    if (!typeEprouvette) missingFields.push("Type d'éprouvette");
    if (!dimensionEprouvette) missingFields.push("Dimension");
    if (!nombreEprouvettes || parseInt(nombreEprouvettes) <= 0) missingFields.push("Nombre d'éprouvettes");

    if (missingFields.length > 0) {
      setShowError(true);
      toast.error(`Champs obligatoires manquants : ${missingFields.join(", ")}`);
      return;
    }

    // Validate eprouvette distribution
    const totalEprouvettes = parseInt(nombreEprouvettes) || 0;
    if (totalEprouvettes > 0 && totalDistribue !== totalEprouvettes) {
      toast.error(
        `Le nombre d'éprouvettes distribuées (${totalDistribue}) ne correspond pas au nombre total saisi (${totalEprouvettes})`
      );
      return;
    }

    // Prepare jours_essai data (jours + heures)
    const joursEssaiData: EcheanceEssai[] = [
      ...joursEssai.filter((j) => j.selected).map((j) => ({ jour: j.jour, nombre: j.nombre })),
      ...(autreJourSelected && autreJour ? [{ jour: parseInt(autreJour), nombre: autreJourNombre }] : []),
      ...heuresEssai
        .filter((h) => h.selected)
        .map((h) => ({ jour: h.heure / 24, nombre: h.nombre, unite: "heures", heures: h.heure })),
      ...(autreHeureSelected && autreHeure
        ? [{
            jour: parseInt(autreHeure) / 24,
            nombre: autreHeureNombre,
            unite: "heures",
            heures: parseInt(autreHeure),
          }]
        : []),
    ];


    const cleanValue = (v: string) => (!v || v === "none") ? null : v;

    const data = {
      chantier_id: chantierId!,
      client_id: chantier?.client_id || null,
      centrale_id: cleanValue(centraleId),
      formulation_id: cleanValue(formulationId),
      operateur_id: responsableId,
      ouvrage: essaiConvenance ? null : (ouvrage || null),
      destination_beton: essaiConvenance ? null : (destinationBeton || null),
      condition_cure: conditionCure,
      date_coulage: dateCoulage ? format(dateCoulage, "yyyy-MM-dd") : null,
      type_eprouvette: typeEprouvette,
      dimension_eprouvette: dimensionEprouvette || null,
      nombre_eprouvettes: parseInt(nombreEprouvettes) || 0,
      jours_essai: joursEssaiData,
      usage: essaiConvenance ? null : (destinationBeton || null),
      temperature_beton: temperatureBeton ? parseFloat(temperatureBeton) : null,
      temperature_air: temperatureAir ? parseFloat(temperatureAir) : null,
      classe_consistance: cleanValue(classeConsistance),
      classe_resistance: cleanValue(classeResistance),
      mode_coulage: cleanValue(modeCoulage),
      essai_convenance: essaiConvenance,
      essai_convenance_details: essaiConvenance ? (essaiConvenanceDetails || null) : null,
      mention_eprouvettes_labo: mentionEprouvettesLabo,
      etuvage: etuvage,
    };

    try {
      if (isEditMode && echantillonId) {
        const { error } = await supabase
          .from("echantillons_compression")
          .update({
            centrale_id: data.centrale_id,
            formulation_id: data.formulation_id,
            operateur_id: data.operateur_id,
            ouvrage: data.ouvrage,
            destination_beton: data.destination_beton,
            condition_cure: data.condition_cure,
            date_coulage: data.date_coulage,
            type_eprouvette: data.type_eprouvette,
            dimension_eprouvette: data.dimension_eprouvette,
            nombre_eprouvettes: data.nombre_eprouvettes,
            jours_essai: data.jours_essai,
            usage: data.usage,
            temperature_beton: data.temperature_beton,
            temperature_air: data.temperature_air,
            classe_consistance: data.classe_consistance,
            classe_resistance: data.classe_resistance,
            mode_coulage: data.mode_coulage,
            essai_convenance: data.essai_convenance,
            essai_convenance_details: data.essai_convenance_details,
            mention_eprouvettes_labo: data.mention_eprouvettes_labo,
            
            etuvage: data.etuvage,
          })
          .eq("id", echantillonId);
        if (error) throw error;
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["echantillons-chantier", chantierId] }),
          queryClient.invalidateQueries({ queryKey: ["echantillons-compression"] }),
          queryClient.invalidateQueries({ queryKey: ["echantillon-beton-frais"] }),
          queryClient.invalidateQueries({ queryKey: ["echantillon", echantillonId] }),
        ]);
        toast.success("Échantillon modifié avec succès");
      } else {
        await createEchantillon.mutateAsync(data);
        toast.success("Échantillon créé avec succès");
      }
      navigate(`/laboratoires-mobiles/chantier/${chantierId}`);
    } catch (error) {
      toast.error(isEditMode ? "Erreur lors de la modification" : "Erreur lors de la création");
    }
  };

  const isPending = createEchantillon.isPending;

  if (isLoadingChantier || isLoadingEchantillon || isDuplicateLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EssaiBreadcrumb items={[
        { label: "Laboratoires Mobiles", path: "/laboratoires-mobiles" },
        { label: chantier?.nom || "Chantier", path: `/laboratoires-mobiles/chantier/${chantierId}` },
        { label: isEditMode ? "Modifier échantillon" : "Nouvel échantillon" },
      ]} />

      {/* Header avec bouton retour */}
      <div className="flex items-start gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(`/laboratoires-mobiles/chantier/${chantierId}`)}
          className="h-10 w-10 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            {isEditMode ? "Modifier" : "Nouvel"} <span className="text-primary text-glow">Échantillon</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {chantier?.nom} - {client?.nom}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section Informations Générales */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Informations générales
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Client */}
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Input
                id="client"
                value={client?.nom || ""}
                disabled
                className="bg-muted/50"
              />
            </div>

            {/* Chantier */}
            <div className="space-y-2">
              <Label htmlFor="chantier">Chantier</Label>
              <Input
                id="chantier"
                value={chantier?.nom || ""}
                disabled
                className="bg-muted/50"
              />
            </div>

            {/* Date de coulage */}
            <div className="space-y-2">
              <Label>Date de coulage <span className="text-red-500">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-background",
                      !dateCoulage && "text-muted-foreground",
                      showError && !dateCoulage && "animate-border-blink"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateCoulage
                      ? format(dateCoulage, "PPP", { locale: fr })
                      : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateCoulage}
                    onSelect={setDateCoulage}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Centrale à béton */}
            <div className="space-y-2">
              <Label htmlFor="centrale">Centrale à béton <span className="text-red-500">*</span></Label>
              <Select key={`centrale-${centraleId}-${centrales.map((c) => c.id).join("|")}`} value={centraleId} onValueChange={handleCentraleChange} disabled={isLoadingCentrales}>
                <SelectTrigger className={cn(showError && !centraleId && "animate-border-blink")}>
                  <SelectValue placeholder="Sélectionnez une centrale">
                    {selectedCentrale?.nom}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {centrales.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">Aucune centrale affectée à ce chantier</div>
                  ) : (
                    centrales.map((centrale) => (
                      <SelectItem key={centrale.id} value={centrale.id}>
                        {centrale.nom}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Formulation de béton */}
            <div className="space-y-2">
              <Label htmlFor="formulation">Formulation de béton <span className="text-red-500">*</span></Label>
              <Select
                key={`formulation-${formulationId}-${formulations.map((f) => f.id).join("|")}`}
                value={formulationId}
                onValueChange={setFormulationId}
                disabled={!centraleId}
              >
                <SelectTrigger className={cn(showError && !formulationId && "animate-border-blink")}>
                  <SelectValue
                    placeholder={
                      centraleId
                        ? "Sélectionnez une formulation"
                        : "Sélectionnez d'abord une centrale"
                    }
                  >
                    {selectedFormulation?.nom}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {formulations.map((form) => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ouvrage */}
            <div className="space-y-2">
              <Label htmlFor="ouvrage">Ouvrage <span className="text-red-500">*</span></Label>
              <Input
                id="ouvrage"
                value={ouvrage}
                onChange={(e) => setOuvrage(e.target.value)}
                placeholder="Ex: Bâtiment A, Pont, Tunnel..."
                className={cn("bg-background", essaiConvenance && "opacity-50", showError && !essaiConvenance && !ouvrage && "animate-border-blink")}
                disabled={essaiConvenance}
              />
            </div>

            {/* Partie de l'ouvrage */}
            <div className="space-y-2">
              <Label htmlFor="destination">Partie de l'ouvrage <span className="text-red-500">*</span></Label>
              <Input
                id="destination"
                value={destinationBeton}
                onChange={(e) => setDestinationBeton(e.target.value)}
                placeholder="Ex: Dalle, Poteau, Fondation..."
                className={cn("bg-background", essaiConvenance && "opacity-50", showError && !essaiConvenance && !destinationBeton && "animate-border-blink")}
                disabled={essaiConvenance}
              />
            </div>

            {/* Essai de convenance */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="essai_convenance" 
                  checked={essaiConvenance}
                  onCheckedChange={(checked) => setEssaiConvenance(checked === true)}
                />
                <Label htmlFor="essai_convenance" className="cursor-pointer">
                  Essai de convenance
                </Label>
              </div>
              {essaiConvenance && (
                <Input
                  id="essai_convenance_details"
                  value={essaiConvenanceDetails}
                  onChange={(e) => setEssaiConvenanceDetails(e.target.value)}
                  placeholder="Détails de l'essai de convenance..."
                  className="bg-background mt-2"
                />
              )}
            </div>

            {/* Mention éprouvettes confectionnées par le laboratoire */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mention_eprouvettes_labo"
                  checked={mentionEprouvettesLabo}
                  onCheckedChange={(checked) => setMentionEprouvettesLabo(checked === true)}
                />
                <Label htmlFor="mention_eprouvettes_labo" className="cursor-pointer">
                  Éprouvettes confectionnées par le laboratoire comme essai de convenance
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Section Caractéristiques de l'essai */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Caractéristiques de l'essai
            </h2>
            <div className="text-sm text-muted-foreground">
              Total distribué: <span className="font-semibold text-foreground">{totalDistribue}</span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Classe de résistance */}
            <div className="space-y-2">
              <Label htmlFor="classeResistance">Classe de résistance <span className="text-red-500">*</span></Label>
              <Select value={classeResistance} onValueChange={setClasseResistance}>
                <SelectTrigger className={cn(showError && !classeResistance && "animate-border-blink")}>
                  <SelectValue placeholder="Sélectionnez une classe" />
                </SelectTrigger>
                <SelectContent>
                  {CLASSES_RESISTANCE.map((classe) => (
                    <SelectItem key={classe.value} value={classe.value}>
                      {classe.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Classe de consistance */}
            <div className="space-y-2">
              <Label htmlFor="classeConsistance">Classe de consistance (Slump) <span className="text-red-500">*</span></Label>
              <Select value={classeConsistance} onValueChange={setClasseConsistance}>
                <SelectTrigger className={cn(showError && !classeConsistance && "animate-border-blink")}>
                  <SelectValue placeholder="Sélectionnez une classe" />
                </SelectTrigger>
                <SelectContent>
                  {CLASSES_CONSISTANCE.map((classe) => (
                    <SelectItem key={classe.value} value={classe.value}>
                      {classe.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type d'éprouvette */}
            <div className="space-y-2">
              <Label htmlFor="type">Type d'éprouvette <span className="text-red-500">*</span></Label>
              <Select value={typeEprouvette} onValueChange={(value) => {
                setTypeEprouvette(value);
                // Reset dimension when type changes
                const dims = DIMENSIONS_EPROUVETTE[value as keyof typeof DIMENSIONS_EPROUVETTE];
                if (dims && dims.length > 0) {
                  setDimensionEprouvette(dims[0].value);
                }
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES_EPROUVETTE.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dimension d'éprouvette */}
            <div className="space-y-2">
              <Label htmlFor="dimension">Dimension <span className="text-red-500">*</span></Label>
              <Select value={dimensionEprouvette} onValueChange={setDimensionEprouvette}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez la dimension" />
                </SelectTrigger>
                <SelectContent>
                  {(DIMENSIONS_EPROUVETTE[typeEprouvette as keyof typeof DIMENSIONS_EPROUVETTE] || []).map(
                    (dim) => (
                      <SelectItem key={dim.value} value={dim.value}>
                        {dim.label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Nombre d'éprouvettes */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre d'éprouvettes <span className="text-red-500">*</span></Label>
              <Input
                id="nombre"
                type="number"
                min="1"
                value={nombreEprouvettes}
                onChange={(e) => setNombreEprouvettes(e.target.value)}
                placeholder="Ex: 6"
                className={cn("bg-background", showError && (!nombreEprouvettes || parseInt(nombreEprouvettes) <= 0) && "animate-border-blink")}
              />
            </div>

            {/* Mode de coulage */}
            <div className="space-y-2">
              <Label htmlFor="modeCoulage">Mode de coulage <span className="text-red-500">*</span></Label>
              <Select value={modeCoulage} onValueChange={setModeCoulage}>
                <SelectTrigger className={cn(showError && !modeCoulage && "animate-border-blink")}>
                  <SelectValue placeholder="Sélectionnez le mode" />
                </SelectTrigger>
                <SelectContent>
                  {MODES_COULAGE.map((mode) => (
                    <SelectItem key={mode.value} value={mode.value}>
                      {mode.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Étuvage */}
            <div className="space-y-2">
              <Label htmlFor="etuvage">Étuvage <span className="text-red-500">*</span></Label>
              <Select value={etuvage} onValueChange={setEtuvage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oui">Oui</SelectItem>
                  <SelectItem value="non">Non</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Température béton */}
            <div className="space-y-2">
              <Label htmlFor="temperatureBeton">Température béton (°C)</Label>
              <Input
                id="temperatureBeton"
                type="number"
                step="0.1"
                value={temperatureBeton}
                onChange={(e) => setTemperatureBeton(e.target.value)}
                placeholder="Ex: 22.5"
                className="bg-background"
              />
            </div>

            {/* Température air */}
            <div className="space-y-2">
              <Label htmlFor="temperatureAir">Température air (°C)</Label>
              <Input
                id="temperatureAir"
                type="number"
                step="0.1"
                value={temperatureAir}
                onChange={(e) => setTemperatureAir(e.target.value)}
                placeholder="Ex: 25.0"
                className="bg-background"
              />
            </div>
          </div>

        </div>

        {/* Section Échéances d'essai */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Échéances d'essai
            </h2>
            <div className="text-sm text-muted-foreground">
              Total distribué: <span className="font-semibold text-foreground">{totalDistribue}</span>
            </div>
          </div>

          <div className="space-y-4">


            <Tabs defaultValue="jours" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="jours">Jours d'essai</TabsTrigger>
                <TabsTrigger value="heures">Heures d'essai</TabsTrigger>
              </TabsList>

              <TabsContent value="jours" className="space-y-3 mt-4">
                {JOURS_ESSAI.map((jour, index) => (
                  <div
                    key={jour.value}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-background"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`jour-${jour.value}`}
                        checked={joursEssai[index].selected}
                        onCheckedChange={(checked) =>
                          handleJourToggle(index, checked as boolean)
                        }
                        className="border-primary data-[state=checked]:bg-primary"
                      />
                      <Label
                        htmlFor={`jour-${jour.value}`}
                        className={cn(
                          "cursor-pointer",
                          joursEssai[index].selected
                            ? "text-primary font-medium"
                            : "text-foreground"
                        )}
                      >
                        {jour.label}
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">Nombre:</span>
                      <Input
                        type="number"
                        min="0"
                        value={joursEssai[index].nombre}
                        onChange={(e) => handleJourNombreChange(index, e.target.value)}
                        className="w-20 h-8 bg-muted/50 text-center"
                        disabled={!joursEssai[index].selected}
                      />
                    </div>
                  </div>
                ))}

                {/* Autre jour */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-background">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="jour-autre"
                      checked={autreJourSelected}
                      onCheckedChange={(checked) => setAutreJourSelected(checked as boolean)}
                      className="border-primary data-[state=checked]:bg-primary"
                    />
                    <Label htmlFor="jour-autre" className="cursor-pointer text-foreground">
                      Autre:
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={autreJour}
                      onChange={(e) => setAutreJour(e.target.value)}
                      placeholder="jours"
                      className="w-20 h-8 bg-muted/50 text-center"
                      disabled={!autreJourSelected}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">Nombre:</span>
                    <Input
                      type="number"
                      min="0"
                      value={autreJourNombre}
                      onChange={(e) => setAutreJourNombre(parseInt(e.target.value) || 0)}
                      className="w-20 h-8 bg-muted/50 text-center"
                      disabled={!autreJourSelected}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="heures" className="space-y-3 mt-4">
                {HEURES_ESSAI.map((heure, index) => (
                  <div
                    key={heure.value}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-background"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`heure-${heure.value}`}
                        checked={heuresEssai[index].selected}
                        onCheckedChange={(checked) => handleHeureToggle(index, checked as boolean)}
                        className="border-primary data-[state=checked]:bg-primary"
                      />
                      <Label
                        htmlFor={`heure-${heure.value}`}
                        className={cn(
                          "cursor-pointer",
                          heuresEssai[index].selected ? "text-primary font-medium" : "text-foreground"
                        )}
                      >
                        {heure.label}
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">Nombre:</span>
                      <Input
                        type="number"
                        min="0"
                        value={heuresEssai[index].nombre}
                        onChange={(e) => handleHeureNombreChange(index, e.target.value)}
                        className="w-20 h-8 bg-muted/50 text-center"
                        disabled={!heuresEssai[index].selected}
                      />
                    </div>
                  </div>
                ))}

                {/* Autre heure */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-background">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="heure-autre"
                      checked={autreHeureSelected}
                      onCheckedChange={(checked) => setAutreHeureSelected(checked as boolean)}
                      className="border-primary data-[state=checked]:bg-primary"
                    />
                    <Label htmlFor="heure-autre" className="cursor-pointer text-foreground">
                      Autre:
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={autreHeure}
                      onChange={(e) => setAutreHeure(e.target.value)}
                      placeholder="heures"
                      className="w-20 h-8 bg-muted/50 text-center"
                      disabled={!autreHeureSelected}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">Nombre:</span>
                    <Input
                      type="number"
                      min="0"
                      value={autreHeureNombre}
                      onChange={(e) => setAutreHeureNombre(parseInt(e.target.value) || 0)}
                      className="w-20 h-8 bg-muted/50 text-center"
                      disabled={!autreHeureSelected}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>


            {/* Validation alert */}
            {parseInt(nombreEprouvettes) > 0 && totalDistribue !== parseInt(nombreEprouvettes) && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Le nombre d'éprouvettes distribuées ({totalDistribue}) ne correspond pas au nombre total saisi ({nombreEprouvettes}).
                  Veuillez ajuster la répartition avant d'enregistrer.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>


        {/* Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/laboratoires-mobiles/chantier/${chantierId}`)}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isPending} className="flex items-center gap-2">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEditMode ? "Enregistrer les modifications" : "Créer l'échantillon"}
          </Button>
        </div>
      </form>
    </div>
  );
}
