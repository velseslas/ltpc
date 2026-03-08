interface EquivalentSableReportContentProps {
  resultats: Record<string, unknown>;
}

export default function EquivalentSableReportContent({ resultats }: EquivalentSableReportContentProps) {
  const display = (key: string) => {
    const v = resultats[key] as number;
    return v != null && v !== 0 ? v : "-";
  };

  const getClassification = (es: number) => {
    if (es >= 80) return "Sable très propre";
    if (es >= 70) return "Sable propre";
    if (es >= 60) return "Sable légèrement argileux";
    return "Sable argileux";
  };

  const esvMoy = (resultats.esv_moyen as number) || (resultats.es_moyen as number) || 0;
  const espMoy = (resultats.esp_moyen as number) || 0;

  const fields: { label: string; unit: string; key1: string; key2: string }[] = [
    { label: "Poids humide de la prise d'essai (mh)", unit: "g", key1: "mh_essai1", key2: "mh_essai2" },
    { label: "Poids sec de la prise d'essai (ms)", unit: "g", key1: "ms_essai1", key2: "ms_essai2" },
    { label: "Teneur en eau", unit: "%", key1: "w_essai1", key2: "w_essai2" },
    { label: "Hauteur du floculat (h1)", unit: "cm", key1: "h1_essai1", key2: "h1_essai2" },
    { label: "Hauteur du sable (visuelle) (h2)", unit: "cm", key1: "h2_essai1", key2: "h2_essai2" },
    { label: "Hauteur du sable (piston) (h'2)", unit: "cm", key1: "h2p_essai1", key2: "h2p_essai2" },
    { label: "Équivalent de sable visuel ESv %", unit: "%", key1: "esv_essai1", key2: "esv_essai2" },
    { label: "Équivalent de sable piston ESp %", unit: "%", key1: "esp_essai1", key2: "esp_essai2" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-sm mb-2 underline">Expression des résultats</h3>
        <table className="w-full border-collapse border border-[#4a90a4] text-sm">
          <thead>
            <tr className="bg-[#e8f4f8]">
              <th className="border border-[#4a90a4] px-3 py-2 text-left font-medium w-1/2">Échantillon N°</th>
              <th className="border border-[#4a90a4] px-3 py-2 text-center font-medium w-16">Unité</th>
              <th className="border border-[#4a90a4] px-3 py-2 text-center font-medium">1</th>
              <th className="border border-[#4a90a4] px-3 py-2 text-center font-medium">2</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f, i) => (
              <tr key={i}>
                <td className="border border-[#4a90a4] px-3 py-1.5">{f.label}</td>
                <td className="border border-[#4a90a4] px-3 py-1.5 text-center">({f.unit})</td>
                <td className="border border-[#4a90a4] px-3 py-1.5 text-center font-medium">{display(f.key1)}</td>
                <td className="border border-[#4a90a4] px-3 py-1.5 text-center font-medium">{display(f.key2)}</td>
              </tr>
            ))}

            <tr className="bg-[#e8f4f8]">
              <td className="border border-[#4a90a4] px-3 py-1.5 font-medium">Moyenne teneur en eau (W moy)</td>
              <td className="border border-[#4a90a4] px-3 py-1.5 text-center">(%)</td>
              <td colSpan={2} className="border border-[#4a90a4] px-3 py-1.5 text-center font-bold text-[#4a90a4]">
                {display("w_moyen")}
              </td>
            </tr>

            <tr className="bg-[#e8f4f8]">
              <td className="border border-[#4a90a4] px-3 py-1.5 font-medium">Moyenne (ESv % moy)</td>
              <td className="border border-[#4a90a4] px-3 py-1.5 text-center">(%)</td>
              <td colSpan={2} className="border border-[#4a90a4] px-3 py-1.5 text-center font-bold text-lg text-[#4a90a4]">
                {esvMoy ? `${esvMoy} %` : "-"}
              </td>
            </tr>

            <tr className="bg-[#e8f4f8]">
              <td className="border border-[#4a90a4] px-3 py-1.5 font-medium">Moyenne (ESp % moy)</td>
              <td className="border border-[#4a90a4] px-3 py-1.5 text-center">(%)</td>
              <td colSpan={2} className="border border-[#4a90a4] px-3 py-1.5 text-center font-bold text-lg text-[#4a90a4]">
                {espMoy ? `${espMoy} %` : "-"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Classification */}
      <div>
        <h3 className="font-bold text-sm mb-2 underline">Classification</h3>
        <table className="w-full border-collapse border border-[#4a90a4]">
          <tbody>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium w-1/2">Classification (ESv)</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center font-medium">
                {esvMoy ? getClassification(esvMoy) : "-"}
              </td>
            </tr>
            {espMoy > 0 && (
              <tr>
                <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">Classification (ESp)</td>
                <td className="border border-[#4a90a4] px-3 py-2 text-center font-medium">
                  {getClassification(espMoy)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="font-bold text-sm mb-2 underline">Spécification</h3>
        <table className="w-full border-collapse border border-[#4a90a4] text-sm">
          <thead>
            <tr className="bg-[#e8f4f8]">
              <th className="border border-[#4a90a4] px-3 py-2 text-left font-medium">Valeur ES</th>
              <th className="border border-[#4a90a4] px-3 py-2 text-left font-medium">Nature du sable</th>
              <th className="border border-[#4a90a4] px-3 py-2 text-left font-medium">Usage recommandé</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-1.5 font-medium">ES ≥ 80</td>
              <td className="border border-[#4a90a4] px-3 py-1.5">Sable très propre</td>
              <td className="border border-[#4a90a4] px-3 py-1.5">Béton de haute qualité</td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-1.5 font-medium">70 ≤ ES &lt; 80</td>
              <td className="border border-[#4a90a4] px-3 py-1.5">Sable propre</td>
              <td className="border border-[#4a90a4] px-3 py-1.5">Béton courant</td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-1.5 font-medium">60 ≤ ES &lt; 70</td>
              <td className="border border-[#4a90a4] px-3 py-1.5">Sable légèrement argileux</td>
              <td className="border border-[#4a90a4] px-3 py-1.5">Tolérable sous conditions</td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-1.5 font-medium">ES &lt; 60</td>
              <td className="border border-[#4a90a4] px-3 py-1.5">Sable argileux</td>
              <td className="border border-[#4a90a4] px-3 py-1.5">Impropre au béton</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
