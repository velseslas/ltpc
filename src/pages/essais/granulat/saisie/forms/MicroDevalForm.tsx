import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MicroDevalFormProps {
  resultats: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

const GRANULARITES = [
  { value: "10-14", label: "10-14 mm" },
  { value: "4-6.3", label: "4-6.3 mm" },
  { value: "6.3-10", label: "6.3-10 mm" },
  { value: "25-50", label: "25-50 mm" },
];

export default function MicroDevalForm({ resultats, onChange }: MicroDevalFormProps) {
  const handleChange = (field: string, value: string | number) => {
    const updated = { ...resultats, [field]: value };
    
    // Calcul du coefficient Micro-Deval
    const masseInitiale = parseFloat(String(updated.masse_initiale)) || 0;
    const masseFinale = parseFloat(String(updated.masse_finale)) || 0;
    
    if (masseInitiale > 0) {
      const coeffMDE = ((masseInitiale - masseFinale) / masseInitiale) * 100;
      updated.coefficient_mde = parseFloat(coeffMDE.toFixed(1));
    }
    
    onChange(updated);
  };

  const getClassification = (coeff: number) => {
    if (coeff <= 10) return { label: "MDE10", description: "Excellente résistance à l'usure" };
    if (coeff <= 15) return { label: "MDE15", description: "Très bonne résistance" };
    if (coeff <= 20) return { label: "MDE20", description: "Bonne résistance" };
    if (coeff <= 25) return { label: "MDE25", description: "Résistance moyenne" };
    if (coeff <= 35) return { label: "MDE35", description: "Résistance acceptable" };
    return { label: "Non conforme", description: "Résistance insuffisante" };
  };

  const coeff = (resultats.coefficient_mde as number) || 0;
  const classification = getClassification(coeff);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Résultats - Essai Micro-Deval en présence d'eau (NF EN 1097-1)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="granularite">Classe granulaire</Label>
            <Select
              value={(resultats.granularite as string) || ""}
              onValueChange={(value) => handleChange("granularite", value)}
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Sélectionnez" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {GRANULARITES.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
            <Label htmlFor="masse_finale">Masse finale m (g)</Label>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="charge_abrasive">Charge abrasive (g)</Label>
            <Input
              id="charge_abrasive"
              type="number"
              value={(resultats.charge_abrasive as number) || 2500}
              onChange={(e) => handleChange("charge_abrasive", parseInt(e.target.value) || 2500)}
              className="bg-background border-border"
              placeholder="2500"
            />
          </div>
          <div>
            <Label htmlFor="volume_eau">Volume d'eau (ml)</Label>
            <Input
              id="volume_eau"
              type="number"
              value={(resultats.volume_eau as number) || 2500}
              onChange={(e) => handleChange("volume_eau", parseInt(e.target.value) || 2500)}
              className="bg-background border-border"
              placeholder="2500"
            />
          </div>
        </div>

        {/* Résultat principal */}
        <div className="bg-primary/20 border border-primary/30 rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Coefficient Micro-Deval (MDE)</p>
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
            <li>• MDE ≤ 10 : Excellente résistance à l'usure</li>
            <li>• MDE ≤ 15 : Très bonne résistance</li>
            <li>• MDE ≤ 20 : Bonne résistance (béton courant)</li>
            <li>• MDE ≤ 25 : Résistance moyenne</li>
            <li>• MDE ≤ 35 : Résistance acceptable</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
