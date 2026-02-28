import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MicroDevalResultsProps {
  resultats: Record<string, unknown>;
}

export default function MicroDevalResults({ resultats }: MicroDevalResultsProps) {
  const getClassification = (coeff: number) => {
    if (coeff <= 10) return { label: "MDE10", description: "Excellente résistance à l'usure" };
    if (coeff <= 15) return { label: "MDE15", description: "Très bonne résistance" };
    if (coeff <= 20) return { label: "MDE20", description: "Bonne résistance" };
    if (coeff <= 25) return { label: "MDE25", description: "Résistance moyenne" };
    if (coeff <= 35) return { label: "MDE35", description: "Résistance acceptable" };
    return { label: "Non conforme", description: "Résistance insuffisante" };
  };

  const coeff = (resultats.coefficient_mde as number) || 0;
  const classification = getClassification(coeff);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Résultats - Essai Micro-Deval (NF EN 1097-1)</CardTitle>
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
          <p className="text-sm text-muted-foreground mb-2">Coefficient Micro-Deval (MDE)</p>
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
            <li>• MDE ≤ 10 : Excellente résistance à l'usure</li>
            <li>• MDE ≤ 15 : Très bonne résistance</li>
            <li>• MDE ≤ 20 : Bonne résistance (béton courant)</li>
            <li>• MDE ≤ 25 : Résistance moyenne</li>
            <li>• MDE ≤ 35 : Résistance acceptable</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
