import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FractionData {
  granulat: string;
  grille: number;
  masseRi: number;
  passantMi: number;
  ai: number;
}

interface FormeGranulatsResultsProps {
  resultats: Record<string, unknown>;
}

export default function FormeGranulatsResults({ resultats }: FormeGranulatsResultsProps) {
  const fractions = (resultats.fractions as FractionData[]) || [];
  const m0 = (resultats.masse_prise_essai as number) || 0;
  const m1 = (resultats.m1_somme_ri as number) || 0;
  const m2 = (resultats.m2_somme_mi as number) || 0;
  const coeff = (resultats.coeff_aplatissement as number) || 0;
  const perte = (resultats.perte_pourcentage as number) || 0;
  const massesEliminees = (resultats.masses_eliminees as number) || 0;

  const getClassification = (c: number) => {
    if (c <= 15) return { label: "FI15", desc: "Très bonne forme", color: "text-green-500" };
    if (c <= 20) return { label: "FI20", desc: "Bonne forme", color: "text-emerald-500" };
    if (c <= 35) return { label: "FI35", desc: "Forme acceptable", color: "text-yellow-500" };
    if (c <= 50) return { label: "FI50", desc: "Forme médiocre", color: "text-orange-500" };
    return { label: "FI>50", desc: "Non conforme", color: "text-destructive" };
  };

  const classification = getClassification(coeff);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Résultats — Coefficient d'Aplatissement (NF EN 933-3)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Header info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Masse prise d'essai M₀</p>
            <p className="font-medium text-foreground">{m0 || "—"} g</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Masses éliminées</p>
            <p className="font-medium text-foreground">{massesEliminees || "—"} g</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">M1 = ΣRi</p>
            <p className="font-medium text-foreground">{m1 || "—"} g</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">M2 = Σmi</p>
            <p className="font-medium text-foreground">{m2 || "—"} g</p>
          </div>
        </div>

        {/* Sieve table */}
        {fractions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-border px-3 py-2 text-center">Granulat d<sub>i</sub>/D<sub>i</sub> (mm)</th>
                  <th className="border border-border px-3 py-2 text-center">Masse Ri (g)</th>
                  <th className="border border-border px-3 py-2 text-center">Grille (mm)</th>
                  <th className="border border-border px-3 py-2 text-center">Passant m<sub>i</sub> (g)</th>
                  <th className="border border-border px-3 py-2 text-center">A<sub>i</sub> (%)</th>
                </tr>
              </thead>
              <tbody>
                {fractions.map((f, idx) => (
                  <tr key={f.granulat} className={idx % 2 === 0 ? "" : "bg-muted/10"}>
                    <td className="border border-border px-3 py-1 text-center font-medium">{f.granulat}</td>
                    <td className="border border-border px-3 py-1 text-center">{f.masseRi || "—"}</td>
                    <td className="border border-border px-3 py-1 text-center text-muted-foreground">{f.grille}</td>
                    <td className="border border-border px-3 py-1 text-center">{f.masseRi > 0 ? (f.passantMi || 0) : "—"}</td>
                    <td className="border border-border px-3 py-1 text-center">{f.masseRi > 0 ? (f.ai || 0).toFixed(2) : "—"}</td>
                  </tr>
                ))}
                <tr className="bg-muted/50 font-bold">
                  <td className="border border-border px-3 py-2 text-center">Totaux</td>
                  <td className="border border-border px-3 py-2 text-center">{m1}</td>
                  <td className="border border-border px-3 py-2"></td>
                  <td className="border border-border px-3 py-2 text-center">{m2}</td>
                  <td className="border border-border px-3 py-2"></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Result */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-primary/20 border border-primary/30 rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Coefficient d'Aplatissement (A = M₂/M₁ × 100)</p>
            <p className="text-4xl font-bold text-primary">{coeff || "—"} %</p>
            {coeff > 0 && (
              <p className={`text-sm font-medium mt-2 ${classification.color}`}>
                {classification.label} — {classification.desc}
              </p>
            )}
          </div>
          <div className={`border rounded-lg p-6 text-center ${Math.abs(perte) <= 1 ? "bg-green-500/10 border-green-500/30" : "bg-destructive/10 border-destructive/30"}`}>
            <p className="text-sm text-muted-foreground mb-2">Vérification de perte</p>
            <p className={`text-4xl font-bold ${Math.abs(perte) <= 1 ? "text-green-500" : "text-destructive"}`}>{perte} %</p>
            <p className={`text-sm mt-2 ${Math.abs(perte) <= 1 ? "text-green-500" : "text-destructive"}`}>
              {Math.abs(perte) <= 1 ? "✓ Conforme (< 1%)" : "✗ Non conforme (> 1%)"}
            </p>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm font-medium text-foreground mb-2">Classification selon NF EN 12620 :</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• FI ≤ 15 : FI15 — Très bonne forme</li>
            <li>• FI ≤ 20 : FI20 — Bonne forme</li>
            <li>• FI ≤ 35 : FI35 — Forme acceptable</li>
            <li>• FI ≤ 50 : FI50 — Forme médiocre</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
