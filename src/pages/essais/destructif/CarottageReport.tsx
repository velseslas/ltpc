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
  hauteur_L: string;
  diametre_D: string;
  elancement: string;
  k_ld: string;
  poids: string;
  volume: string;
  masse_volumique: string;
  charge: string;
  section: string;
  resistance: string;
  resistance_corrigee: string;
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

  // Calculate average resistance (brute et corrigée)
  const resistances = results.map(r => parseFloat(r.resistance)).filter(v => !isNaN(v) && v > 0);
  const moyenneRc = resistances.length > 0
    ? (resistances.reduce((a, b) => a + b, 0) / resistances.length).toFixed(2)
    : "—";
  const resistancesCorr = results.map(r => parseFloat(r.resistance_corrigee)).filter(v => !isNaN(v) && v > 0);
  const moyenneRcCorr = resistancesCorr.length > 0
    ? (resistancesCorr.reduce((a, b) => a + b, 0) / resistancesCorr.length).toFixed(2)
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


        {/* Résultats */}
        <div className="mb-6">
          <h3 className="font-bold text-sm mb-2 underline text-black">Résultats des essais sur carottes</h3>
          <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-black text-[10px]">
            <thead>
              <tr>
                <th className="border border-black px-1 py-1 text-center font-medium text-black">Réf.</th>
                <th className="border border-black px-1 py-1 text-center font-medium text-black">L (mm)</th>
                <th className="border border-black px-1 py-1 text-center font-medium text-black">D (mm)</th>
                <th className="border border-black px-1 py-1 text-center font-medium text-black">L/D</th>
                <th className="border border-black px-1 py-1 text-center font-medium text-black">K(L/D)</th>
                <th className="border border-black px-1 py-1 text-center font-medium text-black">Poids (kg)</th>
                <th className="border border-black px-1 py-1 text-center font-medium text-black">Volume (m³)</th>
                <th className="border border-black px-1 py-1 text-center font-medium text-black">ρ (t/m³)</th>
                <th className="border border-black px-1 py-1 text-center font-medium text-black">Charge (kN)</th>
                <th className="border border-black px-1 py-1 text-center font-medium text-black">Section (mm²)</th>
                <th className="border border-black px-1 py-1 text-center font-medium text-black">Rc (MPa)</th>
                <th className="border border-black px-1 py-1 text-center font-medium text-black">Rc corr. L/D 16×32 (MPa)</th>
              </tr>
            </thead>
            <tbody>
              {results.length > 0 ? (
                results.map((r, i) => (
                  <tr key={i}>
                    <td className="border border-black px-1 py-1 text-center text-black">{r.reference || "—"}</td>
                    <td className="border border-black px-1 py-1 text-center text-black">{r.hauteur_L || "—"}</td>
                    <td className="border border-black px-1 py-1 text-center text-black">{r.diametre_D || "—"}</td>
                    <td className="border border-black px-1 py-1 text-center text-black">{r.elancement || "—"}</td>
                    <td className="border border-black px-1 py-1 text-center text-black">{r.k_ld || "—"}</td>
                    <td className="border border-black px-1 py-1 text-center text-black">{r.poids || "—"}</td>
                    <td className="border border-black px-1 py-1 text-center text-black">{r.volume || "—"}</td>
                    <td className="border border-black px-1 py-1 text-center text-black">{r.masse_volumique || "—"}</td>
                    <td className="border border-black px-1 py-1 text-center text-black">{r.charge || "—"}</td>
                    <td className="border border-black px-1 py-1 text-center text-black">{r.section || "—"}</td>
                    <td className="border border-black px-1 py-1 text-center font-bold text-black">{r.resistance || "—"}</td>
                    <td className="border border-black px-1 py-1 text-center font-bold text-black">{r.resistance_corrigee || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="border border-black px-2 py-4 text-center text-black">
                    Aucune donnée saisie
                  </td>
                </tr>
              )}
              {results.length > 0 && (
                <>
                  <tr>
                    <td colSpan={10} className="border border-black px-2 py-1 text-right font-bold text-black">
                      Rc moyenne (MPa) :
                    </td>
                    <td className="border border-black px-1 py-1 text-center font-bold text-black" colSpan={2}>
                      {moyenneRc}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={10} className="border border-black px-2 py-1 text-right font-bold text-black">
                      Rc moyenne avec élancement L/D (16×32) (MPa) :
                    </td>
                    <td className="border border-black px-1 py-1 text-center font-bold text-black" colSpan={2}>
                      {moyenneRcCorr}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
          </div>
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
