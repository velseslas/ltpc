import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { useEchantillonSclerometre, useUpdateEchantillonSclerometre } from "@/hooks/useEchantillonsSclerometre";
import { toast } from "sonner";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

const SclerometreDataEntry = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const basePath = "/essais/beton/non-destructif/sclerometre";
  const { data: echantillon, isLoading } = useEchantillonSclerometre(id ?? "");
  const updateMutation = useUpdateEchantillonSclerometre();

  const [mesures, setMesures] = useState<number[]>(Array(9).fill(0));

  useEffect(() => {
    if (echantillon?.resultats) {
      const r = echantillon.resultats as any;
      if (r.mesures) setMesures(r.mesures);
    }
  }, [echantillon]);

  const addPoint = () => setMesures([...mesures, 0]);
  const removePoint = (idx: number) => setMesures(mesures.filter((_, i) => i !== idx));
  const updatePoint = (idx: number, val: number) => {
    const updated = [...mesures];
    updated[idx] = val;
    setMesures(updated);
  };

  const validMesures = mesures.filter(v => v > 0);
  const moyenne = validMesures.length > 0 ? Math.round(validMesures.reduce((a, b) => a + b, 0) / validMesures.length * 10) / 10 : 0;
  
  // Filtrage: rejeter valeurs s'écartant de plus de 6 unités de la médiane
  const sorted = [...validMesures].sort((a, b) => a - b);
  const mediane = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;
  const valeursRetenues = validMesures.filter(v => Math.abs(v - mediane) <= 6);
  const indiceCorrige = valeursRetenues.length > 0 ? Math.round(valeursRetenues.reduce((a, b) => a + b, 0) / valeursRetenues.length * 10) / 10 : 0;
  
  // Estimation résistance (courbe générale approximative)
  const resistanceEstimee = indiceCorrige > 0 ? Math.round((indiceCorrige * 1.25 - 15) * 10) / 10 : 0;

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: id!,
        resultats: {
          mesures,
          indice_moyen: moyenne,
          mediane,
          valeurs_retenues: valeursRetenues,
          indice_corrige: indiceCorrige,
          resistance_estimee: resistanceEstimee > 0 ? resistanceEstimee : null,
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
      <EssaiBreadcrumb items={[{ label: "Béton", path: "/essais/beton" }, { label: "Non Destructif", path: "/essais/beton/non-destructif" }, { label: "Scléromètre", path: basePath }, { label: "Saisie de données" }]} />
      <div className="flex items-start gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(`${basePath}/${id}`)} className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Saisie <span className="text-primary text-glow">Scléromètre</span></h1>
          <p className="text-muted-foreground mt-1">Saisir les indices de rebond</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Points de mesure (indices de rebond)</h2>
          <Button variant="outline" size="sm" onClick={addPoint} className="flex items-center gap-1"><Plus className="h-4 w-4" />Ajouter</Button>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
          {mesures.map((val, i) => (
            <div key={i} className="space-y-1 relative group">
              <Label className="text-xs text-muted-foreground">Point {i + 1}</Label>
              <Input type="number" value={val || ""} onChange={(e) => updatePoint(i, parseFloat(e.target.value) || 0)} placeholder="0" className="text-center" />
              {mesures.length > 9 && (
                <button onClick={() => removePoint(i)} className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full p-0.5">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-6">
          <h2 className="text-lg font-semibold mb-4">Résultats calculés</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border p-4 text-center">
              <span className="text-sm text-muted-foreground">Médiane</span>
              <p className="text-2xl font-bold">{mediane}</p>
            </div>
            <div className="rounded-lg border border-border p-4 text-center">
              <span className="text-sm text-muted-foreground">Valeurs retenues</span>
              <p className="text-2xl font-bold">{valeursRetenues.length}/{validMesures.length}</p>
            </div>
            <div className="rounded-lg bg-primary/10 border border-primary/30 p-4 text-center">
              <span className="text-sm text-muted-foreground">Indice moyen corrigé</span>
              <p className="text-2xl font-bold text-primary">{indiceCorrige}</p>
            </div>
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4 text-center">
              <span className="text-sm text-muted-foreground">Résistance estimée</span>
              <p className="text-2xl font-bold text-emerald-500">{resistanceEstimee > 0 ? `${resistanceEstimee} MPa` : "-"}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">* Valeurs s'écartant de plus de 6 unités de la médiane sont rejetées (NF EN 12504-2)</p>
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

export default SclerometreDataEntry;
