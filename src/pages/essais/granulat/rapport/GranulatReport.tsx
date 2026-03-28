import { useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Download, Printer, Loader2 } from "lucide-react";
import ShareButton from "@/components/reports/ShareButton";
import { useEchantillonGranulatById, getPrefix, EchantillonGranulatBase } from "@/hooks/useEchantillonsGranulatFactory";

const TYPE_ESSAI_SUFFIX: Record<string, string> = {
  beton: "B",
  geotechnique: "G",
  route: "R",
};

const ESSAIS_WITH_TYPE = ["equivalent-sable", "bleu-methylene", "micro-deval", "los-angeles"];

function getTypeSuffix(echantillon: EchantillonGranulatBase, essaiType: string): string {
  if (!ESSAIS_WITH_TYPE.includes(essaiType)) return "";
  const resultats = echantillon.resultats as Record<string, unknown> | null;
  const typeEssai = (resultats?.type_essai as string) || "beton";
  return TYPE_ESSAI_SUFFIX[typeEssai] || "B";
}
import { useEntreprise } from "@/hooks/useEntreprise";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

// Import report content components
import EquivalentSableReportContent from "./content/EquivalentSableReportContent";
import BleuMethyleneReportContent from "./content/BleuMethyleneReportContent";
import MatiereOrganiqueReportContent from "./content/MatiereOrganiqueReportContent";
import GranulometrieReportContent from "./content/GranulometrieReportContent";
import MasseVolumiqueReportContent from "./content/MasseVolumiqueReportContent";
import FormeGranulatsReportContent from "./content/FormeGranulatsReportContent";
import TeneurEauReportContent from "./content/TeneurEauReportContent";
import LosAngelesReportContent from "./content/LosAngelesReportContent";
import MicroDevalReportContent from "./content/MicroDevalReportContent";
import EcrasementReportContent from "./content/EcrasementReportContent";
import FriabiliteReportContent from "./content/FriabiliteReportContent";

interface GranulatReportProps {
  essaiType: string;
  essaiTitle: string;
  normRef: string;
  basePath: string;
}

// Configuration des catégories pour le breadcrumb
const breadcrumbConfig: Record<string, { categoryPath: string; categoryLabel: string }> = {
  "equivalent-sable": { categoryPath: "/essais/granulat/proprete", categoryLabel: "Propreté" },
  "bleu-methylene": { categoryPath: "/essais/granulat/proprete", categoryLabel: "Propreté" },
  "matiere-organique": { categoryPath: "/essais/granulat/proprete", categoryLabel: "Propreté" },
  "granulometrie": { categoryPath: "/essais/granulat/physiques", categoryLabel: "Physiques" },
  "masse-volumique": { categoryPath: "/essais/granulat/physiques", categoryLabel: "Physiques" },
  "forme-granulats": { categoryPath: "/essais/granulat/physiques", categoryLabel: "Physiques" },
  "teneur-eau": { categoryPath: "/essais/granulat/physiques", categoryLabel: "Physiques" },
  "los-angeles": { categoryPath: "/essais/granulat/mecaniques", categoryLabel: "Mécaniques" },
  "micro-deval": { categoryPath: "/essais/granulat/mecaniques", categoryLabel: "Mécaniques" },
  "ecrasement": { categoryPath: "/essais/granulat/mecaniques", categoryLabel: "Mécaniques" },
  "friabilite": { categoryPath: "/essais/granulat/mecaniques", categoryLabel: "Mécaniques" },
};

const reportContentComponents: Record<string, React.ComponentType<{ resultats: Record<string, unknown> }>> = {
  "equivalent-sable": EquivalentSableReportContent,
  "bleu-methylene": BleuMethyleneReportContent,
  "matiere-organique": MatiereOrganiqueReportContent,
  "granulometrie": GranulometrieReportContent,
  "masse-volumique": MasseVolumiqueReportContent,
  "forme-granulats": FormeGranulatsReportContent,
  "teneur-eau": TeneurEauReportContent,
  "los-angeles": LosAngelesReportContent,
  "micro-deval": MicroDevalReportContent,
  "ecrasement": EcrasementReportContent,
  "friabilite": FriabiliteReportContent,
};

