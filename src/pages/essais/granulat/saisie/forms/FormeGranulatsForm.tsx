import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormeGranulatsFormProps {
  resultats: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export default function FormeGranulatsForm({ resultats, onChange }: FormeGranulatsFormProps) {
  const handleChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updated = { ...resultats, [field]: numValue };
    
    // Calcul du coefficient d'aplatissement
    const masseTotale = (updated.masse_totale as number) || 0;
    const masseNonCubique = (updated.masse_non_cubique as number) || 0;
    
    if (masseTotale > 0) {
      const coeffAplatissement = (masseNonCubique / masseTotale) * 100;
      updated.coeff_aplatissement = parseFloat(coeffAplatissement.toFixed(1));
    }
    
    onChange(updated);
  };

  const getClassification = (coeff: number) => {
    if (coeff <= 15) return { label: "Fl15", description: "Très bonne forme" };
    if (coeff <= 20) return { label: "Fl20", description: "Bonne forme" };
    if (coeff <= 35) return { label: "Fl35", description: "Forme acceptable" };
    if (coeff <= 50) return { label: "Fl50", description: "Forme médiocre" };
    return { label: "Non conforme", description: "Forme non acceptable" };
  };

  const coeff = (resultats.coeff_aplatissement as number) || 0;
  const classification = getClassification(coeff);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Résultats - Coefficient d'Aplatissement (NF EN 933-3)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="masse_totale">Masse totale de l'échantillon (g)</Label>
            <Input
              id="masse_totale"
              type="number"
              step="0.1"
              value={(resultats.masse_totale as number) || ""}
              onChange={(e) => handleChange("masse_totale", e.target.value)}
              className="bg-background border-border"
              placeholder="0.0"
            />
          </div>
          <div>
            <Label htmlFor="masse_non_cubique">Masse des éléments non cubiques (g)</Label>
            <Input
              id="masse_non_cubique"
              type="number"
              step="0.1"
              value={(resultats.masse_non_cubique as number) || ""}
              onChange={(e) => handleChange("masse_non_cubique", e.target.value)}
              className="bg-background border-border"
              placeholder="0.0"
            />
          </div>
        </div>

        {/* Résultat principal */}
        <div className="bg-primary/20 border border-primary/30 rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Coefficient d'Aplatissement (FI)</p>
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
            <li>• FI ≤ 15 : Fl15 - Très bonne forme</li>
            <li>• FI ≤ 20 : Fl20 - Bonne forme</li>
            <li>• FI ≤ 35 : Fl35 - Forme acceptable</li>
            <li>• FI ≤ 50 : Fl50 - Forme médiocre</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
