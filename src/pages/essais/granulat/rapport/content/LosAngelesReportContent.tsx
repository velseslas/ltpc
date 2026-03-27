interface LosAngelesReportContentProps {
  resultats: Record<string, unknown>;
}

const SPECS_BETON = [
  { min: 0, max: 20, label: "LA20 - Excellente résistance", usage: "Béton de haute qualité", rangeLabel: "LA < 20" },
  { min: 20, max: 25, label: "LA25 - Bonne résistance", usage: "Béton hydraulique", rangeLabel: "20 ≤ LA < 25" },
  { min: 25, max: 30, label: "LA30 - Résistance moyenne", usage: "Béton courant", rangeLabel: "25 ≤ LA < 30" },
  { min: 30, max: 40, label: "LA40 - Résistance faible", usage: "Tolérable sous conditions", rangeLabel: "30 ≤ LA < 40" },
  { min: 40, max: Infinity, label: "Non conforme", usage: "Impropre au béton", rangeLabel: "LA ≥ 40" },
];

const SPECS_GEO = [
  { min: 0, max: 25, label: "Bonne résistance", usage: "Couche de forme, remblai technique", rangeLabel: "LA < 25" },
  { min: 25, max: 35, label: "Résistance acceptable", usage: "Remblai courant", rangeLabel: "25 ≤ LA < 35" },
  { min: 35, max: 45, label: "Résistance faible", usage: "Sous réserve d'étude", rangeLabel: "35 ≤ LA < 45" },
  { min: 45, max: Infinity, label: "Résistance insuffisante", usage: "Impropre", rangeLabel: "LA ≥ 45" },
];

const SPECS_ROUTE = [
  { min: 0, max: 20, label: "LA20 - Excellente résistance", usage: "Couche de roulement, enrobés", rangeLabel: "LA < 20" },
  { min: 20, max: 25, label: "LA25 - Bonne résistance", usage: "Couche de base", rangeLabel: "20 ≤ LA < 25" },
  { min: 25, max: 30, label: "LA30 - Résistance moyenne", usage: "Couche de fondation", rangeLabel: "25 ≤ LA < 30" },
  { min: 30, max: 40, label: "LA40 - Résistance acceptable", usage: "Sous couche", rangeLabel: "30 ≤ LA < 40" },
  { min: 40, max: Infinity, label: "Non conforme", usage: "Impropre pour corps de chaussée", rangeLabel: "LA ≥ 40" },
];

function getSpecs(type: string) {
  if (type === "geotechnique") return SPECS_GEO;
  if (type === "route") return SPECS_ROUTE;
  return SPECS_BETON;
}

function getConformity(la: number, type: string) {
  const specs = getSpecs(type);
  const spec = specs.find(s => la >= s.min && la < s.max);
  if (!spec) return null;
  const conforme = type === "geotechnique" ? la <= 35 : type === "route" ? la <= 30 : la <= 40;
  return { ...spec, conforme };
}

const typeLabel = (t: string) => t === "geotechnique" ? "Géotechnique" : t === "route" ? "Route" : "Béton";

export default function LosAngelesReportContent({ resultats }: LosAngelesReportContentProps) {
  const typeEssai = (resultats.type_essai as string) || "beton";
  const coeff = (resultats.coefficient_la as number) || 0;
  const conformity = coeff > 0 ? getConformity(coeff, typeEssai) : null;
  const specs = getSpecs(typeEssai);

  return (
    <div className="space-y-6">
      <div className="text-sm">
        <strong>Type d'essai :</strong> {typeLabel(typeEssai)}
      </div>

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
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium w-1/2">Coefficient Los Angeles (LA)</td>
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
                <td className="border border-[#4a90a4] px-3 py-1.5 font-medium">LA</td>
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
              <th className="border border-[#4a90a4] px-3 py-2 text-left font-medium">Valeur LA</th>
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