export default function GranulatReport({ essaiType, essaiTitle, normRef, basePath }: GranulatReportProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const reportRef = useRef<HTMLDivElement>(null);
  const { data: echantillon, isLoading } = useEchantillonGranulatById(essaiType, id);
  const { data: entreprise } = useEntreprise();
  const prefix = getPrefix(essaiType);

  const ReportContent = reportContentComponents[essaiType];

  const handlePrint = () => {
    window.print();
  };

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
    const blob = await generatePdfBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-${essaiType}-${prefix}-${String(echantillon!.numero).padStart(3, "0")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
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

  const resultats = (echantillon.resultats as Record<string, unknown>) || {};
  const verificationUrl = `${window.location.origin}${basePath}/${id}/rapport`;

  const config = breadcrumbConfig[essaiType];
  const breadcrumbItems = config ? [
    { label: "Granulat", path: "/essais/granulat" },
    { label: config.categoryLabel, path: config.categoryPath },
    { label: essaiTitle, path: basePath },
    { 
      label: (
        <>
          <span className="text-primary">{getPrefix(essaiType)}</span>-{String(echantillon.numero).padStart(3, "0")}
        </>
      ), 
      path: `${basePath}/${id}` 
    },
    { label: "Rapport" }
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb et actions - Caché à l'impression */}
      <div className="print:hidden space-y-4">
        <EssaiBreadcrumb items={breadcrumbItems} />
        <div className="flex items-start gap-4">
          <BackButton to={`${basePath}/${id}`} />
          <div className="flex-1">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Rapport - <span className="text-primary">{prefix}-{String(echantillon.numero).padStart(3, "0")}</span>
                </h1>
                <p className="text-muted-foreground text-sm">{essaiTitle}</p>
              </div>
              <div className="flex gap-3">
                <ShareButton onGeneratePdf={generatePdfBlob} fileName={`rapport-${essaiType}-${prefix}-${String(echantillon.numero).padStart(3, "0")}.pdf`} />
                <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  Imprimer
                </Button>
                <Button onClick={handleDownloadPDF} className="flex items-center gap-2 gradient-primary text-primary-foreground">
                  <Download className="h-4 w-4" />
                  Télécharger PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rapport */}
      <div 
        ref={reportRef}
        className="report-table bg-white text-black p-8 rounded-lg shadow-lg max-w-4xl mx-auto print:shadow-none print:p-4"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        <ReportHeader
          entreprise={entreprise}
          verificationUrl={verificationUrl}
          title={`RAPPORT D'ESSAI - ${essaiTitle.toUpperCase()}`}
          subtitle={normRef}
        />

        {/* Identification de l'échantillon */}
        <div className="mb-6">
          <h3 className="font-bold text-sm mb-2 underline text-black">Identification de l'échantillon</h3>
          <table className="w-full border-collapse border border-black text-sm">
            <tbody>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium w-1/3 text-black">N° Échantillon</td>
                <td className="border border-black px-3 py-1.5 text-black">{prefix}-{String(echantillon.numero).padStart(3, "0")}</td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium text-black">Type d'essai</td>
                <td className="border border-black px-3 py-1.5 text-black font-semibold">{essaiTitle}</td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium text-black">Carrière / Fournisseur</td>
                <td className="border border-black px-3 py-1.5 text-black">{echantillon.carrieres?.nom || "-"}</td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium text-black">Produit</td>
                <td className="border border-black px-3 py-1.5 text-black">{echantillon.produit}</td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium text-black">Date de réception</td>
                <td className="border border-black px-3 py-1.5 text-black">
                  {format(new Date(echantillon.date_reception), "dd/MM/yyyy", { locale: fr })}
                </td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium text-black">Date d'essai</td>
                <td className="border border-black px-3 py-1.5 text-black">
                  {(echantillon as any).date_essai 
                    ? format(new Date((echantillon as any).date_essai), "dd/MM/yyyy", { locale: fr })
                    : "-"}
                </td>
              </tr>
              {echantillon.observations && (
                <tr>
                  <td className="border border-black px-3 py-1.5 font-medium text-black">Observations</td>
                  <td className="border border-black px-3 py-1.5 text-black">{echantillon.observations}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Contenu spécifique au type d'essai */}
        {ReportContent && (
          essaiType === "granulometrie" ? (
            <GranulometrieReportContent resultats={resultats} produit={echantillon.produit} />
          ) : (
            <ReportContent resultats={resultats} />
          )
        )}

        {/* Pied de page */}
        <div className="mt-8 pt-4 border-t border-gray-300">
          <div className="flex justify-between items-end">
            <div className="text-sm text-gray-600">
              <p>Opérateur: {echantillon.intervenants ? `${echantillon.intervenants.prenom} ${echantillon.intervenants.nom}` : "-"}</p>
              {echantillon.intervenants?.signature_url && (
                <div className="mt-2">
                  <img 
                    src={echantillon.intervenants.signature_url} 
                    alt="Signature opérateur" 
                    className="max-h-16 object-contain"
                  />
                </div>
              )}
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
                  <p className="text-sm font-medium">Signature et cachet</p>
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
          }
        }
      `}</style>
    </div>
  );
}
