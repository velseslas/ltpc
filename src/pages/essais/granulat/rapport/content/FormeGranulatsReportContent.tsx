interface FormeGranulatsReportContentProps {
  resultats: Record<string, unknown>;
}

export default function FormeGranulatsReportContent({ resultats }: FormeGranulatsReportContentProps) {
  const getClassification = (coeff: number) => {
    if (coeff <= 15) return { label: "FI15", description: "Forme excellente" };
    if (coeff <= 20) return { label: "FI20", description: "Forme bonne" };
    if (coeff <= 35) return { label: "FI35", description: "Forme acceptable" };
    if (coeff <= 50) return { label: "FI50", description: "Forme médiocre" };
    return { label: "FI>50", description: "Forme mauvaise" };
  };

  const coeff = (resultats.coefficient_aplatissement as number) || 0;
  const classification = getClassification(coeff);

  return (
    <div className="space-y-6">
      {/* Résultats des essais */}
      <div>
        <h3 className="font-bold text-sm mb-2 underline">Résultats des essais</h3>
        <table className="w-full border-collapse border border-[#4a90a4]">
          <tbody>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium w-1/2">Masse totale échantillon</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center">{(resultats.masse_totale as number) || "-"} g</td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">Masse des éléments non cubiques</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center">{(resultats.masse_non_cubiques as number) || "-"} g</td>
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
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium w-1/2">Coefficient d'Aplatissement (FI)</td>
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
          <li>• FI ≤ 15 : Forme excellente</li>
          <li>• 15 &lt; FI ≤ 20 : Forme bonne</li>
          <li>• 20 &lt; FI ≤ 35 : Forme acceptable</li>
          <li>• 35 &lt; FI ≤ 50 : Forme médiocre</li>
          <li>• FI &gt; 50 : Forme mauvaise</li>
        </ul>
      </div>
    </div>
  );
}
