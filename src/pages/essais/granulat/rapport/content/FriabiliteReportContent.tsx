interface FriabiliteReportContentProps {
  resultats: Record<string, unknown>;
}

export default function FriabiliteReportContent({ resultats }: FriabiliteReportContentProps) {
  const getClassification = (coeff: number) => {
    if (coeff <= 20) return "Excellente résistance à la fragmentation";
    if (coeff <= 30) return "Bonne résistance";
    if (coeff <= 40) return "Résistance moyenne";
    return "Résistance faible";
  };

  const coeff = (resultats.coefficient_friabilite as number) || 0;

  return (
    <div className="space-y-6">
      {/* Résultats des essais */}
      <div>
        <h3 className="font-bold text-sm mb-2 underline">Résultats des essais</h3>
        <table className="w-full border-collapse border border-[#4a90a4]">
          <tbody>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium w-1/2">Masse initiale (M)</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center">{(resultats.masse_initiale as number) || "-"} g</td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">Masse finale (m)</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center">{(resultats.masse_finale as number) || "-"} g</td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">Nombre de tours</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center">{(resultats.nombre_tours as number) || "-"}</td>
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
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium w-1/2">Coefficient de Friabilité (FS)</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center font-bold text-lg text-[#4a90a4]">
                {coeff ? `${coeff} %` : "-"}
              </td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">Classification</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center font-medium">
                {coeff ? getClassification(coeff) : "-"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Formule */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
        <p className="font-medium mb-1">Formule utilisée :</p>
        <p>FS = (M - m) / M × 100</p>
        <p className="mt-1 text-xs">Où M = masse initiale et m = masse finale après essai</p>
      </div>
    </div>
  );
}
