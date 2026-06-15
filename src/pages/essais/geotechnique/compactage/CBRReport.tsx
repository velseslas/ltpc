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
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Legend
} from "recharts";

function pf(v: unknown): number { return parseFloat(String(v ?? "")) || 0; }
function fmt(v: number, dec = 2): string { return isNaN(v) || !isFinite(v) ? "-" : v.toFixed(dec); }

const CBR_REF_2_5 = 13.35;
const CBR_REF_5_0 = 19.93;
const STANDARD_PENETRATIONS = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 7.5, 10.0];

export default function CBRReport() {
  const essaiType = "cbr";
  const basePath = "/essais/geotechnique/compactage/cbr";
  const { id } = useParams<{ id: string }>();
  const printRef = useRef<HTMLDivElement>(null);
  const { data: echantillon, isLoading } = useEchantillonGeotechniqueById(essaiType, id);
  const { data: entreprise } = useEntreprise();

  const r = useMemo(() => (echantillon?.resultats as Record<string, unknown>) || {}, [echantillon]);
  const moules = (r.moules as Array<Record<string, unknown>>) || [];

  const computed = useMemo(() => {
    return moules.map(m => {
      const vol = pf(m.volume_moule);
      const m_moule = pf(m.m_moule);
      const m_moule_sol = pf(m.m_moule_sol);
      const m_tare = pf(m.m_tare);
      const m_humide_tare = pf(m.m_humide_tare);
      const m_sec_tare = pf(m.m_sec_tare);
      const readings = (m.readings as Record<string, string>) || {};

      const m_sol_humide = m_moule_sol - m_moule;
      const rho_humide = vol > 0 ? (m_sol_humide / vol) * 1000 : 0;
      const m_eau = m_humide_tare - m_sec_tare;
      const m_sec = m_sec_tare - m_tare;
      const w = m_sec > 0 ? (m_eau / m_sec) * 100 : 0;
      const rho_sec = w > 0 ? rho_humide / (1 + w / 100) : 0;

      const force_2_5 = pf(readings["2.5"]);
      const force_5_0 = pf(readings["5.0"] || readings["5"]);
      const cbr_2_5 = force_2_5 > 0 ? (force_2_5 / CBR_REF_2_5) * 100 : 0;
      const cbr_5_0 = force_5_0 > 0 ? (force_5_0 / CBR_REF_5_0) * 100 : 0;
      const cbr = Math.max(cbr_2_5, cbr_5_0);

      const curveData = [{ penetration: 0, force: 0 }, ...STANDARD_PENETRATIONS.map(pen => ({
        penetration: pen,
        force: pf(readings[pen.toString()])
      }))].filter(p => p.force > 0 || p.penetration === 0);

      return { m_sol_humide, rho_humide, m_eau, m_sec, w, rho_sec, cbr_2_5, cbr_5_0, cbr, curveData, readings };
    });
  }, [moules]);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!echantillon) return <div className="text-center py-8 text-muted-foreground">Échantillon non trouvé</div>;

  const prefix = getGeoPrefix(essaiType);
  const numero = `${prefix}-${String(echantillon.numero).padStart(3, "0")}`;
  const verificationUrl = `${window.location.origin}${basePath}/${id}`;
  const colors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b"];

  const handlePrint = () => window.print();
  const handleDownloadPDF = async () => {
    const { downloadReportAsPDF } = await import("@/lib/pdf");
    downloadReportAsPDF(`rapport-cbr-${numero}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="print:hidden">
        <EssaiBreadcrumb items={[
          { label: "Géotechnique", path: "/essais/geotechnique" },
          { label: "Compactage", path: "/essais/geotechnique/compactage" },
          { label: "Essai CBR", path: basePath },
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
          title="ESSAI CBR (CALIFORNIA BEARING RATIO)"
          subtitle="NF P 94-078"
        />

        {/* Infos */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="border border-gray-300 p-3 rounded">
            <p><span className="font-bold">N° Échantillon :</span> {numero}</p>
            <p><span className="font-bold">Client :</span> {echantillon.clients?.nom || "-"}</p>
            <p><span className="font-bold">Chantier :</span> {echantillon.chantiers?.nom || "-"}</p>
            <p><span className="font-bold">Carrière :</span> {(echantillon as any).carrieres?.nom || "-"}</p>
          </div>
          <div className="border border-gray-300 p-3 rounded">
            <p><span className="font-bold">Date de prélèvement :</span> {format(new Date(echantillon.date_prelevement), "dd/MM/yyyy", { locale: fr })}</p>
            <p><span className="font-bold">Date d'essai :</span> {(echantillon as any).date_essai ? format(new Date((echantillon as any).date_essai), "dd/MM/yyyy", { locale: fr }) : "-"}</p>
            <p><span className="font-bold">Type de sol :</span> {echantillon.type_sol}</p>
            <p><span className="font-bold">Surcharge :</span> {r.surcharge as string || "-"} kg</p>
            <p><span className="font-bold">Immersion :</span> {r.immersion_jours as string || "-"} jours</p>
          </div>
        </div>

        {/* Compactage table */}
        <h3 className="font-bold text-center text-base mb-3">Résultats de compactage</h3>
        <table className="w-full border-collapse border border-black text-sm mb-6">
          <thead>
            <tr className="bg-[#d4e5f7]">
              <th className="border border-black p-2 text-left">Désignation</th>
              <th className="border border-black p-2 text-center w-10"></th>
              {moules.map((m, i) => (
                <th key={i} className="border border-black p-2 text-center">{m.nombre_coups as string} coups</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { label: "Teneur en eau W", vals: computed.map(c => c.w > 0 ? fmt(c.w) + "%" : "-"), unit: "(%)" },
              { label: "ρd (densité sèche)", vals: computed.map(c => c.rho_sec > 0 ? fmt(c.rho_sec, 3) : "-"), unit: "(t/m³)" },
              { label: "CBR à 2.5 mm", vals: computed.map(c => c.cbr_2_5 > 0 ? fmt(c.cbr_2_5, 1) : "-"), unit: "" },
              { label: "CBR à 5.0 mm", vals: computed.map(c => c.cbr_5_0 > 0 ? fmt(c.cbr_5_0, 1) : "-"), unit: "" },
              { label: "Indice CBR retenu", vals: computed.map(c => c.cbr > 0 ? fmt(c.cbr, 1) : "-"), unit: "" },
            ].map((row, i) => (
              <tr key={i} className={i === 4 ? "bg-[#d4e5f7] font-bold" : i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border border-black p-2">{row.label}</td>
                <td className="border border-black p-2 text-center text-xs text-gray-600">{row.unit}</td>
                {row.vals.map((v, j) => (
                  <td key={j} className="border border-black p-2 text-center font-semibold">{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Poinçonnement table */}
        <h3 className="font-bold text-center text-base mb-3">Lectures de poinçonnement (kN)</h3>
        <table className="w-full border-collapse border border-black text-sm mb-6">
          <thead>
            <tr className="bg-[#d4e5f7]">
              <th className="border border-black p-2 text-center">Enfoncement (mm)</th>
              {moules.map((m, i) => (
                <th key={i} className="border border-black p-2 text-center">{m.nombre_coups as string} coups</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STANDARD_PENETRATIONS.map((pen, i) => (
              <tr key={pen} className={pen === 2.5 || pen === 5.0 ? "bg-yellow-50 font-bold" : i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border border-black p-2 text-center">{pen}</td>
                {computed.map((c, j) => (
                  <td key={j} className="border border-black p-2 text-center">
                    {c.readings[pen.toString()] || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Courbes */}
        {computed.some(c => c.curveData.length >= 2) && (
          <div className="mb-6">
            <h3 className="font-bold text-center text-base mb-3">Courbes Force-Pénétration</h3>
            <div className="h-[280px] border border-gray-300 rounded p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="penetration" type="number" domain={[0, 'dataMax + 1']}
                    label={{ value: "Pénétration (mm)", position: "insideBottom", offset: -10 }} />
                  <YAxis label={{ value: "Force (kN)", angle: -90, position: "insideLeft" }} />
                  <Legend />
                  <ReferenceLine x={2.5} stroke="#999" strokeDasharray="3 3" />
                  <ReferenceLine x={5.0} stroke="#999" strokeDasharray="3 3" />
                  {moules.map((m, i) => (
                    computed[i].curveData.length >= 2 && (
                      <Line key={i} data={computed[i].curveData} type="monotone" dataKey="force"
                        name={`${m.nombre_coups} coups`} stroke={colors[i % colors.length]} strokeWidth={2}
                        dot={{ r: 3 }} connectNulls />
                    )
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Résultats CBR */}
        <div className="border-2 border-black p-4 rounded mb-6">
          <h3 className="font-bold text-center mb-3">Indices CBR</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            {moules.map((m, i) => (
              <div key={i}>
                <p className="font-bold text-sm">{m.nombre_coups as string} coups</p>
                <p className="text-2xl font-bold text-blue-600">{computed[i]?.cbr > 0 ? fmt(computed[i].cbr, 1) : "-"}</p>
              </div>
            ))}
          </div>
        </div>

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
