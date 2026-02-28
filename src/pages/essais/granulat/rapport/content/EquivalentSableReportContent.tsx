interface EquivalentSableReportContentProps {
  resultats: Record<string, unknown>;
}

export default function EquivalentSableReportContent({ resultats }: EquivalentSableReportContentProps) {
  const getClassification = (es: number) => {
    if (es >= 80) return "Sable très propre";
    if (es >= 70) return "Sable propre";
    if (es >= 60) return "Sable légèrement argileux";
    return "Sable argileux";
  };

  const es1 = (resultats.es_essai1 as number) || 0;
  const es2 = (resultats.es_essai2 as number) || 0;
  const esMoyen = es1 && es2 ? ((es1 + es2) / 2) : 0;

  return (
    <div className="space-y-6">
      {/* Résultats des essais */}
      <div>
        <h3 className="font-bold text-sm mb-2 underline">Résultats des essais</h3>
        <table className="w-full border-collapse border border-[#4a90a4]">
          <thead>
            <tr className="bg-[#e8f4f8]">
              <th className="border border-[#4a90a4] px-3 py-2 text-center font-medium">Essai</th>
              <th className="border border-[#4a90a4] px-3 py-2 text-center font-medium">H1 (mm)</th>
              <th className="border border-[#4a90a4] px-3 py-2 text-center font-medium">H2 (mm)</th>
              <th className="border border-[#4a90a4] px-3 py-2 text-center font-medium">ES (%)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 text-center">Essai 1</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center">{(resultats.h1_essai1 as number) || "-"}</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center">{(resultats.h2_essai1 as number) || "-"}</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center font-medium">{es1 || "-"}</td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 text-center">Essai 2</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center">{(resultats.h1_essai2 as number) || "-"}</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center">{(resultats.h2_essai2 as number) || "-"}</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center font-medium">{es2 || "-"}</td>
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
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium w-1/2">Équivalent de Sable moyen (ES)</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center font-bold text-lg text-[#4a90a4]">
                {esMoyen ? `${esMoyen.toFixed(1)} %` : "-"}
              </td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">Classification</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center font-medium">
                {esMoyen ? getClassification(esMoyen) : "-"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Formule */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
        <p className="font-medium mb-1">Formule utilisée :</p>
        <p>ES = (H2 / H1) × 100</p>
        <p className="mt-1 text-xs">Où H1 = hauteur totale et H2 = hauteur du sable</p>
      </div>
    </div>
  );
}
