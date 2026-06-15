import { useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Printer, Loader2, Download } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import ShareButton from "@/components/reports/ShareButton";
import { DuplicateReportButton } from "@/components/reports/DuplicateReportButton";
import { useEchantillonGeotechniqueById, getGeoPrefix } from "@/hooks/useEchantillonsGeotechniqueFactory";
import { useEntreprise } from "@/hooks/useEntreprise";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { ReportHeader } from "@/components/reports/ReportHeader";

function pf(v: unknown): number { return parseFloat(String(v ?? "")) || 0; }
function fmt(v: number, dec = 2): string { return isNaN(v) || !isFinite(v) ? "-" : v.toFixed(dec); }

export default function TeneurEauSolReport() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const printRef = useRef<HTMLDivElement>(null);
  const essaiType = "teneur-eau-sol";
  const basePath = "/essais/geotechnique/identification/teneur-eau-sol";

  const { data: echantillon, isLoading } = useEchantillonGeotechniqueById(essaiType, id);
  const { data: entreprise } = useEntreprise();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!echantillon) {
    return <div className="text-center py-8 text-muted-foreground">Échantillon non trouvé</div>;
  }

  const prefix = getGeoPrefix(essaiType);
  const numero = `${prefix}-${String(echantillon.numero).padStart(3, "0")}`;
  const r = (echantillon.resultats as Record<string, string>) || {};

  const prises = [1, 2].map(n => {
    const m1 = pf(r[`p${n}_m1`]);
    const m2 = pf(r[`p${n}_m2`]);
    const m3 = pf(r[`p${n}_m3`]);
    const mh = m2 - m1;
    const md = m3 - m1;
    const mw = m2 - m3;
    const W = md > 0 ? (mw / md) * 100 : 0;
    return { tare_num: r[`p${n}_tare_num`] || "", m1, m2, m3, mh, md, mw, W };
  });

  const validW = prises.filter(p => p.W > 0);
  const moyen = validW.length > 0 ? validW.reduce((s, p) => s + p.W, 0) / validW.length : 0;

  const verificationUrl = `${window.location.origin}${basePath}/${id}`;

  const rows: { label: string; unit: string; vals: [string, string] }[] = [
    { label: "Numéro de la tare", unit: "", vals: [prises[0].tare_num, prises[1].tare_num] },
    { label: "Poids du récipient m₁", unit: "(g)", vals: [fmt(prises[0].m1, 1), fmt(prises[1].m1, 1)] },
    { label: "Poids de l'ensemble (échantillon humide + récipient) m₂", unit: "(g)", vals: [fmt(prises[0].m2, 1), fmt(prises[1].m2, 1)] },
    { label: "Poids de l'échantillon humide  mh = m₂ – m₁", unit: "(g)", vals: [fmt(prises[0].mh, 1), fmt(prises[1].mh, 1)] },
    { label: "Poids de l'ensemble (échantillon sec + récipient) m₃", unit: "(g)", vals: [fmt(prises[0].m3, 1), fmt(prises[1].m3, 1)] },
    { label: "Poids de l'échantillon sec  md = m₃ – m₁", unit: "(g)", vals: [fmt(prises[0].md, 1), fmt(prises[1].md, 1)] },
    { label: "Poids de l'eau  mw = m₂ – m₃", unit: "(g)", vals: [fmt(prises[0].mw, 1), fmt(prises[1].mw, 1)] },
    { label: "Teneur en eau  W = (mw / md) × 100", unit: "(%)", vals: [prises[0].W > 0 ? fmt(prises[0].W) + "%" : "-", prises[1].W > 0 ? fmt(prises[1].W) + " %" : "-"] },
  ];

  const handlePrint = () => window.print();
  const handleDownloadPDF = async () => {
    const { downloadReportAsPDF } = await import("@/lib/pdf");
    downloadReportAsPDF(`rapport-teneur-eau-${numero}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="print:hidden">
        <EssaiBreadcrumb items={[
          { label: "Géotechnique", path: "/essais/geotechnique" },
          { label: "Identification", path: "/essais/geotechnique/identification" },
          { label: "Teneur en Eau", path: basePath },
          { label: <><span className="text-primary">{prefix}</span>-{String(echantillon.numero).padStart(3, "0")}</>, path: `${basePath}/${id}` },
          { label: "Rapport" }
        ]} />
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <BackButton to={`${basePath}/${id}`} />
            <h1 className="text-3xl font-display font-bold text-foreground">
              Rapport <span className="text-primary">{numero}</span>
            </h1>
          </div>
          <div className="flex gap-2">
            <ShareButton />
            {id && <DuplicateReportButton tableName="echantillons_teneur_eau_sol" sourceId={id} reportRoute={(nid) => `${basePath}/${nid}/rapport`} />}
            <Button variant="outline" className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />Télécharger PDF
            </Button>
            <Button onClick={handlePrint} className="gradient-primary text-primary-foreground">
              <Printer className="h-4 w-4 mr-2" />Imprimer
            </Button>
          </div>
        </div>
      </div>

      <div ref={printRef} data-ref="report" className="bg-white text-black p-8 rounded-lg shadow-sm print:shadow-none print:p-0 max-w-4xl mx-auto print:max-w-none" style={{ fontFamily: "serif" }}>
        <ReportHeader
          entreprise={entreprise}
          verificationUrl={verificationUrl}
          title="ESSAI DE TENEUR EN EAU DES SOLS"
          subtitle="NF P 94-050"
        />

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

        {/* Expression des résultats */}
        <h3 className="font-bold text-center text-base mb-3">Expression des résultats</h3>
        <table className="w-full border-collapse border border-black text-sm mb-6">
          <thead>
            <tr className="bg-[#d4e5f7]">
              <th className="border border-black p-2 text-left">Essais</th>
              <th className="border border-black p-2 text-center w-10"></th>
              <th className="border border-black p-2 text-center w-28">Prise 01</th>
              <th className="border border-black p-2 text-center w-28">Prise 02</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border border-black p-2">{row.label}</td>
                <td className="border border-black p-2 text-center text-xs text-gray-600">{row.unit}</td>
                <td className="border border-black p-2 text-center font-semibold">{row.vals[0]}</td>
                <td className="border border-black p-2 text-center font-semibold">{row.vals[1]}</td>
              </tr>
            ))}
            {/* MOYEN */}
            <tr className="bg-[#d4e5f7]">
              <td className="border border-black p-2 font-bold" colSpan={2}>MOYEN</td>
              <td className="border border-black p-2 text-center font-bold text-lg" colSpan={2}>
                {moyen > 0 ? fmt(moyen) : "-"}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Observations */}
        {r.notes && (
          <div className="border border-gray-300 p-3 rounded mb-6">
            <p className="font-bold text-sm mb-1">Observations :</p>
            <p className="text-sm">{r.notes}</p>
          </div>
        )}

        {/* Signature */}
        <div className="flex justify-between mt-12 text-sm">
          <div className="text-center">
            <p className="font-bold mb-8">L'opérateur</p>
            {echantillon.intervenants?.signature_url && (
              <img src={echantillon.intervenants.signature_url} alt="Signature" className="h-16 mx-auto mb-2" />
            )}
            <p>{echantillon.intervenants ? `${echantillon.intervenants.prenom} ${echantillon.intervenants.nom}` : ""}</p>
          </div>
          <div className="text-center">
            <p className="font-bold mb-8">Le directeur du laboratoire</p>
            <p>_________________________</p>
          </div>
        </div>
      </div>
    </div>
  );
}
