interface TeneurAirReportContentProps {
  resultats: Record<string, unknown>;
}

export default function TeneurAirReportContent({ resultats }: TeneurAirReportContentProps) {
  const isConforme = resultats.conformite === "conforme";

  return (
    <div className="mt-6 border border-black">
      <div className="bg-gray-100 px-3 py-2 border-b border-black">
        <h3 className="font-bold text-sm text-black">RÉSULTATS DE L'ESSAI DE TENEUR EN AIR</h3>
      </div>
      <table className="w-full text-sm text-black">
        <tbody>
          <tr className="border-b border-black">
            <td className="px-3 py-2 border-r border-black w-1/2 font-medium bg-gray-50">
              Teneur en air mesurée
            </td>
            <td className="px-3 py-2 w-1/2 text-center font-bold text-lg">
              {resultats.teneur_air ? `${resultats.teneur_air} %` : "-"}
            </td>
          </tr>
          <tr className="border-b border-black">
            <td className="px-3 py-2 border-r border-black font-medium bg-gray-50">
              Teneur minimale spécifiée
            </td>
            <td className="px-3 py-2 text-center">
              {resultats.teneur_min ? `${resultats.teneur_min} %` : "-"}
            </td>
          </tr>
          <tr className="border-b border-black">
            <td className="px-3 py-2 border-r border-black font-medium bg-gray-50">
              Teneur maximale spécifiée
            </td>
            <td className="px-3 py-2 text-center">
              {resultats.teneur_max ? `${resultats.teneur_max} %` : "-"}
            </td>
          </tr>
          <tr className="border-b border-black">
            <td className="px-3 py-2 border-r border-black font-medium bg-gray-50">
              Méthode de mesure
            </td>
            <td className="px-3 py-2 text-center capitalize">
              {(resultats.methode as string) || "-"}
            </td>
          </tr>
          {resultats.facteur_correction && (
            <tr className="border-b border-black">
              <td className="px-3 py-2 border-r border-black font-medium bg-gray-50">
                Facteur de correction d'agrégat
              </td>
              <td className="px-3 py-2 text-center">
                {resultats.facteur_correction as number}
              </td>
            </tr>
          )}
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
