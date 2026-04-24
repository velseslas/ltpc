import { useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Printer, Download, Loader2, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { EssaiBreadcrumb, BreadcrumbItem } from "@/components/essais/EssaiBreadcrumb";
import { ReportHeader } from "@/components/reports/ReportHeader";
import ShareButton from "@/components/reports/ShareButton";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useFormulation } from "@/hooks/useFormulations";
import { useFormulationDetails } from "@/hooks/useFormulationDetails";
import { useCentraleBeton } from "@/hooks/useCentralesBeton";

interface IngredientRow {
  label: string;
  unite: string;
  quantite: number | null | undefined;
  produit?: string | null;
  producteur?: string | null;
}

export default function FormulationReport() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const reportRef = useRef<HTMLDivElement>(null);

  const { data: formulation, isLoading } = useFormulation(id || "");
  const { data: details } = useFormulationDetails(id);
  const { data: entreprise } = useEntreprise();
  const { data: centrale } = useCentraleBeton(formulation?.centrale_id || "");

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
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`formulation-${formulation?.nom || id}.pdf`);
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

  if (!formulation) {
    return <div className="text-center py-8 text-muted-foreground">Formulation non trouvée</div>;
  }

  // Build ingredient rows
  const granulats: IngredientRow[] = [
    { label: "Sable concassé", unite: "kg", quantite: details?.sable_concasse.quantite, produit: details?.sable_concasse.produit_nom, producteur: details?.sable_concasse.producteur_nom },
    { label: "Sable fin", unite: "kg", quantite: details?.sable_fin.quantite, produit: details?.sable_fin.produit_nom, producteur: details?.sable_fin.producteur_nom },
    { label: "Gravillons 1", unite: "kg", quantite: details?.gravillons1.quantite, produit: details?.gravillons1.produit_nom, producteur: details?.gravillons1.producteur_nom },
    { label: "Gravier 2", unite: "kg", quantite: details?.gravier2.quantite, produit: details?.gravier2.produit_nom, producteur: details?.gravier2.producteur_nom },
    { label: "Gravier 3", unite: "kg", quantite: details?.gravier3.quantite, produit: details?.gravier3.produit_nom, producteur: details?.gravier3.producteur_nom },
  ].filter(r => r.quantite && r.quantite > 0);

  const liants: IngredientRow[] = [
    { label: "Ciment", unite: "kg", quantite: details?.ciment.quantite, produit: details?.ciment.produit_nom, producteur: details?.ciment.producteur_nom },
    { label: "Adjuvant", unite: "kg", quantite: details?.adjuvant.quantite, produit: details?.adjuvant.produit_nom, producteur: details?.adjuvant.producteur_nom },
    { label: "Eau", unite: "L", quantite: details?.eau.quantite, produit: details?.eau.produit_nom, producteur: details?.eau.producteur_nom },
  ].filter(r => r.quantite && r.quantite > 0);

  // Calculations
  const sables = (formulation.sable_concasse_quantite || 0) + (formulation.sable_fin_quantite || 0);
  const graviers = (formulation.gravillons1_quantite || 0) + (formulation.gravier2_quantite || 0) + (formulation.gravier3_quantite || 0);
  const eau = formulation.eau_quantite || 0;
  const ciment = formulation.ciment_quantite || 0;
  const total =
    sables + graviers + ciment + (formulation.adjuvant_quantite || 0) + eau;

  const gs = sables > 0 ? (graviers / sables).toFixed(2) : "-";
  const ec = ciment > 0 ? (eau / ciment).toFixed(2) : "-";
  const dosageCiment = ciment > 0 ? `${ciment} kg/m³` : "-";

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Béton", path: "/essais/beton" },
    { label: "Formulation", path: "/essais/beton/formulation" },
    { label: formulation.nom },
    { label: "Rapport" },
  ];

  const verificationUrl = `${window.location.origin}/essais/beton/formulation/${id}/rapport`;

  return (
    <div className="space-y-6">
      <EssaiBreadcrumb items={breadcrumbItems} />

      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Rapport - <span className="text-primary">{formulation.nom}</span>
            </h1>
            <p className="text-muted-foreground mt-1">Formulation de béton</p>
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
          title="Fiche de formulation de béton"
          subtitle="Méthode Dreux-Gorisse"
        />

        {/* Identification */}
        <div className="mb-6 mt-6">
          <h3 className="font-bold text-sm mb-2 underline text-black">Identification</h3>
          <table className="w-full border-collapse border border-black text-sm">
            <tbody>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium w-1/3 text-black">Nom de la formulation</td>
                <td className="border border-black px-3 py-1.5 text-black">{formulation.nom}</td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium text-black">Centrale à béton</td>
                <td className="border border-black px-3 py-1.5 text-black">{centrale?.nom || "-"}</td>
              </tr>
              {centrale?.ville && (
                <tr>
                  <td className="border border-black px-3 py-1.5 font-medium text-black">Localisation</td>
                  <td className="border border-black px-3 py-1.5 text-black">{centrale.ville}</td>
                </tr>
              )}
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium text-black">Date de création</td>
                <td className="border border-black px-3 py-1.5 text-black">
                  {format(new Date(formulation.created_at), "dd/MM/yyyy", { locale: fr })}
                </td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-1.5 font-medium text-black">Dernière mise à jour</td>
                <td className="border border-black px-3 py-1.5 text-black">
                  {format(new Date(formulation.updated_at), "dd/MM/yyyy", { locale: fr })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Caractéristiques principales */}
        <div className="mb-6">
          <h3 className="font-bold text-sm mb-2 underline text-black">Caractéristiques principales</h3>
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-3 py-1.5 text-center font-medium text-black">Rapport G/S</th>
                <th className="border border-black px-3 py-1.5 text-center font-medium text-black">Rapport E/C</th>
                <th className="border border-black px-3 py-1.5 text-center font-medium text-black">Dosage en ciment</th>
                <th className="border border-black px-3 py-1.5 text-center font-medium text-black">Masse totale</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black px-3 py-2 text-center font-bold text-black">{gs}</td>
                <td className="border border-black px-3 py-2 text-center font-bold text-black">{ec}</td>
                <td className="border border-black px-3 py-2 text-center font-bold text-black">{dosageCiment}</td>
                <td className="border border-black px-3 py-2 text-center font-bold text-black">{total.toFixed(1)} kg</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Granulats */}
        {granulats.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold text-sm mb-2 underline text-black">Granulats</h3>
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black px-3 py-1.5 text-left font-medium text-black">Constituant</th>
                  <th className="border border-black px-3 py-1.5 text-left font-medium text-black">Producteur</th>
                  <th className="border border-black px-3 py-1.5 text-left font-medium text-black">Produit</th>
                  <th className="border border-black px-3 py-1.5 text-center font-medium text-black">Quantité</th>
                  <th className="border border-black px-3 py-1.5 text-center font-medium text-black">% du total</th>
                </tr>
              </thead>
              <tbody>
                {granulats.map((row) => (
                  <tr key={row.label}>
                    <td className="border border-black px-3 py-1.5 font-medium text-black">{row.label}</td>
                    <td className="border border-black px-3 py-1.5 text-black">{row.producteur || "-"}</td>
                    <td className="border border-black px-3 py-1.5 text-black">{row.produit || "-"}</td>
                    <td className="border border-black px-3 py-1.5 text-center text-black">{row.quantite} {row.unite}</td>
                    <td className="border border-black px-3 py-1.5 text-center text-black">
                      {total > 0 ? `${(((row.quantite || 0) / total) * 100).toFixed(1)}%` : "-"}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-bold">
                  <td className="border border-black px-3 py-1.5 text-black" colSpan={3}>Sous-total granulats</td>
                  <td className="border border-black px-3 py-1.5 text-center text-black">{(sables + graviers).toFixed(1)} kg</td>
                  <td className="border border-black px-3 py-1.5 text-center text-black">
                    {total > 0 ? `${(((sables + graviers) / total) * 100).toFixed(1)}%` : "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Liants & Eau */}
        {liants.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold text-sm mb-2 underline text-black">Liants, adjuvants et eau</h3>
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black px-3 py-1.5 text-left font-medium text-black">Constituant</th>
                  <th className="border border-black px-3 py-1.5 text-left font-medium text-black">Producteur</th>
                  <th className="border border-black px-3 py-1.5 text-left font-medium text-black">Produit</th>
                  <th className="border border-black px-3 py-1.5 text-center font-medium text-black">Quantité</th>
                </tr>
              </thead>
              <tbody>
                {liants.map((row) => (
                  <tr key={row.label}>
                    <td className="border border-black px-3 py-1.5 font-medium text-black">{row.label}</td>
                    <td className="border border-black px-3 py-1.5 text-black">{row.producteur || "-"}</td>
                    <td className="border border-black px-3 py-1.5 text-black">{row.produit || "-"}</td>
                    <td className="border border-black px-3 py-1.5 text-center text-black">{row.quantite} {row.unite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Récapitulatif */}
        <div className="mb-6">
          <h3 className="font-bold text-sm mb-2 underline text-black">Récapitulatif (composition pour 1 m³)</h3>
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-2 py-1.5 text-center font-medium text-black">Ciment</th>
                <th className="border border-black px-2 py-1.5 text-center font-medium text-black">Eau</th>
                <th className="border border-black px-2 py-1.5 text-center font-medium text-black">Adjuvant</th>
                <th className="border border-black px-2 py-1.5 text-center font-medium text-black">Sable C.</th>
                <th className="border border-black px-2 py-1.5 text-center font-medium text-black">Sable F.</th>
                <th className="border border-black px-2 py-1.5 text-center font-medium text-black">Gravillons</th>
                <th className="border border-black px-2 py-1.5 text-center font-medium text-black">Gravier 2</th>
                <th className="border border-black px-2 py-1.5 text-center font-medium text-black">Gravier 3</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{formulation.ciment_quantite ?? 0}</td>
                <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{formulation.eau_quantite ?? 0}</td>
                <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{formulation.adjuvant_quantite ?? 0}</td>
                <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{formulation.sable_concasse_quantite ?? 0}</td>
                <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{formulation.sable_fin_quantite ?? 0}</td>
                <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{formulation.gravillons1_quantite ?? 0}</td>
                <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{formulation.gravier2_quantite ?? 0}</td>
                <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{formulation.gravier3_quantite ?? 0}</td>
              </tr>
            </tbody>
          </table>
          <p className="text-[11px] text-black mt-1 italic">Quantités exprimées en kg, sauf l'eau en litres.</p>
        </div>

        {/* Footer signatures */}
        <div className="mt-12 grid grid-cols-2 gap-8 text-black">
          <div className="text-center">
            <p className="text-sm font-medium mb-12">Le Technicien Formulateur</p>
            <p className="text-sm">_________________</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium mb-12">Le Directeur du Laboratoire</p>
            <p className="text-sm">{entreprise?.representant || "_________________"}</p>
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
