import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LosAngelesResultsProps {
  resultats: Record<string, unknown>;
}

export default function LosAngelesResults({ resultats }: LosAngelesResultsProps) {
  const getClassification = (coeff: number) => {
    if (coeff <= 15) return { label: "LA15", description: "Excellente résistance" };
    if (coeff <= 20) return { label: "LA20", description: "Très bonne résistance" };
    if (coeff <= 25) return { label: "LA25", description: "Bonne résistance" };
    if (coeff <= 30) return { label: "LA30", description: "Résistance moyenne" };
    if (coeff <= 35) return { label: "LA35", description: "Résistance acceptable" };
    if (coeff <= 40) return { label: "LA40", description: "Résistance faible" };
    return { label: "Non conforme", description: "Résistance insuffisante" };
  };

  const coeff = (resultats.coefficient_la as number) || 0;
  const classification = getClassification(coeff);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Résultats - Essai Los Angeles (NF EN 1097-2)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Classe granulaire</p>
            <p className="font-medium text-foreground">{(resultats.granularite as string) || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Masse initiale M</p>
            <p className="font-medium text-foreground">{(resultats.masse_initiale as number) || "-"} g</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Masse finale m</p>
            <p className="font-medium text-foreground">{(resultats.masse_finale as number) || "-"} g</p>
          </div>
        </div>

        {/* Résultat principal */}
        <div className="bg-primary/20 border border-primary/30 rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Coefficient Los Angeles (LA)</p>
          <p className="text-4xl font-bold text-primary">
            {coeff || "--"} %
          </p>
          {coeff > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Classification: <span className="text-primary font-medium">{classification.label}</span> - {classification.description}
            </p>
          )}
        </div>

        {/* Classification */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm font-medium text-foreground mb-2">Classification selon NF EN 12620 :</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• LA ≤ 15 : Excellente résistance aux chocs</li>
            <li>• LA ≤ 20 : Très bonne résistance</li>
            <li>• LA ≤ 25 : Bonne résistance (béton courant)</li>
            <li>• LA ≤ 30 : Résistance moyenne</li>
            <li>• LA ≤ 40 : Résistance faible</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
