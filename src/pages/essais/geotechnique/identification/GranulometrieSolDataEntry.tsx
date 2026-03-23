import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, BarChart3 } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GranulometrieSolAbaque from "@/components/essais/geotechnique/GranulometrieSolAbaque";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ReferenceLine } from "recharts";

function pf(v: unknown): number { return parseFloat(String(v ?? "")) || 0; }
function fmt(v: number, dec = 1): string { return isNaN(v) || !isFinite(v) ? "0" : v.toFixed(dec); }

const TAMIS_SOL = [
  125, 80, 63, 50, 40, 31.5, 25, 20, 16, 12.5, 10, 8, 6.3, 5, 4, 2, 1, 0.5, 0.25, 0.125, 0.063
];

// NF EN 13285 envelopes for GNT 0/31.5
const FUSEAU_GNT_0_315 = {
  label: "GNT 0/31.5",
  min: [
    { d: 0.063, p: 2 }, { d: 0.5, p: 10 }, { d: 2, p: 20 }, { d: 4, p: 25 },
    { d: 6.3, p: 30 }, { d: 10, p: 38 }, { d: 16, p: 50 }, { d: 20, p: 58 },
    { d: 25, p: 68 }, { d: 31.5, p: 100 },
  ],
  max: [
    { d: 0.063, p: 9 }, { d: 0.5, p: 30 }, { d: 2, p: 45 }, { d: 4, p: 55 },
    { d: 6.3, p: 60 }, { d: 10, p: 68 }, { d: 16, p: 78 }, { d: 20, p: 85 },
    { d: 25, p: 95 }, { d: 31.5, p: 100 },
  ],
};

function classifyNFEN13285(passants: { d: number; p: number }[]): { classe: string; description: string; conforme: boolean } {
  const get = (d: number) => passants.find(t => Math.abs(t.d - d) < 0.01)?.p ?? null;
  const p0063 = get(0.063);
  const p2 = get(2);

  if (p0063 === null) return { classe: "-", description: "Données insuffisantes", conforme: false };

  // Classification based on fines content (passant 0.063mm)
  if (p0063 <= 3) return { classe: "GNT A", description: "Grave non traitée de type A (f ≤ 3%)", conforme: true };
  if (p0063 <= 7) return { classe: "GNT B", description: "Grave non traitée de type B (3% < f ≤ 7%)", conforme: true };
  if (p0063 <= 12) return { classe: "GNT C", description: "Grave non traitée de type C (7% < f ≤ 12%)", conforme: true };
  return { classe: "Hors norme", description: "Teneur en fines excessive (f > 12%)", conforme: false };
}

