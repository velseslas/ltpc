import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FriabiliteResultsProps {
  resultats: Record<string, unknown>;
}

export default function FriabiliteResults({ resultats }: FriabiliteResultsProps) {
  const getClassification = (coeff: number) => {
    if (coeff <= 10) return "Sable très résistant";
    if (coeff <= 20) return "Sable résistant";
    if (coeff <= 30) return "Sable moyennement résistant";
    if (coeff <= 40) return "Sable peu résistant";
    return "Sable friable - non recommandé pour béton";
  };

  const coeff = (resultats.coefficient_friabilite as number) || 0;

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Résultats - Essai de Friabilité (NF P 18-576)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div data-essai-mobile className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Masse initiale M</p>
            <p className="font-medium text-foreground">{(resultats.masse_initiale as number) || "-"} g</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Masse après tamisage à 0.1 mm</p>
            <p className="font-medium text-foreground">{(resultats.masse_finale as number) || "-"} g</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Nombre de tours</p>
            <p className="font-medium text-foreground">{(resultats.nombre_tours as number) || "-"}</p>
          </div>
        </div>

        {/* Résultat principal */}
        <div className="bg-primary/20 border border-primary/30 rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Coefficient de Friabilité (FS)</p>
          <p className="text-4xl font-bold text-primary">
            {coeff || "--"} %
          </p>
          {coeff > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              {getClassification(coeff)}
            </p>
          )}
        </div>

        {/* Classification */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm font-medium text-foreground mb-2">Classification :</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• FS ≤ 10 : Sable très résistant</li>
            <li>• 10 &lt; FS ≤ 20 : Sable résistant</li>
            <li>• 20 &lt; FS ≤ 30 : Sable moyennement résistant</li>
            <li>• 30 &lt; FS ≤ 40 : Sable peu résistant</li>
            <li>• FS &gt; 40 : Sable friable (non recommandé)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
