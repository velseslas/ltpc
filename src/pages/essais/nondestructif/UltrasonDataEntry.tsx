import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { useEchantillonUltrason, useUpdateEchantillonUltrason } from "@/hooks/useEchantillonsUltrason";
import { toast } from "sonner";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

type Mesure = { distance: number; temps: number };
type ElementTest = { element_coule: string; mesures: Mesure[] };

const getQualite = (v: number) => {
  if (v > 4500) return { label: "Excellent", className: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" };
  if (v > 3500) return { label: "Bon", className: "text-sky-500 bg-sky-500/10 border-sky-500/30" };
  if (v > 3000) return { label: "Moyen", className: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30" };
  if (v > 2000) return { label: "Médiocre", className: "text-orange-500 bg-orange-500/10 border-orange-500/30" };
  return { label: "Très mauvais", className: "text-destructive bg-destructive/10 border-destructive/30" };
};

const UltrasonDataEntry = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const basePath = "/essais/beton/non-destructif/ultrason";
  const { data: echantillon, isLoading } = useEchantillonUltrason(id ?? "");
  const updateMutation = useUpdateEchantillonUltrason();

  const [elements, setElements] = useState<ElementTest[]>([
    { element_coule: "", mesures: [{ distance: 0, temps: 0 }, { distance: 0, temps: 0 }, { distance: 0, temps: 0 }] },
  ]);

  useEffect(() => {
    if (echantillon?.resultats) {
      const r = echantillon.resultats as any;
      // Support new multi-element format
      if (r.elements) {
        setElements(r.elements);
      } else if (r.mesures) {
        // Legacy single-element format
        setElements([{ element_coule: r.element_coule ?? "", mesures: r.mesures }]);
      }
    }
  }, [echantillon]);

  const updateElement = (eIdx: number, field: string, value: string) => {
    const updated = [...elements];
    updated[eIdx] = { ...updated[eIdx], [field]: value };
    setElements(updated);
  };

  const addMesure = (eIdx: number) => {
    const updated = [...elements];
    updated[eIdx].mesures = [...updated[eIdx].mesures, { distance: 0, temps: 0 }];
    setElements(updated);
  };

  const removeMesure = (eIdx: number, mIdx: number) => {
    const updated = [...elements];
    updated[eIdx].mesures = updated[eIdx].mesures.filter((_, i) => i !== mIdx);
    setElements(updated);
  };

  const updateMesure = (eIdx: number, mIdx: number, field: keyof Mesure, val: number) => {
    const updated = [...elements];
    updated[eIdx].mesures[mIdx] = { ...updated[eIdx].mesures[mIdx], [field]: val };
    setElements(updated);
  };

  const addElement = () => {
    setElements([...elements, { element_coule: "", mesures: [{ distance: 0, temps: 0 }] }]);
  };

  const removeElement = (eIdx: number) => {
    setElements(elements.filter((_, i) => i !== eIdx));
  };

  // Global stats
  const allMesures = elements.flatMap(e => e.mesures);
  const allVitesses = allMesures.map(m => m.distance > 0 && m.temps > 0 ? Math.round((m.distance / m.temps) * 1000) : null);
  const validVitesses = allVitesses.filter((v): v is number => v !== null && v > 0);
  const vitesseMoyenne = validVitesses.length > 0 ? Math.round(validVitesses.reduce((a, b) => a + b, 0) / validVitesses.length) : 0;

  const handleSave = async () => {
    try {
      // Also flatten for backward compatibility
      const flatMesures = elements.flatMap(e => e.mesures);
      const flatVitesses = flatMesures.map(m => m.distance > 0 && m.temps > 0 ? Math.round((m.distance / m.temps) * 1000) : null);

      await updateMutation.mutateAsync({
        id: id!,
        resultats: {
          elements,
          mesures: flatMesures,
          element_coule: elements[0]?.element_coule || null,
          vitesses: flatVitesses,
          vitesse_moyenne: vitesseMoyenne,
          qualite: vitesseMoyenne > 0 ? getQualite(vitesseMoyenne).label : null,
        },
        statut: "termine",
      });
      toast.success("Données enregistrées avec succès");
      navigate(`${basePath}/${id}`);
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <EssaiBreadcrumb items={[{ label: "Béton", path: "/essais/beton" }, { label: "Non Destructif", path: "/essais/beton/non-destructif" }, { label: "Ultrason", path: basePath }, { label: "Saisie de données" }]} />
      <div className="flex items-start gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(`${basePath}/${id}`)} className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Saisie <span className="text-primary text-glow">Ultrason</span></h1>
          <p className="text-muted-foreground mt-1">Saisir les mesures de temps et distance</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        {elements.map((elem, eIdx) => (
          <div key={eIdx} className="space-y-4">
            {eIdx > 0 && <div className="border-t border-border" />}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Élément {eIdx + 1}</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => addMesure(eIdx)} className="flex items-center gap-1"><Plus className="h-4 w-4" />Ajouter un point</Button>
                {elements.length > 1 && (
                  <Button variant="outline" size="sm" onClick={() => removeElement(eIdx)} className="flex items-center gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"><Trash2 className="h-4 w-4" />Supprimer</Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Élément coulé</Label>
                <Input placeholder="Ex: Poteau, Dalle, Poutre, Voile..." value={elem.element_coule} onChange={(e) => updateElement(eIdx, "element_coule", e.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-[60px_1fr_1fr_1fr_40px] gap-3 text-sm font-medium text-muted-foreground">
                <span>N°</span><span>Distance (mm)</span><span>Temps (µs)</span><span>Vitesse (m/s)</span><span></span>
              </div>
              {elem.mesures.map((m, mIdx) => {
                const v = m.distance > 0 && m.temps > 0 ? Math.round((m.distance / m.temps) * 1000) : null;
                return (
                  <div key={mIdx} className="grid grid-cols-[60px_1fr_1fr_1fr_40px] gap-3 items-center">
                    <span className="text-sm font-medium">{mIdx + 1}</span>
                    <Input type="number" value={m.distance || ""} onChange={(e) => updateMesure(eIdx, mIdx, "distance", parseFloat(e.target.value) || 0)} placeholder="300" />
                    <Input type="number" value={m.temps || ""} onChange={(e) => updateMesure(eIdx, mIdx, "temps", parseFloat(e.target.value) || 0)} placeholder="65" />
                    <div className={`text-center font-medium rounded-md px-2 py-2 border ${v ? getQualite(v).className : "text-muted-foreground"}`}>
                      {v ?? "-"}
                    </div>
                    {elem.mesures.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeMesure(eIdx, mIdx)}><Trash2 className="h-4 w-4" /></Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <Button variant="outline" onClick={addElement} className="w-full flex items-center justify-center gap-2 border-dashed border-primary/40 text-primary hover:bg-primary/5">
          <Plus className="h-4 w-4" />Ajouter un élément
        </Button>

        <div className="border-t border-border pt-6">
          <h2 className="text-lg font-semibold mb-4">Résultats calculés</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-border p-4 text-center">
              <span className="text-sm text-muted-foreground">Nb de mesures</span>
              <p className="text-2xl font-bold">{validVitesses.length}</p>
            </div>
            <div className="rounded-lg bg-primary/10 border border-primary/30 p-4 text-center">
              <span className="text-sm text-muted-foreground">Vitesse moyenne</span>
              <p className="text-2xl font-bold text-primary">{vitesseMoyenne > 0 ? `${vitesseMoyenne} m/s` : "-"}</p>
            </div>
            {vitesseMoyenne > 0 && (
              <div className={`rounded-lg p-4 text-center border ${getQualite(vitesseMoyenne).className}`}>
                <span className="text-sm text-muted-foreground">Qualité du béton</span>
                <p className="text-2xl font-bold">{getQualite(vitesseMoyenne).label}</p>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">* V = L/T. Classification : {">"} 4500 = Excellent, 3500-4500 = Bon, 3000-3500 = Moyen, 2000-3000 = Médiocre</p>
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

export default UltrasonDataEntry;
