import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Loader2, Printer } from "lucide-react";
import { useEchantillonCarottage } from "@/hooks/useEchantillonsCarottage";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
  const reportRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Rapport_Carottage_CR-${String(echantillon?.numero).padStart(3, "0")}.pdf`);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!echantillon) {
    return <div className="text-center py-12 text-muted-foreground">Échantillon non trouvé</div>;
  }

  const results: CarotteResult[] = (echantillon.resultats && Array.isArray(echantillon.resultats))
    ? echantillon.resultats as unknown as CarotteResult[]
    : [];

  return (
    <div className="space-y-6">
      <EssaiBreadcrumb
        items={[
          { label: "Béton", path: "/essais/beton" },
          { label: "Destructif", path: "/essais/beton/destructif" },
          { label: "Carottage", path: "/essais/beton/destructif/carottage" },
          { label: `CR-${String(echantillon.numero).padStart(3, "0")}`, path: `/essais/beton/destructif/carottage/${id}` },
          { label: "Rapport" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(`/essais/beton/destructif/carottage/${id}`)}
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Rapport <span className="text-primary">CR-{String(echantillon.numero).padStart(3, "0")}</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Imprimer
          </Button>
          <Button onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" /> Exporter PDF
          </Button>
        </div>
      </div>

      <div ref={reportRef} className="bg-white text-black p-8 rounded-xl border max-w-[210mm] mx-auto print:shadow-none print:border-none">
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-xl font-bold uppercase">Rapport d'Essai de Carottage</h1>
          <p className="text-sm mt-1">Selon NF EN 12504-1</p>
        </div>

        {/* Info */}
        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div className="space-y-1">
            <p><strong>N° Échantillon :</strong> CR-{String(echantillon.numero).padStart(3, "0")}</p>
            <p><strong>Client :</strong> {echantillon.clients?.nom ?? "-"}</p>
            <p><strong>Chantier :</strong> {echantillon.chantiers?.nom ?? "-"}</p>
            <p><strong>Ouvrage :</strong> {echantillon.ouvrage ?? "-"}</p>
            <p><strong>Partie d'ouvrage :</strong> {echantillon.partie_ouvrage ?? "-"}</p>
          </div>
          <div className="space-y-1">
            <p><strong>Date de prélèvement :</strong> {format(new Date(echantillon.date_prelevement), "dd/MM/yyyy", { locale: fr })}</p>
            {echantillon.date_essai && <p><strong>Date de l'essai :</strong> {format(new Date(echantillon.date_essai), "dd/MM/yyyy", { locale: fr })}</p>}
            <p><strong>Localisation :</strong> {echantillon.localisation ?? "-"}</p>
            <p><strong>Diamètre :</strong> {echantillon.diametre_carotte ? `Ø ${echantillon.diametre_carotte} mm` : "-"}</p>
            <p><strong>Direction :</strong> {echantillon.direction_carottage ?? "-"}</p>
            <p><strong>Armatures :</strong> {echantillon.presence_armatures ? "Oui" : "Non"}</p>
          </div>
        </div>

        {/* Results table */}
        {results.length > 0 ? (
          <div className="mb-6">
            <h2 className="text-sm font-bold uppercase mb-2">Résultats des essais sur carottes</h2>
            <table className="w-full text-xs border-collapse border border-black">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-1">Réf.</th>
                  <th className="border border-black p-1">Ø (mm)</th>
                  <th className="border border-black p-1">L avant (mm)</th>
                  <th className="border border-black p-1">L après (mm)</th>
                  <th className="border border-black p-1">Masse (g)</th>
                  <th className="border border-black p-1">ρ (kg/m³)</th>
                  <th className="border border-black p-1">F (kN)</th>
                  <th className="border border-black p-1">fc (MPa)</th>
                  <th className="border border-black p-1">Rupture</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i}>
                    <td className="border border-black p-1 text-center">{r.reference || "-"}</td>
                    <td className="border border-black p-1 text-center">{r.diametre || "-"}</td>
                    <td className="border border-black p-1 text-center">{r.longueur_avant || "-"}</td>
                    <td className="border border-black p-1 text-center">{r.longueur_apres || "-"}</td>
                    <td className="border border-black p-1 text-center">{r.masse || "-"}</td>
                    <td className="border border-black p-1 text-center">{r.masse_volumique || "-"}</td>
                    <td className="border border-black p-1 text-center">{r.charge_rupture || "-"}</td>
                    <td className="border border-black p-1 text-center font-bold">{r.resistance || "-"}</td>
                    <td className="border border-black p-1 text-center">{r.type_rupture || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm italic text-gray-500 mb-6">Aucun résultat saisi.</p>
        )}

        {echantillon.observations && (
          <div className="mb-6">
            <h2 className="text-sm font-bold uppercase mb-1">Observations</h2>
            <p className="text-sm">{echantillon.observations}</p>
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-4 mt-12 text-center text-xs">
          <div className="border-t border-black pt-2">Opérateur</div>
          <div className="border-t border-black pt-2">Chef de Laboratoire</div>
          <div className="border-t border-black pt-2">Directeur</div>
        </div>
      </div>
    </div>
  );
};

export default CarottageReport;
