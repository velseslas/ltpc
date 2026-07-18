import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useMemo } from "react";

interface FractionData {
  granulat: string;
  grille: number;
  masseRi: number;
  passantMi: number;
  ai: number;
}

const FRACTIONS_STANDARD: { granulat: string; grille: number }[] = [
  { granulat: "63/80", grille: 40 },
  { granulat: "50/63", grille: 31.5 },
  { granulat: "40/50", grille: 25 },
  { granulat: "31.5/40", grille: 20 },
  { granulat: "25/31.5", grille: 16 },
  { granulat: "20/25", grille: 12.5 },
  { granulat: "16/20", grille: 10 },
  { granulat: "12.5/16", grille: 8 },
  { granulat: "10/12.5", grille: 6.3 },
  { granulat: "8/10", grille: 5 },
  { granulat: "6.3/8", grille: 4 },
  { granulat: "5/6.3", grille: 3.15 },
  { granulat: "4/5", grille: 2.5 },
];

interface FormeGranulatsFormProps {
  resultats: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export default function FormeGranulatsForm({ resultats, onChange }: FormeGranulatsFormProps) {
  const fractions: FractionData[] = useMemo(() => {
    const saved = (resultats.fractions as FractionData[]) || [];
    return FRACTIONS_STANDARD.map((f) => {
      const existing = saved.find((s) => s.granulat === f.granulat);
      return existing || { granulat: f.granulat, grille: f.grille, masseRi: 0, passantMi: 0, ai: 0 };
    });
  }, [resultats.fractions]);

  const m0 = (resultats.masse_prise_essai as number) || 0;
  const massesEliminees = (resultats.masses_eliminees as number) || 0;
  const refusTamis063 = (resultats.refus_tamis_063 as number) || 0;
  const refusTamis4 = (resultats.refus_tamis_4 as number) || 0;

  const m1 = fractions.reduce((sum, f) => sum + (f.masseRi || 0), 0);
  const m2 = fractions.reduce((sum, f) => sum + (f.passantMi || 0), 0);
  const coeffAplatissement = m1 > 0 ? (m2 / m1) * 100 : 0;
  const perte = m0 > 0 ? ((m0 - (m1 + massesEliminees)) / m0) * 100 : 0;

  const handleHeaderChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    onChange({ ...resultats, [field]: numValue });
  };

  const handleFractionChange = (index: number, field: "masseRi" | "passantMi", value: string) => {
    const numValue = parseFloat(value) || 0;
    const updated = fractions.map((f, i) => {
      if (i !== index) return f;
      const newF = { ...f, [field]: numValue };
      newF.ai = newF.masseRi > 0 ? (newF.passantMi / newF.masseRi) * 100 : 0;
      return newF;
    });

    const newM1 = updated.reduce((sum, f) => sum + (f.masseRi || 0), 0);
    const newM2 = updated.reduce((sum, f) => sum + (f.passantMi || 0), 0);
    const newCoeff = newM1 > 0 ? parseFloat(((newM2 / newM1) * 100).toFixed(1)) : 0;
    const newPerte = m0 > 0 ? parseFloat((((m0 - (newM1 + massesEliminees)) / m0) * 100).toFixed(1)) : 0;

    onChange({
      ...resultats,
      fractions: updated,
      m1_somme_ri: parseFloat(newM1.toFixed(1)),
      m2_somme_mi: parseFloat(newM2.toFixed(1)),
      coeff_aplatissement: newCoeff,
      perte_pourcentage: newPerte,
    });
  };

  // Recalculate when header fields change
  useEffect(() => {
    const newPerte = m0 > 0 ? parseFloat((((m0 - (m1 + massesEliminees)) / m0) * 100).toFixed(1)) : 0;
    if (Math.abs(newPerte - ((resultats.perte_pourcentage as number) || 0)) > 0.01) {
      onChange({
        ...resultats,
        perte_pourcentage: newPerte,
        m1_somme_ri: parseFloat(m1.toFixed(1)),
        m2_somme_mi: parseFloat(m2.toFixed(1)),
        coeff_aplatissement: parseFloat(coeffAplatissement.toFixed(1)),
      });
    }
  }, [m0, massesEliminees]);

  const getClassification = (coeff: number) => {
    if (coeff <= 15) return { label: "FI15", color: "text-green-500" };
    if (coeff <= 20) return { label: "FI20", color: "text-emerald-500" };
    if (coeff <= 35) return { label: "FI35", color: "text-yellow-500" };
    if (coeff <= 50) return { label: "FI50", color: "text-orange-500" };
    return { label: "FI>50", color: "text-destructive" };
  };

