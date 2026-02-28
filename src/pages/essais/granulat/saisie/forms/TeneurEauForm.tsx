import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TeneurEauFormProps {
  resultats: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export default function TeneurEauForm({ resultats, onChange }: TeneurEauFormProps) {
  const handleChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updated = { ...resultats, [field]: numValue };
    
    // Calcul de la teneur en eau
    const masseHumide = (updated.masse_humide as number) || 0;
    const masseSeche = (updated.masse_seche as number) || 0;
    
    if (masseSeche > 0) {
      const teneurEau = ((masseHumide - masseSeche) / masseSeche) * 100;
      updated.teneur_eau = parseFloat(teneurEau.toFixed(2));
    }
    
    onChange(updated);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Résultats - Teneur en Eau (NF EN 1097-5)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="masse_humide">Masse de l'échantillon humide M1 (g)</Label>
            <Input
              id="masse_humide"
              type="number"
              step="0.1"
              value={(resultats.masse_humide as number) || ""}
              onChange={(e) => handleChange("masse_humide", e.target.value)}
              className="bg-background border-border"
              placeholder="0.0"
            />
          </div>
          <div>
            <Label htmlFor="masse_seche">Masse de l'échantillon sec M2 (g)</Label>
            <Input
              id="masse_seche"
              type="number"
              step="0.1"
              value={(resultats.masse_seche as number) || ""}
              onChange={(e) => handleChange("masse_seche", e.target.value)}
              className="bg-background border-border"
              placeholder="0.0"
            />
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
