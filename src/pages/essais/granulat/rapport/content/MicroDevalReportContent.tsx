interface MicroDevalReportContentProps {
  resultats: Record<string, unknown>;
}

export default function MicroDevalReportContent({ resultats }: MicroDevalReportContentProps) {
  const getClassification = (coeff: number) => {
    if (coeff <= 10) return { label: "MDE10", description: "Excellente résistance" };
    if (coeff <= 15) return { label: "MDE15", description: "Très bonne résistance" };
    if (coeff <= 20) return { label: "MDE20", description: "Bonne résistance" };
    if (coeff <= 25) return { label: "MDE25", description: "Résistance moyenne" };
    return { label: "MDE>25", description: "Faible résistance" };
  };

  const coeff = (resultats.coefficient_mde as number) || 0;
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
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium w-1/2">Coefficient Micro-Deval (MDE)</td>
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
          <li>• MDE ≤ 10 : Excellente résistance à l'usure</li>
          <li>• 10 &lt; MDE ≤ 15 : Très bonne résistance</li>
          <li>• 15 &lt; MDE ≤ 20 : Bonne résistance</li>
          <li>• 20 &lt; MDE ≤ 25 : Résistance moyenne</li>
          <li>• MDE &gt; 25 : Faible résistance</li>
        </ul>
      </div>
    </div>
  );
}
