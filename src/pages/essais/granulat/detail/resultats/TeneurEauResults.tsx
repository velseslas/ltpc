import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TeneurEauResultsProps {
  resultats: Record<string, unknown>;
}

export default function TeneurEauResults({ resultats }: TeneurEauResultsProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Résultats - Teneur en Eau (NF EN 1097-5)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Masse de l'échantillon humide M1</p>
            <p className="font-medium text-foreground">{(resultats.masse_humide as number) || "-"} g</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Masse de l'échantillon sec M2</p>
            <p className="font-medium text-foreground">{(resultats.masse_seche as number) || "-"} g</p>
          </div>
        </div>

        {/* Résultat principal */}
        <div className="bg-primary/20 border border-primary/30 rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Teneur en Eau (W)</p>
          <p className="text-4xl font-bold text-primary">
            {(resultats.teneur_eau as number) || "--"} %
          </p>
        </div>

        {/* Formule */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm font-medium text-foreground mb-2">Formule utilisée :</p>
          <p className="text-sm text-muted-foreground">
            W = (M1 - M2) / M2 × 100
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Où M1 = masse humide et M2 = masse sèche après étuvage à 105°C
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
