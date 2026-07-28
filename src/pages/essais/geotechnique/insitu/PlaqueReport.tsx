import { useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Printer, Loader2, Download } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import ShareButton from "@/components/reports/ShareButton";
import { useEchantillonGeotechniqueById, getGeoPrefix } from "@/hooks/useEchantillonsGeotechniqueFactory";
import { useEntreprise } from "@/hooks/useEntreprise";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { PrintService } from "@/lib/print/PrintService";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend
} from "recharts";

PrintService.registerTemplate({ id: "plaque-report", title: "Rapport Essai à la Plaque", orientation: "portrait" });

function pf(v: unknown): number { return parseFloat(String(v ?? "")) || 0; }
function fmt(v: number, dec = 2): string { return isNaN(v) || !isFinite(v) ? "-" : v.toFixed(dec); }

export default function PlaqueReport() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const printRef = useRef<HTMLDivElement>(null);
  const essaiType = "plaque";
  const basePath = "/essais/geotechnique/in-situ/plaque";

  const { data: echantillon, isLoading } = useEchantillonGeotechniqueById(essaiType, id);
  const { data: entreprise } = useEntreprise();

  const r = useMemo(() => (echantillon?.resultats as Record<string, unknown>) || {}, [echantillon]);
  const paliers = (r.paliers as string[]) || [];
  const cycle1 = (r.cycle1 as string[]) || [];
  const cycle2 = (r.cycle2 as string[]) || [];
  const diametre = pf(r.diametre);

  const sigma = paliers.map(v => pf(v));
  const def1 = cycle1.map(v => pf(v));
  const def2 = cycle2.map(v => pf(v));

  const EV1 = pf(r.EV1);
  const EV2 = pf(r.EV2);
  const K = pf(r.K);

  const chartData = useMemo(() => {
    return sigma.map((s, i) => ({
      sigma: s,
      cycle1: def1[i] > 0 ? def1[i] : undefined,
      cycle2: def2[i] > 0 ? def2[i] : undefined,
    })).filter(p => p.sigma >= 0 && (p.cycle1 !== undefined || p.cycle2 !== undefined));
  }, [sigma, def1, def2]);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!echantillon) return <div className="text-center py-8 text-muted-foreground">Échantillon non trouvé</div>;

  const prefix = getGeoPrefix(essaiType);
  const numero = `${prefix}-${String(echantillon.numero).padStart(3, "0")}`;
  const verificationUrl = `${window.location.origin}${basePath}/${id}`;

  const handlePrint = () => PrintService.print({ title: `Rapport Plaque ${numero}`, orientation: "portrait" });
  const handleDownloadPDF = handlePrint;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="print:hidden">
        <EssaiBreadcrumb items={[
          { label: "Géotechnique", path: "/essais/geotechnique" },
          { label: "In-Situ", path: "/essais/geotechnique/in-situ" },
          { label: "Plaque", path: basePath },
          { label: <><span className="text-primary">{prefix}</span>-{String(echantillon.numero).padStart(3, "0")}</>, path: `${basePath}/${id}` },
          { label: "Rapport" }
        ]} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
          <div className="flex items-center gap-4">
            <BackButton to={`${basePath}/${id}`} />
            <h1 className="text-3xl font-display font-bold text-foreground">
              Rapport <span className="text-primary">{numero}</span>
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto">
            <ShareButton className="col-span-2 order-last w-full sm:col-span-1 sm:order-none sm:w-auto" />
            <Button variant="outline" className="col-span-2 w-full sm:col-span-1 sm:w-auto border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50" onClick={async () => { await (handleDownloadPDF)(); (handlePrint)(); }}>
            <Printer className="h-4 w-4 mr-2" />
            <Download className="h-4 w-4 mr-2" />
            Imprimer et télécharger
          </Button>
          </div>
        </div>
      </div>

      <div ref={printRef} data-ref="report" data-print-root data-print-template="plaque-report" className="bg-white text-black p-8 rounded-lg shadow-sm print:shadow-none print:p-0 max-w-4xl mx-auto print:max-w-none" style={{ fontFamily: "serif" }}>
        <ReportHeader
          entreprise={entreprise}
          verificationUrl={verificationUrl}
          title="ESSAI DE CHARGEMENT À LA PLAQUE"
          subtitle="NF P 94-117-1"
        />

        {/* Infos */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="border border-gray-300 p-3 rounded">
            <p><span className="font-bold">N° Échantillon :</span> {numero}</p>
            <p><span className="font-bold">Client :</span> {echantillon.clients?.nom || "-"}</p>
            <p><span className="font-bold">Chantier :</span> {echantillon.chantiers?.nom || "-"}</p>
          </div>
          <div className="border border-gray-300 p-3 rounded">
            <p><span className="font-bold">Date de prélèvement :</span> {format(new Date(echantillon.date_prelevement), "dd/MM/yyyy", { locale: fr })}</p>
            {(echantillon as any).date_essai && <p><span className="font-bold">Date d'essai :</span> {format(new Date((echantillon as any).date_essai), "dd/MM/yyyy", { locale: fr })}</p>}
            <p><span className="font-bold">Type de sol :</span> {echantillon.type_sol}</p>
            <p><span className="font-bold">Diamètre plaque :</span> {diametre > 0 ? `${diametre} mm` : "-"}</p>
          </div>
        </div>

        {/* Tableau mesures */}
        <h3 className="font-bold text-center text-base mb-3">Mesures de déformation</h3>
        <table className="w-full border-collapse border border-black text-sm mb-6">
          <thead>
            <tr className="bg-[#d4e5f7]">
              <th className="border border-black p-2 text-center w-12">N°</th>
              <th className="border border-black p-2 text-center">σ (MPa)</th>
              <th className="border border-black p-2 text-center">Cycle 1 (mm)</th>
              <th className="border border-black p-2 text-center">Cycle 2 (mm)</th>
            </tr>
          </thead>
          <tbody>
            {sigma.map((s, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border border-black p-2 text-center font-medium">{i + 1}</td>
                <td className="border border-black p-2 text-center font-semibold">{s > 0 || i === 0 ? fmt(s, 3) : "-"}</td>
                <td className="border border-black p-2 text-center">{def1[i] > 0 || (i === 0 && def1[i] === 0) ? fmt(def1[i], 3) : "-"}</td>
                <td className="border border-black p-2 text-center">{def2[i] > 0 || (i === 0 && def2[i] === 0) ? fmt(def2[i], 3) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Courbe */}
        {chartData.length >= 2 && (
          <div className="mb-6 page-break-inside-avoid">
            <h3 className="font-bold text-center text-base mb-3">Courbe Contrainte - Déformation</h3>
            <div style={{ width: "100%", height: 320 }} className="border border-gray-300 rounded p-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 15, right: 40, left: 30, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                  <XAxis
                    dataKey="sigma"
                    type="number"
                    domain={[0, 'dataMax + 0.02']}
                    tick={{ fontSize: 11 }}
                    label={{ value: "Contrainte σ (MPa)", position: "insideBottom", offset: -15, style: { fontSize: 12, fontWeight: "bold" } }}
                  />
                  <YAxis
                    reversed
                    tick={{ fontSize: 11 }}
                    label={{ value: "Déformation (mm)", angle: -90, position: "insideLeft", offset: -15, style: { fontSize: 12, fontWeight: "bold" } }}
                    tickFormatter={v => v.toFixed(2)}
                  />
                  <Legend
                    verticalAlign="top"
                    height={30}
                    formatter={(value) => value === "cycle1" ? "Cycle 1 (chargement)" : "Cycle 2 (rechargement)"}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                  <Line type="monotone" dataKey="cycle1" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: "#3b82f6", strokeWidth: 1, stroke: "#fff" }} connectNulls name="cycle1" />
                  <Line type="monotone" dataKey="cycle2" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: "#ef4444", strokeWidth: 1, stroke: "#fff" }} connectNulls name="cycle2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Résultats */}
        <div className="border-2 border-black p-4 rounded mb-6">
          <h3 className="font-bold text-center text-base mb-3">Résultats</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-bold text-sm">Module EV1</p>
              <p className="text-xl font-bold text-blue-600">{EV1 > 0 ? fmt(EV1, 1) + " MPa" : "-"}</p>
            </div>
            <div>
              <p className="font-bold text-sm">Module EV2</p>
              <p className="text-xl font-bold text-blue-600">{EV2 > 0 ? fmt(EV2, 1) + " MPa" : "-"}</p>
            </div>
            <div>
              <p className="font-bold text-sm">K = EV2 / EV1</p>
              <p className={`text-xl font-bold ${K > 0 ? (K <= 2 ? "text-green-600" : "text-red-600") : ""}`}>
                {K > 0 ? fmt(K, 2) : "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Spécifications et Conformité */}
        <table className="w-full border-collapse border border-black text-sm mb-6">
          <thead>
            <tr className="bg-[#d4e5f7]">
              <th className="border border-black p-2 text-center">Paramètre</th>
              <th className="border border-black p-2 text-center">Valeur mesurée</th>
              <th className="border border-black p-2 text-center">Spécification</th>
              <th className="border border-black p-2 text-center">Conformité</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const ev2Conforme = EV2 >= 50;
              const kConforme = K > 0 && K <= 2;
              const ev2Class = EV2 >= 120 ? "PF3" : EV2 >= 50 ? "PF2" : EV2 >= 20 ? "PF1" : "-";
              return (
                <>
                  <tr className="bg-white">
                    <td className="border border-black p-2 font-medium text-center">EV2</td>
                    <td className="border border-black p-2 text-center font-bold">{EV2 > 0 ? fmt(EV2, 1) + " MPa" : "-"}</td>
                    <td className="border border-black p-2 text-center">≥ 50 MPa (arase terrassement)</td>
                    <td className="border border-black p-2 text-center">
                      {EV2 > 0 ? (
                        <span className={`font-bold ${ev2Conforme ? "text-green-600" : "text-red-600"}`}>
                          {ev2Conforme ? "✓ CONFORME" : "✗ NON CONFORME"}
                        </span>
                      ) : "-"}
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-black p-2 font-medium text-center">K = EV2/EV1</td>
                    <td className="border border-black p-2 text-center font-bold">{K > 0 ? fmt(K, 2) : "-"}</td>
                    <td className="border border-black p-2 text-center">≤ 2,0</td>
                    <td className="border border-black p-2 text-center">
                      {K > 0 ? (
                        <span className={`font-bold ${kConforme ? "text-green-600" : "text-red-600"}`}>
                          {kConforme ? "✓ CONFORME" : "✗ NON CONFORME"}
                        </span>
                      ) : "-"}
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="border border-black p-2 font-medium text-center">Classe de plateforme</td>
                    <td className="border border-black p-2 text-center font-bold" colSpan={3}>
                      {EV2 > 0 ? (
                        <span className="text-blue-600 font-bold">{ev2Class}</span>
                      ) : "-"}
                      <span className="text-gray-500 ml-2 text-xs">
                        (PF1: 20-50 MPa | PF2: 50-120 MPa | PF3: ≥ 120 MPa)
                      </span>
                    </td>
                  </tr>
                </>
              );
            })()}
          </tbody>
        </table>

        {/* Observations */}
        {(r.notes as string) && (
          <div className="border border-gray-300 p-3 rounded mb-6">
            <p className="font-bold text-sm mb-1">Observations :</p>
            <p className="text-sm">{r.notes as string}</p>
          </div>
        )}

        {/* Signature */}
        <div className="flex justify-between mt-12 text-sm">
          <div className="text-center">
            <p className="font-bold mb-8">Le technicien</p>
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
