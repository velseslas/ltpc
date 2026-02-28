interface BleuMethyleneReportContentProps {
  resultats: Record<string, unknown>;
}

export default function BleuMethyleneReportContent({ resultats }: BleuMethyleneReportContentProps) {
  const getClassification = (mb: number) => {
    if (mb <= 0.5) return "Sable propre";
    if (mb <= 1.5) return "Sable légèrement argileux";
    if (mb <= 2.5) return "Sable argileux";
    return "Sable très argileux";
  };

  const mb = (resultats.valeur_mb as number) || 0;

  return (
    <div className="space-y-6">
      {/* Résultats des essais */}
      <div>
        <h3 className="font-bold text-sm mb-2 underline">Résultats des essais</h3>
        <table className="w-full border-collapse border border-[#4a90a4]">
          <tbody>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium w-1/2">Masse de l'échantillon</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center">{(resultats.masse_echantillon as number) || "-"} g</td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">Volume de bleu injecté</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center">{(resultats.volume_bleu as number) || "-"} ml</td>
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
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium w-1/2">Valeur au Bleu de Méthylène (MB)</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center font-bold text-lg text-[#4a90a4]">
                {mb ? `${mb} g/kg` : "-"}
              </td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">Classification</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center font-medium">
                {mb ? getClassification(mb) : "-"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Classification */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
        <p className="font-medium mb-1">Classification selon NF EN 933-9 :</p>
        <ul className="space-y-0.5">
          <li>• MB ≤ 0,5 : Sable propre</li>
          <li>• 0,5 &lt; MB ≤ 1,5 : Sable légèrement argileux</li>
          <li>• 1,5 &lt; MB ≤ 2,5 : Sable argileux</li>
          <li>• MB &gt; 2,5 : Sable très argileux</li>
        </ul>
      </div>
    </div>
  );
}
