import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LosAngelesFormProps {
  resultats: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

const GRANULARITES = [
  { value: "A", label: "A (10-14 mm)", charge: "5000g", boulets: 11 },
  { value: "B", label: "B (10-25 mm)", charge: "5000g", boulets: 11 },
  { value: "C", label: "C (16-31.5 mm)", charge: "5000g", boulets: 12 },
  { value: "D", label: "D (25-50 mm)", charge: "5000g", boulets: 12 },
];

export default function LosAngelesForm({ resultats, onChange }: LosAngelesFormProps) {
  const handleChange = (field: string, value: string | number) => {
    const updated = { ...resultats, [field]: typeof value === "string" ? value : value };
    
    // Calcul du coefficient Los Angeles
    const masseInitiale = parseFloat(String(updated.masse_initiale)) || 0;
    const masseFinale = parseFloat(String(updated.masse_finale)) || 0;
    
    if (masseInitiale > 0) {
      const coeffLA = ((masseInitiale - masseFinale) / masseInitiale) * 100;
      updated.coefficient_la = parseFloat(coeffLA.toFixed(1));
    }
    
    onChange(updated);
  };

  const getClassification = (coeff: number) => {
    if (coeff <= 15) return { label: "LA15", description: "Excellente résistance" };
    if (coeff <= 20) return { label: "LA20", description: "Très bonne résistance" };
    if (coeff <= 25) return { label: "LA25", description: "Bonne résistance" };
    if (coeff <= 30) return { label: "LA30", description: "Résistance moyenne" };
    if (coeff <= 35) return { label: "LA35", description: "Résistance acceptable" };
    if (coeff <= 40) return { label: "LA40", description: "Résistance faible" };
    return { label: "Non conforme", description: "Résistance insuffisante" };
  };

  const coeff = (resultats.coefficient_la as number) || 0;
  const classification = getClassification(coeff);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Résultats - Essai Los Angeles (NF EN 1097-2)</CardTitle>
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
              placeholder="5000"
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

        <div>
          <Label htmlFor="nombre_tours">Nombre de tours</Label>
          <Input
            id="nombre_tours"
            type="number"
            value={(resultats.nombre_tours as number) || 500}
            onChange={(e) => handleChange("nombre_tours", parseInt(e.target.value) || 500)}
            className="bg-background border-border w-32"
            placeholder="500"
          />
        </div>

        {/* Résultat principal */}
        <div className="bg-primary/20 border border-primary/30 rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Coefficient Los Angeles (LA)</p>
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
            <li>• LA ≤ 15 : Excellente résistance aux chocs</li>
            <li>• LA ≤ 20 : Très bonne résistance</li>
            <li>• LA ≤ 25 : Bonne résistance (béton courant)</li>
            <li>• LA ≤ 30 : Résistance moyenne</li>
            <li>• LA ≤ 40 : Résistance faible</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
