import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Printer, Loader2, Download } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useEchantillonGeotechniqueById } from "@/hooks/useEchantillonsGeotechniqueFactory";
import { useEntreprise } from "@/hooks/useEntreprise";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { ReportHeader } from "@/components/reports/ReportHeader";
import ShareButton from "@/components/reports/ShareButton";
import { PrintService } from "@/lib/print/PrintService";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

PrintService.registerTemplate({ id: "granulometrie-sol-report", title: "Rapport Granulométrie Sol", orientation: "portrait" });

const FUSEAU_GNT_0_315 = {
  min: [
    { d: 0.063, p: 2 }, { d: 0.5, p: 10 }, { d: 2, p: 20 }, { d: 4, p: 25 },
    { d: 6.3, p: 30 }, { d: 10, p: 38 }, { d: 16, p: 50 }, { d: 20, p: 58 },
    { d: 25, p: 68 }, { d: 31.5, p: 100 },
  ],
  max: [
    { d: 0.063, p: 9 }, { d: 0.5, p: 30 }, { d: 2, p: 45 }, { d: 4, p: 55 },
    { d: 6.3, p: 60 }, { d: 10, p: 68 }, { d: 16, p: 78 }, { d: 20, p: 85 },
    { d: 25, p: 95 }, { d: 31.5, p: 100 },
  ],
};

function pf(v: unknown): number { return parseFloat(String(v ?? "")) || 0; }
function fmt(v: number, dec = 1): string { return isNaN(v) || !isFinite(v) ? "-" : v.toFixed(dec); }

const TAMIS_SOL = [125, 80, 63, 50, 40, 31.5, 25, 20, 16, 12.5, 10, 8, 6.3, 5, 4, 2, 1, 0.5, 0.25, 0.125, 0.063];

