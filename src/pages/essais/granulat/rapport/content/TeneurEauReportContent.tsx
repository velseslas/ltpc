interface TeneurEauReportContentProps {
  resultats: Record<string, unknown>;
}

export default function TeneurEauReportContent({ resultats }: TeneurEauReportContentProps) {
  return (
    <div className="space-y-6">
      {/* Résultats des essais */}
      <div>
        <h3 className="font-bold text-sm mb-2 underline">Résultats des essais</h3>
        <table className="w-full border-collapse border border-[#4a90a4]">
          <tbody>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium w-1/2">Masse de l'échantillon humide (M1)</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center">{(resultats.masse_humide as number) || "-"} g</td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">Masse de l'échantillon sec (M2)</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center">{(resultats.masse_seche as number) || "-"} g</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Synthèse */}
      <div>
        <h3 className="font-bold text-sm mb-2 underline">Synthèse des résultats</h3>
        <table className="w-full border-collapse border border-[#4a90a4]">
          <tbody>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium w-1/2">Teneur en Eau (W)</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center font-bold text-lg text-[#4a90a4]">
                {(resultats.teneur_eau as number) ? `${(resultats.teneur_eau as number)} %` : "-"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Formule */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
        <p className="font-medium mb-1">Formule utilisée :</p>
        <p>W = (M1 - M2) / M2 × 100</p>
        <p className="mt-1 text-xs">Où M1 = masse humide et M2 = masse sèche après étuvage à 105°C</p>
      </div>
    </div>
  );
}
