interface MicroDevalReportContentProps {
  resultats: Record<string, unknown>;
}

const SPECS_BETON = [
  { min: 0, max: 10, label: "MDE10 - Excellente résistance", usage: "Béton de haute qualité", rangeLabel: "MDE < 10" },
  { min: 10, max: 15, label: "MDE15 - Très bonne résistance", usage: "Béton hydraulique", rangeLabel: "10 ≤ MDE < 15" },
  { min: 15, max: 20, label: "MDE20 - Bonne résistance", usage: "Béton courant", rangeLabel: "15 ≤ MDE < 20" },
  { min: 20, max: 25, label: "MDE25 - Résistance moyenne", usage: "Tolérable sous conditions", rangeLabel: "20 ≤ MDE < 25" },
  { min: 25, max: Infinity, label: "Non conforme", usage: "Impropre au béton", rangeLabel: "MDE ≥ 25" },
];

const SPECS_GEO = [
  { min: 0, max: 20, label: "Bonne résistance à l'usure", usage: "Couche de forme, remblai technique", rangeLabel: "MDE < 20" },
  { min: 20, max: 35, label: "Résistance acceptable", usage: "Remblai courant", rangeLabel: "20 ≤ MDE < 35" },
  { min: 35, max: 45, label: "Résistance faible", usage: "Sous réserve d'étude", rangeLabel: "35 ≤ MDE < 45" },
  { min: 45, max: Infinity, label: "Résistance insuffisante", usage: "Impropre", rangeLabel: "MDE ≥ 45" },
];

const SPECS_ROUTE = [
  { min: 0, max: 15, label: "MDE15 - Excellente résistance", usage: "Couche de roulement, enrobés", rangeLabel: "MDE < 15" },
  { min: 15, max: 20, label: "MDE20 - Bonne résistance", usage: "Couche de base", rangeLabel: "15 ≤ MDE < 20" },
  { min: 20, max: 25, label: "MDE25 - Résistance moyenne", usage: "Couche de fondation", rangeLabel: "20 ≤ MDE < 25" },
  { min: 25, max: 35, label: "MDE35 - Résistance acceptable", usage: "Sous couche", rangeLabel: "25 ≤ MDE < 35" },
  { min: 35, max: Infinity, label: "Non conforme", usage: "Impropre pour corps de chaussée", rangeLabel: "MDE ≥ 35" },
];

function getSpecs(type: string) {
  if (type === "geotechnique") return SPECS_GEO;
  if (type === "route") return SPECS_ROUTE;
  return SPECS_BETON;
}

function getConformity(mde: number, type: string) {
  const specs = getSpecs(type);
  const spec = specs.find(s => mde >= s.min && mde < s.max);
  if (!spec) return null;
  const conforme = type === "geotechnique" ? mde <= 35 : type === "route" ? mde <= 25 : mde <= 25;
  return { ...spec, conforme };
}

const typeLabel = (t: string) => t === "geotechnique" ? "Géotechnique" : t === "route" ? "Route" : "Béton";

export default function MicroDevalReportContent({ resultats }: MicroDevalReportContentProps) {
  const typeEssai = (resultats.type_essai as string) || "beton";
  const coeff = (resultats.coefficient_mde as number) || 0;
  const conformity = coeff > 0 ? getConformity(coeff, typeEssai) : null;
  const specs = getSpecs(typeEssai);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-sm mb-2 underline">Résultats des essais</h3>
        <table className="w-full border-collapse border border-[#4a90a4]">
          <tbody>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium w-1/2">Classe granulaire</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center">{(resultats.classe_granulaire as string) || (resultats.granularite as string) || "-"}</td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">Masse initiale (M)</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center">{(resultats.masse_initiale as number) || "-"} g</td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">Masse finale (m)</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center">{(resultats.masse_finale as number) || "-"} g</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="font-bold text-sm mb-2 underline">Synthèse des résultats</h3>
        <table className="w-full border-collapse border border-[#4a90a4]">
          <tbody>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium w-1/2">Coefficient Micro-Deval (MDE)</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center font-bold text-lg text-[#4a90a4]">
                {coeff ? `${coeff} %` : "-"}
              </td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">Catégorie</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center font-medium">
                {conformity ? `${conformity.label}` : "-"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Conformité */}
      {conformity && (
        <div>
          <h3 className="font-bold text-sm mb-2 underline">Conformité</h3>
          <table className="w-full border-collapse border border-[#4a90a4] text-sm">
            <thead>
              <tr className="bg-[#e8f4f8]">
                <th className="border border-[#4a90a4] px-3 py-2 text-left font-medium">Paramètre</th>
                <th className="border border-[#4a90a4] px-3 py-2 text-center font-medium">Valeur</th>
                <th className="border border-[#4a90a4] px-3 py-2 text-left font-medium">Classification</th>
                <th className="border border-[#4a90a4] px-3 py-2 text-center font-medium">Conformité</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-[#4a90a4] px-3 py-1.5 font-medium">MDE</td>
                <td className="border border-[#4a90a4] px-3 py-1.5 text-center font-bold">{coeff} %</td>
                <td className="border border-[#4a90a4] px-3 py-1.5">{conformity.label} — {conformity.usage}</td>
                <td className="border border-[#4a90a4] px-3 py-1.5 text-center font-bold" style={{ color: conformity.conforme ? "#16a34a" : "#dc2626" }}>
                  {conformity.conforme ? "✓ Conforme" : "✗ Non conforme"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Spécifications */}
      <div>
        <h3 className="font-bold text-sm mb-2 underline">Spécification ({typeLabel(typeEssai)})</h3>
        <table className="w-full border-collapse border border-[#4a90a4] text-sm">
          <thead>
            <tr className="bg-[#e8f4f8]">
              <th className="border border-[#4a90a4] px-3 py-2 text-left font-medium">Valeur MDE</th>
              <th className="border border-[#4a90a4] px-3 py-2 text-left font-medium">Classification</th>
              <th className="border border-[#4a90a4] px-3 py-2 text-left font-medium">Usage recommandé</th>
            </tr>
          </thead>
          <tbody>
            {specs.map((s, i) => (
              <tr key={i}>
                <td className="border border-[#4a90a4] px-3 py-1.5 font-medium">{s.rangeLabel}</td>
                <td className="border border-[#4a90a4] px-3 py-1.5">{s.label}</td>
                <td className="border border-[#4a90a4] px-3 py-1.5">{s.usage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
