import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FormeGranulatsResultsProps {
  resultats: Record<string, unknown>;
}

export default function FormeGranulatsResults({ resultats }: FormeGranulatsResultsProps) {
  const getClassification = (coeff: number) => {
    if (coeff <= 15) return { label: "Fl15", description: "Très bonne forme" };
    if (coeff <= 20) return { label: "Fl20", description: "Bonne forme" };
    if (coeff <= 35) return { label: "Fl35", description: "Forme acceptable" };
    if (coeff <= 50) return { label: "Fl50", description: "Forme médiocre" };
    return { label: "Non conforme", description: "Forme non acceptable" };
  };

  const coeff = (resultats.coeff_aplatissement as number) || 0;
  const classification = getClassification(coeff);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Résultats - Coefficient d'Aplatissement (NF EN 933-3)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Masse totale de l'échantillon</p>
            <p className="font-medium text-foreground">{(resultats.masse_totale as number) || "-"} g</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Masse des éléments non cubiques</p>
            <p className="font-medium text-foreground">{(resultats.masse_non_cubique as number) || "-"} g</p>
          </div>
        </div>

        {/* Résultat principal */}
        <div className="bg-primary/20 border border-primary/30 rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Coefficient d'Aplatissement (FI)</p>
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
            <li>• FI ≤ 15 : Fl15 - Très bonne forme</li>
            <li>• FI ≤ 20 : Fl20 - Bonne forme</li>
            <li>• FI ≤ 35 : Fl35 - Forme acceptable</li>
            <li>• FI ≤ 50 : Fl50 - Forme médiocre</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
