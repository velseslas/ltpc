import { useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Printer, Download, Loader2 } from "lucide-react";
import ShareButton from "@/components/reports/ShareButton";
import { Button } from "@/components/ui/button";
import { EssaiBreadcrumb, BreadcrumbItem } from "@/components/essais/EssaiBreadcrumb";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useFormulationDetails } from "@/hooks/useFormulationDetails";
import { PrintService } from "@/lib/print/PrintService";
import {
  useEchantillonBetonFraisById,
  getPrefix,
} from "@/hooks/useEchantillonsBetonFraisFactory";

// LOT 3 — Enregistrement des templates Béton Frais auprès du PrintService.
// Un seul composant sert 4 essais (affaissement, temperature, temps-prise, teneur-air).
PrintService.registerTemplate({ id: "beton-frais-affaissement", title: "Rapport essai d'affaissement", orientation: "portrait" });
PrintService.registerTemplate({ id: "beton-frais-temperature", title: "Rapport essai de température de béton", orientation: "portrait" });
PrintService.registerTemplate({ id: "beton-frais-temps-prise", title: "Rapport essai de temps de prise", orientation: "portrait" });
PrintService.registerTemplate({ id: "beton-frais-teneur-air", title: "Rapport essai de teneur en air", orientation: "portrait" });

// Import report content components
import AffaissementReportContent from "./rapport/AffaissementReportContent";
import TemperatureReportContent from "./rapport/TemperatureReportContent";
import TempsPriseReportContent from "./rapport/TempsPriseReportContent";
import TeneurAirReportContent from "./rapport/TeneurAirReportContent";

const reportContentComponents: Record<string, React.ComponentType<{ resultats: Record<string, unknown>; echantillon?: any }>> = {
  "affaissement": AffaissementReportContent,
  "temperature": TemperatureReportContent,
  "temps-prise": TempsPriseReportContent,
  "teneur-air": TeneurAirReportContent,
};

interface BetonFraisReportProps {
  essaiType: string;
  essaiTitle: string;
  normRef: string;
  basePath: string;
}

// Define which fields are available for each test type
const getFieldsForType = (essaiType: string) => {
  switch (essaiType) {
    case "affaissement":
      return { showTemperatureBeton: true, showTemperatureAir: true, showTemperatureAmbiante: false, showClasseConsistance: true };
    case "temperature":
      return { showTemperatureBeton: false, showTemperatureAir: false, showTemperatureAmbiante: false, showClasseConsistance: false };
    case "temps-prise":
      return { showTemperatureBeton: true, showTemperatureAir: true, showTemperatureAmbiante: false, showClasseConsistance: false };
    case "teneur-air":
      return { showTemperatureBeton: true, showTemperatureAir: true, showTemperatureAmbiante: false, showClasseConsistance: false };
    default:
      return { showTemperatureBeton: true, showTemperatureAir: true, showTemperatureAmbiante: false, showClasseConsistance: false };
  }
};

