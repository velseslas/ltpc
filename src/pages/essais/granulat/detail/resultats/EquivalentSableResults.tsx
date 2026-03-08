import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EquivalentSableResultsProps {
  resultats: Record<string, unknown>;
}

export default function EquivalentSableResults({ resultats }: EquivalentSableResultsProps) {
  const display = (key: string) => {
    const v = resultats[key] as number;
    return v != null && v !== 0 ? v : "-";
  };

  const fields: { label: string; unit: string; key1: string; key2: string }[] = [
    { label: "Poids humide (mh)", unit: "g", key1: "mh_essai1", key2: "mh_essai2" },
    { label: "Poids sec (ms)", unit: "g", key1: "ms_essai1", key2: "ms_essai2" },
    { label: "Teneur en eau", unit: "%", key1: "w_essai1", key2: "w_essai2" },
    { label: "Hauteur du floculat (h1)", unit: "cm", key1: "h1_essai1", key2: "h1_essai2" },
    { label: "Hauteur du sable visuelle (h2)", unit: "cm", key1: "h2_essai1", key2: "h2_essai2" },
    { label: "Hauteur du sable piston (h'2)", unit: "cm", key1: "h2p_essai1", key2: "h2p_essai2" },
    { label: "ESv (%)", unit: "%", key1: "esv_essai1", key2: "esv_essai2" },
    { label: "ESp (%)", unit: "%", key1: "esp_essai1", key2: "esp_essai2" },
  ];

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Résultats - Équivalent de Sable (NF EN 933-8)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted/60">
                <th className="border border-border px-3 py-2.5 text-left font-medium text-foreground w-1/2">Échantillon N°</th>
                <th className="border border-border px-3 py-2.5 text-center font-medium text-foreground w-16">Unité</th>
                <th className="border border-border px-3 py-2.5 text-center font-medium text-foreground">1</th>
                <th className="border border-border px-3 py-2.5 text-center font-medium text-foreground">2</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f, i) => (
                <tr key={i}>
                  <td className="border border-border px-3 py-2 text-foreground">{f.label}</td>
                  <td className="border border-border px-3 py-2 text-center text-muted-foreground">({f.unit})</td>
                  <td className="border border-border px-3 py-2 text-center font-medium text-foreground">{display(f.key1)}</td>
                  <td className="border border-border px-3 py-2 text-center font-medium text-foreground">{display(f.key2)}</td>
                </tr>
              ))}

              <tr className="bg-muted/30">
                <td className="border border-border px-3 py-2 font-medium text-foreground">Moyenne teneur en eau (W moy)</td>
                <td className="border border-border px-3 py-2 text-center text-muted-foreground">(%)</td>
                <td colSpan={2} className="border border-border px-3 py-2 text-center">
                  <span className="text-lg font-bold text-primary">{display("w_moyen")} %</span>
                </td>
              </tr>

              <tr className="bg-primary/10">
                <td className="border border-border px-3 py-2 font-medium text-foreground">Moyenne ESv</td>
                <td className="border border-border px-3 py-2 text-center text-muted-foreground">(%)</td>
                <td colSpan={2} className="border border-border px-3 py-2 text-center">
                  <span className="text-xl font-bold text-primary">{display("esv_moyen")} %</span>
                </td>
              </tr>

              <tr className="bg-primary/10">
                <td className="border border-border px-3 py-2 font-medium text-foreground">Moyenne ESp</td>
                <td className="border border-border px-3 py-2 text-center text-muted-foreground">(%)</td>
                <td colSpan={2} className="border border-border px-3 py-2 text-center">
                  <span className="text-xl font-bold text-primary">{display("esp_moyen")} %</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Classification */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm font-medium text-foreground mb-2">Interprétation :</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• ES ≥ 80 : Sable très propre (béton haute qualité)</li>
            <li>• 70 ≤ ES &lt; 80 : Sable propre (béton courant)</li>
            <li>• 60 ≤ ES &lt; 70 : Sable légèrement argileux</li>
            <li>• ES &lt; 60 : Sable argileux (impropre au béton)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
