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
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine
} from "recharts";

function pf(v: unknown): number { return parseFloat(String(v ?? "")) || 0; }
function fmt(v: number, dec = 2): string { return isNaN(v) || !isFinite(v) ? "-" : v.toFixed(dec); }

interface ProctorReportProps {
  essaiType: "proctor-normal" | "proctor-modifie";
}

export default function ProctorReport({ essaiType }: ProctorReportProps) {
  const isModifie = essaiType === "proctor-modifie";
  const essaiTitle = isModifie ? "Essai Proctor Modifié" : "Essai Proctor Normal";
  const basePath = `/essais/geotechnique/compactage/${essaiType}`;

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const printRef = useRef<HTMLDivElement>(null);
  const { data: echantillon, isLoading } = useEchantillonGeotechniqueById(essaiType, id);
  const { data: entreprise } = useEntreprise();

  const r = useMemo(() => (echantillon?.resultats as Record<string, unknown>) || {}, [echantillon]);
  const points = (r.points as Array<Record<string, string>>) || [];
  const vol = pf(r.volume_moule);

  const computed = useMemo(() => {
    return points.map(p => {
      const m_moule = pf(p.m_moule);
      const m_moule_sol = pf(p.m_moule_sol);
      const m_tare = pf(p.m_tare);
      const m_humide_tare = pf(p.m_humide_tare);
      const m_sec_tare = pf(p.m_sec_tare);
      const m_sol_humide = m_moule_sol - m_moule;
      const rho_humide = vol > 0 ? (m_sol_humide / vol) * 1000 : 0;
      const m_eau = m_humide_tare - m_sec_tare;
      const m_sec = m_sec_tare - m_tare;
      const w = m_sec > 0 ? (m_eau / m_sec) * 100 : 0;
      const rho_sec = w > 0 ? rho_humide / (1 + w / 100) : 0;
      return { m_sol_humide, rho_humide, m_eau, m_sec, w, rho_sec };
    });
  }, [points, vol]);

  const chartData = useMemo(() => {
    return computed
      .map((c, i) => ({ w: parseFloat(c.w.toFixed(2)), rho_sec: parseFloat(c.rho_sec.toFixed(3)), name: `P${i + 1}` }))
      .filter(p => p.w > 0 && p.rho_sec > 0)
      .sort((a, b) => a.w - b.w);
  }, [computed]);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!echantillon) return <div className="text-center py-8 text-muted-foreground">Échantillon non trouvé</div>;

  const prefix = getGeoPrefix(essaiType);
  const numero = `${prefix}-${String(echantillon.numero).padStart(3, "0")}`;
  const verificationUrl = `${window.location.origin}${basePath}/${id}`;
  const w_opt = pf(r.w_opt);
  const rho_max = pf(r.rho_max);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="print:hidden">
        <EssaiBreadcrumb items={[
          { label: "Géotechnique", path: "/essais/geotechnique" },
          { label: "Compactage", path: "/essais/geotechnique/compactage" },
          { label: essaiTitle, path: basePath },
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
            <Button variant="outline" className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50" onClick={handlePrint}>
              <Download className="h-4 w-4 mr-2" />Télécharger
            </Button>
            <Button onClick={handlePrint} className="gradient-primary text-primary-foreground">
              <Printer className="h-4 w-4 mr-2" />Imprimer
            </Button>
          </div>
        </div>
      </div>

      <div ref={printRef} className="bg-white text-black p-8 rounded-lg shadow-sm print:shadow-none print:p-0 max-w-4xl mx-auto print:max-w-none" style={{ fontFamily: "serif" }}>
        <ReportHeader
          entreprise={entreprise}
          verificationUrl={verificationUrl}
          title={`ESSAI ${isModifie ? "PROCTOR MODIFIÉ" : "PROCTOR NORMAL"}`}
          subtitle="NF P 94-093"
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
            <p><span className="font-bold">Volume moule :</span> {vol} cm³</p>
          </div>
        </div>

        {/* Tableau résultats */}
        <h3 className="font-bold text-center text-base mb-3">Expression des résultats</h3>
        <table className="w-full border-collapse border border-black text-sm mb-6">
          <thead>
            <tr className="bg-[#d4e5f7]">
              <th className="border border-black p-2 text-left">Désignation</th>
              <th className="border border-black p-2 text-center w-10"></th>
              {points.map((_, i) => (
                <th key={i} className="border border-black p-2 text-center w-20">Point {i + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { label: "N° de tare", vals: points.map(p => p.tare_num || "-"), unit: "" },
              { label: "Masse moule + sol humide", vals: points.map(p => p.m_moule_sol || "-"), unit: "(g)" },
              { label: "Masse du moule", vals: points.map(p => p.m_moule || "-"), unit: "(g)" },
              { label: "Masse sol humide", vals: computed.map(c => c.m_sol_humide > 0 ? fmt(c.m_sol_humide, 1) : "-"), unit: "(g)" },
              { label: "ρ humide", vals: computed.map(c => c.rho_humide > 0 ? fmt(c.rho_humide, 3) : "-"), unit: "(t/m³)" },
              { label: "Masse humide + tare", vals: points.map(p => p.m_humide_tare || "-"), unit: "(g)" },
              { label: "Masse sèche + tare", vals: points.map(p => p.m_sec_tare || "-"), unit: "(g)" },
              { label: "Masse de la tare", vals: points.map(p => p.m_tare || "-"), unit: "(g)" },
              { label: "Masse d'eau", vals: computed.map(c => c.m_eau > 0 ? fmt(c.m_eau, 1) : "-"), unit: "(g)" },
              { label: "Masse sol sec", vals: computed.map(c => c.m_sec > 0 ? fmt(c.m_sec, 1) : "-"), unit: "(g)" },
              { label: "Teneur en eau W", vals: computed.map(c => c.w > 0 ? fmt(c.w) + "%" : "-"), unit: "(%)" },
              { label: "γd (densité sèche)", vals: computed.map(c => c.rho_sec > 0 ? fmt(c.rho_sec, 3) : "-"), unit: "(t/m³)" },
            ].map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border border-black p-2 font-medium">{row.label}</td>
                <td className="border border-black p-2 text-center text-xs text-gray-600">{row.unit}</td>
                {row.vals.map((v, j) => (
                  <td key={j} className="border border-black p-2 text-center font-semibold">{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Courbe Proctor */}
        {chartData.length >= 2 && (
          <div className="mb-6">
            <h3 className="font-bold text-center text-base mb-3">Courbe Proctor</h3>
            <div className="h-[300px] border border-gray-300 rounded p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="w" type="number" domain={['dataMin - 1', 'dataMax + 1']}
                    label={{ value: "Teneur en eau W (%)", position: "insideBottom", offset: -10 }} />
                  <YAxis dataKey="rho_sec" type="number" domain={['dataMin - 0.02', 'dataMax + 0.02']}
                    label={{ value: "γd (t/m³)", angle: -90, position: "insideLeft" }}
                    tickFormatter={v => v.toFixed(3)} />
                  {w_opt > 0 && (
                    <ReferenceLine x={parseFloat(w_opt.toFixed(2))} stroke="#3b82f6" strokeDasharray="5 5"
                      label={{ value: `W opt = ${w_opt.toFixed(2)}%`, position: "top", fill: "#3b82f6" }} />
                  )}
                  <Line type="monotone" dataKey="rho_sec" stroke="#3b82f6" strokeWidth={2}
                    dot={{ r: 4, fill: "#3b82f6" }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Résultats optimum */}
        <div className="border-2 border-black p-4 rounded mb-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="font-bold text-sm">Teneur en eau optimale (W opt)</p>
              <p className="text-2xl font-bold text-blue-600">{w_opt > 0 ? fmt(w_opt) + " %" : "-"}</p>
            </div>
            <div>
              <p className="font-bold text-sm">Densité sèche maximale (γd max)</p>
              <p className="text-2xl font-bold text-blue-600">{rho_max > 0 ? fmt(rho_max, 3) + " t/m³" : "-"}</p>
            </div>
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
