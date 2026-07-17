import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download, Loader2 } from "lucide-react";
import { useEchantillonSclerometre } from "@/hooks/useEchantillonsSclerometre";
import { useEntreprise } from "@/hooks/useEntreprise";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { ReportHeader } from "@/components/reports/ReportHeader";
import ShareButton from "@/components/reports/ShareButton";
import { PrintService } from "@/lib/print/PrintService";

PrintService.registerTemplate({ id: "sclerometre-report", title: "Rapport Scléromètre", orientation: "portrait" });

const SclerometreReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const reportRef = useRef<HTMLDivElement>(null);
  const basePath = "/essais/beton/non-destructif/sclerometre";
  const { data: echantillon, isLoading } = useEchantillonSclerometre(id ?? "");
  const { data: entreprise } = useEntreprise();

  const handlePrint = () => PrintService.print({ title: `Rapport Scléromètre SC-${String(echantillon?.numero ?? "").padStart(3, "0")}`, orientation: "portrait" });
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
          { label: "Scléromètre", path: basePath },
          { label: <><span className="text-primary">SC</span>-{String(echantillon.numero).padStart(3, "0")}</>, path: `${basePath}/${id}` },
          { label: "Rapport" },
        ]} />
      </div>

      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(`${basePath}/${id}`)} className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Rapport - <span className="text-primary">SC-{String(echantillon.numero).padStart(3, "0")}</span>
            </h1>
            <p className="text-muted-foreground mt-1">Essai au Scléromètre</p>
          </div>
        </div>
        <div className="flex gap-2">
          <ShareButton />
          <Button variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Imprimer</Button>
          <Button onClick={handleDownloadPDF} className="gradient-primary text-primary-foreground"><Download className="h-4 w-4 mr-2" />Télécharger PDF</Button>
        </div>
      </div>

      <div ref={reportRef} data-ref="report" className="report-table bg-white text-black p-8 rounded-lg border border-border max-w-4xl mx-auto print:border-0 print:shadow-none print:max-w-none print:p-4" style={{ fontFamily: "Arial, sans-serif" }}>
        <ReportHeader entreprise={entreprise} verificationUrl={verificationUrl} title="RAPPORT D'ESSAI AU SCLÉROMÈTRE" subtitle="Norme NF EN 12504-2" />

        {/* Identification */}
        <div className="mb-6 mt-6">
          <table className="identification-table w-full border-collapse border border-black text-sm">
            <tbody>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium w-1/6 text-black">N° Échantillon</td>
                <td className="border border-black px-3 py-1.5 w-1/3 text-black">SC-{String(echantillon.numero).padStart(3, "0")}</td>
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
                <td className="border border-black px-3 py-1.5 font-medium text-black">Orientation</td>
                <td className="border border-black px-3 py-1.5 text-black capitalize">{echantillon.orientation ?? "-"}</td>
                <td className="border border-black px-3 py-1.5 font-medium text-black">Classe de résistance</td>
                <td className="border border-black px-3 py-1.5 text-black">{echantillon.classe_resistance ?? "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Résultats */}
        {resultats && (
          <>
            <div className="mb-6">
              <h3 className="font-bold text-sm mb-2 underline text-black">Indices de rebond mesurés</h3>
              {(() => {
                const elems = resultats.elements as { element_coule: string; mesures: number[] }[] | undefined;
                if (elems && elems.length > 0) {
                  const maxPoints = Math.max(...elems.map(e => e.mesures.filter((v: number) => v > 0).length));
                  return (
                    <table className="w-full border-collapse border border-black text-sm">
                      <thead>
                        <tr>
                          <th className="border border-black px-2 py-1.5 text-left font-medium text-black">Élément coulé</th>
                          {Array.from({ length: maxPoints }, (_, i) => (
                            <th key={i} className="border border-black px-2 py-1.5 text-center font-medium text-black">P{i + 1}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {elems.map((elem, eIdx) => {
                          const valid = elem.mesures.filter((v: number) => v > 0);
                          return (
                            <tr key={eIdx}>
                              <td className="border border-black px-2 py-1.5 text-left font-medium text-black">{elem.element_coule || "-"}</td>
                              {Array.from({ length: maxPoints }, (_, i) => (
                                <td key={i} className="border border-black px-2 py-1.5 text-center text-black">{valid[i] ?? ""}</td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  );
                }
                // Legacy single-element fallback
                const validMesures = resultats.mesures?.filter((v: number) => v > 0) ?? [];
                return (
                  <table className="w-full border-collapse border border-black text-sm">
                    <thead>
                      <tr>
                        <th className="border border-black px-2 py-1.5 text-left font-medium text-black">Élément coulé</th>
                        {validMesures.map((_: number, i: number) => (
                          <th key={i} className="border border-black px-2 py-1.5 text-center font-medium text-black">P{i + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-black px-2 py-1.5 text-left font-medium text-black">{resultats.element_coule ?? "-"}</td>
                        {validMesures.map((val: number, i: number) => (
                          <td key={i} className="border border-black px-2 py-1.5 text-center text-black">{val}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                );
              })()}
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-sm mb-2 underline text-black">Résultats de l'essai</h3>
              <table className="w-full border-collapse border border-black text-sm">
                <tbody>
                  <tr>
                    <td className="border border-black px-3 py-1.5 font-medium w-1/3 text-black">Médiane</td>
                    <td className="border border-black px-3 py-1.5 text-black">{resultats.mediane ?? "-"}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-3 py-1.5 font-medium text-black">Valeurs retenues</td>
                    <td className="border border-black px-3 py-1.5 text-black">{resultats.valeurs_retenues?.length ?? "-"}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-3 py-1.5 font-medium text-black">Indice de rebond corrigé</td>
                    <td className="border border-black px-3 py-1.5 font-bold text-black">{resultats.indice_corrige ?? "-"}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-3 py-1.5 font-medium text-black">Résistance estimée (MPa)</td>
                    <td className="border border-black px-3 py-1.5 font-bold text-black">{resultats.resistance_estimee ? `${resultats.resistance_estimee} MPa` : "-"}</td>
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

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #root { visibility: visible; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default SclerometreReport;
