import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
import { useCentralesByClient } from "@/hooks/useCentralesByClient";
import { useFormulations } from "@/hooks/useFormulations";
import {
  useEchantillonModuleElasticiteById,
  useCreateEchantillonModuleElasticite,
  useUpdateEchantillonModuleElasticite,
} from "@/hooks/useEchantillonsModuleElasticite";
import { useDuplicateSource } from "@/hooks/useDuplicateEssai";
import { useMergedById } from "@/hooks/useExistingDropdownEntities";
import { useTechnicianOperateurLock } from "@/hooks/useTechnicianOperateurLock";
import { toast } from "sonner";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CONDITIONS_CURE = [
  { value: "standard", label: "Cure standard (20°C, 95% HR)" },
  { value: "acceleree", label: "Cure accélérée" },
  { value: "chantier", label: "Cure chantier" },
];

const TYPES_EPROUVETTE = [
  { value: "cylindre", label: "Cylindre" },
];

const DIMENSIONS_EPROUVETTE = {
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
  "C12/15", "C16/20", "C20/25", "C25/30", "C30/37", "C35/45",
  "C40/50", "C45/55", "C50/60", "C55/67", "C60/75", "C70/85",
  "C80/95", "C90/105", "C100/115",
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

const ModuleElasticiteSampleForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id && id !== "nouveau";

  const { data: existingEchantillon, isLoading: isLoadingEchantillon } = useEchantillonModuleElasticiteById(
    isEditMode ? id : undefined
  );
  const createEchantillon = useCreateEchantillonModuleElasticite();
  const updateEchantillon = useUpdateEchantillonModuleElasticite();

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
  const [typeEprouvette, setTypeEprouvette] = useState("cylindre");
  const [dimensionEprouvette, setDimensionEprouvette] = useState("16x32");
  const [nombreEprouvettes, setNombreEprouvettes] = useState("6");
  const [joursEssai, setJoursEssai] = useState<JourEssai[]>(
    JOURS_ESSAI.map((j) => ({ 
      jour: j.value, 
      selected: j.value === 28, 
      nombre: j.value === 28 ? 3 : 0 
    }))
  );
  const [autreJour, setAutreJour] = useState("");
  const [autreJourNombre, setAutreJourNombre] = useState(0);
  const [autreJourSelected, setAutreJourSelected] = useState(false);
  const [temperatureBeton, setTemperatureBeton] = useState("");
  const [temperatureAir, setTemperatureAir] = useState("");
  const [classeConsistance, setClasseConsistance] = useState("");
  const [classeResistance, setClasseResistance] = useState("");
  const [essaiConvenance, setEssaiConvenance] = useState(false);
  const [essaiConvenanceDetails, setEssaiConvenanceDetails] = useState("");
  const [observations, setObservations] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Initialize clientId and centraleId first for dependent hooks
  useEffect(() => {
    if (existingEchantillon) {
      setClientId(existingEchantillon.client_id || "");
      setCentraleId(existingEchantillon.centrale_id || "");
    }
  }, [existingEchantillon]);

  // Data fetching
  const { data: clients = [], isLoading: isLoadingClients } = useClients();
  const { data: chantiersBase = [], isLoading: isLoadingChantiers } = useChantiersByClient(clientId);
  const { data: intervenants = [], isLoading: isLoadingIntervenants } = useIntervenants();
  const { data: centralesBase = [], isLoading: isLoadingCentrales } = useCentralesByClient(clientId);
  const { data: formulationsBase = [], isLoading: isLoadingFormulations } = useFormulations(centraleId);

  const centrales = useMergedById("centrales_beton", existingEchantillon?.centrale_id, centralesBase as any);
  const formulations = useMergedById("formulations", existingEchantillon?.formulation_id, formulationsBase as any);
  const chantiers = useMergedById("chantiers", existingEchantillon?.chantier_id, chantiersBase as any);

  // Populate remaining form fields when editing
  useEffect(() => {
    if (existingEchantillon) {
      setOperateurId(existingEchantillon.operateur_id || "");
      setOuvrage(existingEchantillon.ouvrage || "");
      setDestinationBeton(existingEchantillon.destination_beton || "");
      setConditionCure(existingEchantillon.condition_cure || "standard");
      setDateCoulage(existingEchantillon.date_coulage ? parseISO(existingEchantillon.date_coulage) : undefined);
      setTypeEprouvette(existingEchantillon.type_eprouvette || "cylindre");
      setDimensionEprouvette(existingEchantillon.dimension_eprouvette || "16x32");
      setNombreEprouvettes(String(existingEchantillon.nombre_eprouvettes || 6));
      setTemperatureBeton(existingEchantillon.temperature_beton?.toString() || "");
      setTemperatureAir(existingEchantillon.temperature_air?.toString() || "");
      setClasseConsistance(existingEchantillon.classe_consistance || "");
      setClasseResistance((existingEchantillon as any).classe_resistance || "");
      setEssaiConvenance(existingEchantillon.essai_convenance || false);
      setEssaiConvenanceDetails(existingEchantillon.essai_convenance_details || "");
      setObservations(existingEchantillon.observations || "");
      
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
    if (existingEchantillon && !isLoadingChantiers && chantiers.length > 0) {
      const savedChantierId = existingEchantillon.chantier_id || "";
      if (savedChantierId) {
        const chantierExists = chantiers.some(c => c.id === savedChantierId);
        if (chantierExists) {
          setChantierId(savedChantierId);
        }
      }
    }
  }, [existingEchantillon, chantiers, isLoadingChantiers]);

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

  // Filter techniciens by poste name
  const techniciens = useMemo(() => {
    return intervenants.filter((i) => 
      i.postes?.nom?.toUpperCase() === "TECHNICIEN"
    );
  }, [intervenants]);

  // Calculate total distributed
  const totalDistribue = useMemo(() => {
    const joursTotal = joursEssai.reduce((sum, j) => sum + (j.selected ? j.nombre : 0), 0);
    const autreTotal = autreJourSelected ? autreJourNombre : 0;
    return joursTotal + autreTotal;
  }, [joursEssai, autreJourSelected, autreJourNombre]);

  // Handle client change
  const handleClientChange = (value: string) => {
    setClientId(value);
    setChantierId("");
    setCentraleId("");
    setFormulationId("");
  };

  // Handle centrale change
  const handleCentraleChange = (value: string) => {
    setCentraleId(value);
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

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!clientId || !chantierId || !operateurId || !centraleId || !formulationId || !classeConsistance || !classeResistance || !typeEprouvette || !dimensionEprouvette || !nombreEprouvettes || !dateCoulage || (!essaiConvenance && (!ouvrage || !destinationBeton))) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const totalEprouvettes = parseInt(nombreEprouvettes) || 0;
    if (totalDistribue !== totalEprouvettes) {
      toast.error(
        `Le nombre d'éprouvettes distribuées (${totalDistribue}) ne correspond pas au nombre total saisi (${totalEprouvettes})`
      );
      return;
    }

    const joursEssaiData = [
      ...joursEssai.filter((j) => j.selected).map((j) => ({ jour: j.jour, nombre: j.nombre })),
      ...(autreJourSelected && autreJour ? [{ jour: parseInt(autreJour), nombre: autreJourNombre }] : []),
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
      temperature_beton: temperatureBeton ? parseFloat(temperatureBeton) : null,
      temperature_air: temperatureAir ? parseFloat(temperatureAir) : null,
      classe_consistance: classeConsistance || null,
      classe_resistance: classeResistance || null,
      essai_convenance: essaiConvenance,
      essai_convenance_details: essaiConvenance ? (essaiConvenanceDetails || null) : null,
      observations: observations || null,
    };

    try {
      if (isEditMode && id) {
        await updateEchantillon.mutateAsync({ id, ...data });
        toast.success("Échantillon modifié avec succès");
      } else {
        await createEchantillon.mutateAsync(data);
        toast.success("Échantillon créé avec succès");
      }
      navigate("/essais/beton/beton-durci/module-elasticite");
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
          { label: "Module d'Élasticité", path: "/essais/beton/beton-durci/module-elasticite" },
          { label: isEditMode ? "Modifier" : "Nouveau" }
        ]} 
      />
      
      <div className="flex items-start gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/essais/beton/beton-durci/module-elasticite")}
          className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            {isEditMode ? "Modifier" : "Nouvel"} <span className="text-primary text-glow">Échantillon</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Module d'Élasticité - NF EN 12390-13
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section Informations Générales */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Informations générales de l'échantillon
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client">Client <span className="text-red-700">*</span></Label>
              <Select value={clientId} onValueChange={handleClientChange}>
                <SelectTrigger className={cn(submitted && !clientId && "border-red-700")}>
                  <SelectValue placeholder="Sélectionnez un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ValidationMessage show={submitted && !clientId} message="Ce champ est obligatoire" />
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="chantier">Chantier <span className="text-red-700">*</span></Label>
              <Select 
                value={chantierId} 
                onValueChange={setChantierId}
                disabled={!clientId}
              >
                <SelectTrigger className={cn(submitted && !chantierId && "border-red-700")}>
                  <SelectValue placeholder={clientId ? "Sélectionnez un chantier" : "Sélectionnez d'abord un client"} />
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

            <div className="space-y-2">
              <Label htmlFor="centrale">Centrale à Béton <span className="text-red-700">*</span></Label>
              <Select value={centraleId} onValueChange={handleCentraleChange}>
                <SelectTrigger className={cn(submitted && !centraleId && "border-red-700")}>
                  <SelectValue placeholder="Sélectionnez une centrale" />
                </SelectTrigger>
                <SelectContent>
                  {centrales.map((centrale) => (
                    <SelectItem key={centrale.id} value={centrale.id}>
                      {centrale.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ValidationMessage show={submitted && !centraleId} message="Ce champ est obligatoire" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="formulation">Formulation <span className="text-red-700">*</span></Label>
              <Select 
                value={formulationId} 
                onValueChange={setFormulationId}
                disabled={!centraleId}
              >
                <SelectTrigger className={cn(submitted && !formulationId && "border-red-700")}>
                  <SelectValue placeholder={centraleId ? "Sélectionnez une formulation" : "Sélectionnez d'abord une centrale"} />
                </SelectTrigger>
                <SelectContent>
                  {formulations.map((formulation) => (
                    <SelectItem key={formulation.id} value={formulation.id}>
                      {formulation.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ValidationMessage show={submitted && !formulationId} message="Ce champ est obligatoire" />
            </div>

            <div className="space-y-2">
              <Label>Date de coulage <span className="text-red-700">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateCoulage && "text-muted-foreground",
                      submitted && !dateCoulage && "border-red-700"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateCoulage ? format(dateCoulage, "dd/MM/yyyy", { locale: fr }) : "Sélectionnez une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateCoulage}
                    onSelect={setDateCoulage}
                    locale={fr}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <ValidationMessage show={submitted && !dateCoulage} message="Ce champ est obligatoire" />
            </div>
          </div>
        </div>

        {/* Section Identification de l'Ouvrage */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Identification de l'ouvrage
          </h2>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="essai_convenance"
                checked={essaiConvenance}
                onCheckedChange={(checked) => setEssaiConvenance(checked === true)}
              />
              <Label htmlFor="essai_convenance">Essai de convenance</Label>
            </div>

            {essaiConvenance && (
              <div className="space-y-2">
                <Label htmlFor="essai_convenance_details">Détails de l'essai de convenance</Label>
                <Textarea
                  id="essai_convenance_details"
                  value={essaiConvenanceDetails}
                  onChange={(e) => setEssaiConvenanceDetails(e.target.value)}
                  placeholder="Décrivez les détails de l'essai de convenance..."
                />
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ouvrage">Ouvrage <span className="text-red-700">*</span></Label>
                <Input
                  id="ouvrage"
                  value={ouvrage}
                  onChange={(e) => setOuvrage(e.target.value)}
                  placeholder="Nom de l'ouvrage"
                  disabled={essaiConvenance}
                  className={cn(essaiConvenance ? "opacity-50" : "", submitted && !essaiConvenance && !ouvrage && "border-red-700")}
                />
                <ValidationMessage show={submitted && !essaiConvenance && !ouvrage} message="Ce champ est obligatoire" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination_beton">Partie de l'ouvrage <span className="text-red-700">*</span></Label>
                <Input
                  id="destination_beton"
                  value={destinationBeton}
                  onChange={(e) => setDestinationBeton(e.target.value)}
                  placeholder="Partie concernée"
                  disabled={essaiConvenance}
                  className={cn(essaiConvenance ? "opacity-50" : "", submitted && !essaiConvenance && !destinationBeton && "border-red-700")}
                />
                <ValidationMessage show={submitted && !essaiConvenance && !destinationBeton} message="Ce champ est obligatoire" />
              </div>
            </div>
          </div>
        </div>

        {/* Section Caractéristiques Techniques */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Caractéristiques techniques
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="condition_cure">Condition de cure</Label>
              <Select value={conditionCure} onValueChange={setConditionCure}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS_CURE.map((condition) => (
                    <SelectItem key={condition.value} value={condition.value}>
                      {condition.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type_eprouvette">Type d'éprouvette <span className="text-red-700">*</span></Label>
              <Select value={typeEprouvette} onValueChange={setTypeEprouvette}>
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

            <div className="space-y-2">
              <Label htmlFor="dimension_eprouvette">Dimension <span className="text-red-700">*</span></Label>
              <Select value={dimensionEprouvette} onValueChange={setDimensionEprouvette}>
                <SelectTrigger className={cn(submitted && !dimensionEprouvette && "border-red-700")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIMENSIONS_EPROUVETTE.cylindre.map((dim) => (
                    <SelectItem key={dim.value} value={dim.value}>
                      {dim.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ValidationMessage show={submitted && !dimensionEprouvette} message="Ce champ est obligatoire" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="classe_consistance">Classe de consistance (Slump) <span className="text-red-700">*</span></Label>
              <Select value={classeConsistance} onValueChange={setClasseConsistance}>
                <SelectTrigger className={cn(submitted && !classeConsistance && "border-red-700")}>
                  <SelectValue placeholder="Sélectionnez" />
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

            <div className="space-y-2">
              <Label>Classe de résistance <span className="text-red-700">*</span></Label>
              <Select value={classeResistance} onValueChange={setClasseResistance}>
                <SelectTrigger className={cn(submitted && !classeResistance && "border-red-700")}>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {CLASSES_RESISTANCE.map((classe) => (
                    <SelectItem key={classe} value={classe}>
                      {classe}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ValidationMessage show={submitted && !classeResistance} message="Ce champ est obligatoire" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature_beton">Température béton (°C)</Label>
              <Input
                id="temperature_beton"
                type="number"
                step="0.1"
                value={temperatureBeton}
                onChange={(e) => setTemperatureBeton(e.target.value)}
                placeholder="Ex: 22.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature_air">Température air (°C)</Label>
              <Input
                id="temperature_air"
                type="number"
                step="0.1"
                value={temperatureAir}
                onChange={(e) => setTemperatureAir(e.target.value)}
                placeholder="Ex: 25.0"
              />
            </div>
          </div>
        </div>

        {/* Section Éprouvettes et Jours d'Essai */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Éprouvettes et jours d'essai
          </h2>

          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre_eprouvettes">Nombre total d'éprouvettes <span className="text-red-700">*</span></Label>
                <Input
                  id="nombre_eprouvettes"
                  type="number"
                  min="1"
                  value={nombreEprouvettes}
                  onChange={(e) => setNombreEprouvettes(e.target.value)}
                  className={cn(submitted && !nombreEprouvettes && "border-red-700")}
                />
                <ValidationMessage show={submitted && !nombreEprouvettes} message="Ce champ est obligatoire" />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Répartition par jour d'essai</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {joursEssai.map((jour, index) => (
                  <div key={jour.jour} className="flex flex-col space-y-2 p-3 border border-border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`jour-${jour.jour}`}
                        checked={jour.selected}
                        onCheckedChange={(checked) => handleJourToggle(index, checked === true)}
                      />
                      <Label htmlFor={`jour-${jour.jour}`} className="text-sm font-medium">
                        {JOURS_ESSAI[index].label}
                      </Label>
                    </div>
                    {jour.selected && (
                      <Input
                        type="number"
                        min="0"
                        value={jour.nombre}
                        onChange={(e) => handleJourNombreChange(index, e.target.value)}
                        className="h-8"
                        placeholder="Nombre"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Autre jour */}
              <div className="flex flex-col space-y-2 p-3 border border-border rounded-lg max-w-xs">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autre-jour"
                    checked={autreJourSelected}
                    onCheckedChange={(checked) => setAutreJourSelected(checked === true)}
                  />
                  <Label htmlFor="autre-jour" className="text-sm font-medium">
                    Autre jour
                  </Label>
                </div>
                {autreJourSelected && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={autreJour}
                      onChange={(e) => setAutreJour(e.target.value)}
                      className="h-8"
                      placeholder="Jour"
                    />
                    <Input
                      type="number"
                      min="0"
                      value={autreJourNombre}
                      onChange={(e) => setAutreJourNombre(parseInt(e.target.value) || 0)}
                      className="h-8"
                      placeholder="Nombre"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Validation */}
            {parseInt(nombreEprouvettes) > 0 && totalDistribue !== parseInt(nombreEprouvettes) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Le nombre d'éprouvettes distribuées ({totalDistribue}) ne correspond pas au nombre total ({nombreEprouvettes}).
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Section Observations */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Observations
          </h2>
          <Textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Observations supplémentaires..."
            rows={3}
          />
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/essais/beton/beton-durci/module-elasticite")}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditMode ? "Modifier" : "Enregistrer"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ModuleElasticiteSampleForm;
