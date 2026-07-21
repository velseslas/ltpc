import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, ClipboardEdit, FileBarChart, Loader2 } from "lucide-react";
import { useEchantillonUltrason } from "@/hooks/useEchantillonsUltrason";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { ModificationsHistory } from "@/components/essais/ModificationsHistory";
import { Badge } from "@/components/ui/badge";

const UltrasonDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: echantillon, isLoading } = useEchantillonUltrason(id ?? "");
  const basePath = "/essais/beton/non-destructif/ultrason";

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!echantillon) return <div className="text-center py-12 text-muted-foreground">Essai non trouvé</div>;

  const resultats = echantillon.resultats as any;

  const getQualiteLabel = (vitesse: number) => {
    if (vitesse > 4500) return { label: "Excellent", className: "text-emerald-500" };
    if (vitesse > 3500) return { label: "Bon", className: "text-sky-500" };
    if (vitesse > 3000) return { label: "Moyen", className: "text-yellow-500" };
    if (vitesse > 2000) return { label: "Médiocre", className: "text-orange-500" };
    return { label: "Très mauvais", className: "text-destructive" };
  };

  return (
    <div className="space-y-6">
      <EssaiBreadcrumb items={[{ label: "Béton", path: "/essais/beton" }, { label: "Non Destructif", path: "/essais/beton/non-destructif" }, { label: "Ultrason", path: basePath }, { label: `US-${String(echantillon.numero).padStart(3, "0")}` }]} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3 sm:gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(basePath)} className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50 shrink-0"><ArrowLeft className="h-5 w-5" /></Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-display font-bold text-foreground">Essai Ultrason <span className="text-primary">US-{String(echantillon.numero).padStart(3, "0")}</span></h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">NF EN 12504-4</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center lg:justify-end">
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => navigate(`${basePath}/${id}/saisie`)}><ClipboardEdit className="h-4 w-4 mr-2" />Saisie</Button>
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => navigate(`${basePath}/${id}/rapport`)}><FileBarChart className="h-4 w-4 mr-2" />Rapport</Button>
          <Button size="sm" className="w-full sm:w-auto" onClick={() => navigate(`${basePath}/${id}/modifier`)}><Pencil className="h-4 w-4 mr-2" />Modifier</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Informations générales</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Client</span><p className="font-medium">{echantillon.clients?.nom ?? "-"}</p></div>
            <div><span className="text-muted-foreground">Chantier</span><p className="font-medium">{echantillon.chantiers?.nom ?? "-"}</p></div>
            <div><span className="text-muted-foreground">Date d'essai</span><p className="font-medium">{format(new Date(echantillon.date_essai), "PPP", { locale: fr })}</p></div>
            <div><span className="text-muted-foreground">Statut</span><p><Badge variant="outline">{echantillon.statut}</Badge></p></div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Détails de l'essai</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Ouvrage</span><p className="font-medium">{echantillon.ouvrage ?? "-"}</p></div>
            <div><span className="text-muted-foreground">Partie de l'ouvrage</span><p className="font-medium">{echantillon.partie_ouvrage ?? "-"}</p></div>
            <div><span className="text-muted-foreground">Mode de transmission</span><p className="font-medium capitalize">{echantillon.mode_transmission ?? "-"}</p></div>
            <div><span className="text-muted-foreground">Fréquence</span><p className="font-medium">{echantillon.frequence_khz ? `${echantillon.frequence_khz} kHz` : "-"}</p></div>
            <div><span className="text-muted-foreground">Âge du béton</span><p className="font-medium">{echantillon.age_beton_jours ? `${echantillon.age_beton_jours} jours` : "-"}</p></div>
            <div><span className="text-muted-foreground">Classe de résistance</span><p className="font-medium">{echantillon.classe_resistance ?? "-"}</p></div>
          </div>
        </div>
      </div>

      {resultats && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Résultats</h2>
          {resultats.mesures && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-muted-foreground">Point</th>
                    <th className="text-center py-2 text-muted-foreground">Distance (mm)</th>
                    <th className="text-center py-2 text-muted-foreground">Temps (µs)</th>
                    <th className="text-center py-2 text-muted-foreground">Vitesse (m/s)</th>
                    <th className="text-center py-2 text-muted-foreground">Qualité</th>
                  </tr>
                </thead>
                <tbody>
                  {(resultats.mesures as any[]).map((m: any, i: number) => {
                    const vitesse = m.distance && m.temps ? Math.round((m.distance / m.temps) * 1000) : null;
                    const qualite = vitesse ? getQualiteLabel(vitesse) : null;
                    return (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2">{i + 1}</td>
                        <td className="text-center">{m.distance ?? "-"}</td>
                        <td className="text-center">{m.temps ?? "-"}</td>
                        <td className="text-center font-medium">{vitesse ?? "-"}</td>
                        <td className={`text-center font-medium ${qualite?.className ?? ""}`}>{qualite?.label ?? "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {resultats.vitesse_moyenne && (
            <div className="flex gap-6 mt-4">
              <div className="rounded-lg bg-primary/10 border border-primary/30 p-4">
                <span className="text-sm text-muted-foreground">Vitesse moyenne</span>
                <p className="text-2xl font-bold text-primary">{resultats.vitesse_moyenne} m/s</p>
              </div>
              <div className={`rounded-lg p-4 border ${resultats.vitesse_moyenne > 3500 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-yellow-500/10 border-yellow-500/30"}`}>
                <span className="text-sm text-muted-foreground">Qualité</span>
                <p className={`text-2xl font-bold ${getQualiteLabel(resultats.vitesse_moyenne).className}`}>{getQualiteLabel(resultats.vitesse_moyenne).label}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {echantillon.observations && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-2">Observations</h2>
          <p className="text-muted-foreground">{echantillon.observations}</p>
        </div>
      )}

      {id && <ModificationsHistory tableName="echantillons_ultrason" recordId={id} />}
    </div>
  );
};

export default UltrasonDetail;
