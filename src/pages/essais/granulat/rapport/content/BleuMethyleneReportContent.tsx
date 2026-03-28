interface BleuMethyleneReportContentProps {
  resultats: Record<string, unknown>;
}

const SPECS_BETON = [
  { min: 0, max: 0.5, label: "Sable propre", usage: "Béton de haute qualité", rangeLabel: "MB < 0,5" },
  { min: 0.5, max: 1.5, label: "Sable légèrement argileux", usage: "Béton courant", rangeLabel: "0,5 ≤ MB < 1,5" },
  { min: 1.5, max: 2.5, label: "Sable argileux", usage: "Tolérable sous conditions", rangeLabel: "1,5 ≤ MB < 2,5" },
  { min: 2.5, max: Infinity, label: "Sable très argileux", usage: "Impropre au béton", rangeLabel: "MB ≥ 2,5" },
];

const SPECS_GEO = [
  { min: 0, max: 1.5, label: "Sol peu sensible à l'eau", usage: "Remblai, couche de forme", rangeLabel: "MB < 1,5" },
  { min: 1.5, max: 2.5, label: "Sol sensible à l'eau", usage: "Sous réserve d'étude", rangeLabel: "1,5 ≤ MB < 2,5" },
  { min: 2.5, max: 6, label: "Sol argileux", usage: "Traitement nécessaire", rangeLabel: "2,5 ≤ MB < 6" },
  { min: 6, max: Infinity, label: "Sol très argileux", usage: "Impropre", rangeLabel: "MB ≥ 6" },
];

const SPECS_ROUTE = [
  { min: 0, max: 1, label: "Sable très propre", usage: "Couche de roulement, enrobés", rangeLabel: "MB < 1" },
  { min: 1, max: 1.5, label: "Sable propre", usage: "Couche de base", rangeLabel: "1 ≤ MB < 1,5" },
  { min: 1.5, max: 2, label: "Sable légèrement argileux", usage: "Couche de fondation", rangeLabel: "1,5 ≤ MB < 2" },
  { min: 2, max: Infinity, label: "Sable argileux", usage: "Impropre pour corps de chaussée", rangeLabel: "MB ≥ 2" },
];

function getSpecs(type: string) {
  if (type === "geotechnique") return SPECS_GEO;
  if (type === "route") return SPECS_ROUTE;
  return SPECS_BETON;
}

function getConformity(mb: number, type: string) {
  const specs = getSpecs(type);
  const spec = specs.find(s => mb >= s.min && mb < s.max);
  if (!spec) return null;
  const conforme = type === "geotechnique" ? mb <= 2.5 : type === "route" ? mb <= 2 : mb <= 1.5;
  return { ...spec, conforme };
}

const typeLabel = (t: string) => t === "geotechnique" ? "Géotechnique" : t === "route" ? "Route" : "Béton";

export default function BleuMethyleneReportContent({ resultats }: BleuMethyleneReportContentProps) {
  const typeEssai = (resultats.type_essai as string) || "beton";
  const mb = (resultats.valeur_mb as number) || 0;
  const conformity = mb > 0 ? getConformity(mb, typeEssai) : null;
  const specs = getSpecs(typeEssai);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-sm mb-2 underline">Résultats des essais</h3>
        <table className="w-full border-collapse border border-[#4a90a4]">
          <tbody>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium w-1/2">Masse de l'échantillon</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center">{(resultats.masse_echantillon as number) || "-"} g</td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">Volume de bleu injecté</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center">{(resultats.volume_bleu as number) || "-"} ml</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="font-bold text-sm mb-2 underline">Synthèse des résultats</h3>
        <table className="w-full border-collapse border border-[#4a90a4]">
          <tbody>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium w-1/2">Valeur au Bleu de Méthylène (MB)</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center font-bold text-lg text-[#4a90a4]">
                {mb ? `${mb} g/kg` : "-"}
              </td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">Classification</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center font-medium">
                {conformity ? conformity.label : "-"}
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
                <td className="border border-[#4a90a4] px-3 py-1.5 font-medium">MB</td>
                <td className="border border-[#4a90a4] px-3 py-1.5 text-center font-bold">{mb} g/kg</td>
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
              <th className="border border-[#4a90a4] px-3 py-2 text-left font-medium">Valeur MB</th>
              <th className="border border-[#4a90a4] px-3 py-2 text-left font-medium">Nature</th>
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