export default function BetonFraisReport({ essaiType, essaiTitle, normRef, basePath }: BetonFraisReportProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const reportRef = useRef<HTMLDivElement>(null);
  const { data: echantillon, isLoading } = useEchantillonBetonFraisById(essaiType, id);
  const { data: entreprise } = useEntreprise();
  const { data: formulation } = useFormulationDetails(echantillon?.formulation_id);
  const prefix = getPrefix(essaiType);
  const fieldConfig = getFieldsForType(essaiType);

  const templateId = `beton-frais-${essaiType}`;

  const triggerPrint = () => {
    const numero = String(echantillon?.numero ?? "").padStart(3, "0");
    PrintService.print({
      title: `rapport-${prefix}-${numero}`,
      orientation: "portrait",
    });
  };

  const handlePrint = () => triggerPrint();
  const handleDownloadPDF = () => triggerPrint();

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Béton", path: "/essais/beton" },
    { label: "Béton Frais", path: "/essais/beton/beton-frais" },
    { label: essaiTitle, path: basePath },
    { label: echantillon ? `${prefix}-${String(echantillon.numero).padStart(3, "0")}` : "Rapport", path: echantillon ? `${basePath}/${id}` : undefined },
    { label: "Rapport" },
  ];

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

  const ReportContent = reportContentComponents[essaiType];
  const resultats = echantillon.resultats as Record<string, unknown> | null;
  const verificationUrl = `${window.location.origin}/verify/${essaiType}/${id}`;
  const reportTitle = essaiType === "temperature" ? "Essai de Température de béton" : essaiTitle;
  const hasCaracteristiquesColumns = fieldConfig.showClasseConsistance || fieldConfig.showTemperatureBeton || fieldConfig.showTemperatureAir || fieldConfig.showTemperatureAmbiante;

  return (
    <div className="space-y-6">
      <EssaiBreadcrumb items={breadcrumbItems} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`${basePath}/${id}`)}
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
              Rapport - <span className="text-primary">{prefix}-{String(echantillon.numero).padStart(3, "0")}</span>
            </h1>
            <p className="text-muted-foreground mt-1">{essaiTitle}</p>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none">
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
        data-print-root
        data-print-template={templateId}
        className="report-table bg-white p-8 rounded-lg border border-border max-w-4xl mx-auto print:border-0 print:shadow-none print:max-w-none print:p-0"
      >
        <ReportHeader
          entreprise={entreprise}
          verificationUrl={verificationUrl}
          title={reportTitle}
          subtitle={normRef}
        />

        {/* Identification de l'échantillon */}
        <div className="mb-6 mt-6">
          <table className="identification-table w-full border-collapse border border-black text-sm">
            <tbody>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium w-1/6 text-black">N° Échantillon</td>
                <td className="border border-black px-3 py-1.5 w-1/3 text-black">{prefix}-{String(echantillon.numero).padStart(3, "0")}</td>
                <td className="border border-black px-3 py-1.5 font-medium w-1/6 text-black">Date de prélèvement</td>
                <td className="border border-black px-3 py-1.5 w-1/3 text-black">
                  {format(new Date(echantillon.date_prelevement), "dd/MM/yyyy", { locale: fr })}
                </td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium text-black">Client</td>
                <td className="border border-black px-3 py-1.5 text-black">{echantillon.clients?.nom || "-"}</td>
                <td className="border border-black px-3 py-1.5 font-medium text-black">Heure de prélèvement</td>
                <td className="border border-black px-3 py-1.5 text-black">{echantillon.heure_prelevement || "-"}</td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium text-black">Chantier</td>
                <td className="border border-black px-3 py-1.5 text-black" colSpan={3}>{echantillon.chantiers?.nom || "-"}</td>
              </tr>
              {(echantillon as any).essai_convenance && (
                <tr>
                  <td className="border border-black px-3 py-1.5 font-medium text-black">Essai de convenance</td>
                  <td className="border border-black px-3 py-1.5 text-black" colSpan={3}>
                    {(echantillon as any).essai_convenance_details || "-"}
                  </td>
                </tr>
              )}
              {!(echantillon as any).essai_convenance && (
                <tr>
                  <td className="border border-black px-3 py-1.5 font-medium text-black">Ouvrage</td>
                  <td className="border border-black px-3 py-1.5 text-black">{(echantillon as any).ouvrage || "-"}</td>
                  <td className="border border-black px-3 py-1.5 font-medium text-black">Partie de l'ouvrage</td>
                  <td className="border border-black px-3 py-1.5 text-black">{(echantillon as any).destination_beton || "-"}</td>
                </tr>
              )}
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
                <th className="border border-black px-2 py-1 text-center font-medium text-xs text-black">Ciment</th>
                <th className="border border-black px-2 py-1 text-center font-medium text-xs text-black">Eau</th>
                <th className="border border-black px-2 py-1 text-center font-medium text-xs text-black">Adjuvant</th>
                <th className="border border-black px-2 py-1 text-center font-medium text-xs text-black">Sable 1</th>
                <th className="border border-black px-2 py-1 text-center font-medium text-xs text-black">Sable 2</th>
                <th className="border border-black px-2 py-1 text-center font-medium text-xs text-black">Gravier 1</th>
                <th className="border border-black px-2 py-1 text-center font-medium text-xs text-black">Gravier 2</th>
                <th className="border border-black px-2 py-1 text-center font-medium text-xs text-black">Gravier 3</th>
              </tr>
              <tr>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.ciment.producteur_nom || "-"}</th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.eau.producteur_nom || "-"}</th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.adjuvant.producteur_nom || "-"}</th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.sable_concasse.producteur_nom || "-"}</th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.sable_fin.producteur_nom || "-"}</th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.gravillons1.producteur_nom || "-"}</th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.gravier2.producteur_nom || "-"}</th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.gravier3.producteur_nom || "-"}</th>
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
        {hasCaracteristiquesColumns && (
          <div className="mb-6">
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr>
                  {fieldConfig.showClasseConsistance && (
                    <th className="border border-black px-3 py-1.5 text-center font-medium text-black">Classe de consistance</th>
                  )}
                  {fieldConfig.showTemperatureBeton && (
                    <th className="border border-black px-3 py-1.5 text-center font-medium text-black">T°C béton</th>
                  )}
                  {fieldConfig.showTemperatureAir && (
                    <th className="border border-black px-3 py-1.5 text-center font-medium text-black">T°C Air</th>
                  )}
                  {fieldConfig.showTemperatureAmbiante && (
                    <th className="border border-black px-3 py-1.5 text-center font-medium text-black">T°C Ambiante</th>
                  )}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {fieldConfig.showClasseConsistance && (
                    <td className="border border-black px-3 py-1.5 text-center text-black">{echantillon.classe_consistance || "—"}</td>
                  )}
                  {fieldConfig.showTemperatureBeton && (
                    <td className="border border-black px-3 py-1.5 text-center text-black">{echantillon.temperature_beton ? `${echantillon.temperature_beton}°C` : "—"}</td>
                  )}
                  {fieldConfig.showTemperatureAir && (
                    <td className="border border-black px-3 py-1.5 text-center text-black">{echantillon.temperature_air ? `${echantillon.temperature_air}°C` : "—"}</td>
                  )}
                  {fieldConfig.showTemperatureAmbiante && (
                    <td className="border border-black px-3 py-1.5 text-center text-black">{echantillon.temperature_ambiante ? `${echantillon.temperature_ambiante}°C` : "—"}</td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Résultats */}
        {resultats && ReportContent && (
          <ReportContent resultats={resultats} echantillon={echantillon} />
        )}

        {/* Observations */}
        {echantillon.observations && (
          <div className="mt-6 mb-6">
            <h3 className="font-bold text-sm mb-2 underline text-black">Observations</h3>
            <div className="border border-black px-3 py-2 text-sm text-black">
              {echantillon.observations}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 grid grid-cols-2 gap-8 text-black">
          <div className="text-center">
            <p className="text-sm font-medium mb-8">
              Le Technicien: {echantillon.intervenants
                ? `${echantillon.intervenants.prenom} ${echantillon.intervenants.nom}`
                : "_________________"}
            </p>
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
}
