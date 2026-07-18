import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, Plus, Trash2 } from "lucide-react";
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
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from "recharts";

function pf(v: string | number | undefined | null): number {
  return parseFloat(String(v ?? "")) || 0;
}
function fmt(v: number, dec = 2): string {
  return isNaN(v) || !isFinite(v) ? "-" : v.toFixed(dec);
}

// Standard CBR reference forces (kN)
const CBR_REF_2_5 = 13.35; // kN at 2.5mm penetration
const CBR_REF_5_0 = 19.93; // kN at 5.0mm penetration

// Standard penetration readings (mm)
const STANDARD_PENETRATIONS = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 7.5, 10.0];

interface CBRMoule {
  nombre_coups: string;
  volume_moule: string;
  m_moule: string;
  m_moule_sol: string;
  m_tare: string;
  m_humide_tare: string;
  m_sec_tare: string;
  readings: Record<string, string>; // penetration -> force reading in kN
}

const emptyMoule = (coups: string): CBRMoule => ({
  nombre_coups: coups,
  volume_moule: "2296",
  m_moule: "", m_moule_sol: "",
  m_tare: "", m_humide_tare: "", m_sec_tare: "",
  readings: {}
});

export default function CBRDataEntry() {
  const essaiType = "cbr";
  const basePath = "/essais/geotechnique/compactage/cbr";
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: echantillon, isLoading } = useEchantillonGeotechniqueById(essaiType, id);
  const updateEchantillon = useUpdateEchantillonGeotechniqueByType(essaiType);

  const [moules, setMoules] = useState<CBRMoule[]>([
    emptyMoule("10"), emptyMoule("25"), emptyMoule("56")
  ]);
  const [notes, setNotes] = useState("");
  const [surcharge, setSurcharge] = useState("4.5");
  const [immersion_jours, setImmersionJours] = useState("4");

  useEffect(() => {
    if (echantillon?.resultats) {
      const r = echantillon.resultats as Record<string, unknown>;
      if (r.moules) setMoules(r.moules as CBRMoule[]);
      if (r.notes) setNotes(r.notes as string);
      if (r.surcharge) setSurcharge(r.surcharge as string);
      if (r.immersion_jours) setImmersionJours(r.immersion_jours as string);
    }
  }, [echantillon]);

  const updateMoule = (idx: number, field: keyof Omit<CBRMoule, 'readings'>, value: string) => {
    setMoules(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const updateReading = (mouleIdx: number, pen: string, value: string) => {
    setMoules(prev => {
      const updated = [...prev];
      updated[mouleIdx] = {
        ...updated[mouleIdx],
        readings: { ...updated[mouleIdx].readings, [pen]: value }
      };
      return updated;
    });
  };

  const computed = useMemo(() => {
    return moules.map(m => {
      const vol = pf(m.volume_moule);
      const m_moule = pf(m.m_moule);
      const m_moule_sol = pf(m.m_moule_sol);
      const m_tare = pf(m.m_tare);
      const m_humide_tare = pf(m.m_humide_tare);
      const m_sec_tare = pf(m.m_sec_tare);

      const m_sol_humide = m_moule_sol - m_moule;
      const rho_humide = vol > 0 ? (m_sol_humide / vol) * 1000 : 0;
      const m_eau = m_humide_tare - m_sec_tare;
      const m_sec = m_sec_tare - m_tare;
      const w = m_sec > 0 ? (m_eau / m_sec) * 100 : 0;
      const rho_sec = w > 0 ? rho_humide / (1 + w / 100) : 0;

      // CBR calculations
      const force_2_5 = pf(m.readings["2.5"]);
      const force_5_0 = pf(m.readings["5.0"] || m.readings["5"]);
      const cbr_2_5 = force_2_5 > 0 ? (force_2_5 / CBR_REF_2_5) * 100 : 0;
      const cbr_5_0 = force_5_0 > 0 ? (force_5_0 / CBR_REF_5_0) * 100 : 0;
      const cbr = Math.max(cbr_2_5, cbr_5_0);

      // Chart data for this moule
      const curveData = STANDARD_PENETRATIONS.map(pen => ({
        penetration: pen,
        force: pf(m.readings[pen.toString()])
      })).filter(p => p.force > 0 || p.penetration === 0);

      return { m_sol_humide, rho_humide, m_eau, m_sec, w, rho_sec, cbr_2_5, cbr_5_0, cbr, curveData };
    });
  }, [moules]);

  // CBR vs density chart
  const cbrDensityData = useMemo(() => {
    return computed
      .map((c, i) => ({
        rho_sec: parseFloat(c.rho_sec.toFixed(3)),
        cbr: parseFloat(c.cbr.toFixed(1)),
        coups: moules[i].nombre_coups
      }))
      .filter(p => p.rho_sec > 0 && p.cbr > 0)
      .sort((a, b) => a.rho_sec - b.rho_sec);
  }, [computed, moules]);

  const handleSave = async () => {
    if (!id) return;
    try {
      const resultats = {
        moules,
        notes,
        surcharge,
        immersion_jours,
        cbr_values: computed.map((c, i) => ({
          coups: moules[i].nombre_coups,
          cbr: c.cbr,
          rho_sec: c.rho_sec,
          w: c.w
        }))
      };
      const hasResults = computed.some(c => c.cbr > 0);
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

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!echantillon) return <div className="text-center py-8 text-muted-foreground">Échantillon non trouvé</div>;

  const prefix = getGeoPrefix(essaiType);
  const colors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b"];

  return (
    <div data-essai-mobile className="space-y-6 animate-fade-in">
      <EssaiBreadcrumb items={[
        { label: "Géotechnique", path: "/essais/geotechnique" },
        { label: "Compactage", path: "/essais/geotechnique/compactage" },
        { label: "Essai CBR", path: basePath },
        { label: <><span className="text-primary">{prefix}</span>-{String(echantillon.numero).padStart(3, "0")}</>, path: `${basePath}/${id}` },
        { label: "Saisie" }
      ]} />

      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Saisie — <span className="text-primary">{prefix}-{String(echantillon.numero).padStart(3, "0")}</span>
        </h1>
        <p className="text-muted-foreground mt-1">Essai CBR (NF P 94-078)</p>
      </div>

      {/* Info */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-lg">Informations Échantillon</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><p className="text-sm text-muted-foreground">Client</p><p className="font-medium text-foreground">{echantillon.clients?.nom || "-"}</p></div>
            <div><p className="text-sm text-muted-foreground">Chantier</p><p className="font-medium text-foreground">{echantillon.chantiers?.nom || "-"}</p></div>
            <div><p className="text-sm text-muted-foreground">Carrière</p><p className="font-medium text-foreground">{(echantillon as any).carrieres?.nom || "-"}</p></div>
            <div><p className="text-sm text-muted-foreground">Type de sol</p><p className="font-medium text-foreground">{echantillon.type_sol}</p></div>
            <div><p className="text-sm text-muted-foreground">Date de prélèvement</p><p className="font-medium text-foreground">{format(new Date(echantillon.date_prelevement), "dd/MM/yyyy", { locale: fr })}</p></div>
            <div><p className="text-sm text-muted-foreground">Date d'essai</p><p className="font-medium text-foreground">{(echantillon as any).date_essai ? format(new Date((echantillon as any).date_essai), "dd/MM/yyyy", { locale: fr }) : "-"}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Paramètres */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-lg">Paramètres d'essai</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground whitespace-nowrap">Surcharge (kg)</label>
              <Input type="number" step="any" value={surcharge} onChange={e => setSurcharge(e.target.value)} className="bg-background border-border w-32" />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground whitespace-nowrap">Durée d'immersion (jours)</label>
              <Input type="number" value={immersion_jours} onChange={e => setImmersionJours(e.target.value)} className="bg-background border-border w-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Moules */}
      {moules.map((moule, mIdx) => (
        <Card key={mIdx} className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Moule {mIdx + 1} — {moule.nombre_coups} coups</CardTitle>
            {moules.length > 1 && (
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setMoules(prev => prev.filter((_, i) => i !== mIdx))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Compactage data */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Nbre de coups", field: "nombre_coups" as const },
                { label: "Volume moule (cm³)", field: "volume_moule" as const },
                { label: "Masse moule (g)", field: "m_moule" as const },
                { label: "Masse moule+sol (g)", field: "m_moule_sol" as const },
                { label: "Masse tare (g)", field: "m_tare" as const },
                { label: "Masse humide+tare (g)", field: "m_humide_tare" as const },
                { label: "Masse sèche+tare (g)", field: "m_sec_tare" as const },
              ].map(f => (
                <div key={f.field}>
                  <label className="text-xs text-muted-foreground">{f.label}</label>
                  <Input type="number" step="any" value={moule[f.field]}
                    onChange={e => updateMoule(mIdx, f.field, e.target.value)}
                    className="bg-background border-border h-8 text-sm" />
                </div>
              ))}
            </div>

            {/* Computed results */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 bg-muted/30 rounded-lg p-3">
              {[
                { label: "W (%)", val: computed[mIdx]?.w, dec: 2 },
                { label: "ρd (t/m³)", val: computed[mIdx]?.rho_sec, dec: 3 },
                { label: "CBR 2.5mm", val: computed[mIdx]?.cbr_2_5, dec: 1 },
                { label: "CBR 5.0mm", val: computed[mIdx]?.cbr_5_0, dec: 1 },
                { label: "CBR retenu", val: computed[mIdx]?.cbr, dec: 1 },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="font-bold text-primary">{item.val > 0 ? fmt(item.val, item.dec) : "-"}</p>
                </div>
              ))}
            </div>

            {/* Penetration readings */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Lectures de pénétration (Force en kN)</h4>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {STANDARD_PENETRATIONS.filter(p => p > 0).map(pen => (
                  <div key={pen}>
                    <label className="text-xs text-muted-foreground">{pen} mm</label>
                    <Input type="number" step="any"
                      value={moule.readings[pen.toString()] || ""}
                      onChange={e => updateReading(mIdx, pen.toString(), e.target.value)}
                      className={`bg-background border-border h-8 text-sm ${pen === 2.5 || pen === 5.0 ? "border-primary/50" : ""}`} />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={() => setMoules(prev => [...prev, emptyMoule(String((prev.length + 1) * 10))])}>
        <Plus className="h-4 w-4 mr-1" /> Ajouter un moule
      </Button>

      {/* Force-Penetration curves */}
      {computed.some(c => c.curveData.length >= 2) && (
        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="text-lg">Courbes Force-Pénétration</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="penetration" type="number"
                    domain={[0, 'dataMax + 1']}
                    label={{ value: "Pénétration (mm)", position: "insideBottom", offset: -10 }}
                  />
                  <YAxis
                    label={{ value: "Force (kN)", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  />
                  <Legend />
                  <ReferenceLine x={2.5} stroke="#999" strokeDasharray="3 3" label="2.5mm" />
                  <ReferenceLine x={5.0} stroke="#999" strokeDasharray="3 3" label="5.0mm" />
                  {moules.map((m, i) => (
                    computed[i].curveData.length >= 2 && (
                      <Line
                        key={i}
                        data={computed[i].curveData}
                        type="monotone"
                        dataKey="force"
                        name={`${m.nombre_coups} coups`}
                        stroke={colors[i % colors.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                      />
                    )
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CBR vs Density chart */}
      {cbrDensityData.length >= 2 && (
        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="text-lg">CBR en fonction de la densité sèche</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cbrDensityData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="rho_sec" type="number"
                    label={{ value: "ρd (t/m³)", position: "insideBottom", offset: -10 }}
                    tickFormatter={v => v.toFixed(3)} />
                  <YAxis label={{ value: "CBR (%)", angle: -90, position: "insideLeft" }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="cbr" stroke="hsl(var(--primary))" strokeWidth={2}
                    dot={{ r: 5, fill: "hsl(var(--primary))" }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résultats CBR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {moules.map((m, i) => (
          <div key={i} className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">{m.nombre_coups} coups</p>
            <p className="text-3xl font-bold text-primary">
              {computed[i]?.cbr > 0 ? fmt(computed[i].cbr, 1) : "--"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Indice CBR</p>
          </div>
        ))}
      </div>

      {/* Notes */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-lg">Observations</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Notes sur les résultats..."
            className="bg-background border-border min-h-[80px]" />
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
