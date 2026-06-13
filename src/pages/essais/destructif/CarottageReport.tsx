import { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Printer, Loader2 } from "lucide-react";
import ShareButton from "@/components/reports/ShareButton";
import { useEchantillonCarottage } from "@/hooks/useEchantillonsCarottage";
import { useEntreprise } from "@/hooks/useEntreprise";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { downloadReportAsPDF } from "@/lib/pdf";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { ReportHeader } from "@/components/reports/ReportHeader";

interface CarotteResult {
  reference: string;
  longueur_avant: string;
  longueur_apres: string;
  diametre: string;
  masse: string;
  masse_volumique: string;
  charge_rupture: string;
  resistance: string;
  type_rupture: string;
  observations: string;
}

const CarottageReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: echantillon, isLoading } = useEchantillonCarottage(id || "");
  const { data: entreprise } = useEntreprise();
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    downloadReportAsPDF(`Rapport_Carottage_CR-${String(echantillon?.numero).padStart(3, "0")}`);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!echantillon) {
    return <div className="text-center py-12 text-muted-foreground">Échantillon non trouvé</div>;
  }

  const rawResults: any = echantillon.resultats;
  let results: CarotteResult[] = [];
  if (Array.isArray(rawResults)) {
    results = rawResults as CarotteResult[];
  } else if (rawResults && typeof rawResults === "object") {
    if (Array.isArray(rawResults.carottes)) {
      results = rawResults.carottes as CarotteResult[];
    } else if (Array.isArray(rawResults.elements)) {
      results = rawResults.elements.flatMap((e: any) => Array.isArray(e?.carottes) ? e.carottes : []);
    }
  }

  const verificationUrl = `${window.location.origin}/essais/beton/destructif/carottage/${id}/rapport`;

  // Calculate average resistance
  const resistances = results.map(r => parseFloat(r.resistance)).filter(v => !isNaN(v) && v > 0);
  const moyenneRc = resistances.length > 0
    ? (resistances.reduce((a, b) => a + b, 0) / resistances.length).toFixed(2)
    : "—";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header actions - hidden on print */}
      <div className="print:hidden">
        <EssaiBreadcrumb
          items={[
            { label: "Béton", path: "/essais/beton" },
            { label: "Destructif", path: "/essais/beton/destructif" },
            { label: "Carottage", path: "/essais/beton/destructif/carottage" },
            { label: <>CR-{String(echantillon.numero).padStart(3, "0")}</>, path: `/essais/beton/destructif/carottage/${id}` },
            { label: "Rapport" },
          ]}
        />
      </div>

      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(`/essais/beton/destructif/carottage/${id}`)}
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Rapport de carottage</h1>
        </div>
        <div className="flex gap-3">
          <ShareButton />
          <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" /> Imprimer
          </Button>
          <Button onClick={handleDownloadPDF} className="flex items-center gap-2">
            <Download className="h-4 w-4" /> Télécharger PDF
          </Button>
        </div>
      </div>

      {/* Report */}
      <div
        ref={reportRef}
        data-ref="report"
        className="report-table bg-white text-black p-8 rounded-lg shadow-lg max-w-4xl mx-auto print:shadow-none print:p-4"
        style={{ fontFamily: "Arial, sans-serif", WebkitPrintColorAdjust: "exact" } as React.CSSProperties}
      >
        <ReportHeader
          entreprise={entreprise}
          verificationUrl={verificationUrl}
          title="RAPPORT D'ESSAI DE CAROTTAGE"
          subtitle="Résistance à la compression sur carottes — Norme NF EN 12504-1"
        />

        {/* Identification */}
        <div className="mb-6">
          <h3 className="font-bold text-sm mb-2 underline text-black">Identification de l'échantillon</h3>
          <table className="identification-table w-full border-collapse border border-black text-sm">
            <tbody>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium w-1/3 text-black">N° Échantillon</td>
                <td className="border border-black px-3 py-1.5 text-black">CR-{String(echantillon.numero).padStart(3, "0")}</td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium text-black">Client</td>
                <td className="border border-black px-3 py-1.5 text-black">{echantillon.clients?.nom || "—"}</td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium text-black">Chantier</td>
                <td className="border border-black px-3 py-1.5 text-black">{echantillon.chantiers?.nom || "—"}</td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium text-black">Ouvrage</td>
                <td className="border border-black px-3 py-1.5 text-black">{echantillon.ouvrage || "—"}</td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium text-black">Partie de l'ouvrage</td>
                <td className="border border-black px-3 py-1.5 text-black">{echantillon.partie_ouvrage || "—"}</td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium text-black">Localisation</td>
                <td className="border border-black px-3 py-1.5 text-black">{echantillon.localisation || "—"}</td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium text-black">Date de prélèvement</td>
                <td className="border border-black px-3 py-1.5 text-black">{format(new Date(echantillon.date_prelevement), "dd/MM/yyyy", { locale: fr })}</td>
              </tr>
              {echantillon.date_essai && (
                <tr>
                  <td className="border border-black px-3 py-1.5 font-medium text-black">Date de l'essai</td>
                  <td className="border border-black px-3 py-1.5 text-black">{format(new Date(echantillon.date_essai), "dd/MM/yyyy", { locale: fr })}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Caractéristiques techniques */}
        <div className="mb-6">
          <h3 className="font-bold text-sm mb-2 underline text-black">Caractéristiques du carottage</h3>
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr>
                <th className="border border-black px-3 py-1.5 text-center font-medium text-black">Diamètre (mm)</th>
                <th className="border border-black px-3 py-1.5 text-center font-medium text-black">Direction</th>
                <th className="border border-black px-3 py-1.5 text-center font-medium text-black">Classe de résistance</th>
                <th className="border border-black px-3 py-1.5 text-center font-medium text-black">État de surface</th>
                <th className="border border-black px-3 py-1.5 text-center font-medium text-black">Armatures</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black px-3 py-1.5 text-center text-black">{echantillon.diametre_carotte ? `Ø ${echantillon.diametre_carotte}` : "—"}</td>
                <td className="border border-black px-3 py-1.5 text-center text-black">{echantillon.direction_carottage || "—"}</td>
                <td className="border border-black px-3 py-1.5 text-center text-black">{echantillon.classe_resistance || "—"}</td>
                <td className="border border-black px-3 py-1.5 text-center text-black">{echantillon.etat_surface || "—"}</td>
                <td className="border border-black px-3 py-1.5 text-center text-black">{echantillon.presence_armatures ? "Oui" : "Non"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Résultats */}
        <div className="mb-6">
          <h3 className="font-bold text-sm mb-2 underline text-black">Résultats des essais sur carottes</h3>
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr>
                <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">Réf.</th>
                <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">Ø (mm)</th>
                <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">L avant rect. (mm)</th>
                <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">L après rect. (mm)</th>
                <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">Masse (g)</th>
                <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">ρ (kg/m³)</th>
                <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">F (kN)</th>
                <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">fc (MPa)</th>
                <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">Type rupture</th>
              </tr>
            </thead>
            <tbody>
              {results.length > 0 ? (
                results.map((r, i) => (
                  <tr key={i}>
                    <td className="border border-black px-2 py-2 text-center text-sm text-black">{r.reference || "—"}</td>
                    <td className="border border-black px-2 py-2 text-center text-sm text-black">{r.diametre || "—"}</td>
                    <td className="border border-black px-2 py-2 text-center text-sm text-black">{r.longueur_avant || "—"}</td>
                    <td className="border border-black px-2 py-2 text-center text-sm text-black">{r.longueur_apres || "—"}</td>
                    <td className="border border-black px-2 py-2 text-center text-sm text-black">{r.masse || "—"}</td>
                    <td className="border border-black px-2 py-2 text-center text-sm text-black">{r.masse_volumique || "—"}</td>
                    <td className="border border-black px-2 py-2 text-center text-sm text-black">{r.charge_rupture || "—"}</td>
                    <td className="border border-black px-2 py-2 text-center text-sm font-bold text-black">{r.resistance || "—"}</td>
                    <td className="border border-black px-2 py-2 text-center text-sm text-black">{r.type_rupture || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="border border-black px-2 py-4 text-center text-sm text-black">
                    Aucune donnée saisie
                  </td>
                </tr>
              )}
              {results.length > 0 && (
                <tr>
                  <td colSpan={7} className="border border-black px-3 py-2 text-right text-sm font-bold text-black">
                    Résistance moyenne fc :
                  </td>
                  <td className="border border-black px-2 py-2 text-center text-sm font-bold text-black">
                    {moyenneRc}
                  </td>
                  <td className="border border-black px-2 py-2 text-center text-sm text-black">MPa</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Observations */}
        {echantillon.observations && (
          <div className="mt-4 pt-3 border-t border-gray-300">
            <p className="font-bold text-sm underline text-black mb-2">Observations</p>
            <p className="text-sm text-black">{echantillon.observations}</p>
          </div>
        )}

        {/* Footer - Signatures */}
        <div className="mt-8 pt-4 border-t border-gray-300">
          <div className="flex justify-between items-end">
            <div className="text-sm text-black">
              <p>Le Technicien: {echantillon.intervenants ? `${echantillon.intervenants.nom} ${echantillon.intervenants.prenom || ""}` : "—"}</p>
            </div>
            <div className="text-center">
              <div className="min-h-16 flex flex-col items-center justify-end">
                {entreprise?.cachet_url ? (
                  <img src={entreprise.cachet_url} alt="Cachet" className="max-h-20 object-contain mb-1" />
                ) : (
                  <p className="text-sm font-medium text-black">Signature et cachet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          #root { padding: 0 !important; }
          [data-ref="report"], [data-ref="report"] * { visibility: visible; }
          [data-ref="report"] { position: absolute; top: 0; left: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default CarottageReport;
