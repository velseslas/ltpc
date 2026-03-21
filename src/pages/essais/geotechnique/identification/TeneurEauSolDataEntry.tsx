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

function pf(v: string | number | undefined | null): number {
  return parseFloat(String(v ?? "")) || 0;
}
function fmt(v: number, dec = 2): string {
  return isNaN(v) || !isFinite(v) ? "-" : v.toFixed(dec);
}

export default function TeneurEauSolDataEntry() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const essaiType = "teneur-eau-sol";
  const basePath = "/essais/geotechnique/identification/teneur-eau-sol";

  const { data: echantillon, isLoading } = useEchantillonGeotechniqueById(essaiType, id);
  const updateEchantillon = useUpdateEchantillonGeotechniqueByType(essaiType);

  const [r, setR] = useState<Record<string, string>>({});

  useEffect(() => {
    if (echantillon?.resultats) {
      setR(echantillon.resultats as Record<string, string>);
    }
  }, [echantillon]);

  const set = (key: string, value: string) => setR(prev => ({ ...prev, [key]: value }));

  const calc = useMemo(() => {
    const prises = [1, 2].map(n => {
      const m1 = pf(r[`p${n}_m1`]);
      const m2 = pf(r[`p${n}_m2`]);
      const m3 = pf(r[`p${n}_m3`]);
      const mh = m2 - m1;
      const md = m3 - m1;
      const mw = m2 - m3;
      const W = md > 0 ? (mw / md) * 100 : 0;
      return { m1, m2, m3, mh, md, mw, W };
    });

    const validW = prises.filter(p => p.W > 0);
    const moyen = validW.length > 0 ? validW.reduce((s, p) => s + p.W, 0) / validW.length : 0;

    return { prises, moyen };
  }, [r]);

  const handleSave = async () => {
    if (!id) return;
    try {
      const resultats = {
        ...r,
        moyen_calc: calc.moyen.toString(),
      };

      const hasResults = pf(r.p1_m2) > 0 || pf(r.p2_m2) > 0;

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

  const rows: { label: string; unit: string; inputKeys?: [string, string]; calculated?: [number, number] }[] = [
    { label: "Numéro de la tare", unit: "", inputKeys: ["p1_tare_num", "p2_tare_num"] },
    { label: "Poids du récipient m₁", unit: "(g)", inputKeys: ["p1_m1", "p2_m1"] },
    { label: "Poids de l'ensemble (échantillon humide + récipient) m₂", unit: "(g)", inputKeys: ["p1_m2", "p2_m2"] },
    { label: "Poids de l'échantillon humide  mh = m₂ – m₁", unit: "(g)", calculated: [calc.prises[0].mh, calc.prises[1].mh] },
    { label: "Poids de l'ensemble (échantillon sec + récipient) m₃", unit: "(g)", inputKeys: ["p1_m3", "p2_m3"] },
    { label: "Poids de l'échantillon sec  md = m₃ – m₁", unit: "(g)", calculated: [calc.prises[0].md, calc.prises[1].md] },
    { label: "Poids de l'eau  mw = m₂ – m₃", unit: "(g)", calculated: [calc.prises[0].mw, calc.prises[1].mw] },
    { label: "Teneur en eau  W = (mw / md) × 100", unit: "(%)", calculated: [calc.prises[0].W, calc.prises[1].W] },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <EssaiBreadcrumb items={[
        { label: "Géotechnique", path: "/essais/geotechnique" },
        { label: "Identification", path: "/essais/geotechnique/identification" },
        { label: "Teneur en Eau", path: basePath },
        { label: <><span className="text-primary">{prefix}</span>-{String(echantillon.numero).padStart(3, "0")}</>, path: `${basePath}/${id}` },
        { label: "Saisie" }
      ]} />

      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Saisie — <span className="text-primary">{prefix}-{String(echantillon.numero).padStart(3, "0")}</span>
        </h1>
        <p className="text-muted-foreground mt-1">Teneur en Eau des Sols (NF P 94-050)</p>
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
        <CardHeader><CardTitle className="text-lg">Expression des Résultats</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-muted-foreground font-medium">Essais</th>
                  <th className="text-center p-3 text-muted-foreground font-medium w-12"></th>
                  <th className="text-center p-3 text-muted-foreground font-medium w-36">Prise 01</th>
                  <th className="text-center p-3 text-muted-foreground font-medium w-36">Prise 02</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-3 text-foreground text-sm">{row.label}</td>
                    <td className="p-3 text-muted-foreground text-xs text-center">{row.unit}</td>
                    <td className="p-3 text-center">
                      {row.inputKeys ? (
                        <Input
                          type={row.inputKeys[0].includes("tare_num") ? "text" : "number"}
                          step="any"
                          value={r[row.inputKeys[0]] || ""}
                          onChange={e => set(row.inputKeys![0], e.target.value)}
                          className="bg-background border-border h-9 text-center"
                        />
                      ) : (
                        <span className="text-primary font-bold">
                          {row.calculated && row.calculated[0] !== 0 ? fmt(row.calculated[0], i === rows.length - 1 ? 2 : 1) : "-"}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {row.inputKeys ? (
                        <Input
                          type={row.inputKeys[1].includes("tare_num") ? "text" : "number"}
                          step="any"
                          value={r[row.inputKeys[1]] || ""}
                          onChange={e => set(row.inputKeys![1], e.target.value)}
                          className="bg-background border-border h-9 text-center"
                        />
                      ) : (
                        <span className="text-primary font-bold">
                          {row.calculated && row.calculated[1] !== 0 ? fmt(row.calculated[1], i === rows.length - 1 ? 2 : 1) : "-"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {/* MOYEN */}
                <tr className="border-t-2 border-primary/30 bg-muted/30">
                  <td className="p-3 font-bold text-foreground" colSpan={2}>MOYEN</td>
                  <td className="p-3 text-center" colSpan={2}>
                    <span className="text-primary font-bold text-xl">
                      {calc.moyen > 0 ? fmt(calc.moyen) + " %" : "-"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Résultat principal */}
      <div className="bg-primary/10 border border-primary/30 rounded-lg p-6 text-center">
        <p className="text-sm text-muted-foreground mb-2">Teneur en Eau Moyenne (W)</p>
        <p className="text-4xl font-bold text-primary">
          {calc.moyen > 0 ? fmt(calc.moyen) + " %" : "--"}
        </p>
      </div>

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
