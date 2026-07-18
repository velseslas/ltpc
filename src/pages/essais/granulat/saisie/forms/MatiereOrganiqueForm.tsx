import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MatiereOrganiqueFormProps {
  resultats: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export default function MatiereOrganiqueForm({ resultats, onChange }: MatiereOrganiqueFormProps) {
  const handleChange = (field: string, value: string | number) => {
    onChange({ ...resultats, [field]: value });
  };

  const getColorLabel = (color: string) => {
    const colors: Record<string, string> = {
      "incolore": "Incolore - Teneur très faible",
      "jaune-clair": "Jaune clair - Teneur faible",
      "jaune-fonce": "Jaune foncé - Teneur moyenne",
      "brun": "Brun - Teneur élevée",
      "brun-fonce": "Brun foncé - Teneur très élevée",
    };
    return colors[color] || "";
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Résultats - Teneur en Matière Organique (NF EN 1744-1)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div data-essai-mobile className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="masse_echantillon">Masse de l'échantillon (g)</Label>
            <Input
              id="masse_echantillon"
              type="number"
              step="0.1"
              value={(resultats.masse_echantillon as number) || ""}
              onChange={(e) => handleChange("masse_echantillon", parseFloat(e.target.value) || 0)}
              className="bg-background border-border"
              placeholder="100"
            />
          </div>
          <div>
            <Label htmlFor="temps_repos">Temps de repos (heures)</Label>
            <Input
              id="temps_repos"
              type="number"
              value={(resultats.temps_repos as number) || ""}
              onChange={(e) => handleChange("temps_repos", parseFloat(e.target.value) || 0)}
              className="bg-background border-border"
              placeholder="24"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="couleur_solution">Couleur de la solution</Label>
          <Select
            value={(resultats.couleur_solution as string) || ""}
            onValueChange={(value) => handleChange("couleur_solution", value)}
          >
            <SelectTrigger className="bg-background border-border">
              <SelectValue placeholder="Sélectionnez la couleur" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="incolore">Incolore</SelectItem>
              <SelectItem value="jaune-clair">Jaune clair</SelectItem>
              <SelectItem value="jaune-fonce">Jaune foncé</SelectItem>
              <SelectItem value="brun">Brun</SelectItem>
              <SelectItem value="brun-fonce">Brun foncé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Résultat */}
        {resultats.couleur_solution && (
          <div className="bg-primary/20 border border-primary/30 rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Résultat de l'essai</p>
            <p className="text-xl font-bold text-primary">
              {getColorLabel(resultats.couleur_solution as string)}
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
