interface LosAngelesReportContentProps {
  resultats: Record<string, unknown>;
}

export default function LosAngelesReportContent({ resultats }: LosAngelesReportContentProps) {
  const getClassification = (coeff: number) => {
    if (coeff <= 20) return { label: "LA20", description: "Très résistant" };
    if (coeff <= 25) return { label: "LA25", description: "Résistant" };
    if (coeff <= 30) return { label: "LA30", description: "Moyennement résistant" };
    if (coeff <= 40) return { label: "LA40", description: "Peu résistant" };
    return { label: "LA>40", description: "Faible résistance" };
  };

  const coeff = (resultats.coefficient_la as number) || 0;
  const classification = getClassification(coeff);

  return (
    <div className="space-y-6">
      {/* Résultats des essais */}
      <div>
        <h3 className="font-bold text-sm mb-2 underline">Résultats des essais</h3>
        <table className="w-full border-collapse border border-[#4a90a4]">
          <tbody>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium w-1/2">Classe granulaire</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center">{(resultats.classe_granulaire as string) || "-"}</td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">Masse initiale (M)</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center">{(resultats.masse_initiale as number) || "-"} g</td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">Masse finale (m)</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center">{(resultats.masse_finale as number) || "-"} g</td>
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
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium w-1/2">Coefficient Los Angeles (LA)</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center font-bold text-lg text-[#4a90a4]">
                {coeff ? `${coeff} %` : "-"}
              </td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">Catégorie</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center font-medium">
                {coeff ? `${classification.label} - ${classification.description}` : "-"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Classification */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
        <p className="font-medium mb-1">Classification selon NF EN 12620 :</p>
        <ul className="space-y-0.5">
          <li>• LA ≤ 20 : Très résistant à la fragmentation</li>
          <li>• 20 &lt; LA ≤ 25 : Résistant</li>
          <li>• 25 &lt; LA ≤ 30 : Moyennement résistant</li>
          <li>• 30 &lt; LA ≤ 40 : Peu résistant</li>
          <li>• LA &gt; 40 : Faible résistance</li>
        </ul>
      </div>
    </div>
  );
}
