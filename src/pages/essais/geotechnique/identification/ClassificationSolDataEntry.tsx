import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2, Info } from "lucide-react";
import { GTRUSCSAbaqueButton } from "@/components/essais/geotechnique/GTRUSCSAbaque";
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
  classifyGTR,
  classifyUSCS,
  SOIL_SIEVES,
  type ClassificationInput,
} from "@/components/essais/geotechnique/SoilClassificationGTR";

const basePath = "/essais/geotechnique/identification/classification-sol";
const essaiType = "classification-sol";

function pf(v: string) { return parseFloat(v) || 0; }
function fmt(v: number) { return isNaN(v) || !isFinite(v) ? "" : v.toFixed(2); }

export default function ClassificationSolDataEntry() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: echantillon, isLoading } = useEchantillonGeotechniqueById(essaiType, id);
  const updateEchantillon = useUpdateEchantillonGeotechniqueByType(essaiType);

  const [granulometrie, setGranulometrie] = useState<Record<string, string>>({});
  const [wl, setWl] = useState("");
  const [ip, setIp] = useState("");
  const [vbs, setVbs] = useState("");
  const [matiereOrganique, setMatiereOrganique] = useState("");
  const [caco3, setCaco3] = useState("");

  useEffect(() => {
    if (echantillon?.resultats) {
      const r = echantillon.resultats as Record<string, unknown>;
      if (r.granulometrie) setGranulometrie(r.granulometrie as Record<string, string>);
      if (r.wl !== undefined) setWl(String(r.wl));
      if (r.ip !== undefined) setIp(String(r.ip));
      if (r.vbs !== undefined) setVbs(String(r.vbs));
      if (r.matiere_organique !== undefined) setMatiereOrganique(String(r.matiere_organique));
      if (r.caco3 !== undefined) setCaco3(String(r.caco3));
    }
  }, [echantillon]);

  const updateGranulo = (key: string, value: string) => {
    setGranulometrie(prev => ({ ...prev, [key]: value }));
  };

  const classificationInput: ClassificationInput = useMemo(() => ({
    passant_80mm: pf(granulometrie["80"] || "100"),
    passant_2mm: pf(granulometrie["2"] || "0"),
    passant_80um: pf(granulometrie["0.08"] || "0"),
    wl: pf(wl),
    ip: pf(ip),
    vbs: pf(vbs),
    matiere_organique: pf(matiereOrganique),
    caco3: pf(caco3),
  }), [granulometrie, wl, ip, vbs, matiereOrganique, caco3]);

  const gtrResult = useMemo(() => {
    if (pf(granulometrie["0.08"]) <= 0) return null;
    return classifyGTR(classificationInput);
  }, [classificationInput, granulometrie]);

  const uscsResult = useMemo(() => {
    if (pf(granulometrie["0.08"]) <= 0) return null;
    return classifyUSCS(classificationInput);
  }, [classificationInput, granulometrie]);

  const handleSave = async () => {
    if (!id) return;
    try {
      const resultats = {
        granulometrie,
        wl,
        ip,
        vbs,
        matiere_organique: matiereOrganique,
        caco3,
        classification_gtr: gtrResult ? {
          classe: gtrResult.classe,
          sous_classe: gtrResult.sousClasse,
          label: gtrResult.label,
          description: gtrResult.description,
        } : null,
        classification_uscs: uscsResult ? {
          code: uscsResult.code,
          label: uscsResult.label,
          description: uscsResult.description,
        } : null,
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

  return (
    <div className="space-y-6 animate-fade-in">
      <EssaiBreadcrumb items={[
        { label: "Géotechnique", path: "/essais/geotechnique" },
        { label: "Identification", path: "/essais/geotechnique/identification" },
        { label: "Classification des Sols", path: basePath },
        { label: <><span className="text-primary">{prefix}</span>-{String(echantillon.numero).padStart(3, "0")}</>, path: `${basePath}/${id}` },
        { label: "Saisie" }
      ]} />

      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Saisie - <span className="text-primary">{prefix}-{String(echantillon.numero).padStart(3, "0")}</span>
        </h1>
        <p className="text-muted-foreground mt-1">Classification des Sols (GTR / USCS)</p>
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

      {/* Granulométrie */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-lg">Analyse Granulométrique (% passant)</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/30">
                  <th className="border border-border px-2 py-2 text-left font-medium">Tamis</th>
                  {SOIL_SIEVES.map(s => (
                    <th key={s.value} className="border border-border px-2 py-2 text-center font-medium text-xs whitespace-nowrap">{s.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border px-2 py-1.5 font-medium">% Passant</td>
                  {SOIL_SIEVES.map(s => (
                    <td key={s.value} className="border border-border px-1 py-1">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={granulometrie[String(s.value)] || ""}
                        onChange={e => updateGranulo(String(s.value), e.target.value)}
                        className={inputClass}
                        placeholder="-"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Paramètres Atterberg et complémentaires */}
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-lg">Paramètres d'identification</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label className="text-sm">Limite de liquidité Wl (%)</Label>
              <Input type="number" step="0.01" value={wl} onChange={e => setWl(e.target.value)} className={inputClass} placeholder="Ex: 35" />
            </div>
            <div>
              <Label className="text-sm">Indice de plasticité Ip (%)</Label>
              <Input type="number" step="0.01" value={ip} onChange={e => setIp(e.target.value)} className={inputClass} placeholder="Ex: 15" />
            </div>
            <div>
              <Label className="text-sm">VBS (g/100g)</Label>
              <Input type="number" step="0.01" value={vbs} onChange={e => setVbs(e.target.value)} className={inputClass} placeholder="Ex: 2.5" />
            </div>
            <div>
              <Label className="text-sm">Matière organique (%)</Label>
              <Input type="number" step="0.01" value={matiereOrganique} onChange={e => setMatiereOrganique(e.target.value)} className={inputClass} placeholder="Ex: 1.2" />
            </div>
            <div>
              <Label className="text-sm">CaCO₃ (%)</Label>
              <Input type="number" step="0.01" value={caco3} onChange={e => setCaco3(e.target.value)} className={inputClass} placeholder="Ex: 5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classification automatique */}
      {(gtrResult || uscsResult) && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Classification automatique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {gtrResult && (
                <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Classification GTR (NF P 11-300)</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-base font-bold border-primary/50 text-primary bg-primary/10 px-3 py-1">
                      {gtrResult.sousClasse}
                    </Badge>
                    <span className={`font-semibold ${gtrResult.color}`}>{gtrResult.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{gtrResult.description}</p>
                </div>
              )}
              {uscsResult && (
                <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Classification USCS (ASTM D2487)</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-base font-bold border-primary/50 text-primary bg-primary/10 px-3 py-1">
                      {uscsResult.code}
                    </Badge>
                    <span className={`font-semibold ${uscsResult.color}`}>{uscsResult.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{uscsResult.description}</p>
                </div>
              )}
            </div>

            {/* Key values */}
            <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-3">
              <div className="p-2 rounded bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">Passant 80µm</p>
                <p className="font-bold text-primary">{granulometrie["0.08"] ? `${granulometrie["0.08"]}%` : "-"}</p>
              </div>
              <div className="p-2 rounded bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">Passant 2mm</p>
                <p className="font-bold text-primary">{granulometrie["2"] ? `${granulometrie["2"]}%` : "-"}</p>
              </div>
              <div className="p-2 rounded bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">Wl</p>
                <p className="font-bold text-foreground">{wl ? `${wl}%` : "-"}</p>
              </div>
              <div className="p-2 rounded bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">Ip</p>
                <p className="font-bold text-foreground">{ip ? `${ip}%` : "-"}</p>
              </div>
              <div className="p-2 rounded bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">VBS</p>
                <p className="font-bold text-foreground">{vbs || "-"}</p>
              </div>
              <div className="p-2 rounded bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">MO</p>
                <p className="font-bold text-foreground">{matiereOrganique ? `${matiereOrganique}%` : "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-4">
        <GTRUSCSAbaqueButton
          passant80um={pf(granulometrie["0.08"])}
          passant2mm={pf(granulometrie["2"])}
          ip={pf(ip)}
          vbs={pf(vbs)}
          mo={pf(matiereOrganique)}
          gtrSousClasse={gtrResult?.sousClasse}
          uscsCode={uscsResult?.code}
        />
        <Button variant="outline" onClick={() => navigate(basePath)}>Annuler</Button>
        <Button onClick={handleSave} disabled={updateEchantillon.isPending} className="gradient-primary text-primary-foreground">
          {updateEchantillon.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Sauvegarder
        </Button>
      </div>
    </div>
  );
}
