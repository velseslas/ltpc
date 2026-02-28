import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface TamisData {
  ouverture: number;
  refus: number;
  refusCumule: number;
  passant: number;
}

interface GranulometrieReportContentProps {
  resultats: Record<string, unknown>;
}

export default function GranulometrieReportContent({ resultats }: GranulometrieReportContentProps) {
  const masseTotale = (resultats.masse_totale as number) || 0;
  const moduleFinesse = (resultats.module_finesse as number) || 0;
  const tamisData = (resultats.tamis as TamisData[]) || [];

  const getModuleFinesseClassification = (mf: number) => {
    if (mf < 1.8) return "Sable très fin";
    if (mf < 2.2) return "Sable fin";
    if (mf < 2.8) return "Sable moyen (idéal pour béton)";
    if (mf < 3.3) return "Sable grossier";
    return "Sable très grossier";
  };

  // Prepare chart data - sort by sieve size and filter valid points
  const chartData = tamisData
    .filter(t => t.ouverture > 0)
    .sort((a, b) => a.ouverture - b.ouverture)
    .map(t => ({
      ouverture: t.ouverture,
      passant: t.passant,
      label: t.ouverture >= 1 ? `${t.ouverture}` : `${t.ouverture}`
    }));

  return (
    <div className="space-y-6">
      {/* Résultats généraux */}
      <div>
        <h3 className="font-bold text-sm mb-2 underline">Caractéristiques générales</h3>
        <table className="w-full border-collapse border border-[#4a90a4]">
          <tbody>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium w-1/2">Masse totale de l'échantillon</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center">{masseTotale || "-"} g</td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">Module de Finesse (Mf)</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center font-bold text-lg text-[#4a90a4]">
                {moduleFinesse || "-"}
              </td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">Classification</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center font-medium">
                {moduleFinesse ? getModuleFinesseClassification(moduleFinesse) : "-"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tableau des tamis */}
      {tamisData.length > 0 && (
        <div>
          <h3 className="font-bold text-sm mb-2 underline">Tableau d'analyse granulométrique</h3>
          <table className="w-full border-collapse border border-[#4a90a4] text-sm">
            <thead>
              <tr className="bg-[#e8f4f8]">
                <th className="border border-[#4a90a4] px-2 py-2 text-center font-medium">Tamis (mm)</th>
                <th className="border border-[#4a90a4] px-2 py-2 text-center font-medium">Refus (g)</th>
                <th className="border border-[#4a90a4] px-2 py-2 text-center font-medium">Refus cumulé (g)</th>
                <th className="border border-[#4a90a4] px-2 py-2 text-center font-medium">Passant (%)</th>
              </tr>
            </thead>
            <tbody>
              {tamisData.filter(t => t.refus > 0 || t.passant < 100).map((tamis) => (
                <tr key={tamis.ouverture}>
                  <td className="border border-[#4a90a4] px-2 py-1 text-center font-medium">{tamis.ouverture}</td>
                  <td className="border border-[#4a90a4] px-2 py-1 text-center">{tamis.refus.toFixed(1)}</td>
                  <td className="border border-[#4a90a4] px-2 py-1 text-center">{tamis.refusCumule.toFixed(1)}</td>
                  <td className="border border-[#4a90a4] px-2 py-1 text-center font-medium">{tamis.passant.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Courbe granulométrique */}
      {chartData.length > 0 && (
        <div>
          <h3 className="font-bold text-sm mb-2 underline">Courbe granulométrique</h3>
          <div className="border border-[#4a90a4] p-4 bg-white">
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                  <XAxis 
                    dataKey="ouverture" 
                    scale="log"
                    domain={['auto', 'auto']}
                    tickFormatter={(value) => value >= 1 ? `${value}` : `${value}`}
                    label={{ value: 'Ouverture tamis (mm)', position: 'bottom', offset: 10, style: { fontSize: 11 } }}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tickFormatter={(value) => `${value}%`}
                    label={{ value: 'Passant (%)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Passant']}
                    labelFormatter={(label) => `Tamis: ${label} mm`}
                  />
                  <ReferenceLine y={50} stroke="#999" strokeDasharray="5 5" />
                  <Line 
                    type="monotone" 
                    dataKey="passant" 
                    stroke="#4a90a4" 
                    strokeWidth={2}
                    dot={{ fill: '#4a90a4', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-center text-gray-500 mt-2">Échelle logarithmique des ouvertures</p>
          </div>
        </div>
      )}

      {/* Formule */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
        <p className="font-medium mb-1">Formule du Module de Finesse :</p>
        <p>Mf = (Σ Refus cumulés sur tamis 0.16, 0.315, 0.63, 1.25, 2.5, 5 mm) / 100</p>
      </div>
    </div>
  );
}
