interface TemperatureReportContentProps {
  resultats: Record<string, unknown>;
}

export default function TemperatureReportContent({ resultats }: TemperatureReportContentProps) {
  const isConforme = resultats.conformite === "conforme";

  return (
    <div className="mt-6 border border-black">
      <div className="bg-gray-100 px-3 py-2 border-b border-black">
        <h3 className="font-bold text-sm text-black">RÉSULTATS DE L'ESSAI DE TEMPÉRATURE</h3>
      </div>
      <table className="w-full text-sm text-black">
        <tbody>
          <tr className="border-b border-black">
            <td className="px-3 py-2 border-r border-black w-1/2 font-medium bg-gray-50">
              Température mesurée
            </td>
            <td className="px-3 py-2 w-1/2 text-center font-bold text-lg">
              {resultats.temperature_mesuree ? `${resultats.temperature_mesuree} °C` : "-"}
            </td>
          </tr>
          <tr className="border-b border-black">
            <td className="px-3 py-2 border-r border-black font-medium bg-gray-50">
              Température minimale spécifiée
            </td>
            <td className="px-3 py-2 text-center">
              {resultats.temperature_min ? `${resultats.temperature_min} °C` : "-"}
            </td>
          </tr>
          <tr className="border-b border-black">
            <td className="px-3 py-2 border-r border-black font-medium bg-gray-50">
              Température maximale spécifiée
            </td>
            <td className="px-3 py-2 text-center">
              {resultats.temperature_max ? `${resultats.temperature_max} °C` : "-"}
            </td>
          </tr>
          <tr className="border-b border-black">
            <td className="px-3 py-2 border-r border-black font-medium bg-gray-50">
              Type de thermomètre
            </td>
            <td className="px-3 py-2 text-center capitalize">
              {(resultats.type_thermometre as string) || "-"}
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
