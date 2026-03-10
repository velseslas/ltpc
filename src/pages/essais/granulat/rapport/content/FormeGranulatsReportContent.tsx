interface FractionData {
  granulat: string;
  grille: number;
  masseRi: number;
  passantMi: number;
  ai: number;
}

interface FormeGranulatsReportContentProps {
  resultats: Record<string, unknown>;
}

export default function FormeGranulatsReportContent({ resultats }: FormeGranulatsReportContentProps) {
  const fractions = (resultats.fractions as FractionData[]) || [];
  const m0 = (resultats.masse_prise_essai as number) || 0;
  const m1 = (resultats.m1_somme_ri as number) || 0;
  const m2 = (resultats.m2_somme_mi as number) || 0;
  const coeff = (resultats.coeff_aplatissement as number) || 0;
  const perte = (resultats.perte_pourcentage as number) || 0;
  const massesEliminees = (resultats.masses_eliminees as number) || 0;
  const refusTamis063 = (resultats.refus_tamis_063 as number) || 0;
  const refusTamis4 = (resultats.refus_tamis_4 as number) || 0;

  const getClassification = (c: number) => {
    if (c <= 15) return "FI15 — Très bonne forme";
    if (c <= 20) return "FI20 — Bonne forme";
    if (c <= 35) return "FI35 — Forme acceptable";
    if (c <= 50) return "FI50 — Forme médiocre";
    return "FI>50 — Non conforme";
  };

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div>
        <h3 className="font-bold text-sm mb-2 underline">Informations de l'essai</h3>
        <table className="w-full border-collapse border border-[#4a90a4]">
          <tbody>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-1.5 bg-[#e8f4f8] font-medium w-1/4">Masse prise d'essai M₀</td>
              <td className="border border-[#4a90a4] px-3 py-1.5 text-center w-1/4">{m0 || "—"} g</td>
              <td className="border border-[#4a90a4] px-3 py-1.5 bg-[#e8f4f8] font-medium w-1/4">Somme masses éliminées</td>
              <td className="border border-[#4a90a4] px-3 py-1.5 text-center w-1/4">{massesEliminees || "—"} g</td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-1.5 bg-[#e8f4f8] font-medium">Refus tamis 0,63 mm</td>
              <td className="border border-[#4a90a4] px-3 py-1.5 text-center">{refusTamis063 || "—"} g</td>
              <td className="border border-[#4a90a4] px-3 py-1.5 bg-[#e8f4f8] font-medium">Refus tamis 4 mm</td>
              <td className="border border-[#4a90a4] px-3 py-1.5 text-center">{refusTamis4 || "—"} g</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Main data table */}
      <div>
        <h3 className="font-bold text-sm mb-2 underline">Résultats du tamisage</h3>
        <table className="w-full border-collapse border border-[#4a90a4] text-sm">
          <thead>
            <tr>
              <th colSpan={2} className="border border-[#4a90a4] px-2 py-1.5 bg-[#e8f4f8] text-center font-medium">Tamisage sur tamis d'essai</th>
              <th colSpan={3} className="border border-[#4a90a4] px-2 py-1.5 bg-[#e8f4f8] text-center font-medium">Tamisage sur grilles à fentes</th>
            </tr>
            <tr>
              <th className="border border-[#4a90a4] px-2 py-1 bg-[#e8f4f8] text-center text-xs">Granulat d<sub>i</sub>/D<sub>i</sub> (mm)</th>
              <th className="border border-[#4a90a4] px-2 py-1 bg-[#e8f4f8] text-center text-xs">Masse Ri (g)</th>
              <th className="border border-[#4a90a4] px-2 py-1 bg-[#e8f4f8] text-center text-xs">Écartement grille (mm)</th>
              <th className="border border-[#4a90a4] px-2 py-1 bg-[#e8f4f8] text-center text-xs">Passant m<sub>i</sub> (g)</th>
              <th className="border border-[#4a90a4] px-2 py-1 bg-[#e8f4f8] text-center text-xs">A<sub>i</sub> = m<sub>i</sub>/R<sub>i</sub> × 100</th>
            </tr>
          </thead>
          <tbody>
            {fractions.map((f) => (
              <tr key={f.granulat}>
                <td className="border border-[#4a90a4] px-2 py-1 text-center font-medium">{f.granulat}</td>
                <td className="border border-[#4a90a4] px-2 py-1 text-center">{f.masseRi || 0}</td>
                <td className="border border-[#4a90a4] px-2 py-1 text-center">{f.grille}</td>
                <td className="border border-[#4a90a4] px-2 py-1 text-center">{f.masseRi > 0 ? (f.passantMi || 0) : ""}</td>
                <td className="border border-[#4a90a4] px-2 py-1 text-center">{f.masseRi > 0 ? (f.ai || 0).toFixed(2) : ""}</td>
              </tr>
            ))}
            <tr className="font-bold">
              <td className="border border-[#4a90a4] px-2 py-1.5 text-center">M1 = ΣRi</td>
              <td className="border border-[#4a90a4] px-2 py-1.5 text-center">{m1}</td>
              <td className="border border-[#4a90a4] px-2 py-1.5 text-center">M2 = Σmi</td>
              <td className="border border-[#4a90a4] px-2 py-1.5 text-center">{m2}</td>
              <td className="border border-[#4a90a4] px-2 py-1.5"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Synthesis */}
      <div>
        <h3 className="font-bold text-sm mb-2 underline">Synthèse des résultats</h3>
        <table className="w-full border-collapse border border-[#4a90a4]">
          <tbody>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium w-1/2">Coefficient d'Aplatissement (A = M₂/M₁ × 100)</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center font-bold text-lg text-[#4a90a4]">
                {coeff ? `${coeff} %` : "—"}
              </td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">Catégorie</td>
              <td className="border border-[#4a90a4] px-3 py-2 text-center font-medium">
                {coeff ? getClassification(coeff) : "—"}
              </td>
            </tr>
            <tr>
              <td className="border border-[#4a90a4] px-3 py-2 bg-[#e8f4f8] font-medium">Vérification de perte (%)</td>
              <td className={`border border-[#4a90a4] px-3 py-2 text-center font-medium ${Math.abs(perte) <= 1 ? "text-green-600" : "text-red-600"}`}>
                {perte} % {Math.abs(perte) <= 1 ? "(< 1% ✓)" : "(> 1% ✗)"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
        <p className="font-medium mb-1">Classification selon NF EN 12620 :</p>
        <ul className="space-y-0.5">
          <li>• FI ≤ 15 : Très bonne forme</li>
          <li>• 15 &lt; FI ≤ 20 : Bonne forme</li>
          <li>• 20 &lt; FI ≤ 35 : Forme acceptable</li>
          <li>• 35 &lt; FI ≤ 50 : Forme médiocre</li>
          <li>• FI &gt; 50 : Non conforme</li>
        </ul>
      </div>
    </div>
  );
}
