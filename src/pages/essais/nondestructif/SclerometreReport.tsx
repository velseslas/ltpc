import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { useEchantillonSclerometre } from "@/hooks/useEchantillonsSclerometre";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { ReportHeader } from "@/components/reports/ReportHeader";

const SclerometreReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const basePath = "/essais/beton/non-destructif/sclerometre";
  const { data: echantillon, isLoading } = useEchantillonSclerometre(id ?? "");

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!echantillon) return <div className="text-center py-12 text-muted-foreground">Essai non trouvé</div>;

  const resultats = echantillon.resultats as any;

  return (
    <div className="space-y-6">
      <EssaiBreadcrumb items={[{ label: "Béton", path: "/essais/beton" }, { label: "Non Destructif", path: "/essais/beton/non-destructif" }, { label: "Scléromètre", path: basePath }, { label: "Rapport" }]} />
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(`${basePath}/${id}`)} className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Rapport <span className="text-primary text-glow">Scléromètre</span></h1>
            <p className="text-muted-foreground mt-1">SC-{String(echantillon.numero).padStart(3, "0")}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => window.print()} className="flex items-center gap-2 print:hidden"><Printer className="h-4 w-4" />Imprimer</Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-8 space-y-8 print:border-0 print:shadow-none" id="report-content">
        <ReportHeader title="RAPPORT D'ESSAI SCLÉROMÈTRE" normRef="NF EN 12504-2" />

        <div className="grid grid-cols-2 gap-6 text-sm">
          <div><span className="text-muted-foreground">N° d'essai :</span> <span className="font-medium">SC-{String(echantillon.numero).padStart(3, "0")}</span></div>
          <div><span className="text-muted-foreground">Date d'essai :</span> <span className="font-medium">{format(new Date(echantillon.date_essai), "PPP", { locale: fr })}</span></div>
          <div><span className="text-muted-foreground">Client :</span> <span className="font-medium">{echantillon.clients?.nom ?? "-"}</span></div>
          <div><span className="text-muted-foreground">Chantier :</span> <span className="font-medium">{echantillon.chantiers?.nom ?? "-"}</span></div>
          <div><span className="text-muted-foreground">Élément testé :</span> <span className="font-medium">{echantillon.element_teste ?? "-"}</span></div>
          <div><span className="text-muted-foreground">Orientation :</span> <span className="font-medium capitalize">{echantillon.orientation ?? "-"}</span></div>
          <div><span className="text-muted-foreground">Âge du béton :</span> <span className="font-medium">{echantillon.age_beton_jours ? `${echantillon.age_beton_jours} jours` : "-"}</span></div>
          <div><span className="text-muted-foreground">Classe de résistance :</span> <span className="font-medium">{echantillon.classe_resistance ?? "-"}</span></div>
        </div>

        {resultats && (
          <>
            <div>
              <h3 className="font-semibold mb-3">Indices de rebond mesurés</h3>
              <div className="grid grid-cols-5 md:grid-cols-9 gap-2">
                {resultats.mesures?.map((val: number, i: number) => (
                  <div key={i} className="border border-border rounded p-2 text-center text-sm">
                    <span className="text-xs text-muted-foreground block">P{i + 1}</span>
                    <span className="font-bold">{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border border-border rounded-lg p-4 text-center">
                <span className="text-sm text-muted-foreground">Médiane</span>
                <p className="text-xl font-bold">{resultats.mediane ?? "-"}</p>
              </div>
              <div className="border border-border rounded-lg p-4 text-center">
                <span className="text-sm text-muted-foreground">Valeurs retenues</span>
                <p className="text-xl font-bold">{resultats.valeurs_retenues?.length ?? "-"}</p>
              </div>
              <div className="border border-primary/50 bg-primary/5 rounded-lg p-4 text-center">
                <span className="text-sm text-muted-foreground">Indice corrigé</span>
                <p className="text-xl font-bold text-primary">{resultats.indice_corrige ?? "-"}</p>
              </div>
              <div className="border border-emerald-500/50 bg-emerald-500/5 rounded-lg p-4 text-center">
                <span className="text-sm text-muted-foreground">Résistance estimée</span>
                <p className="text-xl font-bold text-emerald-600">{resultats.resistance_estimee ? `${resultats.resistance_estimee} MPa` : "-"}</p>
              </div>
            </div>
          </>
        )}

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

export default SclerometreReport;
