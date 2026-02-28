import affaissementVrai from "@/assets/affaissement-vrai.png";
import affaissementCisaille from "@/assets/affaissement-cisaille.png";
import affaissementAffaisse from "@/assets/affaissement-affaisse.png";

interface AffaissementReportContentProps {
  resultats: Record<string, unknown>;
}

const typeAffaissementImages: Record<string, string> = {
  "vrai": affaissementVrai,
  "cisaille": affaissementCisaille,
  "affaisse": affaissementAffaisse,
};

const typeAffaissementLabels: Record<string, string> = {
  "vrai": "Vrai (symétrique)",
  "cisaille": "Cisaillé",
  "affaisse": "Affaissé",
};

export default function AffaissementReportContent({ resultats }: AffaissementReportContentProps) {
  const isConforme = resultats.conformite === "conforme";
  const typeAffaissement = (resultats.type_affaissement as string) || "";
  const typeImage = typeAffaissementImages[typeAffaissement];
  const typeLabel = typeAffaissementLabels[typeAffaissement] || typeAffaissement || "-";

  return (
    <div className="mt-6 border border-black">
      <div className="bg-gray-100 px-3 py-2 border-b border-black">
        <h3 className="font-bold text-sm text-black">RÉSULTATS DE L'ESSAI D'AFFAISSEMENT</h3>
      </div>
      <div className="flex">
        {/* Results table */}
        <table className="flex-1 text-sm text-black">
          <tbody>
            <tr className="border-b border-black">
              <td className="px-3 py-2 border-r border-black w-1/2 font-medium bg-gray-50">
                Affaissement mesuré
              </td>
              <td className="px-3 py-2 w-1/2 text-center font-bold text-lg">
                {resultats.affaissement ? `${resultats.affaissement} mm` : "-"}
              </td>
            </tr>
            <tr className="border-b border-black">
              <td className="px-3 py-2 border-r border-black font-medium bg-gray-50">
                Classe de consistance visée
              </td>
              <td className="px-3 py-2 text-center">
                {(resultats.classe_visee as string) || "-"}
              </td>
            </tr>
            <tr className="border-b border-black">
              <td className="px-3 py-2 border-r border-black font-medium bg-gray-50">
                Classe de consistance mesurée
              </td>
              <td className="px-3 py-2 text-center font-semibold">
                {(resultats.classe_mesuree as string) || "-"}
              </td>
            </tr>
            <tr className="border-b border-black">
              <td className="px-3 py-2 border-r border-black font-medium bg-gray-50">
                Type d'affaissement
              </td>
              <td className="px-3 py-2 text-center capitalize">
                {typeLabel}
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
        
        {/* Type image */}
        {typeImage && (
          <div className="w-40 border-l border-black flex flex-col items-center justify-center p-3 bg-white">
            <img 
              src={typeImage} 
              alt={`Type d'affaissement: ${typeLabel}`}
              className="w-full h-auto max-h-32 object-contain"
            />
            <p className="text-xs text-center mt-2 font-medium text-black">{typeLabel}</p>
          </div>
        )}
      </div>
    </div>
  );
}
