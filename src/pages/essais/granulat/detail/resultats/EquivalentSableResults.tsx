import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EquivalentSableResultsProps {
  resultats: Record<string, unknown>;
}

export default function EquivalentSableResults({ resultats }: EquivalentSableResultsProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Résultats - Équivalent de Sable (NF EN 933-8)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Essai 1 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b border-border pb-2">Essai 1</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">H1 - Hauteur totale</p>
                <p className="font-medium text-foreground">{(resultats.h1_essai1 as number) || "-"} mm</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">H2 - Hauteur sable</p>
                <p className="font-medium text-foreground">{(resultats.h2_essai1 as number) || "-"} mm</p>
              </div>
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">ES Essai 1</p>
              <p className="text-2xl font-bold text-primary">
                {(resultats.es_essai1 as number) || "--"} %
              </p>
            </div>
          </div>

          {/* Essai 2 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b border-border pb-2">Essai 2</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">H1 - Hauteur totale</p>
                <p className="font-medium text-foreground">{(resultats.h1_essai2 as number) || "-"} mm</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">H2 - Hauteur sable</p>
                <p className="font-medium text-foreground">{(resultats.h2_essai2 as number) || "-"} mm</p>
              </div>
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">ES Essai 2</p>
              <p className="text-2xl font-bold text-primary">
                {(resultats.es_essai2 as number) || "--"} %
              </p>
            </div>
          </div>
        </div>

        {/* Résultat final */}
        <div className="bg-primary/20 border border-primary/30 rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Équivalent de Sable Moyen</p>
          <p className="text-4xl font-bold text-primary">
            {(resultats.es_moyen as number) || "--"} %
          </p>
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
