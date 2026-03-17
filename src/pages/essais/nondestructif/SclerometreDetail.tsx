import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, ClipboardEdit, FileBarChart, Loader2 } from "lucide-react";
import { useEchantillonSclerometre } from "@/hooks/useEchantillonsSclerometre";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { Badge } from "@/components/ui/badge";

const SclerometreDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: echantillon, isLoading } = useEchantillonSclerometre(id ?? "");
  const basePath = "/essais/beton/non-destructif/sclerometre";

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!echantillon) return <div className="text-center py-12 text-muted-foreground">Essai non trouvé</div>;

  const resultats = echantillon.resultats as any;

  return (
    <div className="space-y-6">
      <EssaiBreadcrumb items={[{ label: "Béton", path: "/essais/beton" }, { label: "Non Destructif", path: "/essais/beton/non-destructif" }, { label: "Scléromètre", path: basePath }, { label: `SC-${String(echantillon.numero).padStart(3, "0")}` }]} />
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(basePath)} className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Essai Scléromètre <span className="text-primary">SC-{String(echantillon.numero).padStart(3, "0")}</span></h1>
            <p className="text-muted-foreground mt-1">NF EN 12504-2</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2" onClick={() => navigate(`${basePath}/${id}/saisie`)}><ClipboardEdit className="h-4 w-4" />Saisie</Button>
          <Button variant="outline" className="flex items-center gap-2" onClick={() => navigate(`${basePath}/${id}/rapport`)}><FileBarChart className="h-4 w-4" />Rapport</Button>
          <Button className="flex items-center gap-2" onClick={() => navigate(`${basePath}/${id}/modifier`)}><Pencil className="h-4 w-4" />Modifier</Button>
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
            <div><span className="text-muted-foreground">Orientation</span><p className="font-medium capitalize">{echantillon.orientation ?? "-"}</p></div>
            <div><span className="text-muted-foreground">Âge du béton</span><p className="font-medium">{echantillon.age_beton_jours ? `${echantillon.age_beton_jours} jours` : "-"}</p></div>
            <div><span className="text-muted-foreground">Classe de résistance</span><p className="font-medium">{echantillon.classe_resistance ?? "-"}</p></div>
          </div>
        </div>
      </div>

      {resultats && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Résultats</h2>
          {resultats.mesures && (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {(resultats.mesures as number[]).map((val: number, i: number) => (
                <div key={i} className="rounded-lg border border-border p-3 text-center">
                  <span className="text-xs text-muted-foreground">Point {i + 1}</span>
                  <p className="text-lg font-bold text-foreground">{val}</p>
                </div>
              ))}
            </div>
          )}
          {resultats.indice_moyen && (
            <div className="flex gap-6 mt-4">
              <div className="rounded-lg bg-primary/10 border border-primary/30 p-4">
                <span className="text-sm text-muted-foreground">Indice moyen</span>
                <p className="text-2xl font-bold text-primary">{resultats.indice_moyen}</p>
              </div>
              {resultats.resistance_estimee && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4">
                  <span className="text-sm text-muted-foreground">Résistance estimée</span>
                  <p className="text-2xl font-bold text-emerald-500">{resultats.resistance_estimee} MPa</p>
                </div>
              )}
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
    </div>
  );
};

export default SclerometreDetail;
