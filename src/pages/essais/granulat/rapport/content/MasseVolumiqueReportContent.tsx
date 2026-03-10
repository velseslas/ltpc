interface MasseVolumiqueReportContentProps {
  resultats: Record<string, unknown>;
}

export default function MasseVolumiqueReportContent({ resultats }: MasseVolumiqueReportContentProps) {
  const getVal = (field: string) => {
    const v = resultats[field];
    return typeof v === "number" ? v : "-";
  };

  return (
    <div className="space-y-6">
      {/* Mesures */}
      <div>
        <h3 className="font-bold text-sm mb-2 underline">Mesures effectuées</h3>
        <table className="w-full border-collapse border border-[#4a90a4]">
          <tbody>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium w-1/2">Masse échantillon sec (M1)</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center">{getVal("masse_seche")} g</td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">Masse échantillon saturé surface sèche (M2)</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center">{getVal("masse_saturee")} g</td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">Masse dans l'eau (M3)</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center">{getVal("masse_immergee")} g</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Résultats calculés */}
      <div>
        <h3 className="font-bold text-sm mb-2 underline">Résultats calculés</h3>
        <table className="w-full border-collapse border border-[#4a90a4]">
          <tbody>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium w-1/2">Masse volumique réelle (ρrd)</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center font-bold text-[#4a90a4]">
                {getVal("mv_reelle")} kg/m³
              </td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">Masse volumique SSS (ρssd)</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center font-bold text-[#4a90a4]">
                {getVal("mv_ssd")} kg/m³
              </td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">Masse volumique apparente (ρa)</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center font-bold text-[#4a90a4]">
                {getVal("mv_apparente")} kg/m³
              </td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">Coefficient d'absorption (WA)</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center font-bold text-[#4a90a4]">
                {getVal("absorption")} %
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Formules */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
        <p className="font-medium mb-1">Formules utilisées :</p>
        <p>ρrd = M1 / (M2 - M3) × ρw</p>
        <p>ρssd = M2 / (M2 - M3) × ρw</p>
        <p>ρa = M1 / (M1 - M3) × ρw</p>
        <p>WA = (M2 - M1) / M1 × 100</p>
        <p className="mt-1 text-xs">Où ρw = masse volumique de l'eau (1000 kg/m³)</p>
      </div>
    </div>
  );
}
