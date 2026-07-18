import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function pf(v: string | number | undefined | null): number {
  return parseFloat(String(v ?? "")) || 0;
}
function fmt(v: number, dec = 2): string {
  return isNaN(v) || !isFinite(v) ? "-" : v.toFixed(dec);
}

export default function DensitometreDataEntry() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const essaiType = "densitometre";
  const basePath = "/essais/geotechnique/in-situ/densitometre";

  const { data: echantillon, isLoading } = useEchantillonGeotechniqueById(essaiType, id);
  const updateEchantillon = useUpdateEchantillonGeotechniqueByType(essaiType);

  const [r, setR] = useState<Record<string, string>>({});

  useEffect(() => {
    if (echantillon?.resultats) {
      const res = echantillon.resultats as Record<string, string>;
      setR(res);
    }
  }, [echantillon]);

  const set = (key: string, value: string) => setR(prev => ({ ...prev, [key]: value }));

  // Automated calculations
  const calc = useMemo(() => {
    const v0 = pf(r.v0);
    const v1 = pf(r.v1);
    const V = v1 - v0; // Volume du trou
    const M = pf(r.M); // Masse sol extrait
    const tare = pf(r.tare);
    const H = pf(r.H); // tare + sol humide
    const S = pf(r.S); // tare + sol sec
    const I = S - tare; // sol sec
    const E = H - S; // Poids de l'eau
    const W = I > 0 ? (E / I) * 100 : 0; // teneur en eau %
    const P = V > 0 ? M / V : 0; // densité humide g/cm3
    const Pd = (100 + W) > 0 ? (P * 100) / (100 + W) : 0; // densité sèche g/cm3
    const yd_max = pf(r.yd_max);
    const compactage = yd_max > 0 ? (Pd / yd_max) * 100 : 0;

    return { V, M, tare, H, S, I, E, W, P, Pd, yd_max, compactage };
  }, [r]);

  const handleSave = async () => {
    if (!id) return;
    try {
      const resultats = {
        ...r,
        // Store calculated values too
        V_calc: calc.V.toString(),
        I_calc: calc.I.toString(),
        E_calc: calc.E.toString(),
        W_calc: calc.W.toString(),
        P_calc: calc.P.toString(),
        Pd_calc: calc.Pd.toString(),
        compactage_calc: calc.compactage.toString(),
      };

      const hasResults = pf(r.v0) > 0 || pf(r.v1) > 0 || pf(r.M) > 0;

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
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!echantillon) {
    return <div className="text-center py-8 text-muted-foreground">Échantillon non trouvé</div>;
  }

  const prefix = getGeoPrefix(essaiType);

  const rows: { symbol: string; label: string; formula?: string; unit: string; inputKey?: string; calculated?: number }[] = [
    { symbol: "V0", label: "Volume initial", unit: "cm³", inputKey: "v0" },
    { symbol: "V1", label: "Volume final", unit: "cm³", inputKey: "v1" },
    { symbol: "V", label: "Volume du trou", formula: "(V1 - V0)", unit: "cm³", calculated: calc.V },
    { symbol: "M", label: "Masse du sol extrait du trou", unit: "g", inputKey: "M" },
    { symbol: "", label: "Tare", unit: "g", inputKey: "tare" },
    { symbol: "H", label: "Tare + sol humide", unit: "g", inputKey: "H" },
    { symbol: "S", label: "Tare + sol sec", unit: "g", inputKey: "S" },
    { symbol: "I", label: "Sol sec", formula: "(S - Tare)", unit: "g", calculated: calc.I },
    { symbol: "E", label: "Poids de l'eau", formula: "(H - S)", unit: "g", calculated: calc.E },
    { symbol: "W", label: "Teneur en eau", formula: "(E / I × 100)", unit: "%", calculated: calc.W },
    { symbol: "P", label: "Densité humide", formula: "(M / V)", unit: "g/cm³", calculated: calc.P },
    { symbol: "Pd", label: "Densité sèche", formula: "(P×100 / (100+W))", unit: "g/cm³", calculated: calc.Pd },
  ];

  return (
    <div data-essai-mobile className="space-y-6 animate-fade-in">
      <EssaiBreadcrumb items={[
        { label: "Géotechnique", path: "/essais/geotechnique" },
        { label: "In-Situ", path: "/essais/geotechnique/in-situ" },
        { label: "Densitomètre", path: basePath },
        { label: <><span className="text-primary">{prefix}</span>-{String(echantillon.numero).padStart(3, "0")}</>, path: `${basePath}/${id}` },
        { label: "Saisie" }
      ]} />

      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Saisie — <span className="text-primary">{prefix}-{String(echantillon.numero).padStart(3, "0")}</span>
        </h1>
        <p className="text-muted-foreground mt-1">Densitomètre à Membrane</p>
      </div>

      {/* Info échantillon */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-lg">Informations Échantillon</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="font-medium text-foreground">{echantillon.clients?.nom || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Chantier</p>
              <p className="font-medium text-foreground">{echantillon.chantiers?.nom || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date de prélèvement</p>
              <p className="font-medium text-foreground">
                {format(new Date(echantillon.date_prelevement), "dd/MM/yyyy", { locale: fr })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau de saisie */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-lg">Mesures et Résultats</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-muted-foreground font-medium w-16">Symbole</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Désignation</th>
                  <th className="text-left p-3 text-muted-foreground font-medium w-32">Formule</th>
                  <th className="text-left p-3 text-muted-foreground font-medium w-20">Unité</th>
                  <th className="text-left p-3 text-muted-foreground font-medium w-40">Valeur</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-3 font-bold text-foreground">{row.symbol}</td>
                    <td className="p-3 text-foreground">{row.label}</td>
                    <td className="p-3 text-muted-foreground text-sm">{row.formula || ""}</td>
                    <td className="p-3 font-medium text-muted-foreground">{row.unit}</td>
                    <td className="p-3">
                      {row.inputKey ? (
                        <Input
                          type="number"
                          step="any"
                          value={r[row.inputKey] || ""}
                          onChange={e => set(row.inputKey!, e.target.value)}
                          className="bg-background border-border h-9"
                        />
                      ) : (
                        <span className="text-primary font-bold text-lg">
                          {row.calculated !== undefined ? fmt(row.calculated) : "-"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {/* Evd row */}
                <tr className="border-b border-border/50 bg-muted/30">
                  <td className="p-3 font-bold text-foreground" colSpan={2}>Evd</td>
                  <td className="p-3" colSpan={1}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">γd max</span>
                      <Input
                        type="number"
                        step="any"
                        value={r.yd_max || ""}
                        onChange={e => set("yd_max", e.target.value)}
                        className="bg-background border-border h-9 w-24"
                        placeholder="g/cm³"
                      />
                    </div>
                  </td>
                  <td className="p-3 text-center text-sm text-muted-foreground">% Compactage</td>
                  <td className="p-3">
                    <span className={`font-bold text-lg ${calc.compactage >= 95 ? "text-emerald-500" : calc.compactage > 0 ? "text-amber-500" : "text-muted-foreground"}`}>
                      {calc.compactage > 0 ? fmt(calc.compactage, 1) + " %" : "-"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-lg">Observations</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            value={r.notes || ""}
            onChange={e => set("notes", e.target.value)}
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
