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
import { downloadReportAsPDF } from "@/lib/pdf";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Line, ComposedChart } from "recharts";
import { classifySoil } from "@/components/essais/geotechnique/SoilClassification";

const basePath = "/essais/geotechnique/identification/limites-atterberg";
const essaiType = "limites-atterberg";

function pf(v: unknown) { return parseFloat(String(v)) || 0; }
function fmt(v: number) { return isNaN(v) || !isFinite(v) ? "-" : v.toFixed(2); }

export default function LimitesAtterbergReport() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const reportRef = useRef<HTMLDivElement>(null);
  const { data: echantillon, isLoading } = useEchantillonGeotechniqueById(essaiType, id);
  const { data: entreprise } = useEntreprise();
  const prefix = getGeoPrefix(essaiType);

  const resultats = useMemo(() => (echantillon?.resultats as Record<string, unknown>) || {}, [echantillon]);
  const calculs = (resultats.calculs as Record<string, unknown>) || {};
  const liquidite = (resultats.liquidite as Array<Record<string, string>>) || [];
  const plasticite = (resultats.plasticite as Array<Record<string, string>>) || [];
  const reg = (calculs.regression as Record<string, number>) || {};

  // Computed values for liquidité table
  const liqCalc = useMemo(() => liquidite.map(e => {
    const tare = pf(e.poids_tare);
    const th = pf(e.poids_tare_sol_humide);
    const ts = pf(e.poids_tare_sol_sec);
    const sh = th - tare;
    const ss = ts - tare;
    const eau = sh - ss;
    const w = ss > 0 ? (eau / ss) * 100 : 0;
    return { sh, ss, eau, w, valid: tare > 0 && th > 0 && ts > 0 };
  }), [liquidite]);

  const plastCalc = useMemo(() => plasticite.map(e => {
    const tare = pf(e.poids_tare);
    const th = pf(e.poids_tare_sol_humide);
    const ts = pf(e.poids_tare_sol_sec);
    const sh = th - tare;
    const ss = ts - tare;
    const eau = sh - ss;
    const w = ss > 0 ? (eau / ss) * 100 : 0;
    return { sh, ss, eau, w, valid: tare > 0 && th > 0 && ts > 0 };
  }), [plasticite]);

  // Chart data
  const chartPoints = useMemo(() => {
    return liquidite.map((e, i) => ({
      x: pf(e.nombre_coups),
      y: liqCalc[i].valid ? liqCalc[i].w : null
    })).filter(p => p.x > 0 && p.y !== null);
  }, [liquidite, liqCalc]);

  // Regression line points for chart
  const regLineData = useMemo(() => {
    if (!reg.slope && !reg.intercept) return [];
    const xMin = Math.min(...chartPoints.map(p => p.x), 15);
    const xMax = Math.max(...chartPoints.map(p => p.x), 40);
    return Array.from({ length: 30 }, (_, i) => {
      const x = xMin + (xMax - xMin) * i / 29;
      return { x, y: reg.slope * x + reg.intercept };
    });
  }, [reg, chartPoints]);

  const Wl = pf(calculs.wl);
  const Wp = pf(calculs.wp);
  const Ip = pf(calculs.ip);
  const W = pf(calculs.w);
  const Ic = pf(calculs.ic);
  const moyLiq = pf(calculs.moyenne_liquidite);
  const moyPlast = pf(calculs.moyenne_plasticite);
  const classificationResult = classifySoil(Wl, Ip);

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
    downloadReportAsPDF(`rapport-limites-atterberg-${prefix}-${String(echantillon.numero).padStart(3, "0")}`);
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
          { label: "Limites d'Atterberg", path: basePath },
          { label: <><span className="text-primary">{prefix}</span>-{String(echantillon.numero).padStart(3, "0")}</>, path: `${basePath}/${id}` },
          { label: "Rapport" }
        ]} />
        <div className="flex items-start gap-4">
          <BackButton to={`${basePath}/${id}`} />
          <div className="flex-1">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Rapport - <span className="text-primary">{numero}</span></h1>
                <p className="text-muted-foreground text-sm">Limites d'Atterberg</p>
              </div>
              <div className="flex gap-3">
                <ShareButton onGeneratePdf={generatePdfBlob} fileName={`rapport-limites-atterberg-${numero}.pdf`} />
                <Button variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Imprimer</Button>
                <Button onClick={handleDownloadPDF} className="gradient-primary text-primary-foreground"><Download className="h-4 w-4 mr-2" />Télécharger PDF</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rapport */}
      <div ref={reportRef} data-ref="report" className="report-table bg-white text-black p-8 rounded-lg shadow-lg max-w-4xl mx-auto print:shadow-none print:p-4" style={{ fontFamily: "Arial, sans-serif" }}>
        <ReportHeader entreprise={entreprise} verificationUrl={verificationUrl} title="RAPPORT D'ESSAI - LIMITES D'ATTERBERG" subtitle="Norme NF P 94-051" />

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
        <div className="mb-4">
          <h3 className="font-bold text-sm mb-2 text-center text-black">Expression des résultats</h3>
          <table className="w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-2 py-1.5 text-left font-medium" rowSpan={2}>Échantillon</th>
                <th className="border border-black px-2 py-1.5 text-center font-medium" colSpan={liquidite.length}>Limite de liquidité</th>
                <th className="border border-black px-2 py-1.5 text-center font-medium" colSpan={plasticite.length}>Limite de plasticité</th>
              </tr>
              <tr className="bg-gray-50">
                {liquidite.map((_, i) => <th key={`l${i}`} className="border border-black px-2 py-1 text-center">{i + 1}</th>)}
                {plasticite.map((_, i) => <th key={`p${i}`} className="border border-black px-2 py-1 text-center">{i + 1}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black px-2 py-1 font-medium text-black">ESSAIS N</td>
                {liquidite.map((_, i) => <td key={i} className="border border-black px-2 py-1 text-center">{i + 1}</td>)}
                {plasticite.map((_, i) => <td key={i} className="border border-black px-2 py-1 text-center">{i + 1}</td>)}
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 font-medium text-black">Numéro de la tare (N°)</td>
                {liquidite.map((e, i) => <td key={i} className="border border-black px-2 py-1 text-center">{e.numero_tare || "-"}</td>)}
                {plasticite.map((e, i) => <td key={i} className="border border-black px-2 py-1 text-center">{e.numero_tare || "-"}</td>)}
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 font-medium text-black">Poids de la tare (g)</td>
                {liquidite.map((e, i) => <td key={i} className="border border-black px-2 py-1 text-center">{e.poids_tare || "-"}</td>)}
                {plasticite.map((e, i) => <td key={i} className="border border-black px-2 py-1 text-center">{e.poids_tare || "-"}</td>)}
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 font-medium text-black">Poids Tare + SOL Humide (g)</td>
                {liquidite.map((e, i) => <td key={i} className="border border-black px-2 py-1 text-center">{e.poids_tare_sol_humide || "-"}</td>)}
                {plasticite.map((e, i) => <td key={i} className="border border-black px-2 py-1 text-center">{e.poids_tare_sol_humide || "-"}</td>)}
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 font-medium text-black">Poids sol humide (g)</td>
                {liqCalc.map((c, i) => <td key={i} className="border border-black px-2 py-1 text-center">{c.valid ? fmt(c.sh) : "-"}</td>)}
                {plastCalc.map((c, i) => <td key={i} className="border border-black px-2 py-1 text-center">{c.valid ? fmt(c.sh) : "-"}</td>)}
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 font-medium text-black">Poids Tare + SOL Sec (g)</td>
                {liquidite.map((e, i) => <td key={i} className="border border-black px-2 py-1 text-center">{e.poids_tare_sol_sec || "-"}</td>)}
                {plasticite.map((e, i) => <td key={i} className="border border-black px-2 py-1 text-center">{e.poids_tare_sol_sec || "-"}</td>)}
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 font-medium text-black">Poids Sol Sec (g)</td>
                {liqCalc.map((c, i) => <td key={i} className="border border-black px-2 py-1 text-center">{c.valid ? fmt(c.ss) : "-"}</td>)}
                {plastCalc.map((c, i) => <td key={i} className="border border-black px-2 py-1 text-center">{c.valid ? fmt(c.ss) : "-"}</td>)}
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 font-medium text-black">Poids Eau (g)</td>
                {liqCalc.map((c, i) => <td key={i} className="border border-black px-2 py-1 text-center">{c.valid ? fmt(c.eau) : "-"}</td>)}
                {plastCalc.map((c, i) => <td key={i} className="border border-black px-2 py-1 text-center">{c.valid ? fmt(c.eau) : "-"}</td>)}
              </tr>
              <tr className="bg-gray-50 font-semibold">
                <td className="border border-black px-2 py-1 font-bold text-black">TENEUR EN EAU % (D/E)*100</td>
                {liqCalc.map((c, i) => <td key={i} className="border border-black px-2 py-1 text-center">{c.valid ? fmt(c.w) : "-"}</td>)}
                {plastCalc.map((c, i) => <td key={i} className="border border-black px-2 py-1 text-center">{c.valid ? fmt(c.w) : "-"}</td>)}
              </tr>
              <tr className="bg-gray-100">
                <td className="border border-black px-2 py-1 font-bold text-black">Moyenne</td>
                <td className="border border-black px-2 py-1 text-center font-bold" colSpan={liquidite.length}>{fmt(moyLiq)}</td>
                <td className="border border-black px-2 py-1 text-center font-bold" colSpan={plasticite.length}>{fmt(moyPlast)}</td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 font-medium text-black">Nombre de coups</td>
                {liquidite.map((e, i) => <td key={i} className="border border-black px-2 py-1 text-center">{e.nombre_coups || "-"}</td>)}
                {plasticite.map((_, i) => <td key={i} className="border border-black px-2 py-1 text-center">-</td>)}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Graphique de régression */}
        {chartPoints.length >= 2 && (
          <div className="mb-4">
            <p className="text-xs text-center text-black mb-1 font-medium">
              y = {(reg.slope || 0).toFixed(4)}x + {(reg.intercept || 0).toFixed(3)}
            </p>
            <div style={{ width: "100%", height: 250 }}>
              <ResponsiveContainer>
                <ComposedChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                  <XAxis
                    dataKey="x"
                    type="number"
                    domain={[15, 40]}
                    ticks={[15, 20, 25, 30, 35, 40]}
                    label={{ value: "Nombre de coups", position: "insideBottom", offset: -15, style: { fontSize: 11, fill: "#000" } }}
                    tick={{ fontSize: 10, fill: "#000" }}
                    stroke="#000"
                  />
                  <YAxis
                    dataKey="y"
                    type="number"
                    label={{ value: "Teneur en eau", angle: -90, position: "insideLeft", offset: -5, style: { fontSize: 11, fill: "#000" } }}
                    tick={{ fontSize: 10, fill: "#000" }}
                    stroke="#000"
                  />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <ReferenceLine x={25} stroke="#d00" strokeDasharray="5 3" label={{ value: "25", position: "top", fontSize: 9, fill: "#d00" }} />
                  <Scatter data={chartPoints} fill="#1e5a7a" shape="diamond" r={5} />
                  <Line data={regLineData} dataKey="y" stroke="#1e5a7a" dot={false} strokeWidth={1.5} type="linear" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Résultats finaux */}
        <div className="mb-4">
          <table className="w-full border-collapse border border-black text-sm">
            <tbody>
              <tr>
                <td className="border border-black px-3 py-2 font-medium text-center text-black w-1/3">Limite de liquidité (Wl)</td>
                <td className="border border-black px-3 py-2 font-medium text-center text-black w-1/3">Limite de plasticité (Wp)</td>
                <td className="border border-black px-3 py-2 font-medium text-center text-black w-1/3">Teneur en eau (W)</td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-2 text-center font-bold text-black">{fmt(Wl)}</td>
                <td className="border border-black px-3 py-2 text-center font-bold text-black">{fmt(Wp)}</td>
                <td className="border border-black px-3 py-2 text-center font-bold text-black">{fmt(W)}</td>
              </tr>
            </tbody>
          </table>
          <table className="w-full border-collapse border border-black text-sm mt-2">
            <tbody>
              <tr>
                <td className="border border-black px-3 py-2 font-medium text-center text-black w-1/2">Indice de plasticité (Ip)</td>
                <td className="border border-black px-3 py-2 font-medium text-center text-black w-1/2">Indice de consistance (Ic)</td>
              </tr>
              <tr>
                <td className="border border-black px-3 py-2 text-center font-bold text-black">{fmt(Ip)}</td>
                <td className="border border-black px-3 py-2 text-center font-bold text-black">{fmt(Ic)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Classification du sol */}
        {classificationResult && (
          <div className="mb-4">
            <h3 className="font-bold text-sm mb-2 underline text-black">Classification du sol (Casagrande)</h3>
            <table className="w-full border-collapse border border-black text-sm">
              <tbody>
                <tr>
                  <td className="border border-black px-3 py-2 font-medium text-black w-1/3">Code</td>
                  <td className="border border-black px-3 py-2 font-bold text-black">{classificationResult.code}</td>
                </tr>
                <tr>
                  <td className="border border-black px-3 py-2 font-medium text-black">Classification</td>
                  <td className="border border-black px-3 py-2 text-black">{classificationResult.label}</td>
                </tr>
                <tr>
                  <td className="border border-black px-3 py-2 font-medium text-black">Description</td>
                  <td className="border border-black px-3 py-2 text-black">{classificationResult.description}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Pied de page */}
        <div className="mt-8 pt-4 border-t border-gray-300">
          <div className="flex justify-between items-end">
            <div className="text-sm text-gray-600">
              <p>Opérateur: {echantillon.intervenants ? `${echantillon.intervenants.prenom} ${echantillon.intervenants.nom}` : "-"}</p>
              {echantillon.intervenants?.signature_url && (
                <div className="mt-2"><img src={echantillon.intervenants.signature_url} alt="Signature" className="max-h-16 object-contain" /></div>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Signature et cachet</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          #root { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
