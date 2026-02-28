import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BleuMethyleneResultsProps {
  resultats: Record<string, unknown>;
}

export default function BleuMethyleneResults({ resultats }: BleuMethyleneResultsProps) {
  const getClassification = (mb: number) => {
    if (mb <= 0.5) return "Sable propre";
    if (mb <= 1.5) return "Sable légèrement argileux";
    if (mb <= 2.5) return "Sable argileux";
    return "Sable très argileux";
  };

  const mb = (resultats.valeur_mb as number) || 0;

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Résultats - Essai au Bleu de Méthylène (NF EN 933-9)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Masse de l'échantillon</p>
            <p className="font-medium text-foreground">{(resultats.masse_echantillon as number) || "-"} g</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Volume de bleu injecté</p>
            <p className="font-medium text-foreground">{(resultats.volume_bleu as number) || "-"} ml</p>
          </div>
        </div>

        {/* Résultat final */}
        <div className="bg-primary/20 border border-primary/30 rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Valeur au Bleu de Méthylène (MB)</p>
          <p className="text-4xl font-bold text-primary">
            {mb || "--"} g/kg
          </p>
          {mb > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Classification: <span className="text-primary font-medium">{getClassification(mb)}</span>
            </p>
          )}
        </div>

        {/* Classification */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm font-medium text-foreground mb-2">Classification selon NF EN 933-9 :</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• MB ≤ 0,5 : Sable propre</li>
            <li>• 0,5 &lt; MB ≤ 1,5 : Sable légèrement argileux</li>
            <li>• 1,5 &lt; MB ≤ 2,5 : Sable argileux</li>
            <li>• MB &gt; 2,5 : Sable très argileux</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
