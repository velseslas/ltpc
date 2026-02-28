interface MatiereOrganiqueReportContentProps {
  resultats: Record<string, unknown>;
}

export default function MatiereOrganiqueReportContent({ resultats }: MatiereOrganiqueReportContentProps) {
  const getColorLabel = (color: string) => {
    const colors: Record<string, string> = {
      "incolore": "Incolore - Teneur très faible",
      "jaune-clair": "Jaune clair - Teneur faible",
      "jaune-fonce": "Jaune foncé - Teneur moyenne",
      "brun": "Brun - Teneur élevée",
      "brun-fonce": "Brun foncé - Teneur très élevée",
    };
    return colors[color] || color;
  };

  const couleur = (resultats.couleur_solution as string) || "";

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
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">Temps de repos</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center">{(resultats.temps_repos as number) || "-"} heures</td>
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
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium w-1/2">Couleur de la solution</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center font-bold text-lg text-[#4a90a4]">
                {couleur ? getColorLabel(couleur) : "-"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Interprétation */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
        <p className="font-medium mb-1">Interprétation :</p>
        <p>Si la couleur de la solution est plus foncée que la solution témoin (jaune foncé ou plus), 
        le sable contient une quantité significative de matières organiques qui peuvent affecter 
        la prise et le durcissement du béton.</p>
      </div>
    </div>
  );
}
