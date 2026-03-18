import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const basePath = "/essais/geotechnique/identification/limites-atterberg";
const essaiType = "limites-atterberg";

interface LiquiditeEssai {
  numero_tare: string;
  poids_tare: string;
  poids_tare_sol_humide: string;
  poids_tare_sol_sec: string;
  nombre_coups: string;
}

interface PlasticiteEssai {
  numero_tare: string;
  poids_tare: string;
  poids_tare_sol_humide: string;
  poids_tare_sol_sec: string;
}

const emptyLiquidite = (): LiquiditeEssai => ({
  numero_tare: "", poids_tare: "", poids_tare_sol_humide: "", poids_tare_sol_sec: "", nombre_coups: ""
});

const emptyPlasticite = (): PlasticiteEssai => ({
  numero_tare: "", poids_tare: "", poids_tare_sol_humide: "", poids_tare_sol_sec: ""
});

function pf(v: string) { return parseFloat(v) || 0; }
function fmt(v: number) { return isNaN(v) || !isFinite(v) ? "" : v.toFixed(2); }

// Linear regression
function linearRegression(points: { x: number; y: number }[]) {
  if (points.length < 2) return { slope: 0, intercept: 0 };
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export default function LimitesAtterbergDataEntry() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: echantillon, isLoading } = useEchantillonGeotechniqueById(essaiType, id);
  const updateEchantillon = useUpdateEchantillonGeotechniqueByType(essaiType);

  const [liquidite, setLiquidite] = useState<LiquiditeEssai[]>(
    Array.from({ length: 6 }, emptyLiquidite)
  );
  const [plasticite, setPlasticite] = useState<PlasticiteEssai[]>(
    Array.from({ length: 2 }, emptyPlasticite)
  );
  const [teneurEauW, setTeneurEauW] = useState("");

  useEffect(() => {
    if (echantillon?.resultats) {
      const r = echantillon.resultats as Record<string, unknown>;
      if (r.liquidite) setLiquidite(r.liquidite as LiquiditeEssai[]);
      if (r.plasticite) setPlasticite(r.plasticite as PlasticiteEssai[]);
      if (r.teneur_eau_w !== undefined) setTeneurEauW(String(r.teneur_eau_w));
    }
  }, [echantillon]);

  const updateLiquidite = (idx: number, key: keyof LiquiditeEssai, val: string) => {
    setLiquidite(prev => prev.map((e, i) => i === idx ? { ...e, [key]: val } : e));
  };
  const updatePlasticite = (idx: number, key: keyof PlasticiteEssai, val: string) => {
    setPlasticite(prev => prev.map((e, i) => i === idx ? { ...e, [key]: val } : e));
  };

  // Calculs liquidité
  const calcLiq = useMemo(() => liquidite.map(e => {
    const tare = pf(e.poids_tare);
    const th = pf(e.poids_tare_sol_humide);
    const ts = pf(e.poids_tare_sol_sec);
    const solHumide = th - tare;
    const solSec = ts - tare;
    const eau = solHumide - solSec;
    const teneur = solSec > 0 ? (eau / solSec) * 100 : 0;
    return { solHumide, solSec, eau, teneur, valid: tare > 0 && th > 0 && ts > 0 };
  }), [liquidite]);

  // Calculs plasticité
  const calcPlast = useMemo(() => plasticite.map(e => {
    const tare = pf(e.poids_tare);
    const th = pf(e.poids_tare_sol_humide);
    const ts = pf(e.poids_tare_sol_sec);
    const solHumide = th - tare;
    const solSec = ts - tare;
    const eau = solHumide - solSec;
    const teneur = solSec > 0 ? (eau / solSec) * 100 : 0;
    return { solHumide, solSec, eau, teneur, valid: tare > 0 && th > 0 && ts > 0 };
  }), [plasticite]);

  // Moyenne plasticité
  const moyennePlast = useMemo(() => {
    const valid = calcPlast.filter(c => c.valid);
    if (valid.length === 0) return 0;
    return valid.reduce((s, c) => s + c.teneur, 0) / valid.length;
  }, [calcPlast]);

  // Régression linéaire pour Wl (à 25 coups)
  const regression = useMemo(() => {
    const points = liquidite.map((e, i) => ({
      x: pf(e.nombre_coups),
      y: calcLiq[i].teneur
    })).filter((p, i) => calcLiq[i].valid && p.x > 0);
    
    const reg = linearRegression(points);
    const wl = reg.slope * 25 + reg.intercept;
    return { ...reg, wl, points };
  }, [liquidite, calcLiq]);

  // Moyenne liquidité
  const moyenneLiq = useMemo(() => {
    const valid = calcLiq.filter(c => c.valid);
    if (valid.length === 0) return 0;
    return valid.reduce((s, c) => s + c.teneur, 0) / valid.length;
  }, [calcLiq]);

  const Wp = moyennePlast;
  const Wl = regression.points.length >= 2 ? regression.wl : 0;
  const Ip = Wl > 0 && Wp > 0 ? Wl - Wp : 0;
  const W = pf(teneurEauW);
  const Ic = Ip > 0 ? (Wl - W) / Ip : 0;

  const handleSave = async () => {
    if (!id) return;
    try {
      const resultats = {
        liquidite,
        plasticite,
        teneur_eau_w: teneurEauW,
        calculs: {
          moyenne_liquidite: moyenneLiq,
          moyenne_plasticite: moyennePlast,
          wl: Wl,
          wp: Wp,
          ip: Ip,
          ic: Ic,
          w: W,
          regression: { slope: regression.slope, intercept: regression.intercept }
        }
      };
      await updateEchantillon.mutateAsync({
        id,
        resultats: resultats as unknown as Json,
        statut: "termine",
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

  const inputClass = "bg-background border-border h-9 text-center text-sm";
  const readonlyClass = "bg-muted/50 border-border h-9 text-center text-sm font-medium";

  return (
    <div className="space-y-6 animate-fade-in">
      <EssaiBreadcrumb items={[
        { label: "Géotechnique", path: "/essais/geotechnique" },
        { label: "Identification", path: "/essais/geotechnique/identification" },
        { label: "Limites d'Atterberg", path: basePath },
        { label: <><span className="text-primary">{prefix}</span>-{String(echantillon.numero).padStart(3, "0")}</>, path: `${basePath}/${id}` },
        { label: "Saisie" }
      ]} />

      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Saisie - <span className="text-primary">{prefix}-{String(echantillon.numero).padStart(3, "0")}</span>
        </h1>
        <p className="text-muted-foreground mt-1">Limites d'Atterberg</p>
      </div>

      {/* Info échantillon */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-lg">Informations Échantillon</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div><p className="text-muted-foreground">Client</p><p className="font-medium">{echantillon.clients?.nom || "-"}</p></div>
            <div><p className="text-muted-foreground">Chantier</p><p className="font-medium">{echantillon.chantiers?.nom || "-"}</p></div>
            <div><p className="text-muted-foreground">Type de sol</p><p className="font-medium">{echantillon.type_sol}</p></div>
            <div><p className="text-muted-foreground">Profondeur</p><p className="font-medium">{echantillon.profondeur || "-"}</p></div>
            <div><p className="text-muted-foreground">Date de prélèvement</p><p className="font-medium">{format(new Date(echantillon.date_prelevement), "dd/MM/yyyy", { locale: fr })}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Limite de liquidité */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-lg">Limite de Liquidité</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/30">
                  <th className="border border-border px-2 py-2 text-left font-medium min-w-[180px]">Échantillon</th>
                  {[1,2,3,4,5,6].map(n => (
                    <th key={n} className="border border-border px-2 py-2 text-center font-medium w-24">{n}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border px-2 py-1.5 font-medium">Numéro de la tare (N°)</td>
                  {liquidite.map((e, i) => (
                    <td key={i} className="border border-border px-1 py-1">
                      <Input value={e.numero_tare} onChange={ev => updateLiquidite(i, "numero_tare", ev.target.value)} className={inputClass} />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-border px-2 py-1.5 font-medium">Poids de la tare (g)</td>
                  {liquidite.map((e, i) => (
                    <td key={i} className="border border-border px-1 py-1">
                      <Input type="number" step="0.01" value={e.poids_tare} onChange={ev => updateLiquidite(i, "poids_tare", ev.target.value)} className={inputClass} />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-border px-2 py-1.5 font-medium">Poids Tare + Sol Humide (g)</td>
                  {liquidite.map((e, i) => (
                    <td key={i} className="border border-border px-1 py-1">
                      <Input type="number" step="0.01" value={e.poids_tare_sol_humide} onChange={ev => updateLiquidite(i, "poids_tare_sol_humide", ev.target.value)} className={inputClass} />
                    </td>
                  ))}
                </tr>
                <tr className="bg-muted/20">
                  <td className="border border-border px-2 py-1.5 font-medium">Poids sol humide (g)</td>
                  {calcLiq.map((c, i) => (
                    <td key={i} className="border border-border px-1 py-1">
                      <Input readOnly value={c.valid ? fmt(c.solHumide) : ""} className={readonlyClass} />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-border px-2 py-1.5 font-medium">Poids Tare + Sol Sec (g)</td>
                  {liquidite.map((e, i) => (
                    <td key={i} className="border border-border px-1 py-1">
                      <Input type="number" step="0.01" value={e.poids_tare_sol_sec} onChange={ev => updateLiquidite(i, "poids_tare_sol_sec", ev.target.value)} className={inputClass} />
                    </td>
                  ))}
                </tr>
                <tr className="bg-muted/20">
                  <td className="border border-border px-2 py-1.5 font-medium">Poids Sol Sec (g)</td>
                  {calcLiq.map((c, i) => (
                    <td key={i} className="border border-border px-1 py-1">
                      <Input readOnly value={c.valid ? fmt(c.solSec) : ""} className={readonlyClass} />
                    </td>
                  ))}
                </tr>
                <tr className="bg-muted/20">
                  <td className="border border-border px-2 py-1.5 font-medium">Poids Eau (g)</td>
                  {calcLiq.map((c, i) => (
                    <td key={i} className="border border-border px-1 py-1">
                      <Input readOnly value={c.valid ? fmt(c.eau) : ""} className={readonlyClass} />
                    </td>
                  ))}
                </tr>
                <tr className="bg-primary/10">
                  <td className="border border-border px-2 py-1.5 font-semibold">Teneur en eau % (D/E)*100</td>
                  {calcLiq.map((c, i) => (
                    <td key={i} className="border border-border px-1 py-1">
                      <Input readOnly value={c.valid ? fmt(c.teneur) : ""} className={`${readonlyClass} font-bold`} />
                    </td>
                  ))}
                </tr>
                <tr className="bg-muted/30">
                  <td className="border border-border px-2 py-1.5 font-semibold">Moyenne</td>
                  <td colSpan={6} className="border border-border px-2 py-1.5 text-center font-bold text-primary">
                    {moyenneLiq > 0 ? fmt(moyenneLiq) : "-"}
                  </td>
                </tr>
                <tr>
                  <td className="border border-border px-2 py-1.5 font-medium">Nombre de coups</td>
                  {liquidite.map((e, i) => (
                    <td key={i} className="border border-border px-1 py-1">
                      <Input type="number" value={e.nombre_coups} onChange={ev => updateLiquidite(i, "nombre_coups", ev.target.value)} className={inputClass} />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Limite de plasticité */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-lg">Limite de Plasticité</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse max-w-lg">
              <thead>
                <tr className="bg-muted/30">
                  <th className="border border-border px-2 py-2 text-left font-medium min-w-[180px]">Échantillon</th>
                  <th className="border border-border px-2 py-2 text-center font-medium w-24">1</th>
                  <th className="border border-border px-2 py-2 text-center font-medium w-24">2</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border px-2 py-1.5 font-medium">Numéro de la tare (N°)</td>
                  {plasticite.map((e, i) => (
                    <td key={i} className="border border-border px-1 py-1">
                      <Input value={e.numero_tare} onChange={ev => updatePlasticite(i, "numero_tare", ev.target.value)} className={inputClass} />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-border px-2 py-1.5 font-medium">Poids de la tare (g)</td>
                  {plasticite.map((e, i) => (
                    <td key={i} className="border border-border px-1 py-1">
                      <Input type="number" step="0.01" value={e.poids_tare} onChange={ev => updatePlasticite(i, "poids_tare", ev.target.value)} className={inputClass} />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-border px-2 py-1.5 font-medium">Poids Tare + Sol Humide (g)</td>
                  {plasticite.map((e, i) => (
                    <td key={i} className="border border-border px-1 py-1">
                      <Input type="number" step="0.01" value={e.poids_tare_sol_humide} onChange={ev => updatePlasticite(i, "poids_tare_sol_humide", ev.target.value)} className={inputClass} />
                    </td>
                  ))}
                </tr>
                <tr className="bg-muted/20">
                  <td className="border border-border px-2 py-1.5 font-medium">Poids sol humide (g)</td>
                  {calcPlast.map((c, i) => (
                    <td key={i} className="border border-border px-1 py-1">
                      <Input readOnly value={c.valid ? fmt(c.solHumide) : ""} className={readonlyClass} />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-border px-2 py-1.5 font-medium">Poids Tare + Sol Sec (g)</td>
                  {plasticite.map((e, i) => (
                    <td key={i} className="border border-border px-1 py-1">
                      <Input type="number" step="0.01" value={e.poids_tare_sol_sec} onChange={ev => updatePlasticite(i, "poids_tare_sol_sec", ev.target.value)} className={inputClass} />
                    </td>
                  ))}
                </tr>
                <tr className="bg-muted/20">
                  <td className="border border-border px-2 py-1.5 font-medium">Poids Sol Sec (g)</td>
                  {calcPlast.map((c, i) => (
                    <td key={i} className="border border-border px-1 py-1">
                      <Input readOnly value={c.valid ? fmt(c.solSec) : ""} className={readonlyClass} />
                    </td>
                  ))}
                </tr>
                <tr className="bg-muted/20">
                  <td className="border border-border px-2 py-1.5 font-medium">Poids Eau (g)</td>
                  {calcPlast.map((c, i) => (
                    <td key={i} className="border border-border px-1 py-1">
                      <Input readOnly value={c.valid ? fmt(c.eau) : ""} className={readonlyClass} />
                    </td>
                  ))}
                </tr>
                <tr className="bg-primary/10">
                  <td className="border border-border px-2 py-1.5 font-semibold">Teneur en eau % (D/E)*100</td>
                  {calcPlast.map((c, i) => (
                    <td key={i} className="border border-border px-1 py-1">
                      <Input readOnly value={c.valid ? fmt(c.teneur) : ""} className={`${readonlyClass} font-bold`} />
                    </td>
                  ))}
                </tr>
                <tr className="bg-muted/30">
                  <td className="border border-border px-2 py-1.5 font-semibold">Moyenne</td>
                  <td colSpan={2} className="border border-border px-2 py-1.5 text-center font-bold text-primary">
                    {moyennePlast > 0 ? fmt(moyennePlast) : "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Teneur en eau W */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-lg">Teneur en Eau Naturelle (W)</CardTitle></CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Label>Teneur en eau W (%)</Label>
            <Input type="number" step="0.01" value={teneurEauW} onChange={e => setTeneurEauW(e.target.value)} className="bg-background border-border mt-1" placeholder="Ex: 11.44" />
          </div>
        </CardContent>
      </Card>

      {/* Résultats calculés */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Résultats Calculés</CardTitle>
            {Wl > 0 && Ip > 0 && <AbaqueButton wl={Wl} ip={Ip} />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Limite de liquidité (Wl)</p>
              <p className="text-xl font-bold text-primary">{Wl > 0 ? fmt(Wl) : "-"}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Limite de plasticité (Wp)</p>
              <p className="text-xl font-bold text-primary">{Wp > 0 ? fmt(Wp) : "-"}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Teneur en eau (W)</p>
              <p className="text-xl font-bold text-primary">{W > 0 ? fmt(W) : "-"}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Indice de plasticité (Ip)</p>
              <p className="text-xl font-bold text-primary">{Ip > 0 ? fmt(Ip) : "-"}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Indice de consistance (Ic)</p>
              <p className="text-xl font-bold text-primary">{Ic !== 0 ? fmt(Ic) : "-"}</p>
            </div>
          </div>
          {Wl > 0 && Ip > 0 && (
            <div className="mt-4">
              <ClassificationBadge wl={Wl} ip={Ip} />
            </div>
          )}
          {regression.points.length >= 2 && (
            <p className="text-xs text-muted-foreground mt-3">
              Équation de régression : y = {regression.slope.toFixed(4)}x + {regression.intercept.toFixed(3)}
            </p>
          )}
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
