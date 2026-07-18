import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useEchantillonGeotechniqueById,
  useUpdateEchantillonGeotechniqueByType,
  getGeoPrefix
} from "@/hooks/useEchantillonsGeotechniqueFactory";
import { Json } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

function pf(v: string | number | undefined | null): number {
  return parseFloat(String(v ?? "")) || 0;
}
function fmt(v: number, dec = 2): string {
  return isNaN(v) || !isFinite(v) ? "-" : v.toFixed(dec);
}

// Essai de plaque NF P 94-117-1
// 2 cycles de chargement/déchargement
// Paliers de contrainte : 0, 0.025, 0.050, 0.075, 0.100, 0.150, 0.200, 0.250 MPa
const DEFAULT_PALIERS = ["0", "0.025", "0.050", "0.075", "0.100", "0.150", "0.200", "0.250"];

export default function PlaqueDataEntry() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const essaiType = "plaque";
  const basePath = "/essais/geotechnique/in-situ/plaque";

  const { data: echantillon, isLoading } = useEchantillonGeotechniqueById(essaiType, id);
  const updateEchantillon = useUpdateEchantillonGeotechniqueByType(essaiType);

  const [diametre, setDiametre] = useState("600"); // mm
  const [paliers, setPaliers] = useState<string[]>(DEFAULT_PALIERS);
  // Lectures de déformation pour chaque cycle (en mm)
  const [cycle1, setCycle1] = useState<string[]>(new Array(8).fill(""));
  const [cycle2, setCycle2] = useState<string[]>(new Array(8).fill(""));
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (echantillon?.resultats) {
      const r = echantillon.resultats as Record<string, unknown>;
      if (r.diametre) setDiametre(r.diametre as string);
      if (r.paliers) setPaliers(r.paliers as string[]);
      if (r.cycle1) setCycle1(r.cycle1 as string[]);
      if (r.cycle2) setCycle2(r.cycle2 as string[]);
      if (r.notes) setNotes(r.notes as string);
    }
  }, [echantillon]);

  const updateCycle = (cycle: 1 | 2, idx: number, value: string) => {
    if (cycle === 1) {
      setCycle1(prev => { const u = [...prev]; u[idx] = value; return u; });
    } else {
      setCycle2(prev => { const u = [...prev]; u[idx] = value; return u; });
    }
  };

  const updatePalier = (idx: number, value: string) => {
    setPaliers(prev => { const u = [...prev]; u[idx] = value; return u; });
  };

  const addPalier = () => {
    setPaliers(prev => [...prev, ""]);
    setCycle1(prev => [...prev, ""]);
    setCycle2(prev => [...prev, ""]);
  };

  const removePalier = (idx: number) => {
    if (paliers.length <= 3) return;
    setPaliers(prev => prev.filter((_, i) => i !== idx));
    setCycle1(prev => prev.filter((_, i) => i !== idx));
    setCycle2(prev => prev.filter((_, i) => i !== idx));
  };

  // Calculs automatisés
  const calc = useMemo(() => {
    const d = pf(diametre); // mm
    // Rayon en m
    const r_m = (d / 2) / 1000;
    
    // Lectures de déformation (en mm)
    const def1 = cycle1.map(v => pf(v));
    const def2 = cycle2.map(v => pf(v));
    const sigma = paliers.map(v => pf(v)); // MPa

    // Calcul EV1 et EV2 par méthode des moindres carrés sur la partie linéaire
    // EV = (π/4) × (Δσ / Δz) × d  (en MPa, avec d en mm et Δz en mm)
    // Ou plus simplement : EV = (3 × Δσ × d) / (4 × Δz)  pour plaque circulaire rigide
    // Avec Δσ en MPa, d en mm, Δz en mm → EV en MPa

    const computeEV = (deformations: number[]) => {
      // On prend la pente entre 2 points significatifs
      const points = sigma.map((s, i) => ({ sigma: s, z: deformations[i] }))
        .filter(p => p.sigma > 0 && p.z > 0);
      
      if (points.length < 2) return 0;
      
      // Pente Δσ/Δz entre premier et dernier point significatif
      const first = points[0];
      const last = points[points.length - 1];
      const dSigma = last.sigma - first.sigma;
      const dZ = last.z - first.z;
      
      if (dZ <= 0) return 0;
      
      // EV = (3/4) × (Δσ / Δz) × d  (plaque circulaire rigide, coefficient 3/4)
      // Avec dSigma en MPa, dZ en mm, d en mm → résultat en MPa
      return (3 / 4) * (dSigma / dZ) * d;
    };

    const EV1 = computeEV(def1);
    const EV2 = computeEV(def2);
    const K = EV1 > 0 ? EV2 / EV1 : 0;

    return { EV1, EV2, K, def1, def2, sigma };
  }, [cycle1, cycle2, paliers, diametre]);

  // Chart data
  const chartData = useMemo(() => {
    return calc.sigma.map((s, i) => ({
      sigma: s,
      cycle1: calc.def1[i] > 0 ? calc.def1[i] : undefined,
      cycle2: calc.def2[i] > 0 ? calc.def2[i] : undefined,
    })).filter(p => p.sigma >= 0 && (p.cycle1 !== undefined || p.cycle2 !== undefined));
  }, [calc]);

  const handleSave = async () => {
    if (!id) return;
    try {
      const resultats = {
        diametre,
        paliers,
        cycle1,
        cycle2,
        notes,
        EV1: calc.EV1.toString(),
        EV2: calc.EV2.toString(),
        K: calc.K.toString(),
      };
      const hasResults = calc.def1.some(v => v > 0) || calc.def2.some(v => v > 0);
      await updateEchantillon.mutateAsync({
        id,
        resultats: resultats as unknown as Json,
        statut: hasResults ? "termine" : "en-cours",
      });
      toast.success("Données enregistrées avec succès");
      navigate(basePath);
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  if (isLoading) {
    return <div data-essai-mobile className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!echantillon) {
    return <div className="text-center py-8 text-muted-foreground">Échantillon non trouvé</div>;
  }

  const prefix = getGeoPrefix(essaiType);

  return (
    <div className="space-y-6 animate-fade-in">
      <EssaiBreadcrumb items={[
        { label: "Géotechnique", path: "/essais/geotechnique" },
        { label: "In-Situ", path: "/essais/geotechnique/in-situ" },
        { label: "Plaque", path: basePath },
        { label: <><span className="text-primary">{prefix}</span>-{String(echantillon.numero).padStart(3, "0")}</>, path: `${basePath}/${id}` },
        { label: "Saisie" }
      ]} />

      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Saisie — <span className="text-primary">{prefix}-{String(echantillon.numero).padStart(3, "0")}</span>
        </h1>
        <p className="text-muted-foreground mt-1">Essai de Plaque (NF P 94-117-1)</p>
      </div>

      {/* Info */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-lg">Informations Échantillon</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><p className="text-sm text-muted-foreground">Client</p><p className="font-medium text-foreground">{echantillon.clients?.nom || "-"}</p></div>
            <div><p className="text-sm text-muted-foreground">Chantier</p><p className="font-medium text-foreground">{echantillon.chantiers?.nom || "-"}</p></div>
            <div><p className="text-sm text-muted-foreground">Type de sol</p><p className="font-medium text-foreground">{echantillon.type_sol}</p></div>
            <div><p className="text-sm text-muted-foreground">Date de prélèvement</p><p className="font-medium text-foreground">{format(new Date(echantillon.date_prelevement), "dd/MM/yyyy", { locale: fr })}</p></div>
            <div><p className="text-sm text-muted-foreground">Date d'essai</p><p className="font-medium text-foreground">{(echantillon as any).date_essai ? format(new Date((echantillon as any).date_essai), "dd/MM/yyyy", { locale: fr }) : "-"}</p></div>
            <div><p className="text-sm text-muted-foreground">Technicien</p><p className="font-medium text-foreground">{echantillon.intervenants ? `${echantillon.intervenants.prenom} ${echantillon.intervenants.nom}` : "-"}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Paramètres */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-lg">Paramètres de l'essai</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Diamètre de la plaque (mm)</label>
              <Input
                type="number"
                value={diametre}
                onChange={e => setDiametre(e.target.value)}
                className="bg-background border-border"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau de mesures */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Mesures de déformation</CardTitle>
            <Button variant="outline" size="sm" onClick={addPalier} className="border-border">
              + Ajouter un palier
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-muted-foreground font-medium w-10">#</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">σ (MPa)</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Cycle 1 - Déformation (mm)</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Cycle 2 - Déformation (mm)</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {paliers.map((p, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-3 text-muted-foreground text-sm">{i + 1}</td>
                    <td className="p-3">
                      <Input
                        type="number"
                        step="any"
                        value={p}
                        onChange={e => updatePalier(i, e.target.value)}
                        className="bg-background border-border h-9 w-28"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        step="any"
                        value={cycle1[i] || ""}
                        onChange={e => updateCycle(1, i, e.target.value)}
                        className="bg-background border-border h-9 w-32"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        step="any"
                        value={cycle2[i] || ""}
                        onChange={e => updateCycle(2, i, e.target.value)}
                        className="bg-background border-border h-9 w-32"
                      />
                    </td>
                    <td className="p-3">
                      {paliers.length > 3 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removePalier(i)}>×</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Résultats calculés */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-lg">Résultats calculés</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm text-muted-foreground mb-1">Module EV1 (1er cycle)</p>
              <p className="text-2xl font-bold text-primary">{calc.EV1 > 0 ? fmt(calc.EV1, 1) + " MPa" : "-"}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm text-muted-foreground mb-1">Module EV2 (2ème cycle)</p>
              <p className="text-2xl font-bold text-primary">{calc.EV2 > 0 ? fmt(calc.EV2, 1) + " MPa" : "-"}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm text-muted-foreground mb-1">Rapport K = EV2/EV1</p>
              <p className={`text-2xl font-bold ${calc.K > 0 ? (calc.K <= 2 ? "text-emerald-500" : "text-amber-500") : "text-muted-foreground"}`}>
                {calc.K > 0 ? fmt(calc.K, 2) : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graphique */}
      {chartData.length >= 2 && (
        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="text-lg">Courbe Contrainte - Déformation</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="sigma"
                    type="number"
                    domain={[0, 'dataMax + 0.02']}
                    label={{ value: "Contrainte σ (MPa)", position: "insideBottom", offset: -10 }}
                  />
                  <YAxis
                    reversed
                    label={{ value: "Déformation (mm)", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(3)} mm`,
                      name === "cycle1" ? "Cycle 1" : "Cycle 2"
                    ]}
                    labelFormatter={(v: number) => `σ = ${v} MPa`}
                  />
                  <Legend formatter={(value) => value === "cycle1" ? "Cycle 1" : "Cycle 2"} />
                  <Line type="monotone" dataKey="cycle1" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: "#3b82f6" }} connectNulls />
                  <Line type="monotone" dataKey="cycle2" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: "#ef4444" }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-lg">Observations</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes sur les résultats..."
            className="bg-background border-border min-h-[80px]"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate(basePath)}>Annuler</Button>
        <Button onClick={handleSave} disabled={updateEchantillon.isPending} className="gradient-primary text-primary-foreground">
          {updateEchantillon.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Sauvegarder
        </Button>
      </div>
    </div>
  );
}
