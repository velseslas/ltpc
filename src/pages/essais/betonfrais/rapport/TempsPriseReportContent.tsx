import { formatDuration, SEUIL_PRISE_FINALE_MPA, SEUIL_PRISE_INITIALE_MPA } from "../lib/tempsPriseCalculs";

interface TempsPriseReportContentProps {
  resultats: Record<string, unknown>;
}

interface MesureRow {
  temps_min?: number;
  force_N?: number;
  aiguille_mm2?: number;
}

export default function TempsPriseReportContent({ resultats }: TempsPriseReportContentProps) {
  const isConforme = resultats.conformite === "conforme";
  const mesures = (resultats.mesures as MesureRow[] | undefined) ?? [];
  const tempsInitial = resultats.temps_prise_initial as number | null | undefined;
  const tempsFinal = resultats.temps_prise_final as number | null | undefined;

  return (
    <div className="mt-6 space-y-4">
      <div className="border border-black">
        <div className="bg-gray-100 px-3 py-2 border-b border-black">
          <h3 className="font-bold text-sm text-black">
            MESURES DE PÉNÉTRATION — ASTM C403/C403M
          </h3>
        </div>
        <table className="w-full text-xs text-black">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-1 border-b border-r border-black text-left">N°</th>
              <th className="px-2 py-1 border-b border-r border-black text-center">Temps (min)</th>
              <th className="px-2 py-1 border-b border-r border-black text-center">Force (N)</th>
              <th className="px-2 py-1 border-b border-r border-black text-center">Surface aiguille (mm²)</th>
              <th className="px-2 py-1 border-b border-black text-center">Résistance (MPa)</th>
            </tr>
          </thead>
          <tbody>
            {mesures.length === 0 && (
              <tr>
                <td colSpan={5} className="px-2 py-4 text-center text-gray-500">
                  Aucune mesure saisie
                </td>
              </tr>
            )}
            {mesures.map((m, i) => {
              const r =
                m.force_N && m.aiguille_mm2 ? Number(m.force_N) / Number(m.aiguille_mm2) : null;
              return (
                <tr key={i} className="border-b border-black">
                  <td className="px-2 py-1 border-r border-black">{i + 1}</td>
                  <td className="px-2 py-1 border-r border-black text-center">{m.temps_min ?? "-"}</td>
                  <td className="px-2 py-1 border-r border-black text-center">{m.force_N ?? "-"}</td>
                  <td className="px-2 py-1 border-r border-black text-center">{m.aiguille_mm2 ?? "-"}</td>
                  <td className="px-2 py-1 text-center font-medium">
                    {r != null ? r.toFixed(2) : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="border border-black">
        <div className="bg-gray-100 px-3 py-2 border-b border-black">
          <h3 className="font-bold text-sm text-black">RÉSULTATS DE L'ESSAI DE TEMPS DE PRISE</h3>
        </div>
        <table className="w-full text-sm text-black">
          <tbody>
            <tr className="border-b border-black">
              <td className="px-3 py-2 border-r border-black w-1/2 font-medium bg-gray-50">
                Début de prise (R = {SEUIL_PRISE_INITIALE_MPA} MPa)
              </td>
              <td className="px-3 py-2 w-1/2 text-center font-bold text-lg">
                {formatDuration(tempsInitial)}
              </td>
            </tr>
            <tr className="border-b border-black">
              <td className="px-3 py-2 border-r border-black font-medium bg-gray-50">
                Fin de prise (R = {SEUIL_PRISE_FINALE_MPA} MPa)
              </td>
              <td className="px-3 py-2 text-center font-bold text-lg">
                {formatDuration(tempsFinal)}
              </td>
            </tr>
            <tr className="border-b border-black">
              <td className="px-3 py-2 border-r border-black font-medium bg-gray-50">
                Température de l'essai
              </td>
              <td className="px-3 py-2 text-center">
                {resultats.temperature_essai != null ? `${resultats.temperature_essai} °C` : "-"}
              </td>
            </tr>
            <tr className="border-b border-black">
              <td className="px-3 py-2 border-r border-black font-medium bg-gray-50">
                Méthode d'essai
              </td>
              <td className="px-3 py-2 text-center">
                Pénétromètre de résistance à la pénétration (ASTM C403/C403M)
              </td>
            </tr>
            <tr>
              <td className="px-3 py-2 border-r border-black font-medium bg-gray-50">Conformité</td>
              <td
                className={`px-3 py-2 text-center font-bold ${
                  isConforme ? "text-green-600" : "text-red-600"
                }`}
              >
                {isConforme ? "CONFORME" : "NON CONFORME"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {resultats.observations && (
        <div className="border border-black">
          <div className="bg-gray-100 px-3 py-2 border-b border-black">
            <h3 className="font-bold text-sm text-black">OBSERVATIONS</h3>
          </div>
          <div className="px-3 py-2 text-sm text-black whitespace-pre-wrap">
            {String(resultats.observations)}
          </div>
        </div>
      )}
    </div>
  );
}
