import { useState, useMemo, useEffect } from "react";
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
import { useCentralesByClient } from "@/hooks/useCentralesByClient";
import { useFormulations } from "@/hooks/useFormulations";
import { 
  useCreateEchantillonTractionFendage, 
  useUpdateEchantillonTractionFendage,
  useEchantillonTractionFendageById 
} from "@/hooks/useEchantillonsTractionFendage";
import { useMergedById } from "@/hooks/useExistingDropdownEntities";
import { useTechnicianOperateurLock } from "@/hooks/useTechnicianOperateurLock";
import { toast } from "sonner";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CONDITIONS_CURE = [
  { value: "standard", label: "Cure standard (20°C, 95% HR)" },
  { value: "acceleree", label: "Cure accélérée" },
  { value: "chantier", label: "Cure chantier" },
];

const DIMENSIONS_EPROUVETTE = [
  { value: "16x32", label: "Cylindrique 16×32" },
  { value: "11x22", label: "Cylindrique 11×22" },
  { value: "15x30", label: "Cylindrique 15×30" },
];

const JOURS_ESSAI = [
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

const TractionFendageSampleForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  
  const createEchantillon = useCreateEchantillonTractionFendage();
  const updateEchantillon = useUpdateEchantillonTractionFendage();
  const { data: existingEchantillon, isLoading: isLoadingEchantillon } = useEchantillonTractionFendageById(id);

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
  const [dimensionEprouvette, setDimensionEprouvette] = useState("16x32");
  const [nombreEprouvettes, setNombreEprouvettes] = useState("3");
  const [joursEssai, setJoursEssai] = useState<JourEssai[]>(
    JOURS_ESSAI.map((j) => ({ 
      jour: j.value, 
      selected: j.value === 28, 
      nombre: j.value === 28 ? 3 : 0 
    }))
  );
  const [temperatureBeton, setTemperatureBeton] = useState("");
  const [temperatureAir, setTemperatureAir] = useState("");
  const [classeConsistance, setClasseConsistance] = useState("");
  const [classeResistance, setClasseResistance] = useState("");
  const [essaiConvenance, setEssaiConvenance] = useState(false);
  const [essaiConvenanceDetails, setEssaiConvenanceDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Initialize clientId and centraleId first for dependent hooks
  useEffect(() => {
    if (existingEchantillon) {
      setClientId(existingEchantillon.client_id || "");
      setCentraleId(existingEchantillon.centrale_id || "");
    }
  }, [existingEchantillon]);

  // Data fetching
  const { data: clients } = useClients();
  const { data: chantiersBase, isLoading: chantiersLoading } = useChantiersByClient(clientId);
  const { data: intervenants } = useIntervenants();
  const { data: centralesBase } = useCentralesByClient(clientId);
  const { data: formulationsBase, isLoading: formulationsLoading } = useFormulations(centraleId);

  const centrales = useMergedById("centrales_beton", existingEchantillon?.centrale_id, centralesBase as any);
  const formulations = useMergedById("formulations", existingEchantillon?.formulation_id, formulationsBase as any);
  const chantiers = useMergedById("chantiers", existingEchantillon?.chantier_id, chantiersBase as any);

  // Second effect: Set dependent data after lists are loaded
  useEffect(() => {
    if (existingEchantillon && !chantiersLoading && !formulationsLoading) {
      setChantierId(existingEchantillon.chantier_id || "");
      setFormulationId(existingEchantillon.formulation_id || "");
      setOperateurId(existingEchantillon.operateur_id || "");
      setOuvrage(existingEchantillon.ouvrage || "");
      setDestinationBeton(existingEchantillon.destination_beton || "");
      setConditionCure(existingEchantillon.condition_cure || "standard");
      setDimensionEprouvette(existingEchantillon.dimension_eprouvette || "16x32");
      setNombreEprouvettes(String(existingEchantillon.nombre_eprouvettes || 3));
      setTemperatureBeton(existingEchantillon.temperature_beton?.toString() || "");
      setTemperatureAir(existingEchantillon.temperature_air?.toString() || "");
      setClasseConsistance(existingEchantillon.classe_consistance || "");
      setClasseResistance((existingEchantillon as any).classe_resistance || "");
      setEssaiConvenance(existingEchantillon.essai_convenance || false);
      setEssaiConvenanceDetails(existingEchantillon.essai_convenance_details || "");
      
      if (existingEchantillon.date_coulage) {
        setDateCoulage(parseISO(existingEchantillon.date_coulage));
      }
      
      // Parse jours_essai if exists
      if (existingEchantillon.jours_essai && Array.isArray(existingEchantillon.jours_essai)) {
        const savedJours = existingEchantillon.jours_essai as Array<{ jour: number; nombre: number }>;
        setJoursEssai(
          JOURS_ESSAI.map((j) => {
            const found = savedJours.find((s) => s.jour === j.value);
            return {
              jour: j.value,
              selected: !!found,
              nombre: found?.nombre || 0,
            };
          })
        );
      }
    }
  }, [existingEchantillon, chantiersLoading, formulationsLoading]);

  // Calculate total specimens
  const totalEprouvettes = useMemo(() => {
    return joursEssai.filter((j) => j.selected).reduce((sum, j) => sum + j.nombre, 0);
  }, [joursEssai]);

  const handleJourToggle = (jour: number, checked: boolean) => {
    setJoursEssai((prev) =>
      prev.map((j) =>
        j.jour === jour
          ? { ...j, selected: checked, nombre: checked ? 3 : 0 }
          : j
      )
    );
  };

  const handleNombreChange = (jour: number, nombre: number) => {
    setJoursEssai((prev) =>
      prev.map((j) => (j.jour === jour ? { ...j, nombre: Math.max(0, nombre) } : j))
    );
  };

  const handleSubmit = async () => {
    setSubmitted(true);

    if (!clientId || !chantierId || !centraleId || !dateCoulage || !operateurId || !formulationId || !classeConsistance || !classeResistance || !dimensionEprouvette || (!essaiConvenance && (!ouvrage || !destinationBeton))) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const selectedJours = joursEssai
      .filter((j) => j.selected && j.nombre > 0)
      .map((j) => ({ jour: j.jour, nombre: j.nombre }));

    if (selectedJours.length === 0) {
      toast.error("Veuillez sélectionner au moins un jour d'essai");
      return;
    }

    const data = {
      client_id: clientId,
      chantier_id: chantierId,
      centrale_id: centraleId,
      formulation_id: formulationId || null,
      operateur_id: operateurId || null,
      ouvrage: essaiConvenance ? null : (ouvrage || null),
      destination_beton: essaiConvenance ? null : (destinationBeton || null),
      condition_cure: conditionCure,
      type_eprouvette: "cylindre",
      dimension_eprouvette: dimensionEprouvette,
      nombre_eprouvettes: totalEprouvettes,
      jours_essai: selectedJours,
      date_coulage: format(dateCoulage, "yyyy-MM-dd"),
      temperature_beton: temperatureBeton ? parseFloat(temperatureBeton) : null,
      temperature_air: temperatureAir ? parseFloat(temperatureAir) : null,
      classe_consistance: classeConsistance || null,
      classe_resistance: classeResistance || null,
      essai_convenance: essaiConvenance,
      essai_convenance_details: essaiConvenance ? essaiConvenanceDetails : null,
    };

    try {
      if (isEditMode && id) {
        await updateEchantillon.mutateAsync({ id, ...data });
        toast.success("Échantillon modifié avec succès");
      } else {
        await createEchantillon.mutateAsync(data);
        toast.success("Échantillon créé avec succès");
      }
      navigate("/essais/beton/beton-durci/traction-fendage");
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  if (isEditMode && isLoadingEchantillon) {
    return (
      <div className="flex items-center justify-center h-64">
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
          { label: "Traction par Fendage", path: "/essais/beton/beton-durci/traction-fendage" },
          { label: isEditMode ? "Modifier" : "Nouveau" }
        ]} 
      />

      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/essais/beton/beton-durci/traction-fendage")}
          className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-display font-bold text-foreground">
          {isEditMode ? (
            <>Modifier <span className="text-primary">TF-{String(existingEchantillon?.numero).padStart(3, "0")}</span></>
          ) : (
            <>Nouvel Échantillon <span className="text-primary">Traction par Fendage</span></>
          )}
        </h1>
      </div>

      {/* Form */}
      <div className="space-y-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Informations Générales</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Client */}
            <div className="space-y-2">
              <Label>Client <span className="text-red-700">*</span></Label>
              <Select value={clientId} onValueChange={(v) => { setClientId(v); setChantierId(""); setCentraleId(""); setFormulationId(""); }}>
                <SelectTrigger className={cn(submitted && !clientId && "border-red-700")}>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
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
              <Label>Chantier <span className="text-red-700">*</span></Label>
              <Select 
                value={chantierId} 
                onValueChange={setChantierId}
                disabled={!clientId || chantiersLoading}
              >
                <SelectTrigger className={cn(submitted && !chantierId && "border-red-700")}>
                  <SelectValue placeholder="Sélectionner un chantier" />
                </SelectTrigger>
                <SelectContent>
                  {chantiers?.map((chantier) => (
                    <SelectItem key={chantier.id} value={chantier.id}>
                      {chantier.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ValidationMessage show={submitted && !chantierId} message="Ce champ est obligatoire" />
            </div>

            {/* Essai de convenance */}
            <div className="flex items-center space-x-3 p-4 border rounded-md">
              <Checkbox
                id="essai_convenance"
                checked={essaiConvenance}
                onCheckedChange={(checked) => setEssaiConvenance(checked as boolean)}
              />
              <Label htmlFor="essai_convenance">Essai de convenance</Label>
            </div>

            {/* Convenance details */}
            {essaiConvenance && (
              <div className="space-y-2 lg:col-span-2">
                <Label>Détails de l'essai de convenance</Label>
                <Input 
                  value={essaiConvenanceDetails}
                  onChange={(e) => setEssaiConvenanceDetails(e.target.value)}
                  placeholder="Détails de l'essai de convenance..."
                />
              </div>
            )}

            {/* Ouvrage */}
            <div className="space-y-2">
              <Label>Ouvrage <span className="text-red-700">*</span></Label>
              <Input 
                value={ouvrage}
                onChange={(e) => setOuvrage(e.target.value)}
                placeholder="Nom de l'ouvrage..."
                disabled={essaiConvenance}
                className={cn(essaiConvenance ? "opacity-50" : "", submitted && !essaiConvenance && !ouvrage && "border-red-700")}
              />
              <ValidationMessage show={submitted && !essaiConvenance && !ouvrage} message="Ce champ est obligatoire" />
            </div>

            {/* Partie de l'ouvrage */}
            <div className="space-y-2">
              <Label>Partie de l'ouvrage <span className="text-red-700">*</span></Label>
              <Input 
                value={destinationBeton}
                onChange={(e) => setDestinationBeton(e.target.value)}
                placeholder="Partie de l'ouvrage..."
                disabled={essaiConvenance}
                className={cn(essaiConvenance ? "opacity-50" : "", submitted && !essaiConvenance && !destinationBeton && "border-red-700")}
              />
              <ValidationMessage show={submitted && !essaiConvenance && !destinationBeton} message="Ce champ est obligatoire" />
            </div>

            {/* Centrale */}
            <div className="space-y-2">
              <Label>Centrale à Béton <span className="text-red-700">*</span></Label>
              <Select value={centraleId} onValueChange={setCentraleId}>
                <SelectTrigger className={cn(submitted && !centraleId && "border-red-700")}>
                  <SelectValue placeholder="Sélectionner une centrale" />
                </SelectTrigger>
                <SelectContent>
                  {centrales?.map((centrale) => (
                    <SelectItem key={centrale.id} value={centrale.id}>
                      {centrale.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ValidationMessage show={submitted && !centraleId} message="Ce champ est obligatoire" />
            </div>

            {/* Formulation */}
            <div className="space-y-2">
              <Label>Formulation <span className="text-red-700">*</span></Label>
              <Select 
                value={formulationId} 
                onValueChange={setFormulationId}
                disabled={!centraleId || formulationsLoading}
              >
                <SelectTrigger className={cn(submitted && !formulationId && "border-red-700")}>
                  <SelectValue placeholder="Sélectionner une formulation" />
                </SelectTrigger>
                <SelectContent>
                  {formulations?.map((formulation) => (
                    <SelectItem key={formulation.id} value={formulation.id}>
                      {formulation.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ValidationMessage show={submitted && !formulationId} message="Ce champ est obligatoire" />
            </div>

            {/* Opérateur */}
            <div className="space-y-2">
              <Label>Technicien <span className="text-red-700">*</span></Label>
              <Select value={operateurId} onValueChange={setOperateurId} disabled={isOperateurLocked}>
                <SelectTrigger className={cn(submitted && !operateurId && "border-red-700")}>
                  <SelectValue placeholder="Sélectionner un technicien" />
                </SelectTrigger>
                <SelectContent>
                  {intervenants?.map((intervenant) => (
                    <SelectItem key={intervenant.id} value={intervenant.id}>
                      {intervenant.prenom} {intervenant.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ValidationMessage show={submitted && !operateurId} message="Ce champ est obligatoire" />
            </div>

            {/* Date de coulage */}
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
                    {dateCoulage ? format(dateCoulage, "PPP", { locale: fr }) : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateCoulage}
                    onSelect={setDateCoulage}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
              <ValidationMessage show={submitted && !dateCoulage} message="Ce champ est obligatoire" />
            </div>
          </CardContent>
        </Card>

        {/* Caractéristiques de l'essai */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Caractéristiques de l'Essai</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Condition de cure */}
            <div className="space-y-2">
              <Label>Condition de cure</Label>
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

            {/* Dimension éprouvette */}
            <div className="space-y-2">
              <Label>Dimension éprouvette <span className="text-red-700">*</span></Label>
              <Select value={dimensionEprouvette} onValueChange={setDimensionEprouvette}>
                <SelectTrigger className={cn(submitted && !dimensionEprouvette && "border-red-700")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIMENSIONS_EPROUVETTE.map((dim) => (
                    <SelectItem key={dim.value} value={dim.value}>
                      {dim.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ValidationMessage show={submitted && !dimensionEprouvette} message="Ce champ est obligatoire" />
            </div>

            {/* Classe de consistance */}
            <div className="space-y-2">
              <Label>Classe de consistance (Slump) <span className="text-red-700">*</span></Label>
              <Select value={classeConsistance} onValueChange={setClasseConsistance}>
                <SelectTrigger className={cn(submitted && !classeConsistance && "border-red-700")}>
                  <SelectValue placeholder="Sélectionner" />
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

            {/* Classe de résistance */}
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

            {/* Température béton */}
            <div className="space-y-2">
              <Label>Température béton (°C)</Label>
              <Input 
                type="number"
                value={temperatureBeton}
                onChange={(e) => setTemperatureBeton(e.target.value)}
                placeholder="Ex: 22"
              />
            </div>

            {/* Température air */}
            <div className="space-y-2">
              <Label>Température air (°C)</Label>
              <Input 
                type="number"
                value={temperatureAir}
                onChange={(e) => setTemperatureAir(e.target.value)}
                placeholder="Ex: 25"
              />
            </div>
          </CardContent>
        </Card>

        {/* Jours d'essai */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Jours d'Essai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {joursEssai.map((jour) => (
                <div key={jour.jour} className="flex items-center gap-4 p-3 border rounded-md">
                  <Checkbox
                    id={`jour-${jour.jour}`}
                    checked={jour.selected}
                    onCheckedChange={(checked) => handleJourToggle(jour.jour, checked as boolean)}
                  />
                  <Label htmlFor={`jour-${jour.jour}`} className="flex-1">
                    {jour.jour} jours
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={jour.nombre}
                    onChange={(e) => handleNombreChange(jour.jour, parseInt(e.target.value) || 0)}
                    className="w-20"
                    disabled={!jour.selected}
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total éprouvettes:</span>
                <span className="text-xl font-bold text-primary">{totalEprouvettes}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/essais/beton/beton-durci/traction-fendage")}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createEchantillon.isPending || updateEchantillon.isPending}
          >
            {(createEchantillon.isPending || updateEchantillon.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Save className="mr-2 h-4 w-4" />
            {isEditMode ? "Enregistrer" : "Créer l'échantillon"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TractionFendageSampleForm;
