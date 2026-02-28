interface TempsPriseReportContentProps {
  resultats: Record<string, unknown>;
}

export default function TempsPriseReportContent({ resultats }: TempsPriseReportContentProps) {
  const isConforme = resultats.conformite === "conforme";

  const formatDuration = (minutes: number | undefined) => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  return (
    <div className="mt-6 border border-black">
      <div className="bg-gray-100 px-3 py-2 border-b border-black">
        <h3 className="font-bold text-sm text-black">RÉSULTATS DE L'ESSAI DE TEMPS DE PRISE</h3>
      </div>
      <table className="w-full text-sm text-black">
        <tbody>
          <tr className="border-b border-black">
            <td className="px-3 py-2 border-r border-black w-1/2 font-medium bg-gray-50">
              Temps de prise initial
            </td>
            <td className="px-3 py-2 w-1/2 text-center font-bold text-lg">
              {formatDuration(resultats.temps_prise_initial as number)}
            </td>
          </tr>
          <tr className="border-b border-black">
            <td className="px-3 py-2 border-r border-black font-medium bg-gray-50">
              Temps de prise final
            </td>
            <td className="px-3 py-2 text-center font-bold text-lg">
              {formatDuration(resultats.temps_prise_final as number)}
            </td>
          </tr>
          <tr className="border-b border-black">
            <td className="px-3 py-2 border-r border-black font-medium bg-gray-50">
              Température de l'essai
            </td>
            <td className="px-3 py-2 text-center">
              {resultats.temperature_essai ? `${resultats.temperature_essai} °C` : "-"}
            </td>
          </tr>
          <tr className="border-b border-black">
            <td className="px-3 py-2 border-r border-black font-medium bg-gray-50">
              Méthode d'essai
            </td>
            <td className="px-3 py-2 text-center">
              {resultats.methode === "vicat" ? "Aiguille de Vicat" : 
               resultats.methode === "penetrometre" ? "Pénétromètre" : "-"}
            </td>
          </tr>
          <tr>
            <td className="px-3 py-2 border-r border-black font-medium bg-gray-50">
              Conformité
            </td>
            <td className={`px-3 py-2 text-center font-bold ${isConforme ? "text-green-600" : "text-red-600"}`}>
              {isConforme ? "CONFORME" : "NON CONFORME"}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
