import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, CalendarIcon, Save, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";
import { useChantiersByClient } from "@/hooks/useChantiers";
import { useIntervenants } from "@/hooks/useIntervenants";
import { useCreateEchantillonUltrason, useUpdateEchantillonUltrason, useEchantillonUltrason } from "@/hooks/useEchantillonsUltrason";
import { toast } from "sonner";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

const MODES_TRANSMISSION = [
  { value: "direct", label: "Direct (face à face)" },
  { value: "semi-direct", label: "Semi-direct (faces adjacentes)" },
  { value: "indirect", label: "Indirect (même face)" },
];

const CLASSES_RESISTANCE = [
  "C12/15", "C16/20", "C20/25", "C25/30", "C30/37", "C35/45", "C40/50", "C45/55", "C50/60"
];

const UltrasonSampleForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const basePath = "/essais/beton/non-destructif/ultrason";

  const { data: existingData } = useEchantillonUltrason(id ?? "");
  const { data: clients } = useClients();
  const { data: intervenants } = useIntervenants();
  const createMutation = useCreateEchantillonUltrason();
  const updateMutation = useUpdateEchantillonUltrason();

  const [clientId, setClientId] = useState<string>("");
  const [chantierId, setChantierId] = useState<string>("");
  const [operateurId, setOperateurId] = useState<string>("");
  const [ouvrage, setOuvrage] = useState("");
  const [partieOuvrage, setPartieOuvrage] = useState("");
  const [modeTransmission, setModeTransmission] = useState("direct");
  const [frequenceKhz, setFrequenceKhz] = useState<string>("");
  const [dateEssai, setDateEssai] = useState<Date>(new Date());
  const [ageBetonJours, setAgeBetonJours] = useState<string>("");
  const [classeResistance, setClasseResistance] = useState("");
  const [observations, setObservations] = useState("");

  const { data: chantiers } = useChantiersByClient(clientId);

  useEffect(() => {
    if (existingData && isEdit) {
      setClientId(existingData.client_id ?? "");
      setChantierId(existingData.chantier_id ?? "");
      setOperateurId(existingData.operateur_id ?? "");
      setOuvrage(existingData.ouvrage ?? "");
      setPartieOuvrage(existingData.partie_ouvrage ?? "");
      setModeTransmission(existingData.mode_transmission ?? "direct");
      setFrequenceKhz(existingData.frequence_khz?.toString() ?? "");
      setDateEssai(parseISO(existingData.date_essai));
      setAgeBetonJours(existingData.age_beton_jours?.toString() ?? "");
      setClasseResistance(existingData.classe_resistance ?? "");
      setObservations(existingData.observations ?? "");
    }
  }, [existingData, isEdit]);

  const handleSubmit = async () => {
    const payload: any = {
      client_id: clientId || null,
      chantier_id: chantierId || null,
      operateur_id: operateurId || null,
      ouvrage: ouvrage || null,
      partie_ouvrage: partieOuvrage || null,
      mode_transmission: modeTransmission,
      frequence_khz: frequenceKhz ? parseFloat(frequenceKhz) : null,
      date_essai: format(dateEssai, "yyyy-MM-dd"),
      age_beton_jours: ageBetonJours ? parseInt(ageBetonJours) : null,
      classe_resistance: classeResistance || null,
      observations: observations || null,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id, ...payload });
        toast.success("Essai modifié avec succès");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Essai créé avec succès");
      }
      navigate(basePath);
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <EssaiBreadcrumb items={[{ label: "Béton", path: "/essais/beton" }, { label: "Non Destructif", path: "/essais/beton/non-destructif" }, { label: "Ultrason", path: basePath }, { label: isEdit ? "Modifier" : "Nouveau" }]} />
      <div className="flex items-start gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(basePath)} className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">{isEdit ? "Modifier" : "Nouveau"} <span className="text-primary text-glow">Essai Ultrason</span></h1>
          <p className="text-muted-foreground mt-1">NF EN 12504-4</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        <h2 className="text-lg font-semibold text-foreground">Informations générales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Client</Label>
            <Select value={clientId} onValueChange={(v) => { setClientId(v); setChantierId(""); }}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
              <SelectContent>{clients?.map((c) => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Chantier</Label>
            <Select value={chantierId} onValueChange={setChantierId} disabled={!clientId}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un chantier" /></SelectTrigger>
              <SelectContent>{chantiers?.map((c) => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Opérateur</Label>
            <Select value={operateurId} onValueChange={setOperateurId}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un opérateur" /></SelectTrigger>
              <SelectContent>{intervenants?.map((i) => <SelectItem key={i.id} value={i.id}>{i.nom} {i.prenom}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date de l'essai</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateEssai && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateEssai, "PPP", { locale: fr })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateEssai} onSelect={(d) => d && setDateEssai(d)} locale={fr} /></PopoverContent>
            </Popover>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-foreground pt-4">Détails de l'essai</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Ouvrage</Label>
            <Input placeholder="Ex: Pont, Bâtiment A, Viaduc..." value={ouvrage} onChange={(e) => setOuvrage(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Partie de l'ouvrage</Label>
            <Input placeholder="Ex: Poteau P1, Dalle D2, Poutre B3..." value={partieOuvrage} onChange={(e) => setPartieOuvrage(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Mode de transmission</Label>
            <Select value={modeTransmission} onValueChange={setModeTransmission}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MODES_TRANSMISSION.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fréquence (kHz)</Label>
            <Input type="number" placeholder="Ex: 54" value={frequenceKhz} onChange={(e) => setFrequenceKhz(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Âge du béton (jours)</Label>
            <Input type="number" placeholder="Ex: 28" value={ageBetonJours} onChange={(e) => setAgeBetonJours(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Classe de résistance</Label>
            <Select value={classeResistance} onValueChange={setClasseResistance}>
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>{CLASSES_RESISTANCE.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Observations</Label>
          <Textarea placeholder="Observations éventuelles..." value={observations} onChange={(e) => setObservations(e.target.value)} rows={3} />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => navigate(basePath)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? "Modifier" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UltrasonSampleForm;
