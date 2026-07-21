import { useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download, Loader2 } from "lucide-react";
import { useEchantillonUltrason } from "@/hooks/useEchantillonsUltrason";
import { useEntreprise } from "@/hooks/useEntreprise";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { ReportHeader } from "@/components/reports/ReportHeader";
import ShareButton from "@/components/reports/ShareButton";
import { PrintService } from "@/lib/print/PrintService";

PrintService.registerTemplate({ id: "ultrason-report", title: "Rapport Ultrason", orientation: "portrait" });

const getQualite = (v: number) => {
  if (v > 4500) return "Excellent";
  if (v > 3500) return "Bon";
  if (v > 3000) return "Moyen";
  if (v > 2000) return "Médiocre";
  return "Très mauvais";
};

const UltrasonReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const reportRef = useRef<HTMLDivElement>(null);
  const basePath = "/essais/beton/non-destructif/ultrason";
  const { data: echantillon, isLoading } = useEchantillonUltrason(id ?? "");
  const { data: entreprise } = useEntreprise();

  const handlePrint = () => PrintService.print({ title: `Rapport Ultrason US-${String(echantillon?.numero ?? "").padStart(3, "0")}`, orientation: "portrait" });
  const handleDownloadPDF = handlePrint;

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!echantillon) return <div className="text-center py-8 text-muted-foreground">Échantillon non trouvé</div>;

  const resultats = echantillon.resultats as any;
  const verificationUrl = `${window.location.origin}${basePath}/${id}/rapport`;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="print:hidden">
        <EssaiBreadcrumb items={[
          { label: "Béton", path: "/essais/beton" },
          { label: "Non Destructif", path: "/essais/beton/non-destructif" },
          { label: "Ultrason", path: basePath },
          { label: <><span className="text-primary">US</span>-{String(echantillon.numero).padStart(3, "0")}</>, path: `${basePath}/${id}` },
          { label: "Rapport" },
        ]} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(`${basePath}/${id}`)} className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Rapport - <span className="text-primary">US-{String(echantillon.numero).padStart(3, "0")}</span>
            </h1>
            <p className="text-muted-foreground mt-1">Essai Vitesse Ultrason</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none">
          <ShareButton />
          <Button variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Imprimer</Button>
          <Button onClick={handleDownloadPDF} className="gradient-primary text-primary-foreground"><Download className="h-4 w-4 mr-2" />Télécharger PDF</Button>
        </div>
      </div>

      <div ref={reportRef} data-ref="report" data-print-root data-print-template="ultrason-report" className="report-table bg-white text-black p-8 rounded-lg border border-border max-w-4xl mx-auto print:border-0 print:shadow-none print:max-w-none print:p-4" style={{ fontFamily: "Arial, sans-serif" }}>
        <ReportHeader entreprise={entreprise} verificationUrl={verificationUrl} title="RAPPORT D'ESSAI VITESSE ULTRASON" subtitle="Norme NF EN 12504-4" />

        {/* Identification */}
        <div className="mb-6 mt-6">
          <table className="identification-table w-full border-collapse border border-black text-sm">
            <tbody>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium w-1/6 text-black">N° Échantillon</td>
                <td className="border border-black px-3 py-1.5 w-1/3 text-black">US-{String(echantillon.numero).padStart(3, "0")}</td>
                <td className="border border-black px-3 py-1.5 font-medium w-1/6 text-black">Date d'essai</td>
                <td className="border border-black px-3 py-1.5 w-1/3 text-black">{format(new Date(echantillon.date_essai), "dd/MM/yyyy", { locale: fr })}</td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium text-black">Client</td>
                <td className="border border-black px-3 py-1.5 text-black">{echantillon.clients?.nom ?? "-"}</td>
                <td className="border border-black px-3 py-1.5 font-medium text-black">Âge du béton</td>
                <td className="border border-black px-3 py-1.5 text-black">{echantillon.age_beton_jours ? `${echantillon.age_beton_jours} jours` : "-"}</td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium text-black">Chantier</td>
                <td className="border border-black px-3 py-1.5 text-black" colSpan={3}>{echantillon.chantiers?.nom ?? "-"}</td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium text-black">Ouvrage</td>
                <td className="border border-black px-3 py-1.5 text-black">{echantillon.ouvrage ?? "-"}</td>
                <td className="border border-black px-3 py-1.5 font-medium text-black">Partie de l'ouvrage</td>
                <td className="border border-black px-3 py-1.5 text-black">{echantillon.partie_ouvrage ?? "-"}</td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium text-black">Mode de transmission</td>
                <td className="border border-black px-3 py-1.5 text-black capitalize">{echantillon.mode_transmission ?? "-"}</td>
                <td className="border border-black px-3 py-1.5 font-medium text-black">Fréquence</td>
                <td className="border border-black px-3 py-1.5 text-black">{echantillon.frequence_khz ? `${echantillon.frequence_khz} kHz` : "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Résultats des mesures */}
        {resultats?.mesures && (
          <>
            <div className="mb-6">
              <h3 className="font-bold text-sm mb-2 underline text-black">Résultats des mesures</h3>
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr>
                    <th className="border border-black px-3 py-1.5 text-left font-medium text-black">Élément coulé</th>
                    <th className="border border-black px-3 py-1.5 text-center font-medium text-black">Distance (mm)</th>
                    <th className="border border-black px-3 py-1.5 text-center font-medium text-black">Temps (µs)</th>
                    <th className="border border-black px-3 py-1.5 text-center font-medium text-black">Vitesse (m/s)</th>
                    <th className="border border-black px-3 py-1.5 text-center font-medium text-black">Qualité</th>
                  </tr>
                </thead>
                <tbody>
                  {resultats.elements ? (
                    (resultats.elements as any[]).map((elem: any, eIdx: number) =>
                      (elem.mesures as any[]).map((m: any, mIdx: number) => {
                        const v = m.distance && m.temps ? Math.round((m.distance / m.temps) * 1000) : null;
                        return (
                          <tr key={`${eIdx}-${mIdx}`}>
                            {mIdx === 0 && (
                              <td className="border border-black px-3 py-1.5 text-left font-medium text-black align-middle" rowSpan={elem.mesures.length}>{elem.element_coule || "-"}</td>
                            )}
                            <td className="border border-black px-3 py-1.5 text-center text-black">{m.distance ?? "-"}</td>
                            <td className="border border-black px-3 py-1.5 text-center text-black">{m.temps ?? "-"}</td>
                            <td className="border border-black px-3 py-1.5 text-center font-medium text-black">{v ?? "-"}</td>
                            <td className="border border-black px-3 py-1.5 text-center text-black">{v ? getQualite(v) : "-"}</td>
                          </tr>
                        );
                      })
                    )
                  ) : (
                    (resultats.mesures as any[]).map((m: any, i: number) => {
                      const v = m.distance && m.temps ? Math.round((m.distance / m.temps) * 1000) : null;
                      const nbMesures = (resultats.mesures as any[]).length;
                      return (
                        <tr key={i}>
                          {i === 0 && (
                            <td className="border border-black px-3 py-1.5 text-left font-medium text-black align-middle" rowSpan={nbMesures}>{resultats.element_coule ?? "-"}</td>
                          )}
                          <td className="border border-black px-3 py-1.5 text-center text-black">{m.distance ?? "-"}</td>
                          <td className="border border-black px-3 py-1.5 text-center text-black">{m.temps ?? "-"}</td>
                          <td className="border border-black px-3 py-1.5 text-center font-medium text-black">{v ?? "-"}</td>
                          <td className="border border-black px-3 py-1.5 text-center text-black">{v ? getQualite(v) : "-"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-sm mb-2 underline text-black">Synthèse</h3>
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr>
                    <th className="border border-black px-3 py-1.5 text-center font-medium text-black w-1/3">Nombre de mesures</th>
                    <th className="border border-black px-3 py-1.5 text-center font-medium text-black w-1/3">Vitesse moyenne</th>
                    <th className="border border-black px-3 py-1.5 text-center font-medium text-black w-1/3">Qualité globale du béton</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-3 py-1.5 text-center text-black">{resultats.mesures.length}</td>
                    <td className="border border-black px-3 py-1.5 text-center font-bold text-black">{resultats.vitesse_moyenne ? `${resultats.vitesse_moyenne} m/s` : "-"}</td>
                    <td className="border border-black px-3 py-1.5 text-center font-bold text-black">{resultats.qualite ?? "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-sm mb-2 underline text-black">Barème de classification</h3>
              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr>
                    <th className="border border-black px-2 py-1 text-center font-medium text-black">{">"} 4500 m/s</th>
                    <th className="border border-black px-2 py-1 text-center font-medium text-black">3500 - 4500</th>
                    <th className="border border-black px-2 py-1 text-center font-medium text-black">3000 - 3500</th>
                    <th className="border border-black px-2 py-1 text-center font-medium text-black">2000 - 3000</th>
                    <th className="border border-black px-2 py-1 text-center font-medium text-black">{"<"} 2000</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 text-center text-black">Excellent</td>
                    <td className="border border-black px-2 py-1 text-center text-black">Bon</td>
                    <td className="border border-black px-2 py-1 text-center text-black">Moyen</td>
                    <td className="border border-black px-2 py-1 text-center text-black">Médiocre</td>
                    <td className="border border-black px-2 py-1 text-center text-black">Très mauvais</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Mentions */}
        {(() => {
          let mentionsList: string[] = [];
          try { mentionsList = JSON.parse(echantillon.observations ?? "[]"); } catch {}
          return Array.isArray(mentionsList) && mentionsList.length > 0 ? (
            <div className="mt-6 mb-6">
              <h3 className="font-bold text-sm mb-2 underline text-black">Remarques</h3>
              <table className="w-full border-collapse border border-black text-sm">
                <tbody>
                  {mentionsList.map((m, i) => (
                    <tr key={i}><td className="border border-black px-3 py-1.5 text-black">{m}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null;
        })()}

        {/* Footer signatures */}
        <div className="mt-8 grid grid-cols-2 gap-8 text-black">
          <div className="text-center">
            <p className="text-sm font-medium mb-8">Le Technicien</p>
            <p className="text-sm">_________________</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium mb-8">Le Directeur du Laboratoire</p>
            <p className="text-sm">_________________</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default UltrasonReport;