export default function GranulometrieSolDataEntry() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const essaiType = "granulometrie-sol";
  const basePath = "/essais/geotechnique/identification/granulometrie-sol";

  const { data: echantillon, isLoading } = useEchantillonGeotechniqueById(essaiType, id);
  const updateEchantillon = useUpdateEchantillonGeotechniqueByType(essaiType);

  const [r, setR] = useState<Record<string, unknown>>({});
  const [showAbaque, setShowAbaque] = useState(false);
  const [typeMateriau, setTypeMateriau] = useState<string>("GNT");

  useEffect(() => {
    if (echantillon?.resultats) {
      const res = echantillon.resultats as Record<string, unknown>;
      setR(res);
      if (res.type_materiau) setTypeMateriau(String(res.type_materiau));
    }
  }, [echantillon]);

  const set = (key: string, value: string) => setR(prev => ({ ...prev, [key]: value }));

  // Auto calculations
  const calc = useMemo(() => {
    const masseHumide = pf(r.masse_humide);
    const m1 = pf(r.masse_seche_m1);
    const m2 = pf(r.masse_apres_lavage_m2);

    // Build tamis data
    const tamisData = TAMIS_SOL.map(d => {
      const refus = pf(r[`refus_${d}`]);
      return { d, refus };
    });

    // Cumulative refus
    let refusCumule = 0;
    const tamisCalc = tamisData.map(t => {
      refusCumule += t.refus;
      const refusCumulePct = m1 > 0 ? (refusCumule / m1) * 100 : 0;
      const passant = 100 - refusCumulePct;
      return {
        ...t,
        refusCumule: parseFloat(refusCumule.toFixed(1)),
        refusCumulePct: parseFloat(refusCumulePct.toFixed(1)),
        passant: parseFloat(Math.max(0, passant).toFixed(1)),
      };
    });

    const fondP = pf(r.fond_p);
    // f = ((M1-M2)+P)/M1 × 100
    const f = m1 > 0 ? ((m1 - m2) + fondP) / m1 * 100 : 0;

    // Classification
    const passants = tamisCalc.map(t => ({ d: t.d, p: t.passant }));
    const classification = classifyNFEN13285(passants);

    // Chart data
    const chartData = tamisCalc
      .filter(t => t.refusCumule > 0 || t.passant < 100)
      .sort((a, b) => a.d - b.d)
      .map(t => ({ d: t.d, passant: t.passant }));

    return { masseHumide, m1, m2, tamisCalc, fondP, f, classification, chartData };
  }, [r]);

  const handleSave = async () => {
    if (!id) return;
    try {
      const hasResults = Object.keys(r).length > 0 &&
        Object.values(r).some(v => v !== null && v !== undefined && v !== "");

      // Store computed values
      const toSave = {
        ...r,
        type_materiau: typeMateriau,
        computed_f: calc.f,
        computed_classification: calc.classification.classe,
        computed_tamis: calc.tamisCalc,
      };

      await updateEchantillon.mutateAsync({
        id,
        resultats: toSave as unknown as Json,
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
  const numero = `${prefix}-${String(echantillon.numero).padStart(3, "0")}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <EssaiBreadcrumb items={[
        { label: "Géotechnique", path: "/essais/geotechnique" },
        { label: "Identification", path: "/essais/geotechnique/identification" },
        { label: "Granulométrie Sol", path: basePath },
        { label: numero, path: `${basePath}/${id}` },
        { label: "Saisie" }
      ]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Saisie — {numero}</h1>
          <p className="text-muted-foreground">Analyse Granulométrique des Sols (NF P 94-056)</p>
        </div>
        <div className="flex gap-2">
          {typeMateriau === "GNT" && (
            <Button variant="outline" onClick={() => setShowAbaque(true)}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Voir Abaque NF EN 13285
            </Button>
          )}
          <Button onClick={handleSave} disabled={updateEchantillon.isPending}>
            {updateEchantillon.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Identification */}
      <Card className="border-border bg-card">
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground">Client :</span> <span className="font-medium">{echantillon.clients?.nom || "-"}</span></div>
            <div><span className="text-muted-foreground">Chantier :</span> <span className="font-medium">{echantillon.chantiers?.nom || "-"}</span></div>
            <div><span className="text-muted-foreground">Type de sol :</span> <span className="font-medium">{echantillon.type_sol}</span></div>
            <div><span className="text-muted-foreground">Date :</span> <span className="font-medium">{format(new Date(echantillon.date_prelevement), "dd/MM/yyyy", { locale: fr })}</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Type Matériau + Masses */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-lg">Paramètres & Masses</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Type de matériau</Label>
              <Select value={typeMateriau} onValueChange={setTypeMateriau}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="GNT">GNT (Grave Non Traitée)</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Masse humide (g)</Label>
              <Input type="number" step="0.1" value={String(r.masse_humide ?? "")} onChange={e => set("masse_humide", e.target.value)} className="bg-background border-border" />
            </div>
            <div>
              <Label>Masse sèche M1 (g)</Label>
              <Input type="number" step="0.1" value={String(r.masse_seche_m1 ?? "")} onChange={e => set("masse_seche_m1", e.target.value)} className="bg-background border-border" />
            </div>
            <div>
              <Label>Masse sèche après lavage M2 (g)</Label>
              <Input type="number" step="0.1" value={String(r.masse_apres_lavage_m2 ?? "")} onChange={e => set("masse_apres_lavage_m2", e.target.value)} className="bg-background border-border" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des tamis */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-lg">Analyse par tamisage</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">DIAMÈTRE TAMIS (mm)</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">REFUS (g)</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">REFUS CUMULÉ (g)</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">REFUS CUMULÉ (%)</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">PASSANT CUMULÉ (%)</th>
                </tr>
              </thead>
              <tbody>
                {calc.tamisCalc.map((t, i) => (
                  <tr key={t.d} className="border-b border-border/50">
                    <td className="py-2 px-2 font-bold text-foreground">{t.d}</td>
                    <td className="py-2 px-2">
                      <Input
                        type="number"
                        step="0.1"
                        value={String(r[`refus_${t.d}`] ?? "")}
                        onChange={e => set(`refus_${t.d}`, e.target.value)}
                        className="w-28 mx-auto bg-background border-border text-center"
                        placeholder="0"
                      />
                    </td>
                    <td className="py-2 px-2 text-center text-muted-foreground">{fmt(t.refusCumule)}</td>
                    <td className="py-2 px-2 text-center text-muted-foreground">{fmt(t.refusCumulePct)}</td>
                    <td className="py-2 px-2 text-center">
                      <span className={`font-bold ${
                        [50, 0.063, 2].some(d => Math.abs(t.d - d) < 0.01) ? "text-primary" : "text-foreground"
                      }`}>
                        {fmt(t.passant)}
                      </span>
                    </td>
                  </tr>
                ))}
                {/* Fond P */}
                <tr className="border-t-2 border-border bg-muted/30">
                  <td className="py-2 px-2 font-bold text-foreground">P</td>
                  <td className="py-2 px-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={String(r.fond_p ?? "")}
                      onChange={e => set("fond_p", e.target.value)}
                      className="w-28 mx-auto bg-background border-border text-center"
                      placeholder="0"
                    />
                  </td>
                  <td className="py-2 px-2 text-center text-muted-foreground" colSpan={2}>
                    f = ((M1-M2)+P)/M1×100
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-primary text-lg">
                    f = {fmt(calc.f, 1)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Classification & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Classification NF EN 13285</p>
            <p className={`text-2xl font-bold mt-1 ${calc.classification.conforme ? "text-primary" : "text-destructive"}`}>
              {calc.classification.classe}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{calc.classification.description}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Passant à 0,063 mm</p>
            <p className="text-2xl font-bold text-primary mt-1">
              {fmt(calc.tamisCalc.find(t => Math.abs(t.d - 0.063) < 0.01)?.passant ?? 0)}%
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Passant à 2 mm</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {fmt(calc.tamisCalc.find(t => Math.abs(t.d - 2) < 0.01)?.passant ?? 0)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fuseau granulométrique */}
      {calc.chartData.length > 1 && (() => {
        const fuseauData = FUSEAU_GNT_0_315.min.map((pt, i) => {
          const sample = calc.tamisCalc.find(t => Math.abs(t.d - pt.d) < 0.01);
          return {
            d: pt.d,
            min: pt.p,
            max: FUSEAU_GNT_0_315.max[i].p,
            passant: sample?.passant ?? null,
          };
        });
        return (
          <Card className="border-border bg-card">
            <CardHeader><CardTitle className="text-lg">Fuseau granulométrique — GNT 0/31.5</CardTitle></CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fuseauData} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="d"
                      scale="log"
                      domain={['auto', 'auto']}
                      tickFormatter={v => `${v}`}
                      label={{ value: 'Ouverture tamis (mm)', position: 'bottom', offset: 10, style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' } }}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={v => `${v}%`}
                      label={{ value: 'Passant cumulé (%)', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' } }}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip formatter={(value: number | null) => value !== null ? [`${value}%`] : ['-']} labelFormatter={l => `Tamis: ${l} mm`} />
                    <Line type="monotone" dataKey="min" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Min fuseau" />
                    <Line type="monotone" dataKey="max" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Max fuseau" />
                    <Line type="monotone" dataKey="passant" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: 'hsl(var(--primary))', r: 4 }} connectNulls name="Échantillon" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Lignes pointillées : limites du fuseau NF EN 13285 (GNT 0/31.5)
              </p>
            </CardContent>
          </Card>
        );
      })()}

      {/* Abaque Dialog */}
      <Dialog open={showAbaque} onOpenChange={setShowAbaque}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Abaque NF EN 13285 — Graves Non Traitées</DialogTitle>
          </DialogHeader>
          <GranulometrieSolAbaque
            tamisData={calc.tamisCalc.map(t => ({ d: t.d, passant: t.passant }))}
            classification={calc.classification}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
