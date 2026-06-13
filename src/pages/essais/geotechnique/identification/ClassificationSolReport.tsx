import { useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Download, Printer, Loader2 } from "lucide-react";
import ShareButton from "@/components/reports/ShareButton";
import { useEchantillonGeotechniqueById, getGeoPrefix } from "@/hooks/useEchantillonsGeotechniqueFactory";
import { useEntreprise } from "@/hooks/useEntreprise";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { downloadReportAsPDF } from "@/lib/pdf";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { SOIL_SIEVES } from "@/components/essais/geotechnique/SoilClassificationGTR";

const basePath = "/essais/geotechnique/identification/classification-sol";
const essaiType = "classification-sol";

export default function ClassificationSolReport() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const reportRef = useRef<HTMLDivElement>(null);
  const { data: echantillon, isLoading } = useEchantillonGeotechniqueById(essaiType, id);
  const { data: entreprise } = useEntreprise();
  const prefix = getGeoPrefix(essaiType);

  const resultats = useMemo(() => (echantillon?.resultats as Record<string, unknown>) || {}, [echantillon]);
  const granulometrie = (resultats.granulometrie as Record<string, string>) || {};
  const gtr = resultats.classification_gtr as Record<string, string> | null;
  const uscs = resultats.classification_uscs as Record<string, string> | null;

  const filledSieves = SOIL_SIEVES.filter(s => granulometrie[String(s.value)]);

  const handlePrint = () => window.print();

  const generatePdfBlob = async (): Promise<Blob | null> => {
    if (!reportRef.current || !echantillon) return null;
    const canvas = await html2canvas(reportRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    return pdf.output("blob");
  };

  const handleDownloadPDF = async () => {
    if (!echantillon) return;
    await downloadReportAsPDF(
      reportRef.current,
      `rapport-classification-sol-${prefix}-${String(echantillon.numero).padStart(3, "0")}`
    );
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!echantillon) return <div className="text-center py-8 text-muted-foreground">Échantillon non trouvé</div>;

  const numero = `${prefix}-${String(echantillon.numero).padStart(3, "0")}`;
  const verificationUrl = `${window.location.origin}${basePath}/${id}/rapport`;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="print:hidden space-y-4">
        <EssaiBreadcrumb items={[
          { label: "Géotechnique", path: "/essais/geotechnique" },
          { label: "Identification", path: "/essais/geotechnique/identification" },
          { label: "Classification des Sols", path: basePath },
          { label: <><span className="text-primary">{prefix}</span>-{String(echantillon.numero).padStart(3, "0")}</>, path: `${basePath}/${id}` },
          { label: "Rapport" }
        ]} />
        <div className="flex items-start gap-4">
          <BackButton to={`${basePath}/${id}`} />
          <div className="flex-1">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Rapport - <span className="text-primary">{numero}</span></h1>
                <p className="text-muted-foreground text-sm">Classification des Sols</p>
              </div>
              <div className="flex gap-3">
                <ShareButton onGeneratePdf={generatePdfBlob} fileName={`rapport-classification-sol-${numero}.pdf`} />
                <Button variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Imprimer</Button>
                <Button onClick={handleDownloadPDF} className="gradient-primary text-primary-foreground"><Download className="h-4 w-4 mr-2" />Télécharger PDF</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rapport */}
      <div ref={reportRef} data-ref="report" className="report-table bg-white text-black p-8 rounded-lg shadow-lg max-w-4xl mx-auto print:shadow-none print:p-4" style={{ fontFamily: "Arial, sans-serif" }}>
        <ReportHeader entreprise={entreprise} verificationUrl={verificationUrl} title="RAPPORT D'ESSAI - CLASSIFICATION DES SOLS" subtitle="NF P 11-300 (GTR) / ASTM D2487 (USCS)" />

        {/* Infos échantillon */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="border border-gray-300 p-3 rounded">
            <p><span className="font-bold">N° Échantillon :</span> {numero}</p>
            <p><span className="font-bold">Client :</span> {echantillon.clients?.nom || "-"}</p>
            <p><span className="font-bold">Chantier :</span> {echantillon.chantiers?.nom || "-"}</p>
            {echantillon.carrieres && <p><span className="font-bold">Carrière :</span> {echantillon.carrieres.nom}</p>}
          </div>
          <div className="border border-gray-300 p-3 rounded">
            <p><span className="font-bold">Date de prélèvement :</span> {format(new Date(echantillon.date_prelevement), "dd/MM/yyyy", { locale: fr })}</p>
            {echantillon.date_essai && <p><span className="font-bold">Date d'essai :</span> {format(new Date(echantillon.date_essai), "dd/MM/yyyy", { locale: fr })}</p>}
            <p><span className="font-bold">Type de sol :</span> {echantillon.type_sol}</p>
          </div>
        </div>

        {/* Granulométrie */}
        {filledSieves.length > 0 && (
          <div className="mb-4">
            <h3 className="font-bold text-sm mb-2 underline text-black">Analyse Granulométrique</h3>
            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black px-2 py-1.5 text-left font-medium text-black">Tamis (mm)</th>
                  {filledSieves.map(s => (
                    <th key={s.value} className="border border-black px-2 py-1.5 text-center font-medium text-black">{s.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black px-2 py-1.5 font-medium text-black">% Passant</td>
                  {filledSieves.map(s => (
                    <td key={s.value} className="border border-black px-2 py-1.5 text-center text-black">{granulometrie[String(s.value)] || "-"}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Paramètres */}
        <div className="mb-4">
          <h3 className="font-bold text-sm mb-2 underline text-black">Paramètres d'identification</h3>
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-3 py-1.5 text-center font-medium text-black">Wl (%)</th>
                <th className="border border-black px-3 py-1.5 text-center font-medium text-black">Ip (%)</th>
                <th className="border border-black px-3 py-1.5 text-center font-medium text-black">VBS (g/100g)</th>
                <th className="border border-black px-3 py-1.5 text-center font-medium text-black">MO (%)</th>
                <th className="border border-black px-3 py-1.5 text-center font-medium text-black">CaCO₃ (%)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black px-3 py-1.5 text-center font-bold text-black">{String(resultats.wl || "-")}</td>
                <td className="border border-black px-3 py-1.5 text-center font-bold text-black">{String(resultats.ip || "-")}</td>
                <td className="border border-black px-3 py-1.5 text-center font-bold text-black">{String(resultats.vbs || "-")}</td>
                <td className="border border-black px-3 py-1.5 text-center font-bold text-black">{String(resultats.matiere_organique || "-")}</td>
                <td className="border border-black px-3 py-1.5 text-center font-bold text-black">{String(resultats.caco3 || "-")}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Classification */}
        <div className="mb-4">
          <h3 className="font-bold text-sm mb-2 underline text-black">Résultats de Classification</h3>
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-3 py-1.5 font-medium text-black">Système</th>
                <th className="border border-black px-3 py-1.5 font-medium text-black">Classe</th>
                <th className="border border-black px-3 py-1.5 font-medium text-black">Désignation</th>
                <th className="border border-black px-3 py-1.5 font-medium text-black">Description</th>
              </tr>
            </thead>
            <tbody>
              {gtr && (
                <tr>
                  <td className="border border-black px-3 py-2 font-medium text-black">GTR (NF P 11-300)</td>
                  <td className="border border-black px-3 py-2 text-center font-bold text-black text-lg">{gtr.sous_classe}</td>
                  <td className="border border-black px-3 py-2 text-black">{gtr.label}</td>
                  <td className="border border-black px-3 py-2 text-black">{gtr.description}</td>
                </tr>
              )}
              {uscs && (
                <tr>
                  <td className="border border-black px-3 py-2 font-medium text-black">USCS (ASTM D2487)</td>
                  <td className="border border-black px-3 py-2 text-center font-bold text-black text-lg">{uscs.code}</td>
                  <td className="border border-black px-3 py-2 text-black">{uscs.label}</td>
                  <td className="border border-black px-3 py-2 text-black">{uscs.description}</td>
                </tr>
              )}
              {!gtr && !uscs && (
                <tr>
                  <td colSpan={4} className="border border-black px-3 py-2 text-center text-gray-500">Classification non disponible</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Observations */}
        {echantillon.observations && (
          <div className="mb-4">
            <h3 className="font-bold text-sm mb-2 underline text-black">Observations</h3>
            <p className="text-sm text-black border border-black p-3">{echantillon.observations}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 flex justify-between text-xs text-black border-t border-black pt-4">
          <div>
            <p>Date du rapport : {format(new Date(), "dd/MM/yyyy", { locale: fr })}</p>
          </div>
          <div className="text-right">
            <p className="font-medium">Le Responsable du Laboratoire</p>
            <div className="h-16" />
            <p className="border-t border-black pt-1">Signature et cachet</p>
          </div>
        </div>
      </div>
    </div>
  );
}
