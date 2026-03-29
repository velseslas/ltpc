import { useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Printer, Download, Loader2 } from "lucide-react";
import ShareButton from "@/components/reports/ShareButton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useFormulationDetails } from "@/hooks/useFormulationDetails";
import { useEchantillonTractionFendageById } from "@/hooks/useEchantillonsTractionFendage";

interface EprouvetteData {
  id: number;
  jour: number;
  dateEssai: string;
  poids: string;
  densite: string;
  charge: string;
  resistance: string;
}

const TractionFendageReport = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const reportRef = useRef<HTMLDivElement>(null);
  const { data: echantillon, isLoading } = useEchantillonTractionFendageById(id);
  const { data: entreprise } = useEntreprise();
  const { data: formulation } = useFormulationDetails(echantillon?.formulation_id);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`rapport-TF-${echantillon?.numero}.pdf`);

      toast.success("PDF téléchargé avec succès");
    } catch (error) {
      toast.error("Erreur lors de la génération du PDF");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!echantillon) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Échantillon non trouvé
      </div>
    );
  }

  const resultats = echantillon.resultats as unknown as { eprouvettes: EprouvetteData[]; moyennes: Array<{ jour: number; moyenne: string | null }> } | null;
  const verificationUrl = `${window.location.origin}/verify/traction-fendage/${id}`;

  // Group eprouvettes by jour for the new table format
  const sortedEprouvettes = resultats?.eprouvettes ? [...resultats.eprouvettes].sort((a, b) => a.jour - b.jour) : [];
  const groups: { jour: number; dateEssai: string; items: EprouvetteData[] }[] = [];
  
  sortedEprouvettes.forEach((ep) => {
    const existingGroup = groups.find(g => g.jour === ep.jour);
    if (existingGroup) {
      existingGroup.items.push(ep);
    } else {
      groups.push({ jour: ep.jour, dateEssai: ep.dateEssai, items: [ep] });
    }
  });

  const totalRows = sortedEprouvettes.length;

  return (
    <div className="space-y-6">
      <EssaiBreadcrumb 
        items={[
          { label: "Béton", path: "/essais/beton" },
          { label: "Béton Durci", path: "/essais/beton/beton-durci" },
          { label: "Traction par Fendage", path: "/essais/beton/beton-durci/traction-fendage" },
          { label: <><span className="text-primary">TF</span>-{String(echantillon.numero).padStart(3, "0")}</>, path: `/essais/beton/beton-durci/traction-fendage/${id}` },
          { label: "Rapport" }
        ]} 
      />

      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`/essais/beton/beton-durci/traction-fendage/${id}`)}
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Rapport - <span className="text-primary">TF-{String(echantillon.numero).padStart(3, "0")}</span>
            </h1>
            <p className="text-muted-foreground mt-1">Essai de Traction par Fendage</p>
          </div>
        </div>

        <div className="flex gap-2">
          <ShareButton />
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
          <Button onClick={handleDownloadPDF} className="gradient-primary text-primary-foreground">
            <Download className="h-4 w-4 mr-2" />
            Télécharger PDF
          </Button>
        </div>
      </div>

      <div
        ref={reportRef}
        data-ref="report"
        className="report-table bg-white p-8 rounded-lg border border-border max-w-4xl mx-auto print:border-0 print:shadow-none print:max-w-none print:p-0"
      >
        <ReportHeader
          entreprise={entreprise}
          verificationUrl={verificationUrl}
          title="RAPPORT D'ESSAI DE TRACTION PAR FENDAGE"
          subtitle="Résistance à la traction par fendage du béton - Norme NF EN 12390-6"
        />

        {/* Identification de l'échantillon */}
        <div className="mb-6 mt-6">
          <h3 className="font-bold text-sm mb-2 underline text-black">Identification de l'échantillon</h3>
          <table className="w-full border-collapse border border-black text-sm">
            <tbody>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium w-1/3 text-black">N° Échantillon</td>
                <td className="border border-black px-3 py-1.5 text-black">TF-{String(echantillon.numero).padStart(3, "0")}</td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium text-black">Client</td>
                <td className="border border-black px-3 py-1.5 text-black">{echantillon.clients?.nom || "-"}</td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium text-black">Chantier</td>
                <td className="border border-black px-3 py-1.5 text-black">{echantillon.chantiers?.nom || "-"}</td>
              </tr>
              {echantillon.essai_convenance ? (
                <tr>
                  <td className="border border-black px-3 py-1.5 font-medium text-black">Essai de convenance</td>
                  <td className="border border-black px-3 py-1.5 text-black">
                    {echantillon.essai_convenance_details || "-"}
                  </td>
                </tr>
              ) : (
                <>
                  <tr>
                    <td className="border border-black px-3 py-1.5 font-medium text-black">Ouvrage</td>
                    <td className="border border-black px-3 py-1.5 text-black">{echantillon.ouvrage || "-"}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-3 py-1.5 font-medium text-black">Partie de l'ouvrage</td>
                    <td className="border border-black px-3 py-1.5 text-black">{echantillon.destination_beton || "-"}</td>
                  </tr>
                </>
              )}
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium text-black">Mode de conservation</td>
                <td className="border border-black px-3 py-1.5 text-black">{echantillon.condition_cure || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Formulation de béton */}
        <div className="mb-6">
          <h3 className="font-bold text-sm mb-2 underline text-black">Formulation de béton</h3>
          <div className="mb-2 text-sm text-black">
            <span className="font-medium">Centrale à béton : </span>{echantillon.centrales_beton?.nom || "-"}
            <span className="mx-4">|</span>
            <span className="font-medium">Formulation : </span>{formulation?.nom || echantillon.formulations?.nom || "-"}
          </div>
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr>
                <th className="border border-black px-2 py-1 text-center font-medium text-xs text-black">
                  Ciment
                </th>
                <th className="border border-black px-2 py-1 text-center font-medium text-xs text-black">
                  Eau
                </th>
                <th className="border border-black px-2 py-1 text-center font-medium text-xs text-black">
                  Adjuvant
                </th>
                <th className="border border-black px-2 py-1 text-center font-medium text-xs text-black">
                  Sable 1
                </th>
                <th className="border border-black px-2 py-1 text-center font-medium text-xs text-black">
                  Sable 2
                </th>
                <th className="border border-black px-2 py-1 text-center font-medium text-xs text-black">
                  Gravier 1
                </th>
                <th className="border border-black px-2 py-1 text-center font-medium text-xs text-black">
                  Gravier 2
                </th>
                <th className="border border-black px-2 py-1 text-center font-medium text-xs text-black">
                  Gravier 3
                </th>
              </tr>
              <tr>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">
                  {formulation?.ciment.producteur_nom || "-"}
                </th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">
                  {formulation?.eau.producteur_nom || "-"}
                </th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">
                  {formulation?.adjuvant.producteur_nom || "-"}
                </th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">
                  {formulation?.sable_concasse.producteur_nom || "-"}
                </th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">
                  {formulation?.sable_fin.producteur_nom || "-"}
                </th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">
                  {formulation?.gravillons1.producteur_nom || "-"}
                </th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">
                  {formulation?.gravier2.producteur_nom || "-"}
                </th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">
                  {formulation?.gravier3.producteur_nom || "-"}
                </th>
              </tr>
              <tr>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.ciment.produit_nom || "-"}</th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.eau.produit_nom || "-"}</th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.adjuvant.produit_nom || "-"}</th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.sable_concasse.produit_nom || "-"}</th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.sable_fin.produit_nom || "-"}</th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.gravillons1.produit_nom || "-"}</th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.gravier2.produit_nom || "-"}</th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.gravier3.produit_nom || "-"}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{formulation?.ciment.quantite ?? 0}</td>
                <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{formulation?.eau.quantite ?? 0}</td>
                <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{formulation?.adjuvant.quantite ?? 0}</td>
                <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{formulation?.sable_concasse.quantite ?? 0}</td>
                <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{formulation?.sable_fin.quantite ?? 0}</td>
                <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{formulation?.gravillons1.quantite ?? 0}</td>
                <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{formulation?.gravier2.quantite ?? 0}</td>
                <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{formulation?.gravier3.quantite ?? 0}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Caractéristiques techniques */}
        <div className="mb-6">
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr>
                <th className="border border-black px-3 py-1.5 text-center font-medium text-black">Classe de consistance</th>
                <th className="border border-black px-3 py-1.5 text-center font-medium text-black">Type éprouvette</th>
                <th className="border border-black px-3 py-1.5 text-center font-medium text-black">T°C béton</th>
                <th className="border border-black px-3 py-1.5 text-center font-medium text-black">T°C Air</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black px-3 py-1.5 text-center text-black">{echantillon.classe_consistance || "—"}</td>
                <td className="border border-black px-3 py-1.5 text-center text-black">{echantillon.type_eprouvette} {echantillon.dimension_eprouvette}</td>
                <td className="border border-black px-3 py-1.5 text-center text-black">{echantillon.temperature_beton ? `${echantillon.temperature_beton}°C` : "—"}</td>
                <td className="border border-black px-3 py-1.5 text-center text-black">{echantillon.temperature_air ? `${echantillon.temperature_air}°C` : "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Résultats des essais */}
        <div className="mb-6">
          <h3 className="font-bold text-sm mb-2 underline text-black">Résultats des essais</h3>
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr>
                <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">Date coulage</th>
                <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">Date d'essai</th>
                <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">Âge (jours)</th>
                <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">Poids (g)</th>
                <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">Densité (t/m³)</th>
                <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">Charge (kN)</th>
                <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">fct (MPa)</th>
                <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">Moy. fct (MPa)</th>
              </tr>
            </thead>
            <tbody>
              {sortedEprouvettes.length > 0 ? (() => {
                let globalRowIndex = 0;

                return groups.map((group) => {
                  // Calculate average resistance for the group
                  const resistances = group.items
                    .map(ep => parseFloat(ep.resistance))
                    .filter(r => !isNaN(r) && r > 0);
                  const moyenneFct = resistances.length > 0 
                    ? (resistances.reduce((a, b) => a + b, 0) / resistances.length).toFixed(2)
                    : "—";

                  return group.items.map((ep, idx) => {
                    const isVeryFirstRow = globalRowIndex === 0;
                    globalRowIndex++;

                    return (
                      <tr key={`${group.jour}-${ep.id}`}>
                        {isVeryFirstRow && (
                          <td 
                            rowSpan={totalRows} 
                            className="border border-black px-2 py-2 text-center text-sm align-middle text-black"
                          >
                            {echantillon.date_coulage 
                              ? format(new Date(echantillon.date_coulage), "dd/MM/yyyy", { locale: fr })
                              : "—"}
                          </td>
                        )}
                        {idx === 0 && (
                          <>
                            <td 
                              rowSpan={group.items.length} 
                              className="border border-black px-2 py-2 text-center text-sm align-middle text-black"
                            >
                              {format(new Date(group.dateEssai), "dd/MM/yyyy", { locale: fr })}
                            </td>
                            <td 
                              rowSpan={group.items.length} 
                              className="border border-black px-2 py-2 text-center text-sm font-medium align-middle text-black"
                            >
                              {group.jour}
                            </td>
                          </>
                        )}
                        <td className="border border-black px-2 py-2 text-center text-sm text-black">{ep.poids || "—"}</td>
                        <td className="border border-black px-2 py-2 text-center text-sm text-black">{ep.densite || "—"}</td>
                        <td className="border border-black px-2 py-2 text-center text-sm text-black">{ep.charge || "—"}</td>
                        <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{ep.resistance || "—"}</td>
                        {idx === 0 && (
                          <td 
                            rowSpan={group.items.length} 
                            className="border border-black px-2 py-2 text-center text-sm font-bold align-middle text-black"
                          >
                            {moyenneFct}
                          </td>
                        )}
                      </tr>
                    );
                  });
                });
              })() : (
                <tr>
                  <td colSpan={8} className="border border-black px-2 py-4 text-center text-sm text-black">
                    Aucune donnée saisie
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Observations */}
        {echantillon.observations && (
          <div className="mb-6">
            <h3 className="font-bold text-sm mb-2 underline text-black">Observations</h3>
            <div className="border border-black px-3 py-2 text-sm text-black">
              {echantillon.observations}
            </div>
          </div>
        )}

        {/* Pied de page */}
        <div className="mt-8 pt-4 border-t border-gray-300">
          <div className="flex justify-between items-end">
            <div className="text-sm text-black">
              <p>Le Technicien: {echantillon.intervenants
                ? `${echantillon.intervenants.prenom} ${echantillon.intervenants.nom}`
                : "_________________"}</p>
            </div>
            <div className="text-center">
              <div className="min-h-16 flex flex-col items-center justify-end">
                {entreprise?.cachet_url ? (
                  <img 
                    src={entreprise.cachet_url} 
                    alt="Cachet entreprise" 
                    className="max-h-20 object-contain mb-1"
                  />
                ) : (
                  <p className="text-sm font-medium text-black">Signature et cachet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Styles d'impression */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          #root {
            padding: 0 !important;
            margin: 0 !important;
          }
          [data-ref="report"] {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          [data-ref="report"] * {
            visibility: visible;
          }
        }
      `}</style>
    </div>
  );
};

export default TractionFendageReport;
