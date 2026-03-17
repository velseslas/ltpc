import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { useEchantillonUltrason } from "@/hooks/useEchantillonsUltrason";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { ReportHeader } from "@/components/reports/ReportHeader";

const UltrasonReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const basePath = "/essais/beton/non-destructif/ultrason";
  const { data: echantillon, isLoading } = useEchantillonUltrason(id ?? "");

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!echantillon) return <div className="text-center py-12 text-muted-foreground">Essai non trouvé</div>;

  const resultats = echantillon.resultats as any;

  const getQualite = (v: number) => {
    if (v > 4500) return "Excellent";
    if (v > 3500) return "Bon";
    if (v > 3000) return "Moyen";
    if (v > 2000) return "Médiocre";
    return "Très mauvais";
  };

  return (
    <div className="space-y-6">
      <EssaiBreadcrumb items={[{ label: "Béton", path: "/essais/beton" }, { label: "Non Destructif", path: "/essais/beton/non-destructif" }, { label: "Ultrason", path: basePath }, { label: "Rapport" }]} />
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(`${basePath}/${id}`)} className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Rapport <span className="text-primary text-glow">Ultrason</span></h1>
            <p className="text-muted-foreground mt-1">US-{String(echantillon.numero).padStart(3, "0")}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => window.print()} className="flex items-center gap-2 print:hidden"><Printer className="h-4 w-4" />Imprimer</Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-8 space-y-8 print:border-0 print:shadow-none">
        <ReportHeader title="RAPPORT D'ESSAI VITESSE ULTRASON" subtitle="NF EN 12504-4" verificationUrl={window.location.href} />

        <div className="grid grid-cols-2 gap-6 text-sm">
          <div><span className="text-muted-foreground">N° d'essai :</span> <span className="font-medium">US-{String(echantillon.numero).padStart(3, "0")}</span></div>
          <div><span className="text-muted-foreground">Date d'essai :</span> <span className="font-medium">{format(new Date(echantillon.date_essai), "PPP", { locale: fr })}</span></div>
          <div><span className="text-muted-foreground">Client :</span> <span className="font-medium">{echantillon.clients?.nom ?? "-"}</span></div>
          <div><span className="text-muted-foreground">Chantier :</span> <span className="font-medium">{echantillon.chantiers?.nom ?? "-"}</span></div>
          <div><span className="text-muted-foreground">Élément testé :</span> <span className="font-medium">{echantillon.element_teste ?? "-"}</span></div>
          <div><span className="text-muted-foreground">Mode de transmission :</span> <span className="font-medium capitalize">{echantillon.mode_transmission ?? "-"}</span></div>
          <div><span className="text-muted-foreground">Fréquence :</span> <span className="font-medium">{echantillon.frequence_khz ? `${echantillon.frequence_khz} kHz` : "-"}</span></div>
          <div><span className="text-muted-foreground">Âge du béton :</span> <span className="font-medium">{echantillon.age_beton_jours ? `${echantillon.age_beton_jours} jours` : "-"}</span></div>
        </div>

        {resultats?.mesures && (
          <>
            <div>
              <h3 className="font-semibold mb-3">Résultats des mesures</h3>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3">Point</th>
                    <th className="text-center py-2 px-3">Distance (mm)</th>
                    <th className="text-center py-2 px-3">Temps (µs)</th>
                    <th className="text-center py-2 px-3">Vitesse (m/s)</th>
                    <th className="text-center py-2 px-3">Qualité</th>
                  </tr>
                </thead>
                <tbody>
                  {(resultats.mesures as any[]).map((m: any, i: number) => {
                    const v = m.distance && m.temps ? Math.round((m.distance / m.temps) * 1000) : null;
                    return (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2 px-3">{i + 1}</td>
                        <td className="text-center py-2 px-3">{m.distance ?? "-"}</td>
                        <td className="text-center py-2 px-3">{m.temps ?? "-"}</td>
                        <td className="text-center py-2 px-3 font-medium">{v ?? "-"}</td>
                        <td className="text-center py-2 px-3">{v ? getQualite(v) : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="border border-border rounded-lg p-4 text-center">
                <span className="text-sm text-muted-foreground">Nb de mesures</span>
                <p className="text-xl font-bold">{resultats.mesures.length}</p>
              </div>
              <div className="border border-primary/50 bg-primary/5 rounded-lg p-4 text-center">
                <span className="text-sm text-muted-foreground">Vitesse moyenne</span>
                <p className="text-xl font-bold text-primary">{resultats.vitesse_moyenne ? `${resultats.vitesse_moyenne} m/s` : "-"}</p>
              </div>
              <div className="border border-border rounded-lg p-4 text-center">
                <span className="text-sm text-muted-foreground">Qualité globale</span>
                <p className="text-xl font-bold">{resultats.qualite ?? "-"}</p>
              </div>
            </div>
          </>
        )}

        <div className="text-xs text-muted-foreground border-t border-border pt-4">
          <p className="font-medium mb-1">Barème de classification :</p>
          <p>{">"} 4500 m/s = Excellent | 3500-4500 = Bon | 3000-3500 = Moyen | 2000-3000 = Médiocre | {"<"} 2000 = Très mauvais</p>
        </div>

        {echantillon.observations && (
          <div>
            <h3 className="font-semibold mb-2">Observations</h3>
            <p className="text-sm text-muted-foreground">{echantillon.observations}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UltrasonReport;
