import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EcrasementResultsProps {
  resultats: Record<string, unknown>;
}

export default function EcrasementResults({ resultats }: EcrasementResultsProps) {
  const getClassification = (coeff: number) => {
    if (coeff <= 20) return "Excellente résistance à l'écrasement";
    if (coeff <= 30) return "Bonne résistance";
    if (coeff <= 40) return "Résistance moyenne";
    return "Résistance faible";
  };

  const coeff = (resultats.coefficient_ecrasement as number) || 0;

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Résultats - Résistance à l'Écrasement (NF P 18-576)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div data-essai-mobile className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Masse initiale M</p>
            <p className="font-medium text-foreground">{(resultats.masse_initiale as number) || "-"} g</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Masse passant au tamis 1.6 mm</p>
            <p className="font-medium text-foreground">{(resultats.masse_passant as number) || "-"} g</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Charge appliquée</p>
            <p className="font-medium text-foreground">{(resultats.charge_appliquee as number) || "-"} kN</p>
          </div>
        </div>

        {/* Résultat principal */}
        <div className="bg-primary/20 border border-primary/30 rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Coefficient d'Écrasement (CE)</p>
          <p className="text-4xl font-bold text-primary">
            {coeff || "--"} %
          </p>
          {coeff > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              {getClassification(coeff)}
            </p>
          )}
        </div>

        {/* Formule */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm font-medium text-foreground mb-2">Formule utilisée :</p>
          <p className="text-sm text-muted-foreground">
            CE = (masse passant / masse initiale) × 100
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Plus le coefficient est faible, meilleure est la résistance à l'écrasement.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
