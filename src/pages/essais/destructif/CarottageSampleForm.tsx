import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, CalendarIcon, Save, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";
import { useChantiersByClient } from "@/hooks/useChantiers";
import { useIntervenants } from "@/hooks/useIntervenants";
import { useCreateEchantillonCarottage, useUpdateEchantillonCarottage, useEchantillonCarottage } from "@/hooks/useEchantillonsCarottage";
import { useTechnicianOperateurLock } from "@/hooks/useTechnicianOperateurLock";
import { useDuplicateSource } from "@/hooks/useDuplicateEssai";
import { toast } from "sonner";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

const DIAMETRES = [
  { value: "50", label: "Ø 50 mm" },
  { value: "75", label: "Ø 75 mm" },
  { value: "100", label: "Ø 100 mm" },
  { value: "150", label: "Ø 150 mm" },
];

const DIRECTIONS = [
  { value: "verticale", label: "Verticale" },
  { value: "horizontale", label: "Horizontale" },
  { value: "inclinee", label: "Inclinée" },
];

const ETATS_SURFACE = [
  { value: "bon", label: "Bon état" },
  { value: "fissure", label: "Fissuré" },
  { value: "degrade", label: "Dégradé" },
  { value: "mouille", label: "Mouillé" },
];

const CLASSES_RESISTANCE = [
  "C12/15", "C16/20", "C20/25", "C25/30", "C30/37", "C35/45", "C40/50", "C45/55", "C50/60",
];

const CarottageSampleForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const { data: existingData, isLoading: loadingExisting } = useEchantillonCarottage(id || "");
  const { duplicateSource, isDuplicateLoading } = useDuplicateSource<any>("echantillons_carottage");
  const { data: clients } = useClients();
  const { data: intervenants } = useIntervenants();
  const createMutation = useCreateEchantillonCarottage();
  const updateMutation = useUpdateEchantillonCarottage();

  const [clientId, setClientId] = useState<string>("");
  const [chantierId, setChantierId] = useState<string>("");
  const [operateurId, setOperateurId] = useState<string>("");
  const { isLocked: isOperateurLocked } = useTechnicianOperateurLock(operateurId, setOperateurId);
  const [datePrelevement, setDatePrelevement] = useState<Date>(new Date());
  const [ouvrage, setOuvrage] = useState("");
  const [partieOuvrage, setPartieOuvrage] = useState("");
  const [localisation, setLocalisation] = useState("");
  const [diametreCarotte, setDiametreCarotte] = useState("");
  const [longueurCarotte, setLongueurCarotte] = useState("");
  const [directionCarottage, setDirectionCarottage] = useState("");
  const [presenceArmatures, setPresenceArmatures] = useState(false);
  const [etatSurface, setEtatSurface] = useState("");
  const [classeResistance, setClasseResistance] = useState("");
  const [observations, setObservations] = useState("");

  const { data: chantiers } = useChantiersByClient(clientId);

  useEffect(() => {
    const sourceData = isEditing ? existingData : duplicateSource;
    if (sourceData) {
      setClientId(sourceData.client_id || "");
      setChantierId(sourceData.chantier_id || "");
      setOperateurId(sourceData.operateur_id || "");
      if (sourceData.date_prelevement) setDatePrelevement(parseISO(sourceData.date_prelevement));
      setOuvrage(sourceData.ouvrage || "");
      setPartieOuvrage(sourceData.partie_ouvrage || "");
      setLocalisation(sourceData.localisation || "");
      setDiametreCarotte(sourceData.diametre_carotte || "");
      setLongueurCarotte(sourceData.longueur_carotte?.toString() || "");
      setDirectionCarottage(sourceData.direction_carottage || "");
      setPresenceArmatures(sourceData.presence_armatures || false);
      setEtatSurface(sourceData.etat_surface || "");
      setClasseResistance(sourceData.classe_resistance || "");
      setObservations(sourceData.observations || "");
    }
  }, [isEditing, existingData, duplicateSource]);

  const handleSubmit = async () => {
    const payload = {
      client_id: clientId || null,
      chantier_id: chantierId || null,
      operateur_id: operateurId || null,
      date_prelevement: format(datePrelevement, "yyyy-MM-dd"),
      ouvrage: ouvrage || null,
      partie_ouvrage: partieOuvrage || null,
      localisation: localisation || null,
      diametre_carotte: diametreCarotte || null,
      longueur_carotte: longueurCarotte ? parseFloat(longueurCarotte) : null,
      direction_carottage: directionCarottage || null,
      presence_armatures: presenceArmatures,
      etat_surface: etatSurface || null,
      classe_resistance: classeResistance || null,
      observations: observations || null,
    };

    try {
      if (isEditing && id) {
        await updateMutation.mutateAsync({ id, ...payload });
        toast.success("Échantillon modifié avec succès");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Échantillon créé avec succès");
      }
      navigate("/essais/beton/destructif/carottage");
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditing && loadingExisting) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <EssaiBreadcrumb
        items={[
          { label: "Béton", path: "/essais/beton" },
          { label: "Destructif", path: "/essais/beton/destructif" },
          { label: "Carottage", path: "/essais/beton/destructif/carottage" },
          { label: isEditing ? "Modifier" : "Nouveau" },
        ]}
      />

      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/essais/beton/destructif/carottage")}
          className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-display font-bold text-foreground">
          {isEditing ? "Modifier" : "Nouveau"} <span className="text-primary">Carottage</span>
        </h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        {/* Identification */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Identification</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={clientId} onValueChange={(v) => { setClientId(v); setChantierId(""); }}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Chantier</Label>
              <Select value={chantierId} onValueChange={setChantierId} disabled={!clientId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{chantiers?.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Opérateur</Label>
              <Select value={operateurId} onValueChange={setOperateurId} disabled={isOperateurLocked}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{intervenants?.map(i => <SelectItem key={i.id} value={i.id}>{i.nom} {i.prenom || ""}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date de prélèvement</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !datePrelevement && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {datePrelevement ? format(datePrelevement, "dd/MM/yyyy", { locale: fr }) : "Choisir une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={datePrelevement} onSelect={(d) => d && setDatePrelevement(d)} locale={fr} /></PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Ouvrage</Label>
              <Input value={ouvrage} onChange={(e) => setOuvrage(e.target.value)} placeholder="Ex: Pile P3" />
            </div>
            <div className="space-y-2">
              <Label>Partie d'ouvrage</Label>
              <Input value={partieOuvrage} onChange={(e) => setPartieOuvrage(e.target.value)} placeholder="Ex: Fût" />
            </div>
          </div>
        </div>

        {/* Caractéristiques du carottage */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Caractéristiques du carottage</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Localisation</Label>
              <Input value={localisation} onChange={(e) => setLocalisation(e.target.value)} placeholder="Ex: Face Nord, 1.5m du sol" />
            </div>
            <div className="space-y-2">
              <Label>Diamètre de la carotte</Label>
              <Select value={diametreCarotte} onValueChange={setDiametreCarotte}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{DIAMETRES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Longueur de la carotte (mm)</Label>
              <Input type="number" value={longueurCarotte} onChange={(e) => setLongueurCarotte(e.target.value)} placeholder="Ex: 200" />
            </div>
            <div className="space-y-2">
              <Label>Direction de carottage</Label>
              <Select value={directionCarottage} onValueChange={setDirectionCarottage}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{DIRECTIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>État de surface</Label>
              <Select value={etatSurface} onValueChange={setEtatSurface}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{ETATS_SURFACE.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Classe de résistance visée</Label>
              <Select value={classeResistance} onValueChange={setClasseResistance}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{CLASSES_RESISTANCE.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Checkbox checked={presenceArmatures} onCheckedChange={(v) => setPresenceArmatures(!!v)} id="armatures" />
              <Label htmlFor="armatures">Présence d'armatures</Label>
            </div>
          </div>
        </div>

        {/* Observations */}
        <div className="space-y-2">
          <Label>Observations</Label>
          <Textarea value={observations} onChange={(e) => setObservations(e.target.value)} rows={3} placeholder="Remarques sur le prélèvement..." />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => navigate("/essais/beton/destructif/carottage")}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {isEditing ? "Enregistrer" : "Créer l'échantillon"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CarottageSampleForm;
