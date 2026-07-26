import { useState, useMemo, useEffect, useRef } from "react";
import { useDuplicateSource } from "@/hooks/useDuplicateEssai";
import { mergeDuplicateData } from "@/lib/duplicate-utils";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useClients } from "@/hooks/useClients";
import { useChantiersByClient } from "@/hooks/useChantiers";
import { useIntervenants } from "@/hooks/useIntervenants";
import { useCentralesForSample } from "@/hooks/useChantierCentrales";
import { useFormulations } from "@/hooks/useFormulations";
import { useCreateEchantillonCompression, useUpdateEchantillonCompression } from "@/hooks/useEchantillonsCompression";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { logEchantillonHistory, getChangedFields } from "@/hooks/useHistoriqueEchantillons";
import { useTechnicianOperateurLock } from "@/hooks/useTechnicianOperateurLock";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

const ValidationMessage = ({ show, message }: { show: boolean; message: string }) => {
  if (!show) return null;
  return (
    <p className="text-red-700 text-sm flex items-center gap-1 mt-1">
      <AlertCircle className="w-4 h-4" />
      {message}
    </p>
  );
};

const CompressionSampleForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  
  const createEchantillon = useCreateEchantillonCompression();
  const updateEchantillon = useUpdateEchantillonCompression();
  const { duplicateSource } = useDuplicateSource<any>("echantillons_compression");

  // Fetch existing echantillon for edit mode
  const { data: editEchantillon, isLoading: isLoadingEchantillon } = useQuery({
    queryKey: ["echantillon-compression", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("echantillons_compression")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Source data: edit data when editing, duplicate source when duplicating
  const existingEchantillon = isEditMode ? editEchantillon : duplicateSource;

  // Form state
  const [clientId, setClientId] = useState("");
  const [chantierId, setChantierId] = useState("");
  const [operateurId, setOperateurId] = useState("");
  const { isLocked: isOperateurLocked } = useTechnicianOperateurLock(operateurId, setOperateurId);
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
  const [temperatureBeton, setTemperatureBeton] = useState("");
  const [temperatureAir, setTemperatureAir] = useState("");
  const [classeConsistance, setClasseConsistance] = useState("");
  const [classeResistance, setClasseResistance] = useState("");
  const [modeCoulage, setModeCoulage] = useState("");
  const [essaiConvenance, setEssaiConvenance] = useState(false);
  const [essaiConvenanceDetails, setEssaiConvenanceDetails] = useState("");
  const [mentionInfoClient, setMentionInfoClient] = useState(false);
  const [mentionEprouvetteClient, setMentionEprouvetteClient] = useState(false);
  
  const [etuvage, setEtuvage] = useState("non");
  const [submitted, setSubmitted] = useState(false);

  const editInitialized = useRef(false);

  // Use existingEchantillon values directly for dependent hooks before state is initialized
  const effectiveClientId = (!editInitialized.current && existingEchantillon?.client_id) ? existingEchantillon.client_id : clientId;
  const effectiveChantierId = (!editInitialized.current && existingEchantillon?.chantier_id) ? existingEchantillon.chantier_id : chantierId;
  const effectiveCentraleId = (!editInitialized.current && existingEchantillon?.centrale_id) ? existingEchantillon.centrale_id : centraleId;

  // Data fetching
  const { data: clients = [], isLoading: isLoadingClients } = useClients();
  const { data: chantiers = [], isLoading: isLoadingChantiers } = useChantiersByClient(effectiveClientId);
  const { data: intervenants = [], isLoading: isLoadingIntervenants } = useIntervenants();
  const { data: centralesFromClient = [], isLoading: isLoadingCentrales } = useCentralesForSample(effectiveClientId, effectiveChantierId);
  const { data: formulationsFromCentrale = [], isLoading: isLoadingFormulations } = useFormulations(effectiveCentraleId);

  // Fallback: load existing centrale/formulation by id (in case they aren't linked to current client/centrale)
  const existingCentraleId = existingEchantillon?.centrale_id || null;
  const existingFormulationId = existingEchantillon?.formulation_id || null;

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

  // Merge existing centrale/formulation into select lists if missing
  const mergeExistingCentrale = !chantierId || chantierId === existingEchantillon?.chantier_id;
  const centrales = useMemo(() => {
    const list = [...centralesFromClient];
    if (mergeExistingCentrale && existingCentrale && !list.some((c) => c.id === existingCentrale.id)) {
      list.push(existingCentrale as any);
    }
    return list;
  }, [centralesFromClient, existingCentrale, mergeExistingCentrale]);

  const formulations = useMemo(() => {
    const list = [...formulationsFromCentrale];
    if (existingFormulation && !list.some((f) => f.id === existingFormulation.id)) {
      list.push(existingFormulation as any);
    }
    return list;
  }, [formulationsFromCentrale, existingFormulation]);

  // Initialize all form fields when editing (single consolidated effect)
  useEffect(() => {
    if (existingEchantillon && !editInitialized.current) {
      editInitialized.current = true;
      setClientId(existingEchantillon.client_id || "");
      setCentraleId(existingEchantillon.centrale_id || "");
      setOperateurId(existingEchantillon.operateur_id || "");
      setOuvrage(existingEchantillon.ouvrage || "");
      setDestinationBeton(existingEchantillon.destination_beton || "");
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
      setMentionInfoClient((existingEchantillon as { mention_info_client?: boolean }).mention_info_client || false);
      setMentionEprouvetteClient((existingEchantillon as { mention_eprouvette_client?: boolean }).mention_eprouvette_client || false);
      setEtuvage((existingEchantillon as any).etuvage || "non");
      
      // Parse jours_essai
      const savedJours = existingEchantillon.jours_essai as Array<{ jour: number; nombre: number }> | null;
      if (savedJours && Array.isArray(savedJours)) {
        const standardJours = [1, 3, 7, 14, 28];
        const updatedJoursEssai = JOURS_ESSAI.map((j) => {
          const found = savedJours.find((sj) => sj.jour === j.value);
          return {
            jour: j.value,
            selected: !!found,
            nombre: found?.nombre || 0,
          };
        });
        setJoursEssai(updatedJoursEssai);
        
        const autreJourData = savedJours.find((sj) => !standardJours.includes(sj.jour));
        if (autreJourData) {
          setAutreJourSelected(true);
          setAutreJour(String(autreJourData.jour));
          setAutreJourNombre(autreJourData.nombre);
        }
      }
    }
  }, [existingEchantillon]);

  // Set chantierId after chantiers are loaded
  useEffect(() => {
    if (existingEchantillon && !isLoadingChantiers && chantiers.length > 0 && !chantierId) {
      const savedChantierId = existingEchantillon.chantier_id || "";
      if (savedChantierId && chantiers.some(c => c.id === savedChantierId)) {
        setChantierId(savedChantierId);
      }
    }
  }, [existingEchantillon, chantiers, isLoadingChantiers]);

  // Set formulationId after formulations are loaded
  useEffect(() => {
    if (existingEchantillon && !isLoadingFormulations && formulations.length > 0 && !formulationId) {
      const savedFormulationId = existingEchantillon.formulation_id || "";
      if (savedFormulationId && formulations.some(f => f.id === savedFormulationId)) {
        setFormulationId(savedFormulationId);
      }
    }
  }, [existingEchantillon, formulations, isLoadingFormulations]);

  // Filter techniciens by poste name or role
  const techniciens = useMemo(() => {
    return intervenants.filter((i) => {
      const posteName = i.postes?.nom?.toUpperCase() || "";
      const role = (i.role || "").toUpperCase();
      return posteName.includes("TECHNICIEN") || role.includes("TECHNICIEN");
    });
  }, [intervenants]);

  // Calculate total distributed
  const totalDistribue = useMemo(() => {
    const joursTotal = joursEssai.reduce((sum, j) => sum + (j.selected ? j.nombre : 0), 0);
    const autreTotal = autreJourSelected ? autreJourNombre : 0;
    const heuresTotal = heuresEssai.reduce((sum, h) => sum + (h.selected ? h.nombre : 0), 0);
    const autreHeureTotal = autreHeureSelected ? autreHeureNombre : 0;
    return joursTotal + autreTotal + heuresTotal + autreHeureTotal;
  }, [joursEssai, autreJourSelected, autreJourNombre, heuresEssai, autreHeureSelected, autreHeureNombre]);

  const handleHeureToggle = (index: number, checked: boolean) => {
    setHeuresEssai((prev) => prev.map((h, i) => (i === index ? { ...h, selected: checked } : h)));
  };

  const handleHeureNombreChange = (index: number, value: string) => {
    const nombre = parseInt(value) || 0;
    setHeuresEssai((prev) => prev.map((h, i) => (i === index ? { ...h, nombre } : h)));
  };


  // Handle client change - reset chantier
  const handleClientChange = (value: string) => {
    setClientId(value);
    setChantierId("");
    setCentraleId("");
    setFormulationId("");
  };

  // Handle centrale change - reset formulation
  const handleCentraleChange = (value: string) => {
    setCentraleId(value);
    setFormulationId("");
  };

  const handleChantierChange = (value: string) => {
    setChantierId(value);
    setCentraleId("");
    setFormulationId("");
  };

  // Handle type eprouvette change - reset dimension
  const handleTypeEprouvetteChange = (value: string) => {
    setTypeEprouvette(value);
    setDimensionEprouvette("");
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

  // Validation check
  const hasValidationErrors = () => {
    const requiredFields = [
      { value: clientId, label: "Client" },
      { value: chantierId, label: "Chantier" },
      { value: operateurId, label: "Technicien" },
      { value: centraleId, label: "Centrale" },
      { value: formulationId, label: "Formulation" },
      { value: classeConsistance, label: "Classe de consistance" },
      { value: classeResistance, label: "Classe de résistance" },
      { value: typeEprouvette, label: "Type d'éprouvette" },
      { value: dimensionEprouvette, label: "Dimension" },
      { value: nombreEprouvettes, label: "Nombre d'éprouvettes" },
      { value: modeCoulage, label: "Mode de coulage" },
    ];

    if (!essaiConvenance) {
      requiredFields.push(
        { value: ouvrage, label: "Ouvrage" },
        { value: destinationBeton, label: "Partie de l'ouvrage" }
      );
    }

    const missing = requiredFields.filter(f => !f.value);
    if (!dateCoulage) missing.push({ value: "", label: "Date de coulage" });

    return missing.length > 0;
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (hasValidationErrors()) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    // Validate that distributed count matches total
    const totalEprouvettes = parseInt(nombreEprouvettes) || 0;
    if (totalDistribue !== totalEprouvettes) {
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


    const data = {
      client_id: clientId || null,
      chantier_id: chantierId || null,
      centrale_id: centraleId || null,
      formulation_id: formulationId || null,
      operateur_id: operateurId || null,
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
      classe_consistance: classeConsistance || null,
      classe_resistance: classeResistance || null,
      mode_coulage: modeCoulage || null,
      essai_convenance: essaiConvenance,
      essai_convenance_details: essaiConvenance ? (essaiConvenanceDetails || null) : null,
      mention_info_client: mentionInfoClient,
      mention_eprouvette_client: mentionEprouvetteClient,
      
      etuvage: etuvage,
    };

    try {
      if (isEditMode && id) {
        // Get old values for history
        const oldValues = existingEchantillon ? {
          client_id: existingEchantillon.client_id,
          chantier_id: existingEchantillon.chantier_id,
          centrale_id: existingEchantillon.centrale_id,
          formulation_id: existingEchantillon.formulation_id,
          operateur_id: existingEchantillon.operateur_id,
          ouvrage: existingEchantillon.ouvrage,
          destination_beton: existingEchantillon.destination_beton,
          condition_cure: existingEchantillon.condition_cure,
          date_coulage: existingEchantillon.date_coulage,
          type_eprouvette: existingEchantillon.type_eprouvette,
          dimension_eprouvette: existingEchantillon.dimension_eprouvette,
          nombre_eprouvettes: existingEchantillon.nombre_eprouvettes,
          jours_essai: existingEchantillon.jours_essai,
          temperature_beton: existingEchantillon.temperature_beton,
          temperature_air: existingEchantillon.temperature_air,
          classe_consistance: existingEchantillon.classe_consistance,
          mode_coulage: existingEchantillon.mode_coulage,
        } : {};

        const changes = getChangedFields(oldValues as Record<string, unknown>, data as Record<string, unknown>);
        
        await updateEchantillon.mutateAsync({ id, ...data });
        
        // Log modification history
        if (Object.keys(changes).length > 0) {
          await logEchantillonHistory(id, "modification", "Utilisateur", { modifications: changes });
        }
        
        toast.success("Échantillon modifié avec succès");
      } else {
        const createPayload = mergeDuplicateData(data, duplicateSource);
        const result = await createEchantillon.mutateAsync(createPayload);
        
        // Log creation history
        if (result?.id) {
          await logEchantillonHistory(result.id, "creation", "Utilisateur", { donnees_initiales: data });
        }
        
        toast.success("Échantillon créé avec succès");
      }
      navigate("/essais/beton/beton-durci/compression");
    } catch (error) {
      toast.error(isEditMode ? "Erreur lors de la modification" : "Erreur lors de la création de l'échantillon");
    }
  };

  const isPending = createEchantillon.isPending || updateEchantillon.isPending;

  if (isLoadingEchantillon) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EssaiBreadcrumb 
        items={[
          { label: "Béton", path: "/essais/beton" },
          { label: "Béton Durci", path: "/essais/beton/beton-durci" },
          { label: "Compression", path: "/essais/beton/beton-durci/compression" },
          { label: isEditMode ? "Modifier" : "Nouveau" }
        ]} 
      />
      
      {/* Header avec bouton retour */}
      <div className="flex items-start gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/essais/beton/beton-durci/compression")}
          className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            {isEditMode ? "Modifier" : "Nouvel"} <span className="text-primary text-glow">Échantillon</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Essai de Résistance à la Compression
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
                <Label htmlFor="client">Client <span className="text-red-700">*</span></Label>
                <Select value={clientId} onValueChange={handleClientChange}>
                  <SelectTrigger className={cn(submitted && !clientId && "border-red-700")}>
                    <SelectValue placeholder="Sélectionnez un client" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-[300px] overflow-y-auto bg-popover">
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ValidationMessage show={submitted && !clientId} message="Ce champ est obligatoire" />
              </div>

              {/* Chantier */}
              <div className="space-y-2">
                <Label htmlFor="chantier">Chantier <span className="text-red-700">*</span></Label>
                <Select
                  value={chantierId}
                  onValueChange={handleChantierChange}
                  disabled={!clientId}
                >
                  <SelectTrigger className={cn(submitted && !chantierId && "border-red-700")}>
                    <SelectValue
                      placeholder={
                        clientId
                          ? "Sélectionnez un chantier"
                          : "Sélectionnez d'abord un client"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {chantiers.map((chantier) => (
                      <SelectItem key={chantier.id} value={chantier.id}>
                        {chantier.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ValidationMessage show={submitted && !chantierId} message="Ce champ est obligatoire" />
              </div>

              {/* Date de coulage */}
              <div className="space-y-2">
                <Label>Date de coulage <span className="text-red-700">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background",
                        !dateCoulage && "text-muted-foreground",
                        submitted && !dateCoulage && "border-red-700"
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
                <ValidationMessage show={submitted && !dateCoulage} message="Ce champ est obligatoire" />
              </div>

              {/* Centrale à béton */}
              <div className="space-y-2">
                <Label htmlFor="centrale">Centrale à béton <span className="text-red-700">*</span></Label>
                <Select value={centraleId} onValueChange={handleCentraleChange} disabled={!chantierId || isLoadingCentrales}>
                  <SelectTrigger className={cn(submitted && !centraleId && "border-red-700")}>
                    <SelectValue placeholder={chantierId ? "Sélectionnez une centrale" : "Sélectionnez d'abord un chantier"} />
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
                <ValidationMessage show={submitted && !centraleId} message="Ce champ est obligatoire" />
              </div>

              {/* Formulation de béton */}
              <div className="space-y-2">
                <Label htmlFor="formulation">Formulation de béton <span className="text-red-700">*</span></Label>
                <Select
                  value={formulationId}
                  onValueChange={setFormulationId}
                  disabled={!centraleId}
                >
                  <SelectTrigger className={cn(submitted && !formulationId && "border-red-700")}>
                    <SelectValue
                      placeholder={
                        centraleId
                          ? "Sélectionnez une formulation"
                          : "Sélectionnez d'abord une centrale"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {formulations.map((form) => (
                      <SelectItem key={form.id} value={form.id}>
                        {form.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ValidationMessage show={submitted && !formulationId} message="Ce champ est obligatoire" />
              </div>

              {/* Ouvrage */}
              <div className="space-y-2">
                <Label htmlFor="ouvrage">Ouvrage <span className="text-red-700">*</span></Label>
                <Input
                  id="ouvrage"
                  value={ouvrage}
                  onChange={(e) => setOuvrage(e.target.value)}
                  placeholder="Ex: Bâtiment A, Pont, Tunnel..."
                  className={cn("bg-background", submitted && !essaiConvenance && !ouvrage && "border-red-700")}
                  disabled={essaiConvenance}
                />
                <ValidationMessage show={submitted && !essaiConvenance && !ouvrage} message="Ce champ est obligatoire" />
              </div>

              {/* Partie de l'ouvrage */}
              <div className="space-y-2">
                <Label htmlFor="destination">Partie de l'ouvrage <span className="text-red-700">*</span></Label>
                <Input
                  id="destination"
                  value={destinationBeton}
                  onChange={(e) => setDestinationBeton(e.target.value)}
                  placeholder="Ex: Dalle, Poteau, Fondation..."
                  className={cn("bg-background", submitted && !essaiConvenance && !destinationBeton && "border-red-700")}
                  disabled={essaiConvenance}
                />
                <ValidationMessage show={submitted && !essaiConvenance && !destinationBeton} message="Ce champ est obligatoire" />
              </div>

              {/* Technicien */}
              <div className="space-y-2">
                <Label htmlFor="operateur">Technicien <span className="text-red-700">*</span></Label>
                <Select value={operateurId} onValueChange={setOperateurId} disabled={isOperateurLocked}>
                  <SelectTrigger className={cn(submitted && !operateurId && "border-red-700")}>
                    <SelectValue placeholder="Sélectionnez un technicien" />
                  </SelectTrigger>
                  <SelectContent>
                    {techniciens.map((op) => (
                      <SelectItem key={op.id} value={op.id}>
                        {op.prenom} {op.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ValidationMessage show={submitted && !operateurId} message="Ce champ est obligatoire" />
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
            </div>
          </div>

          {/* Section Caractéristiques de l'essai */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Caractéristiques de l'essai
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Classe de résistance */}
              <div className="space-y-2">
                <Label htmlFor="classeResistance">Classe de résistance <span className="text-red-700">*</span></Label>
                <Select value={classeResistance} onValueChange={setClasseResistance}>
                  <SelectTrigger className={cn(submitted && !classeResistance && "border-red-700")}>
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
                <ValidationMessage show={submitted && !classeResistance} message="Ce champ est obligatoire" />
              </div>

              {/* Classe de consistance */}
              <div className="space-y-2">
                <Label htmlFor="classeConsistance">Classe de consistance (Slump) <span className="text-red-700">*</span></Label>
                <Select value={classeConsistance} onValueChange={setClasseConsistance}>
                  <SelectTrigger className={cn(submitted && !classeConsistance && "border-red-700")}>
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
                <ValidationMessage show={submitted && !classeConsistance} message="Ce champ est obligatoire" />
              </div>

              {/* Type d'éprouvette */}
              <div className="space-y-2">
                <Label htmlFor="type">Type d'éprouvette <span className="text-red-700">*</span></Label>
                <Select value={typeEprouvette} onValueChange={(value) => {
                  setTypeEprouvette(value);
                  const dims = DIMENSIONS_EPROUVETTE[value as keyof typeof DIMENSIONS_EPROUVETTE];
                  if (dims && dims.length > 0) {
                    setDimensionEprouvette(dims[0].value);
                  }
                }}>
                  <SelectTrigger className={cn(submitted && !typeEprouvette && "border-red-700")}>
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
                <ValidationMessage show={submitted && !typeEprouvette} message="Ce champ est obligatoire" />
              </div>

              {/* Dimension d'éprouvette */}
              <div className="space-y-2">
                <Label htmlFor="dimension">Dimension <span className="text-red-700">*</span></Label>
                <Select value={dimensionEprouvette} onValueChange={setDimensionEprouvette}>
                  <SelectTrigger className={cn(submitted && !dimensionEprouvette && "border-red-700")}>
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
                <ValidationMessage show={submitted && !dimensionEprouvette} message="Ce champ est obligatoire" />
              </div>

              {/* Nombre d'éprouvettes */}
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre d'éprouvettes <span className="text-red-700">*</span></Label>
                <Input
                  id="nombre"
                  type="number"
                  min="1"
                  value={nombreEprouvettes}
                  onChange={(e) => setNombreEprouvettes(e.target.value)}
                  placeholder="Ex: 6"
                  className={cn("bg-background", submitted && !nombreEprouvettes && "border-red-700")}
                />
                <ValidationMessage show={submitted && !nombreEprouvettes} message="Ce champ est obligatoire" />
              </div>

              {/* Mode de coulage */}
              <div className="space-y-2">
                <Label htmlFor="modeCoulage">Mode de coulage <span className="text-red-700">*</span></Label>
                <Select value={modeCoulage} onValueChange={setModeCoulage}>
                  <SelectTrigger className={cn(submitted && !modeCoulage && "border-red-700")}>
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
                <ValidationMessage show={submitted && !modeCoulage} message="Ce champ est obligatoire" />
              </div>

              {/* Étuvage */}
              <div className="space-y-2">
                <Label htmlFor="etuvage">Étuvage</Label>
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

              {/* Condition de cure */}
              <div className="space-y-2">
                <Label htmlFor="condition">Condition de cure</Label>
                <Select value={conditionCure} onValueChange={setConditionCure}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS_CURE.map((cond) => (
                      <SelectItem key={cond.value} value={cond.value}>
                        {cond.label}
                      </SelectItem>
                    ))}
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

              {/* Mentions rapport */}
              <div className="space-y-3 md:col-span-2">
                <p className="text-sm font-medium text-foreground">Mentions à afficher sur le rapport :</p>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="mention_info_client"
                    checked={mentionInfoClient}
                    onCheckedChange={(checked) => setMentionInfoClient(checked === true)}
                  />
                  <Label htmlFor="mention_info_client" className="cursor-pointer text-sm">
                    Informations fournies par le client
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="mention_eprouvette_client"
                    checked={mentionEprouvetteClient}
                    onCheckedChange={(checked) => setMentionEprouvetteClient(checked === true)}
                  />
                  <Label htmlFor="mention_eprouvette_client" className="cursor-pointer text-sm">
                    Éprouvette confectionnée par le client
                  </Label>
                </div>
              </div>
            </div>
          </div>


          {/* Section Informations Techniques */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                Informations Techniques
              </h2>
              <div className="text-sm text-muted-foreground">
                Total distribué: <span className="font-semibold text-foreground">{totalDistribue}</span>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-muted-foreground">Échéances d'essai</Label>

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
              onClick={() => navigate("/essais/beton/beton-durci/compression")}
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
};

export default CompressionSampleForm;
