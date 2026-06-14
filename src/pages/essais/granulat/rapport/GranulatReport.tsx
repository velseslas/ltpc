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
  const { data: echantillon, isLoading } = useEchantillonGranulatById(essaiType, id);
  const { data: entreprise } = useEntreprise();
  const prefix = getPrefix(essaiType);
  const typeSuffix = echantillon ? getTypeSuffix(echantillon, essaiType) : "";
  const fullPrefix = `${prefix}${typeSuffix}`;

  const ReportContent = reportContentComponents[essaiType];

  const handlePrint = () => {
    requestAnimationFrame(() => window.print());
  };

  const handleDownloadPDF = async () => {
    const { downloadReportAsPDF } = await import("@/lib/pdf");
    downloadReportAsPDF(`Rapport_${fullPrefix}-${String(echantillon?.numero ?? "").padStart(3, "0")}`);
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
          <span className="text-primary">{fullPrefix}</span>-{String(echantillon.numero).padStart(3, "0")}
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
                  Rapport - <span className="text-primary">{fullPrefix}-{String(echantillon.numero).padStart(3, "0")}</span>
                </h1>
                <p className="text-muted-foreground text-sm">{essaiTitle}</p>
              </div>
              <div className="flex gap-3">
                <ShareButton fileName={`rapport-${essaiType}-${fullPrefix}-${String(echantillon.numero).padStart(3, "0")}.pdf`} />
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
        data-ref="report"
        className="report-table bg-white text-black p-8 rounded-lg shadow-lg w-[210mm] max-w-full mx-auto overflow-x-auto print:overflow-visible print:shadow-none print:p-0 print:rounded-none"
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
          <h2 className="text-sm font-bold text-black mb-2">Identification de l'échantillon</h2>
          <table className="identification-table w-full border-collapse border border-black text-sm">
            <tbody>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium w-1/3 text-black">N° Échantillon</td>
                <td className="border border-black px-3 py-1.5 text-black">{fullPrefix}-{String(echantillon.numero).padStart(3, "0")}</td>
              </tr>
              {echantillon.clients?.nom && (
                <tr>
                  <td className="border border-black px-3 py-1.5 font-medium text-black">Entreprise</td>
                  <td className="border border-black px-3 py-1.5 text-black">{echantillon.clients.nom}</td>
                </tr>
              )}
              {echantillon.chantiers?.nom && (
                <tr>
                  <td className="border border-black px-3 py-1.5 font-medium text-black">Chantier</td>
                  <td className="border border-black px-3 py-1.5 text-black">{echantillon.chantiers.nom}</td>
                </tr>
              )}
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
          @page {
            size: A4 portrait;
            margin: 8mm;
          }

          html,
          body {
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
          }

          body * {
            visibility: hidden;
          }

          .print\\:hidden {
            display: none !important;
          }

          [data-ref="report"],
          [data-ref="report"] * {
            visibility: visible !important;
          }

          #root {
            width: 210mm !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }

          [data-ref="report"] {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 194mm !important;
            max-width: none !important;
            min-height: 281mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: white !important;
            color: #111111 !important;
            font-size: 11px !important;
            line-height: 1.35 !important;
            display: flex !important;
            flex-direction: column !important;
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* A4 readable spacing: avoid the old 3/4-page compact rendering */
          [data-ref="report"] h1,
          [data-ref="report"] h2,
          [data-ref="report"] h3,
          [data-ref="report"] h4 {
            margin: 0 0 6px 0 !important;
            line-height: 1.25 !important;
          }
          [data-ref="report"] h1 { font-size: 21px !important; font-weight: 800 !important; }
          [data-ref="report"] h2 { font-size: 20px !important; font-weight: 800 !important; }
          [data-ref="report"] h3 { font-size: 14px !important; font-weight: 800 !important; }
          [data-ref="report"] p { margin: 3px 0 !important; }

          [data-ref="report"] .mb-6 { margin-bottom: 12px !important; }
          [data-ref="report"] .mb-4 { margin-bottom: 10px !important; }
          [data-ref="report"] .mb-2 { margin-bottom: 6px !important; }
          [data-ref="report"] .mt-8 { margin-top: 18px !important; }
          [data-ref="report"] .mt-4 { margin-top: 10px !important; }
          [data-ref="report"] .mt-2 { margin-top: 6px !important; }
          [data-ref="report"] .pt-4 { padding-top: 10px !important; }
          [data-ref="report"] .p-4 { padding: 10px !important; }
          [data-ref="report"] .p-8 { padding: 0 !important; }
          [data-ref="report"] .space-y-6 > * + * { margin-top: 14px !important; }
          [data-ref="report"] .space-y-4 > * + * { margin-top: 11px !important; }
          [data-ref="report"] .space-y-2 > * + * { margin-top: 6px !important; }

          [data-ref="report"] table {
            width: 100% !important;
            border-collapse: collapse !important;
            border-spacing: 0 !important;
            table-layout: fixed !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            font-size: 10.5px !important;
          }

          [data-ref="report"] th,
          [data-ref="report"] td {
            border: 1px solid #444444 !important;
            vertical-align: middle !important;
            padding: 4.5px 7px !important;
            line-height: 1.3 !important;
          }

          [data-ref="report"] tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          [data-ref="report"] thead {
            display: table-header-group !important;
          }

          [data-ref="report"] img {
            max-height: 72px !important;
          }

          [data-ref="report"] > div:last-child {
            margin-top: auto !important;
          }

          /* Force entire report onto one page */
          [data-ref="report"] > * {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          [data-ref="report"] {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
