import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { useEchantillonCarottage, useUpdateEchantillonCarottage } from "@/hooks/useEchantillonsCarottage";
import { toast } from "sonner";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
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

interface ElementTest {
  element_coule: string;
  carottes: CarotteResult[];
}

const TYPES_RUPTURE = ["Conique", "Colonne", "Mixte", "Cisaillement", "Autre"];

const emptyCarotte = (): CarotteResult => ({
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

const getQualite = (r: number) => {
  if (r >= 40) return { label: "Excellent", className: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" };
  if (r >= 30) return { label: "Bon", className: "text-sky-500 bg-sky-500/10 border-sky-500/30" };
  if (r >= 20) return { label: "Moyen", className: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30" };
  if (r >= 15) return { label: "Médiocre", className: "text-orange-500 bg-orange-500/10 border-orange-500/30" };
  return { label: "Très mauvais", className: "text-destructive bg-destructive/10 border-destructive/30" };
};

const computeCarotte = (c: CarotteResult): CarotteResult => {
  const updated = { ...c };
  const charge = parseFloat(updated.charge_rupture);
  const diam = parseFloat(updated.diametre);
  if (!isNaN(charge) && !isNaN(diam) && diam > 0) {
    const area = (Math.PI * diam * diam) / 4;
    updated.resistance = ((charge * 1000) / area).toFixed(2);
  }
  const masse = parseFloat(updated.masse);
  const longueur = parseFloat(updated.longueur_apres);
  if (!isNaN(masse) && !isNaN(diam) && !isNaN(longueur) && diam > 0 && longueur > 0) {
    const volume_mm3 = Math.PI * (diam / 2) ** 2 * longueur;
    updated.masse_volumique = ((masse / volume_mm3) * 1e6).toFixed(0);
  }
  return updated;
};

const CarottageDataEntry = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const basePath = "/essais/beton/destructif/carottage";
  const { data: echantillon, isLoading } = useEchantillonCarottage(id || "");
  const updateMutation = useUpdateEchantillonCarottage();

  const [elements, setElements] = useState<ElementTest[]>([
    { element_coule: "", carottes: [emptyCarotte()] },
  ]);
  const [dateEssai, setDateEssai] = useState("");

  useEffect(() => {
    if (!echantillon) return;
    if (echantillon.date_essai) setDateEssai(echantillon.date_essai);
    const r = echantillon.resultats as any;
    if (r) {
      if (Array.isArray(r?.elements)) {
        setElements(r.elements);
      } else if (Array.isArray(r)) {
        // Legacy: flat array of carottes
        setElements([{ element_coule: "", carottes: r as CarotteResult[] }]);
      }
    }
  }, [echantillon]);

  const updateElement = (eIdx: number, field: keyof ElementTest, value: string) => {
    const updated = [...elements];
    (updated[eIdx] as any)[field] = value;
    setElements(updated);
  };

  const updateCarotte = (eIdx: number, cIdx: number, field: keyof CarotteResult, value: string) => {
    const updated = [...elements];
    updated[eIdx].carottes[cIdx] = computeCarotte({ ...updated[eIdx].carottes[cIdx], [field]: value });
    setElements(updated);
  };

  const addCarotte = (eIdx: number) => {
    const updated = [...elements];
    updated[eIdx].carottes = [...updated[eIdx].carottes, emptyCarotte()];
    setElements(updated);
  };

  const removeCarotte = (eIdx: number, cIdx: number) => {
    const updated = [...elements];
    updated[eIdx].carottes = updated[eIdx].carottes.filter((_, i) => i !== cIdx);
    setElements(updated);
  };

  const addElement = () => {
    setElements([...elements, { element_coule: "", carottes: [emptyCarotte()] }]);
  };

  const removeElement = (eIdx: number) => {
    setElements(elements.filter((_, i) => i !== eIdx));
  };

  // Global stats
  const allCarottes = elements.flatMap(e => e.carottes);
  const resistances = allCarottes
    .map(c => parseFloat(c.resistance))
    .filter(v => !isNaN(v) && v > 0);
  const resistanceMoyenne = resistances.length > 0
    ? resistances.reduce((a, b) => a + b, 0) / resistances.length
    : 0;

  const handleSave = async () => {
    if (!id) return;
    try {
      const flat = elements.flatMap(e => e.carottes);
      await updateMutation.mutateAsync({
        id,
        date_essai: dateEssai || null,
        resultats: {
          elements,
          carottes: flat,
          resistance_moyenne: resistanceMoyenne > 0 ? Number(resistanceMoyenne.toFixed(2)) : null,
          qualite: resistanceMoyenne > 0 ? getQualite(resistanceMoyenne).label : null,
        } as unknown as Json,
        statut: "termine",
      });
      toast.success("Données enregistrées avec succès");
      navigate(`${basePath}/${id}`);
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
          { label: "Carottage", path: basePath },
          { label: `CR-${String(echantillon.numero).padStart(3, "0")}`, path: `${basePath}/${id}` },
          { label: "Saisie" },
        ]}
      />

      <div className="flex items-start gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(`${basePath}/${id}`)}
          className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Saisie <span className="text-primary text-glow">Carottage</span> — CR-{String(echantillon.numero).padStart(3, "0")}
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

        {elements.map((elem, eIdx) => (
          <div key={eIdx} className="space-y-4">
            {eIdx > 0 && <div className="border-t border-border" />}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Élément {eIdx + 1}</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => addCarotte(eIdx)} className="flex items-center gap-1">
                  <Plus className="h-4 w-4" />Ajouter une carotte
                </Button>
                {elements.length > 1 && (
                  <Button variant="outline" size="sm" onClick={() => removeElement(eIdx)}
                    className="flex items-center gap-1 text-destructive border-destructive/30 hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />Supprimer
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Élément coulé</Label>
                <Input
                  placeholder="Ex: Poteau, Dalle, Poutre, Voile..."
                  value={elem.element_coule}
                  onChange={(e) => updateElement(eIdx, "element_coule", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              {elem.carottes.map((r, cIdx) => {
                const res = parseFloat(r.resistance);
                const q = !isNaN(res) && res > 0 ? getQualite(res) : null;
                return (
                  <div key={r.id} className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-foreground">Carotte {cIdx + 1}</h3>
                      {elem.carottes.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                          onClick={() => removeCarotte(eIdx, cIdx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Référence</Label>
                        <Input value={r.reference} onChange={(e) => updateCarotte(eIdx, cIdx, "reference", e.target.value)} placeholder="Ex: C1" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Diamètre (mm)</Label>
                        <Input type="number" value={r.diametre} onChange={(e) => updateCarotte(eIdx, cIdx, "diametre", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Longueur avant rect. (mm)</Label>
                        <Input type="number" value={r.longueur_avant} onChange={(e) => updateCarotte(eIdx, cIdx, "longueur_avant", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Longueur après rect. (mm)</Label>
                        <Input type="number" value={r.longueur_apres} onChange={(e) => updateCarotte(eIdx, cIdx, "longueur_apres", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Masse (g)</Label>
                        <Input type="number" value={r.masse} onChange={(e) => updateCarotte(eIdx, cIdx, "masse", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Masse vol. (kg/m³)</Label>
                        <Input type="number" value={r.masse_volumique} readOnly className="bg-muted/50" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Charge de rupture (kN)</Label>
                        <Input type="number" value={r.charge_rupture} onChange={(e) => updateCarotte(eIdx, cIdx, "charge_rupture", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Résistance (MPa)</Label>
                        <div className={`text-center font-medium rounded-md px-2 py-2 border ${q ? q.className : "text-muted-foreground bg-muted/50 border-border"}`}>
                          {r.resistance || "-"}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Type de rupture</Label>
                        <Select value={r.type_rupture} onValueChange={(v) => updateCarotte(eIdx, cIdx, "type_rupture", v)}>
                          <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                          <SelectContent>{TYPES_RUPTURE.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1 col-span-2 md:col-span-3">
                        <Label className="text-xs">Observations</Label>
                        <Input value={r.observations} onChange={(e) => updateCarotte(eIdx, cIdx, "observations", e.target.value)} placeholder="Remarques..." />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <Button variant="outline" onClick={addElement}
          className="w-full flex items-center justify-center gap-2 border-dashed border-primary/40 text-primary hover:bg-primary/5">
          <Plus className="h-4 w-4" />Ajouter un élément
        </Button>

        <div className="border-t border-border pt-6">
          <h2 className="text-lg font-semibold mb-4">Résultats calculés</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-border p-4 text-center">
              <span className="text-sm text-muted-foreground">Nb de carottes</span>
              <p className="text-2xl font-bold">{resistances.length}</p>
            </div>
            <div className="rounded-lg bg-primary/10 border border-primary/30 p-4 text-center">
              <span className="text-sm text-muted-foreground">Résistance moyenne</span>
              <p className="text-2xl font-bold text-primary">
                {resistanceMoyenne > 0 ? `${resistanceMoyenne.toFixed(2)} MPa` : "-"}
              </p>
            </div>
            {resistanceMoyenne > 0 && (
              <div className={`rounded-lg p-4 text-center border ${getQualite(resistanceMoyenne).className}`}>
                <span className="text-sm text-muted-foreground">Qualité du béton</span>
                <p className="text-2xl font-bold">{getQualite(resistanceMoyenne).label}</p>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            * fc = F(kN) × 1000 / A(mm²). Classification : ≥ 40 = Excellent, 30-40 = Bon, 20-30 = Moyen, 15-20 = Médiocre.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => navigate(`${basePath}/${id}`)}>Annuler</Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="flex items-center gap-2">
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CarottageDataEntry;
