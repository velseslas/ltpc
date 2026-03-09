import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface TamisData {
  ouverture: number;
  refus: number;
  refusCumule: number;
  pourcentageRefusCumule: number;
  passant: number;
}

interface GranulometrieReportContentProps {
  resultats: Record<string, unknown>;
}

export default function GranulometrieReportContent({ resultats }: GranulometrieReportContentProps) {
  const masseSechM1 = (resultats.masse_seche_m1 as number) || 0;
  const masseHumideM1Prime = (resultats.masse_humide_m1_prime as number) || 0;
  const masseLavageM1M2 = (resultats.masse_lavage_m1_m2 as number) || 0;
  const masseApresLavageM2 = (resultats.masse_apres_lavage_m2 as number) || 0;
  const fondP = (resultats.fond_p as number) || 0;
  const moduleFinesse = (resultats.module_finesse as number) || 0;
  const sommeRiPlusP = (resultats.somme_ri_plus_p as number) || 0;
  const pertePourcentage = (resultats.perte_pourcentage as number) || 0;
  const teneurFinesF = (resultats.teneur_fines_f as number) || 0;
  const procede = (resultats.procede as string) || "lavage_tamisage";
  const tamisData = (resultats.tamis as TamisData[]) || [];

  const procedeLabel = procede === "lavage_tamisage" ? "Lavage et tamisage" : "Tamisage par voie sèche";

  // Chart data
  const chartData = tamisData
    .filter(t => t.ouverture > 0 && (t.refus > 0 || t.passant < 100))
    .sort((a, b) => a.ouverture - b.ouverture)
    .map(t => ({
      ouverture: t.ouverture,
      passant: t.passant,
    }));

  return (
    <div className="space-y-6">
      {/* Expression des résultats title */}
      <h3 className="font-bold text-sm mb-2 underline text-center">Expression des résultats</h3>

      {/* Header info */}
      <table className="w-full border-collapse border border-[#4a90a4] text-sm">
        <tbody>
          <tr>
            <td className="border border-[#4a90a4] px-3 py-1 bg-[#e8f4f8] font-medium">Procédé utilisé:</td>
            <td className="border border-[#4a90a4] px-3 py-1 text-center">{procedeLabel}</td>
            <td className="border border-[#4a90a4] px-3 py-1 bg-[#e8f4f8] font-medium">Tamisage par voie sèche</td>
            <td className="border border-[#4a90a4] px-3 py-1 text-center font-bold">
              {masseApresLavageM2 ? masseApresLavageM2.toFixed(1) : "-"}
            </td>
          </tr>
          <tr>
            <td className="border border-[#4a90a4] px-3 py-1 bg-[#e8f4f8] font-medium">Masse sèche M1</td>
            <td className="border border-[#4a90a4] px-3 py-1 text-center font-bold">{masseSechM1 ? masseSechM1.toFixed(2) : "-"}</td>
            <td className="border border-[#4a90a4] px-3 py-1 bg-[#e8f4f8] font-medium">Masse Humide M'1:</td>
            <td className="border border-[#4a90a4] px-3 py-1 text-center">{masseHumideM1Prime || "-"}</td>
          </tr>
          <tr>
            <td className="border border-[#4a90a4] px-3 py-1 bg-[#e8f4f8] font-medium" colSpan={2}>
              Masse sèche retirée par lavage M1 - M2 = {masseLavageM1M2 ? masseLavageM1M2.toFixed(2) : "-"}
            </td>
            <td className="border border-[#4a90a4] px-3 py-1 bg-[#e8f4f8] font-medium">Masse sèche après lavage M2:</td>
            <td className="border border-[#4a90a4] px-3 py-1 text-center font-bold">{masseApresLavageM2 ? masseApresLavageM2.toFixed(1) : "-"}</td>
          </tr>
        </tbody>
      </table>

      {/* Tableau des tamis */}
      <table className="w-full border-collapse border border-[#4a90a4] text-sm">
        <thead>
          <tr className="bg-[#e8f4f8]">
            <th className="border border-[#4a90a4] px-2 py-2 text-center font-medium">Ouverture des tamis (mm)</th>
            <th className="border border-[#4a90a4] px-2 py-2 text-center font-medium">Masse des refus Ri (g)</th>
            <th className="border border-[#4a90a4] px-2 py-2 text-center font-medium">Masse des refus cumulés Rn (g)</th>
            <th className="border border-[#4a90a4] px-2 py-2 text-center font-medium">Pourcentage des refus cumulés (Rn/M1) × 100</th>
            <th className="border border-[#4a90a4] px-2 py-2 text-center font-medium">Pourcentage cumulé de tamisât 100 - (Rn/M1 × 100)</th>
            <th className="border border-[#4a90a4] px-2 py-2 text-center font-medium">Observation</th>
          </tr>
        </thead>
        <tbody>
          {tamisData.map((tamis) => (
            <tr key={tamis.ouverture}>
              <td className="border border-[#4a90a4] px-2 py-1 text-center font-medium">{tamis.ouverture}</td>
              <td className="border border-[#4a90a4] px-2 py-1 text-center">{tamis.refus > 0 ? tamis.refus.toFixed(1) : "0"}</td>
              <td className="border border-[#4a90a4] px-2 py-1 text-center">{tamis.refusCumule > 0 ? tamis.refusCumule.toFixed(1) : "0"}</td>
              <td className="border border-[#4a90a4] px-2 py-1 text-center">{tamis.pourcentageRefusCumule?.toFixed(2) || "0,00"}</td>
              <td className="border border-[#4a90a4] px-2 py-1 text-center font-medium text-[#4a90a4]">{tamis.passant.toFixed(2)}</td>
              <td className="border border-[#4a90a4] px-2 py-1 text-center"></td>
            </tr>
          ))}
          {/* Fond P row */}
          <tr className="bg-[#e8f4f8]">
            <td className="border border-[#4a90a4] px-2 py-1 font-medium">Fond P =</td>
            <td className="border border-[#4a90a4] px-2 py-1 text-center font-bold">{fondP ? fondP.toFixed(1) : "-"}</td>
            <td className="border border-[#4a90a4] px-2 py-1 text-center" colSpan={2}>
              Σ Ri + P = <span className="font-bold">{sommeRiPlusP ? sommeRiPlusP.toFixed(2) : "-"}</span>
            </td>
            <td className="border border-[#4a90a4] px-2 py-1 text-center font-bold" colSpan={2}>
              FM = <span className="text-lg text-[#4a90a4]">{moduleFinesse || "-"}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Formules de vérification */}
      <table className="w-full border-collapse border border-[#4a90a4] text-sm">
        <tbody>
          <tr>
            <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">
              (M2 - Σ Ri + P) / M2 × 100
            </td>
            <td className="border border-[#4a90a4] px-3 py-2 text-center">{"< 1%"}</td>
            <td className="border border-[#4a90a4] px-3 py-2 text-center font-bold">
              {pertePourcentage ? pertePourcentage.toFixed(2) + "%" : "-"}
            </td>
            <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">
              f = (M1 - M2) / M1 × 100
            </td>
            <td className="border border-[#4a90a4] px-3 py-2 text-center font-bold">
              {teneurFinesF ? teneurFinesF.toFixed(2) : "-"}
            </td>
          </tr>
        </tbody>
      </table>

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
                    tickFormatter={(value) => `${value}`}
                    label={{ value: 'Ouverture tamis (mm)', position: 'bottom', offset: 10, style: { fontSize: 11 } }}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tickFormatter={(value) => `${value}%`}
                    label={{ value: 'Tamisât cumulé (%)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Tamisât']}
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
    </div>
  );
}
