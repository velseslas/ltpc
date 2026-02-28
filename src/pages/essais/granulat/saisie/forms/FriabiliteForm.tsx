import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FriabiliteFormProps {
  resultats: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export default function FriabiliteForm({ resultats, onChange }: FriabiliteFormProps) {
  const handleChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updated = { ...resultats, [field]: numValue };
    
    // Calcul du coefficient de friabilité
    const masseInitiale = (updated.masse_initiale as number) || 0;
    const masseFinale = (updated.masse_finale as number) || 0;
    
    if (masseInitiale > 0) {
      const coeffFriabilite = ((masseInitiale - masseFinale) / masseInitiale) * 100;
      updated.coefficient_friabilite = parseFloat(coeffFriabilite.toFixed(1));
    }
    
    onChange(updated);
  };

  const getClassification = (coeff: number) => {
    if (coeff <= 10) return { description: "Sable très résistant" };
    if (coeff <= 20) return { description: "Sable résistant" };
    if (coeff <= 30) return { description: "Sable moyennement résistant" };
    if (coeff <= 40) return { description: "Sable peu résistant" };
    return { description: "Sable friable - non recommandé pour béton" };
  };

  const coeff = (resultats.coefficient_friabilite as number) || 0;
  const classification = getClassification(coeff);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Résultats - Essai de Friabilité des Sables (NF P 18-576)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="masse_initiale">Masse initiale M (g)</Label>
            <Input
              id="masse_initiale"
              type="number"
              step="0.1"
              value={(resultats.masse_initiale as number) || ""}
              onChange={(e) => handleChange("masse_initiale", e.target.value)}
              className="bg-background border-border"
              placeholder="500"
            />
          </div>
          <div>
            <Label htmlFor="masse_finale">Masse après tamisage à 0.1 mm (g)</Label>
            <Input
              id="masse_finale"
              type="number"
              step="0.1"
              value={(resultats.masse_finale as number) || ""}
              onChange={(e) => handleChange("masse_finale", e.target.value)}
              className="bg-background border-border"
              placeholder="0.0"
            />
          </div>
          <div>
            <Label htmlFor="nombre_tours">Nombre de tours</Label>
            <Input
              id="nombre_tours"
              type="number"
              value={(resultats.nombre_tours as number) || 105}
              onChange={(e) => handleChange("nombre_tours", e.target.value)}
              className="bg-background border-border"
              placeholder="105"
            />
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
              {classification.description}
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