  const classification = getClassification(coeffAplatissement);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Coefficient d'Aplatissement — NF EN 933-3</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Header fields */}
        <div data-essai-mobile className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label>Masse prise d'essai M₀ (g)</Label>
            <Input type="number" step="0.1" value={m0 || ""} onChange={(e) => handleHeaderChange("masse_prise_essai", e.target.value)} className="bg-background border-border" placeholder="0.0" />
          </div>
          <div>
            <Label>Somme masses éliminées (g)</Label>
            <Input type="number" step="0.1" value={massesEliminees || ""} onChange={(e) => handleHeaderChange("masses_eliminees", e.target.value)} className="bg-background border-border" placeholder="0.0" />
          </div>
          <div>
            <Label>Refus tamis 0,63 mm (g)</Label>
            <Input type="number" step="0.1" value={refusTamis063 || ""} onChange={(e) => handleHeaderChange("refus_tamis_063", e.target.value)} className="bg-background border-border" placeholder="0.0" />
          </div>
          <div>
            <Label>Refus tamis 4 mm (g)</Label>
            <Input type="number" step="0.1" value={refusTamis4 || ""} onChange={(e) => handleHeaderChange("refus_tamis_4", e.target.value)} className="bg-background border-border" placeholder="0.0" />
          </div>
        </div>

        {/* Main sieve table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th colSpan={2} className="border border-border px-3 py-2 text-center font-medium">Tamisage sur tamis d'essai</th>
                <th colSpan={3} className="border border-border px-3 py-2 text-center font-medium">Tamisage sur grilles à fentes</th>
              </tr>
              <tr className="bg-muted/30">
                <th className="border border-border px-3 py-2 text-center font-medium">Granulat élémentaire d<sub>i</sub>/D<sub>i</sub> (mm)</th>
                <th className="border border-border px-3 py-2 text-center font-medium">Masse Ri (g)</th>
                <th className="border border-border px-3 py-2 text-center font-medium">Écartement grille (mm)</th>
                <th className="border border-border px-3 py-2 text-center font-medium">Passant m<sub>i</sub> (g)</th>
                <th className="border border-border px-3 py-2 text-center font-medium">A<sub>i</sub> = m<sub>i</sub>/R<sub>i</sub> × 100</th>
              </tr>
            </thead>
            <tbody>
              {fractions.map((f, idx) => (
                <tr key={f.granulat} className={idx % 2 === 0 ? "bg-background" : "bg-muted/10"}>
                  <td className="border border-border px-3 py-1 text-center font-medium">{f.granulat}</td>
                  <td className="border border-border px-1 py-1">
                    <Input type="number" step="0.1" className="h-8 text-center bg-background border-border" value={f.masseRi || ""} onChange={(e) => handleFractionChange(idx, "masseRi", e.target.value)} placeholder="0" />
                  </td>
                  <td className="border border-border px-3 py-1 text-center text-muted-foreground">{f.grille}</td>
                  <td className="border border-border px-1 py-1">
                    <Input type="number" step="0.1" className="h-8 text-center bg-background border-border" value={f.passantMi || ""} onChange={(e) => handleFractionChange(idx, "passantMi", e.target.value)} placeholder="0" disabled={!f.masseRi} />
                  </td>
                  <td className="border border-border px-3 py-1 text-center font-medium">
                    {f.masseRi > 0 ? f.ai.toFixed(2) : "—"}
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr className="bg-muted/50 font-bold">
                <td className="border border-border px-3 py-2 text-center">M1 = ΣR<sub>i</sub></td>
                <td className="border border-border px-3 py-2 text-center">{m1.toFixed(1)}</td>
                <td className="border border-border px-3 py-2 text-center">M2 = Σm<sub>i</sub></td>
                <td className="border border-border px-3 py-2 text-center">{m2.toFixed(1)}</td>
                <td className="border border-border px-3 py-2"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Results section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Coefficient d'Aplatissement (A)</p>
            <p className="text-sm text-muted-foreground mb-2">A = M₂/M₁ × 100</p>
            <p className="text-3xl font-bold text-primary">{coeffAplatissement.toFixed(1)} %</p>
            {coeffAplatissement > 0 && (
              <p className={`text-sm font-medium mt-1 ${classification.color}`}>Catégorie : {classification.label}</p>
            )}
          </div>
          <div className={`border rounded-lg p-4 text-center ${Math.abs(perte) <= 1 ? "bg-green-500/10 border-green-500/30" : "bg-destructive/10 border-destructive/30"}`}>
            <p className="text-sm text-muted-foreground mb-1">Vérification de perte</p>
            <p className="text-sm text-muted-foreground mb-2">(M₀ − (ΣRi + ΣÉliminées)) / M₀ × 100</p>
            <p className={`text-3xl font-bold ${Math.abs(perte) <= 1 ? "text-green-500" : "text-destructive"}`}>{perte.toFixed(1)} %</p>
            <p className={`text-sm mt-1 ${Math.abs(perte) <= 1 ? "text-green-500" : "text-destructive"}`}>
              {Math.abs(perte) <= 1 ? "✓ Conforme (< 1%)" : "✗ Non conforme (> 1%)"}
            </p>
          </div>
        </div>

        {/* Classification */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm font-medium text-foreground mb-2">Classification selon NF EN 12620 :</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• FI ≤ 15 : FI15 — Très bonne forme</li>
            <li>• FI ≤ 20 : FI20 — Bonne forme</li>
            <li>• FI ≤ 35 : FI35 — Forme acceptable</li>
            <li>• FI ≤ 50 : FI50 — Forme médiocre</li>
            <li>• FI &gt; 50 : Non conforme</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
