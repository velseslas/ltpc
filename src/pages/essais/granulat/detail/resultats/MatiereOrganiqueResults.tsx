import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MatiereOrganiqueResultsProps {
  resultats: Record<string, unknown>;
}

export default function MatiereOrganiqueResults({ resultats }: MatiereOrganiqueResultsProps) {
  const getColorLabel = (color: string) => {
    const colors: Record<string, string> = {
      "incolore": "Incolore - Teneur très faible",
      "jaune-clair": "Jaune clair - Teneur faible",
      "jaune-fonce": "Jaune foncé - Teneur moyenne",
      "brun": "Brun - Teneur élevée",
      "brun-fonce": "Brun foncé - Teneur très élevée",
    };
    return colors[color] || color;
  };

  const couleur = (resultats.couleur_solution as string) || "";

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Résultats - Teneur en Matière Organique (NF EN 1744-1)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div data-essai-mobile className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Masse de l'échantillon</p>
            <p className="font-medium text-foreground">{(resultats.masse_echantillon as number) || "-"} g</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Temps de repos</p>
            <p className="font-medium text-foreground">{(resultats.temps_repos as number) || "-"} heures</p>
          </div>
        </div>

        {/* Résultat */}
        {couleur && (
          <div className="bg-primary/20 border border-primary/30 rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Résultat de l'essai</p>
            <p className="text-xl font-bold text-primary">
              {getColorLabel(couleur)}
            </p>
          </div>
        )}

        {/* Conformité */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm font-medium text-foreground mb-2">Interprétation :</p>
          <p className="text-sm text-muted-foreground">
            Si la couleur de la solution est plus foncée que la solution témoin (jaune foncé ou plus), 
            le sable contient une quantité significative de matières organiques qui peuvent affecter 
            la prise et le durcissement du béton.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
