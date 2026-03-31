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
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";

function pf(v: string | number | undefined | null): number {
  return parseFloat(String(v ?? "")) || 0;
}
function fmt(v: number, dec = 2): string {
  return isNaN(v) || !isFinite(v) ? "-" : v.toFixed(dec);
}

interface ProctorPoint {
  tare_num: string;
  m_moule: string;
  m_moule_sol: string;
  m_tare: string;
  m_humide_tare: string;
  m_sec_tare: string;
}

const emptyPoint = (): ProctorPoint => ({
  tare_num: "", m_moule: "", m_moule_sol: "", m_tare: "", m_humide_tare: "", m_sec_tare: ""
});

interface ProctorDataEntryProps {
  essaiType: "proctor-normal" | "proctor-modifie";
}

export default function ProctorDataEntry({ essaiType }: ProctorDataEntryProps) {
  const isModifie = essaiType === "proctor-modifie";
  const essaiTitle = isModifie ? "Essai Proctor Modifié" : "Essai Proctor Normal";
  const norme = isModifie ? "NF P 94-093" : "NF P 94-093";
  const basePath = `/essais/geotechnique/compactage/${essaiType}`;

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: echantillon, isLoading } = useEchantillonGeotechniqueById(essaiType, id);
  const updateEchantillon = useUpdateEchantillonGeotechniqueByType(essaiType);

  const [volume_moule, setVolumeMoule] = useState("948");
  const [points, setPoints] = useState<ProctorPoint[]>([emptyPoint(), emptyPoint(), emptyPoint(), emptyPoint(), emptyPoint()]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (echantillon?.resultats) {
      const r = echantillon.resultats as Record<string, unknown>;
      if (r.volume_moule) setVolumeMoule(r.volume_moule as string);
      if (r.points) setPoints(r.points as ProctorPoint[]);
      if (r.notes) setNotes(r.notes as string);
    }
  }, [echantillon]);

  const updatePoint = (idx: number, field: keyof ProctorPoint, value: string) => {
    setPoints(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const computed = useMemo(() => {
    const vol = pf(volume_moule);
    return points.map(p => {
      const m_moule = pf(p.m_moule);
      const m_moule_sol = pf(p.m_moule_sol);
      const m_tare = pf(p.m_tare);
      const m_humide_tare = pf(p.m_humide_tare);
      const m_sec_tare = pf(p.m_sec_tare);

      const m_sol_humide = m_moule_sol - m_moule;
      const rho_humide = vol > 0 ? (m_sol_humide / vol) * 1000 : 0;

      const m_eau = m_humide_tare - m_sec_tare;
      const m_sec = m_sec_tare - m_tare;
      const w = m_sec > 0 ? (m_eau / m_sec) * 100 : 0;

      const rho_sec = w > 0 ? rho_humide / (1 + w / 100) : (rho_humide > 0 ? rho_humide : 0);

      return { m_sol_humide, rho_humide, m_eau, m_sec, w, rho_sec };
    });
  }, [points, volume_moule]);

  // Find optimum
  const optimum = useMemo(() => {
    const validPoints = computed
      .map((c, i) => ({ w: c.w, rho_sec: c.rho_sec, idx: i }))
      .filter(p => p.w > 0 && p.rho_sec > 0);

    if (validPoints.length < 3) return { w_opt: 0, rho_max: 0 };

    // Polynomial regression (degree 2) to find the maximum
    const sorted = [...validPoints].sort((a, b) => a.w - b.w);
    let maxRho = 0;
    let wAtMax = 0;
    sorted.forEach(p => {
      if (p.rho_sec > maxRho) {
        maxRho = p.rho_sec;
        wAtMax = p.w;
      }
    });

    return { w_opt: wAtMax, rho_max: maxRho };
  }, [computed]);

  // Chart data
  const chartData = useMemo(() => {
    return computed
      .map((c, i) => ({
        w: parseFloat(c.w.toFixed(2)),
        rho_sec: parseFloat(c.rho_sec.toFixed(3)),
        name: `Point ${i + 1}`
      }))
      .filter(p => p.w > 0 && p.rho_sec > 0)
      .sort((a, b) => a.w - b.w);
  }, [computed]);

  const handleSave = async () => {
    if (!id) return;
    try {
      const resultats = {
        volume_moule,
        points,
        notes,
        w_opt: optimum.w_opt.toString(),
        rho_max: optimum.rho_max.toString(),
      };
      const hasResults = computed.some(c => c.w > 0 && c.rho_sec > 0);
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

  return (
    <div className="space-y-6 animate-fade-in">
      <EssaiBreadcrumb items={[
        { label: "Géotechnique", path: "/essais/geotechnique" },
        { label: "Compactage", path: "/essais/geotechnique/compactage" },
        { label: essaiTitle, path: basePath },
        { label: <><span className="text-primary">{prefix}</span>-{String(echantillon.numero).padStart(3, "0")}</>, path: `${basePath}/${id}` },
        { label: "Saisie" }
      ]} />

      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Saisie — <span className="text-primary">{prefix}-{String(echantillon.numero).padStart(3, "0")}</span>
        </h1>
        <p className="text-muted-foreground mt-1">{essaiTitle} ({norme})</p>
      </div>

      {/* Info */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-lg">Informations Échantillon</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><p className="text-sm text-muted-foreground">Client</p><p className="font-medium text-foreground">{echantillon.clients?.nom || "-"}</p></div>
            <div><p className="text-sm text-muted-foreground">Chantier</p><p className="font-medium text-foreground">{echantillon.chantiers?.nom || "-"}</p></div>
            <div><p className="text-sm text-muted-foreground">Type de sol</p><p className="font-medium text-foreground">{echantillon.type_sol}</p></div>
            <div><p className="text-sm text-muted-foreground">Date</p><p className="font-medium text-foreground">{format(new Date(echantillon.date_prelevement), "dd/MM/yyyy", { locale: fr })}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Volume moule */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-lg">Paramètres du moule</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <label className="text-sm text-muted-foreground whitespace-nowrap">Volume du moule (cm³)</label>
            <Input
              type="number" step="any"
              value={volume_moule}
              onChange={e => setVolumeMoule(e.target.value)}
              className="bg-background border-border w-40"
            />
            <span className="text-xs text-muted-foreground">{isModifie ? "Moule CBR (2 296 cm³ typique)" : "Moule Proctor (948 cm³ typique)"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Data entry table */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Points d'essai</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setPoints(prev => [...prev, emptyPoint()])}>
            <Plus className="h-4 w-4 mr-1" /> Ajouter
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Désignation</th>
                  <th className="text-center p-2 text-muted-foreground font-medium text-xs">Unité</th>
                  {points.map((_, i) => (
                    <th key={i} className="text-center p-2 text-muted-foreground font-medium min-w-[100px]">
                      <div className="flex items-center justify-center gap-1">
                        Point {i + 1}
                        {points.length > 3 && (
                          <button onClick={() => setPoints(prev => prev.filter((_, j) => j !== i))} className="text-destructive hover:text-destructive/80">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Input rows */}
                {[
                  { label: "N° de tare", field: "tare_num" as const, unit: "" },
                  { label: "Masse du moule", field: "m_moule" as const, unit: "(g)" },
                  { label: "Masse moule + sol humide", field: "m_moule_sol" as const, unit: "(g)" },
                  { label: "Masse de la tare", field: "m_tare" as const, unit: "(g)" },
                  { label: "Masse humide + tare", field: "m_humide_tare" as const, unit: "(g)" },
                  { label: "Masse sèche + tare", field: "m_sec_tare" as const, unit: "(g)" },
                ].map(row => (
                  <tr key={row.field} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-2 text-foreground">{row.label}</td>
                    <td className="p-2 text-muted-foreground text-xs text-center">{row.unit}</td>
                    {points.map((p, i) => (
                      <td key={i} className="p-2">
                        <Input
                          type={row.field === "tare_num" ? "text" : "number"}
                          step="any"
                          value={p[row.field]}
                          onChange={e => updatePoint(i, row.field, e.target.value)}
                          className="bg-background border-border h-8 text-center text-sm"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Calculated rows */}
                {[
                  { label: "Masse sol humide", key: "m_sol_humide", unit: "(g)", dec: 1 },
                  { label: "ρ humide", key: "rho_humide", unit: "(kg/m³)", dec: 3 },
                  { label: "Masse d'eau", key: "m_eau", unit: "(g)", dec: 1 },
                  { label: "Masse sol sec", key: "m_sec", unit: "(g)", dec: 1 },
                  { label: "Teneur en eau W", key: "w", unit: "(%)", dec: 2 },
                  { label: "ρ sec (γd)", key: "rho_sec", unit: "(kg/m³)", dec: 3 },
                ].map(row => (
                  <tr key={row.key} className={`border-b border-border/50 ${row.key === "rho_sec" ? "bg-primary/5" : ""}`}>
                    <td className="p-2 text-foreground font-medium">{row.label}</td>
                    <td className="p-2 text-muted-foreground text-xs text-center">{row.unit}</td>
                    {computed.map((c, i) => (
                      <td key={i} className="p-2 text-center">
                        <span className={`font-bold ${row.key === "rho_sec" || row.key === "w" ? "text-primary" : "text-foreground"}`}>
                          {(c as Record<string, number>)[row.key] > 0 ? fmt((c as Record<string, number>)[row.key], row.dec) : "-"}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Proctor Curve */}
      {chartData.length >= 2 && (
        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="text-lg">Courbe Proctor</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="w"
                    type="number"
                    domain={['dataMin - 1', 'dataMax + 1']}
                    label={{ value: "Teneur en eau W (%)", position: "insideBottom", offset: -10 }}
                    tickFormatter={v => v.toFixed(1)}
                  />
                  <YAxis
                    dataKey="rho_sec"
                    type="number"
                    domain={['dataMin - 0.02', 'dataMax + 0.02']}
                    label={{ value: "γd (t/m³)", angle: -90, position: "insideLeft", offset: -5 }}
                    tickFormatter={v => v.toFixed(3)}
                  />
                  <Tooltip
                    formatter={(value: number) => [value.toFixed(3) + " t/m³", "γd"]}
                    labelFormatter={(label: number) => `W = ${label.toFixed(2)} %`}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  />
                  {optimum.w_opt > 0 && (
                    <ReferenceLine
                      x={parseFloat(optimum.w_opt.toFixed(2))}
                      stroke="hsl(var(--primary))"
                      strokeDasharray="5 5"
                      label={{ value: `W opt = ${optimum.w_opt.toFixed(2)}%`, position: "top", fill: "hsl(var(--primary))" }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="rho_sec"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 5, fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 7 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résultat principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Teneur en eau optimale (W opt)</p>
          <p className="text-4xl font-bold text-primary">
            {optimum.w_opt > 0 ? fmt(optimum.w_opt) + " %" : "--"}
          </p>
        </div>
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Densité sèche maximale (γd max)</p>
          <p className="text-4xl font-bold text-primary">
            {optimum.rho_max > 0 ? fmt(optimum.rho_max, 3) + " t/m³" : "--"}
          </p>
        </div>
      </div>

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
