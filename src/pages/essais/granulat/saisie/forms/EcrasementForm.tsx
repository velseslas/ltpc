import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EcrasementFormProps {
  resultats: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export default function EcrasementForm({ resultats, onChange }: EcrasementFormProps) {
  const handleChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updated = { ...resultats, [field]: numValue };
    
    // Calcul du coefficient d'écrasement
    const masseInitiale = (updated.masse_initiale as number) || 0;
    const massePassant = (updated.masse_passant as number) || 0;
    
    if (masseInitiale > 0) {
      const coeffEcrasement = (massePassant / masseInitiale) * 100;
      updated.coefficient_ecrasement = parseFloat(coeffEcrasement.toFixed(1));
    }
    
    onChange(updated);
  };

  const getClassification = (coeff: number) => {
    if (coeff <= 20) return { description: "Excellente résistance à l'écrasement" };
    if (coeff <= 30) return { description: "Bonne résistance" };
    if (coeff <= 40) return { description: "Résistance moyenne" };
    return { description: "Résistance faible" };
  };

  const coeff = (resultats.coefficient_ecrasement as number) || 0;
  const classification = getClassification(coeff);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Résultats - Résistance à l'Écrasement (NF P 18-576)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div data-essai-mobile className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="masse_initiale">Masse initiale M (g)</Label>
            <Input
              id="masse_initiale"
              type="number"
              step="0.1"
              value={(resultats.masse_initiale as number) || ""}
              onChange={(e) => handleChange("masse_initiale", e.target.value)}
              className="bg-background border-border"
              placeholder="0.0"
            />
          </div>
          <div>
            <Label htmlFor="masse_passant">Masse passant au tamis 1.6 mm (g)</Label>
            <Input
              id="masse_passant"
              type="number"
              step="0.1"
              value={(resultats.masse_passant as number) || ""}
              onChange={(e) => handleChange("masse_passant", e.target.value)}
              className="bg-background border-border"
              placeholder="0.0"
            />
          </div>
          <div>
            <Label htmlFor="charge_appliquee">Charge appliquée (kN)</Label>
            <Input
              id="charge_appliquee"
              type="number"
              step="0.1"
              value={(resultats.charge_appliquee as number) || ""}
              onChange={(e) => handleChange("charge_appliquee", e.target.value)}
              className="bg-background border-border"
              placeholder="400"
            />
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
              {classification.description}
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
