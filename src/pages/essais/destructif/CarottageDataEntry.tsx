import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { useEchantillonCarottage, useUpdateEchantillonCarottage } from "@/hooks/useEchantillonsCarottage";
import { toast } from "sonner";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Json } from "@/integrations/supabase/types";

interface CarotteResult {
  id: string;
  reference: string;
  longueur_avant: string;
  longueur_apres: string;
  diametre: string;
  masse: string;
  masse_volumique: string;
  charge_rupture: string;
  resistance: string;
  type_rupture: string;
  observations: string;
}

const TYPES_RUPTURE = [
  "Conique", "Colonne", "Mixte", "Cisaillement", "Autre",
];

const emptyResult = (): CarotteResult => ({
  id: crypto.randomUUID(),
  reference: "",
  longueur_avant: "",
  longueur_apres: "",
  diametre: "",
  masse: "",
  masse_volumique: "",
  charge_rupture: "",
  resistance: "",
  type_rupture: "",
  observations: "",
});

const CarottageDataEntry = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: echantillon, isLoading } = useEchantillonCarottage(id || "");
  const updateMutation = useUpdateEchantillonCarottage();

  const [results, setResults] = useState<CarotteResult[]>([emptyResult()]);
  const [dateEssai, setDateEssai] = useState("");

  useEffect(() => {
    if (echantillon) {
      if (echantillon.date_essai) setDateEssai(echantillon.date_essai);
      if (echantillon.resultats && Array.isArray(echantillon.resultats)) {
        setResults(echantillon.resultats as unknown as CarotteResult[]);
      }
    }
  }, [echantillon]);

  const updateResult = (idx: number, field: keyof CarotteResult, value: string) => {
    const updated = [...results];
    updated[idx] = { ...updated[idx], [field]: value };

    // Auto-calculate resistance if charge and diameter are present
    const charge = parseFloat(updated[idx].charge_rupture);
    const diam = parseFloat(updated[idx].diametre);
    if (!isNaN(charge) && !isNaN(diam) && diam > 0) {
      const area = (Math.PI * diam * diam) / 4;
      updated[idx].resistance = (charge / area).toFixed(2);
    }

    // Auto-calculate masse volumique
    const masse = parseFloat(updated[idx].masse);
    const longueur = parseFloat(updated[idx].longueur_apres);
    if (!isNaN(masse) && !isNaN(diam) && !isNaN(longueur) && diam > 0 && longueur > 0) {
      const volume = (Math.PI * (diam / 2) ** 2 * longueur) / 1e6; // cm³ to dm³
      updated[idx].masse_volumique = ((masse / 1000) / (volume / 1000)).toFixed(0); // kg/m³
    }

    setResults(updated);
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      await updateMutation.mutateAsync({
        id,
        date_essai: dateEssai || null,
        resultats: results as unknown as Json,
        statut: "en-cours",
      });
      toast.success("Données enregistrées avec succès");
      navigate(`/essais/beton/destructif/carottage/${id}`);
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!echantillon) {
    return <div className="text-center py-12 text-muted-foreground">Échantillon non trouvé</div>;
  }

  return (
    <div className="space-y-6">
      <EssaiBreadcrumb
        items={[
          { label: "Béton", path: "/essais/beton" },
          { label: "Destructif", path: "/essais/beton/destructif" },
          { label: "Carottage", path: "/essais/beton/destructif/carottage" },
          { label: `CR-${String(echantillon.numero).padStart(3, "0")}`, path: `/essais/beton/destructif/carottage/${id}` },
          { label: "Saisie" },
        ]}
      />

      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(`/essais/beton/destructif/carottage/${id}`)}
          className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Saisie des résultats — <span className="text-primary">CR-{String(echantillon.numero).padStart(3, "0")}</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {echantillon.clients?.nom ?? "—"} • {echantillon.chantiers?.nom ?? "—"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Date de l'essai</Label>
            <Input type="date" value={dateEssai} onChange={(e) => setDateEssai(e.target.value)} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Résultats des carottes</h2>
            <Button variant="outline" size="sm" onClick={() => setResults([...results, emptyResult()])}>
              <Plus className="h-4 w-4 mr-1" /> Ajouter une carotte
            </Button>
          </div>

          {results.map((r, idx) => (
            <div key={r.id} className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">Carotte {idx + 1}</h3>
                {results.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setResults(results.filter((_, i) => i !== idx))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Référence</Label>
                  <Input value={r.reference} onChange={(e) => updateResult(idx, "reference", e.target.value)} placeholder="Ex: C1" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Diamètre (mm)</Label>
                  <Input type="number" value={r.diametre} onChange={(e) => updateResult(idx, "diametre", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Longueur avant rect. (mm)</Label>
                  <Input type="number" value={r.longueur_avant} onChange={(e) => updateResult(idx, "longueur_avant", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Longueur après rect. (mm)</Label>
                  <Input type="number" value={r.longueur_apres} onChange={(e) => updateResult(idx, "longueur_apres", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Masse (g)</Label>
                  <Input type="number" value={r.masse} onChange={(e) => updateResult(idx, "masse", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Masse vol. (kg/m³)</Label>
                  <Input type="number" value={r.masse_volumique} readOnly className="bg-muted/50" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Charge de rupture (kN)</Label>
                  <Input type="number" value={r.charge_rupture} onChange={(e) => updateResult(idx, "charge_rupture", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Résistance (MPa)</Label>
                  <Input type="number" value={r.resistance} readOnly className="bg-muted/50" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Type de rupture</Label>
                  <Select value={r.type_rupture} onValueChange={(v) => updateResult(idx, "type_rupture", v)}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>{TYPES_RUPTURE.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 col-span-2 md:col-span-3">
                  <Label className="text-xs">Observations</Label>
                  <Input value={r.observations} onChange={(e) => updateResult(idx, "observations", e.target.value)} placeholder="Remarques..." />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => navigate(`/essais/beton/destructif/carottage/${id}`)}>Annuler</Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CarottageDataEntry;
