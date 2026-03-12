interface MasseVolumiqueReportContentProps {
  resultats: Record<string, unknown>;
}

function getModule(resultats: Record<string, unknown>, key: string): Record<string, unknown> {
  const v = resultats[key];
  return (v && typeof v === "object" && !Array.isArray(v)) ? v as Record<string, unknown> : {};
}

function getNum(obj: Record<string, unknown>, field: string): number | undefined {
  const v = obj[field];
  return typeof v === "number" ? v : undefined;
}

function fmt3(v: number | undefined): string { return v !== undefined ? v.toFixed(3) : "-"; }
function fmt2(v: number | undefined): string { return v !== undefined ? v.toFixed(2) : "-"; }

function ModuleTable({ data, label, method, fields }: {
  data: Record<string, unknown>;
  label: string;
  method: string;
  fields: { label: string; key: string }[];
}) {
  const ds = getNum(data, "densite_seche");
  const dh = getNum(data, "densite_humide");
  const de = getNum(data, "densite_effective");
  const ab = getNum(data, "absorption");

  return (
    <div className="space-y-3 mb-6">
      <h3 className="font-bold text-sm underline">{label} – Méthode {method}</h3>

      {/* Mesures */}
      <table className="w-full border-collapse border border-[#4a90a4] text-sm">
        <thead>
          <tr className="bg-[#e8f4f8]">
            <th className="border border-[#4a90a4] px-2 py-1 text-left">Paramètre</th>
            <th className="border border-[#4a90a4] px-2 py-1 text-center">Valeur</th>
          </tr>
        </thead>
        <tbody>
          {fields.map(f => (
            <tr key={f.key}>
              <td className="border border-[#4a90a4] px-2 py-1">{f.label}</td>
              <td className="border border-[#4a90a4] px-2 py-1 text-center">{getNum(data, f.key) !== undefined ? getNum(data, f.key)!.toFixed(3) : "-"} g</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Résultats */}
      <table className="w-full border-collapse border border-[#4a90a4] text-sm">
        <thead>
          <tr className="bg-[#e8f4f8]">
            <th className="border border-[#4a90a4] px-2 py-1 text-left">Résultat</th>
            <th className="border border-[#4a90a4] px-2 py-1 text-center">Valeur</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-[#4a90a4] px-2 py-1">Densité sèche</td>
            <td className="border border-[#4a90a4] px-2 py-1 text-center font-bold text-[#4a90a4]">{fmt3(ds)}</td>
          </tr>
          <tr>
            <td className="border border-[#4a90a4] px-2 py-1">Densité humide (SSD)</td>
            <td className="border border-[#4a90a4] px-2 py-1 text-center font-bold text-[#4a90a4]">{fmt3(dh)}</td>
          </tr>
          <tr>
            <td className="border border-[#4a90a4] px-2 py-1">Densité effective</td>
            <td className="border border-[#4a90a4] px-2 py-1 text-center font-bold text-[#4a90a4]">{fmt3(de)}</td>
          </tr>
          <tr>
            <td className="border border-[#4a90a4] px-2 py-1">Absorption</td>
            <td className="border border-[#4a90a4] px-2 py-1 text-center font-bold text-[#4a90a4]">{fmt2(ab)} %</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const SAND_FIELDS = [
  { label: "W1 (poids sec)", key: "W1" },
  { label: "W2 (poids humide SSD)", key: "W2" },
  { label: "W3 (pycno + sable + eau)", key: "W3" },
  { label: "W4 (pycno + eau)", key: "W4" },
  { label: "V1 (volume humide)", key: "V1" },
  { label: "V2 (volume sec)", key: "V2" },
];

const GRAVEL_FIELDS = [
  { label: "W1 (poids sec)", key: "W1" },
  { label: "W2 (poids humide SSD)", key: "W2" },
  { label: "W5 (poids immergé)", key: "W5" },
  { label: "V1 (volume humide)", key: "V1" },
  { label: "V2 (volume sec)", key: "V2" },
];

export default function MasseVolumiqueReportContent({ resultats }: MasseVolumiqueReportContentProps) {
  const sandData = getModule(resultats, "sable");
  const gravelFractions = [
    { key: "gravier_4_8", label: "Graviers 4–8 mm" },
    { key: "gravier_8_16", label: "Graviers 8–16 mm" },
    { key: "gravier_16_25", label: "Graviers 16–25 mm" },
  ];
  // Also check the generic "gravier" key used by the form
  const genericGravelData = getModule(resultats, "gravier");

  const hasSand = Object.keys(sandData).length > 0;
  const hasGenericGravel = Object.keys(genericGravelData).length > 0;

  return (
    <div className="space-y-6">
      {hasSand && (
        <ModuleTable data={sandData} label="Sable 0–4 mm" method="Pycnomètre" fields={SAND_FIELDS} />
      )}

      {hasGenericGravel && (
        <ModuleTable data={genericGravelData} label="Graviers" method="Panier immersion" fields={GRAVEL_FIELDS} />
      )}

      {gravelFractions.map(f => {
        const data = getModule(resultats, f.key);
        if (Object.keys(data).length === 0) return null;
        return <ModuleTable key={f.key} data={data} label={f.label} method="Panier immersion" fields={GRAVEL_FIELDS} />;
      })}

      {/* Formules */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
        <p className="font-medium mb-1">Formules NF EN 1097-6 :</p>
        <p className="font-medium mt-2">Pycnomètre (sable) :</p>
        <p>V1 = W2 + W4 − W3 &nbsp;|&nbsp; V2 = W1 + W4 − W3</p>
        <p className="font-medium mt-2">Panier immersion (graviers) :</p>
        <p>W5 = E − F &nbsp;|&nbsp; V1 = W2 − W5 &nbsp;|&nbsp; V2 = W1 − W5</p>
        <p className="font-medium mt-2">Commun :</p>
        <p>Densité sèche = W1/V1 &nbsp;|&nbsp; Densité humide = W2/V1 &nbsp;|&nbsp; Densité effective = W1/V2</p>
        <p>Absorption = (W2 − W1)/W1 × 100</p>
      </div>
    </div>
  );
}
