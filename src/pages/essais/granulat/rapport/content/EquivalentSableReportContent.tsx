import { CheckCircle, XCircle } from "lucide-react";

interface EquivalentSableReportContentProps {
  resultats: Record<string, unknown>;
}

const SPECS_BETON = [
  { min: 80, max: Infinity, label: "Sable très propre", usage: "Béton de haute qualité", rangeLabel: "ES ≥ 80" },
  { min: 70, max: 80, label: "Sable propre", usage: "Béton courant", rangeLabel: "70 ≤ ES < 80" },
  { min: 60, max: 70, label: "Sable légèrement argileux", usage: "Tolérable sous conditions", rangeLabel: "60 ≤ ES < 70" },
  { min: 0, max: 60, label: "Sable argileux", usage: "Impropre au béton", rangeLabel: "ES < 60" },
];

const SPECS_GEO = [
  { min: 40, max: Infinity, label: "Sol sableux propre", usage: "Remblai, couche de forme", rangeLabel: "ES ≥ 40" },
  { min: 20, max: 40, label: "Sol légèrement argileux", usage: "Sous réserve d'étude", rangeLabel: "20 ≤ ES < 40" },
  { min: 10, max: 20, label: "Sol argileux", usage: "Déconseillé pour remblai", rangeLabel: "10 ≤ ES < 20" },
  { min: 0, max: 10, label: "Sol très argileux", usage: "Impropre", rangeLabel: "ES < 10" },
];

const SPECS_ROUTE = [
  { min: 50, max: Infinity, label: "Sable très propre", usage: "Couche de roulement, enrobés", rangeLabel: "ES ≥ 50" },
  { min: 40, max: 50, label: "Sable propre", usage: "Couche de base", rangeLabel: "40 ≤ ES < 50" },
  { min: 30, max: 40, label: "Sable légèrement argileux", usage: "Couche de fondation", rangeLabel: "30 ≤ ES < 40" },
  { min: 20, max: 30, label: "Sable argileux", usage: "Sous couche, remblai technique", rangeLabel: "20 ≤ ES < 30" },
  { min: 0, max: 20, label: "Sable très argileux", usage: "Impropre pour corps de chaussée", rangeLabel: "ES < 20" },
];

function getSpecs(type: string) {
  if (type === "geotechnique") return SPECS_GEO;
  if (type === "route") return SPECS_ROUTE;
  return SPECS_BETON;
}

function getConformity(es: number, type: string) {
  const specs = getSpecs(type);
  const spec = specs.find(s => es >= s.min && es < s.max);
  if (!spec) return null;
  const conforme = type === "geotechnique" ? es >= 20 : type === "route" ? es >= 40 : es >= 60;
  return { ...spec, conforme };
}