export default function GranulometrieSolReport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: echantillon, isLoading } = useEchantillonGeotechniqueById("granulometrie-sol", id);
  const { data: entreprise } = useEntreprise();

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!echantillon) return <div className="text-center py-8 text-muted-foreground">Échantillon non trouvé</div>;

  const r = (echantillon.resultats || {}) as Record<string, unknown>;
  const m1 = pf(r.masse_seche_m1);
  const m2 = pf(r.masse_apres_lavage_m2);
  const masseHumide = pf(r.masse_humide);
  const fondP = pf(r.fond_p);

  // Rebuild tamis calculations
  let refusCumule = 0;
  const tamisCalc = TAMIS_SOL.map(d => {
    const refus = pf(r[`refus_${d}`]);
    refusCumule += refus;
    const pct = m1 > 0 ? (refusCumule / m1) * 100 : 0;
    const passant = Math.max(0, 100 - pct);
    return { d, refus, refusCumule: parseFloat(refusCumule.toFixed(1)), refusCumulePct: parseFloat(pct.toFixed(1)), passant: parseFloat(passant.toFixed(1)) };
  });

  const f = m1 > 0 ? ((m1 - m2) + fondP) / m1 * 100 : 0;
    const classification = String(r.computed_classification || "-");
    const typeMateriau = String(r.type_materiau || "GNT");
    const isGNT = typeMateriau === "GNT";

    const chartData = tamisCalc.filter(t => t.refusCumule > 0 || t.passant < 100).sort((a, b) => a.d - b.d).map(t => ({ d: t.d, passant: t.passant }));

  const numero = `GRSOL-${String(echantillon.numero).padStart(3, "0")}`;
  const basePath = "/essais/geotechnique/identification/granulometrie-sol";

  return (
    <div className="space-y-4 animate-fade-in">
      <EssaiBreadcrumb items={[
        { label: "Géotechnique", path: "/essais/geotechnique" },
        { label: "Identification", path: "/essais/geotechnique/identification" },
        { label: "Granulométrie Sol", path: basePath },
        { label: numero, path: `${basePath}/${id}` },
        { label: "Rapport" }
      ]} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex items-center gap-4">
          <BackButton to={`${basePath}/${id}`} />
          <h1 className="text-3xl font-display font-bold text-foreground">
            Rapport <span className="text-primary">{numero}</span>
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto">
          <ShareButton className="col-span-2 order-last w-full sm:col-span-1 sm:order-none sm:w-auto" />
          <Button
            variant="outline"
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
            onClick={() => PrintService.print({ title: `Rapport Granulométrie Sol ${numero}`, orientation: "portrait" })}
          >
            <Download className="h-4 w-4 mr-2" />Télécharger PDF
          </Button>
          <Button onClick={() => PrintService.print({ title: `Rapport Granulométrie Sol ${numero}`, orientation: "portrait" })} className="gradient-primary text-primary-foreground">
            <Printer className="h-4 w-4 mr-2" />Imprimer
          </Button>
        </div>
      </div>

      {/* Printable report */}
      <div data-ref="report" data-print-root data-print-template="granulometrie-sol-report" className="bg-white text-black p-8 rounded-lg shadow-lg print:shadow-none print:p-4 max-w-4xl mx-auto" id="report-content">
        <ReportHeader
          title="ANALYSE GRANULOMÉTRIQUE DES SOLS"
          subtitle="NF P 94-056"
          verificationUrl={window.location.href}
          entreprise={entreprise || undefined}
        />

        {/* Identification */}
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

        {/* Masses */}
        <table className="w-full border-collapse border border-gray-400 text-sm mb-4">
          <tbody>
            <tr>
              <td className="border border-gray-400 px-3 py-1 bg-gray-100 font-medium">Masse humide :</td>
              <td className="border border-gray-400 px-3 py-1 text-center font-bold">{masseHumide ? fmt(masseHumide) : "-"}</td>
              <td className="border border-gray-400 px-3 py-1 bg-gray-100 font-medium">Masse sèche (M1) :</td>
              <td className="border border-gray-400 px-3 py-1 text-center font-bold">{m1 ? fmt(m1) : "-"}</td>
              <td className="border border-gray-400 px-3 py-1 bg-gray-100 font-medium">Masse sèche après lavage (M2) :</td>
              <td className="border border-gray-400 px-3 py-1 text-center font-bold">{m2 ? fmt(m2) : "-"}</td>
            </tr>
          </tbody>
        </table>

        {/* Tableau des tamis */}
        <table className="w-full border-collapse border border-gray-400 text-sm mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 px-2 py-2 text-center font-medium">DIAMÈTRE TAMIS (mm)</th>
              <th className="border border-gray-400 px-2 py-2 text-center font-medium">REFUS (g)</th>
              <th className="border border-gray-400 px-2 py-2 text-center font-medium">REFUS CUMULÉ (g)</th>
              <th className="border border-gray-400 px-2 py-2 text-center font-medium">REFUS CUMULÉ (%)</th>
              <th className="border border-gray-400 px-2 py-2 text-center font-medium">PASSANT CUMULÉ (%)</th>
            </tr>
          </thead>
          <tbody>
            {tamisCalc.map(t => (
              <tr key={t.d}>
                <td className="border border-gray-400 px-2 py-1 text-center font-bold">{t.d}</td>
                <td className="border border-gray-400 px-2 py-1 text-center">{t.refus > 0 ? fmt(t.refus) : "0"}</td>
                <td className="border border-gray-400 px-2 py-1 text-center">{fmt(t.refusCumule)}</td>
                <td className="border border-gray-400 px-2 py-1 text-center">{fmt(t.refusCumulePct)}</td>
                <td className="border border-gray-400 px-2 py-1 text-center font-bold">{fmt(t.passant)}</td>
              </tr>
            ))}
            <tr className="bg-gray-100">
              <td className="border border-gray-400 px-2 py-1 font-bold">P</td>
              <td className="border border-gray-400 px-2 py-1 text-center font-bold">{fmt(fondP)}</td>
              <td className="border border-gray-400 px-2 py-1 text-center" colSpan={2}>f = ((M1-M2)+P)/M1×100</td>
              <td className="border border-gray-400 px-2 py-1 text-center font-bold text-blue-700">{fmt(f, 1)}</td>
            </tr>
          </tbody>
        </table>

        {/* Classification - GNT only */}
        {isGNT && (
          <div className="border border-gray-400 p-3 mb-4 text-sm">
            <p className="font-bold">Classification NF EN 13285 : <span className="text-blue-700 text-lg">{classification}</span></p>
          </div>
        )}

        {/* Fuseau granulométrique - GNT only */}
        {isGNT && chartData.length > 1 && (() => {
          const fuseauData = FUSEAU_GNT_0_315.min.map((pt, i) => {
            const sample = chartData.find(t => Math.abs(t.d - pt.d) < 0.01);
            return { d: pt.d, min: pt.p, max: FUSEAU_GNT_0_315.max[i].p, passant: sample?.passant ?? null };
          });
          return (
            <div className="mb-4">
              <h3 className="font-bold text-sm mb-2 underline text-center">Fuseau granulométrique — GNT 0/31.5</h3>
              <div className="border border-gray-400 p-4 bg-white">
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={fuseauData} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                      <XAxis dataKey="d" scale="log" domain={['auto', 'auto']} tickFormatter={v => `${v}`} label={{ value: 'Ouverture tamis (mm)', position: 'bottom', offset: 10, style: { fontSize: 11 } }} tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} label={{ value: 'Passant cumulé (%)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} tick={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey="min" stroke="#999" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Min fuseau" />
                      <Line type="monotone" dataKey="max" stroke="#999" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Max fuseau" />
                      <Line type="monotone" dataKey="passant" stroke="#1d4ed8" strokeWidth={2.5} dot={{ fill: '#1d4ed8', r: 4 }} connectNulls name="Échantillon" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-center text-gray-500 mt-2">Lignes pointillées : limites du fuseau NF EN 13285 (GNT 0/31.5)</p>
              </div>
            </div>
          );
        })()}

        {/* Courbe simple - Autre only */}
        {!isGNT && chartData.length > 1 && (
          <div className="mb-4">
            <h3 className="font-bold text-sm mb-2 underline text-center">Courbe granulométrique</h3>
            <div className="border border-gray-400 p-4 bg-white">
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                    <XAxis dataKey="d" scale="log" domain={['auto', 'auto']} tickFormatter={v => `${v}`} label={{ value: 'Ouverture tamis (mm)', position: 'bottom', offset: 10, style: { fontSize: 11 } }} tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} label={{ value: 'Passant cumulé (%)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} tick={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="passant" stroke="#1d4ed8" strokeWidth={2.5} dot={{ fill: '#1d4ed8', r: 4 }} connectNulls name="Échantillon" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Observations */}
        {echantillon.observations && (
          <div className="border border-gray-400 p-3 text-sm">
            <p className="font-bold">Observations :</p>
            <p>{echantillon.observations}</p>
          </div>
        )}
      </div>
    </div>
  );
}