export default function EquivalentSableReportContent({ resultats }: EquivalentSableReportContentProps) {
  const typeEssai = (resultats.type_essai as string) || "beton";
  const specs = getSpecs(typeEssai);

  const display = (key: string) => {
    const v = resultats[key] as number;
    return v != null && v !== 0 ? v : "-";
  };

  const esvMoy = (resultats.esv_moyen as number) || (resultats.es_moyen as number) || 0;
  const espMoy = (resultats.esp_moyen as number) || 0;
  const conformityEsv = esvMoy > 0 ? getConformity(esvMoy, typeEssai) : null;
  const conformityEsp = espMoy > 0 ? getConformity(espMoy, typeEssai) : null;

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
    <div className="space-y-3 print:space-y-2">
      <div>
        <h3 className="font-bold text-sm mb-1 underline">Expression des résultats</h3>
        <table className="w-full border-collapse border border-[#4a90a4] text-sm">
          <thead>
            <tr className="bg-[#e8f4f8]">
              <th className="border border-[#4a90a4] px-3 py-1.5 text-left font-medium w-1/2">Échantillon N°</th>
              <th className="border border-[#4a90a4] px-3 py-1.5 text-center font-medium w-16">Unité</th>
              <th className="border border-[#4a90a4] px-3 py-1.5 text-center font-medium">1</th>
              <th className="border border-[#4a90a4] px-3 py-1.5 text-center font-medium">2</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f, i) => (
              <tr key={i}>
                <td className="border border-[#4a90a4] px-3 py-1">{f.label}</td>
                <td className="border border-[#4a90a4] px-3 py-1 text-center">({f.unit})</td>
                <td className="border border-[#4a90a4] px-3 py-1 text-center font-medium">{display(f.key1)}</td>
                <td className="border border-[#4a90a4] px-3 py-1 text-center font-medium">{display(f.key2)}</td>
              </tr>
            ))}

            <tr className="bg-[#e8f4f8]">
              <td className="border border-[#4a90a4] px-3 py-1 font-medium">Moyenne teneur en eau (W moy)</td>
              <td className="border border-[#4a90a4] px-3 py-1 text-center">(%)</td>
              <td colSpan={2} className="border border-[#4a90a4] px-3 py-1 text-center font-bold text-[#4a90a4]">
                {display("w_moyen")}
              </td>
            </tr>

            <tr className="bg-[#e8f4f8]">
              <td className="border border-[#4a90a4] px-3 py-1 font-medium">Moyenne (ESv % moy)</td>
              <td className="border border-[#4a90a4] px-3 py-1 text-center">(%)</td>
              <td colSpan={2} className="border border-[#4a90a4] px-3 py-1 text-center font-bold text-[#4a90a4]">
                {esvMoy ? `${esvMoy} %` : "-"}
              </td>
            </tr>

            <tr className="bg-[#e8f4f8]">
              <td className="border border-[#4a90a4] px-3 py-1 font-medium">Moyenne (ESp % moy)</td>
              <td className="border border-[#4a90a4] px-3 py-1 text-center">(%)</td>
              <td colSpan={2} className="border border-[#4a90a4] px-3 py-1 text-center font-bold text-[#4a90a4]">
                {espMoy ? `${espMoy} %` : "-"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Conformité */}
      {(conformityEsv || conformityEsp) && (
        <div>
          <h3 className="font-bold text-sm mb-1 underline">Conformité</h3>
          <table className="w-full border-collapse border border-[#4a90a4] text-sm" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "15%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "58%" }} />
              <col style={{ width: "15%" }} />
            </colgroup>
            <thead>
              <tr className="bg-[#e8f4f8]">
                <th className="border border-[#4a90a4] px-3 py-1.5 text-left font-medium">Paramètre</th>
                <th className="border border-[#4a90a4] px-3 py-1.5 text-center font-medium">Valeur</th>
                <th className="border border-[#4a90a4] px-3 py-1.5 text-left font-medium">Classification</th>
                <th className="border border-[#4a90a4] px-3 py-1.5 text-center font-medium">Conformité</th>
              </tr>
            </thead>
            <tbody>
              {conformityEsv && (
                <tr>
                  <td className="border border-[#4a90a4] px-3 py-1 font-medium">ESv moyen</td>
                  <td className="border border-[#4a90a4] px-3 py-1 text-center font-bold">{esvMoy} %</td>
                  <td className="border border-[#4a90a4] px-3 py-1 whitespace-nowrap overflow-hidden text-ellipsis">{conformityEsv.label} — {conformityEsv.usage}</td>
                  <td className="border border-[#4a90a4] px-3 py-1 text-center font-bold whitespace-nowrap" style={{ color: conformityEsv.conforme ? "#16a34a" : "#dc2626" }}>
                    {conformityEsv.conforme ? "✓ Conforme" : "✗ Non conforme"}
                  </td>
                </tr>
              )}
              {conformityEsp && (
                <tr>
                  <td className="border border-[#4a90a4] px-3 py-1 font-medium">ESp moyen</td>
                  <td className="border border-[#4a90a4] px-3 py-1 text-center font-bold">{espMoy} %</td>
                  <td className="border border-[#4a90a4] px-3 py-1 whitespace-nowrap overflow-hidden text-ellipsis">{conformityEsp.label} — {conformityEsp.usage}</td>
                  <td className="border border-[#4a90a4] px-3 py-1 text-center font-bold whitespace-nowrap" style={{ color: conformityEsp.conforme ? "#16a34a" : "#dc2626" }}>
                    {conformityEsp.conforme ? "✓ Conforme" : "✗ Non conforme"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Spécifications */}
      <div>
        <h3 className="font-bold text-sm mb-1 underline">
          Spécification ({typeEssai === "geotechnique" ? "Géotechnique" : typeEssai === "route" ? "Route" : "Béton"})
        </h3>
        <table className="w-full border-collapse border border-[#4a90a4] text-sm">
          <thead>
            <tr className="bg-[#e8f4f8]">
              <th className="border border-[#4a90a4] px-3 py-1.5 text-left font-medium">Valeur ES</th>
              <th className="border border-[#4a90a4] px-3 py-1.5 text-left font-medium">Nature</th>
              <th className="border border-[#4a90a4] px-3 py-1.5 text-left font-medium">Usage recommandé</th>
            </tr>
          </thead>
          <tbody>
            {specs.map((s, i) => (
              <tr key={i}>
                <td className="border border-[#4a90a4] px-3 py-1 font-medium">{s.rangeLabel}</td>
                <td className="border border-[#4a90a4] px-3 py-1">{s.label}</td>
                <td className="border border-[#4a90a4] px-3 py-1">{s.usage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
