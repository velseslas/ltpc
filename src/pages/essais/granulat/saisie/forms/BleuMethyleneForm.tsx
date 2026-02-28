import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BleuMethyleneFormProps {
  resultats: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export default function BleuMethyleneForm({ resultats, onChange }: BleuMethyleneFormProps) {
  const handleChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updated = { ...resultats, [field]: numValue };
    
    // Calculate MB value: MB = V1 / M1 * 10
    const v1 = (updated.volume_bleu as number) || 0;
    const m1 = (updated.masse_echantillon as number) || 0;
    
    const mb = m1 > 0 ? (v1 / m1) * 10 : 0;
    updated.valeur_mb = parseFloat(mb.toFixed(2));
    
    onChange(updated);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Résultats - Essai au Bleu de Méthylène (NF EN 933-9)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="masse_echantillon">Masse de l'échantillon M1 (g)</Label>
            <Input
              id="masse_echantillon"
              type="number"
              step="0.1"
              value={(resultats.masse_echantillon as number) || ""}
              onChange={(e) => handleChange("masse_echantillon", e.target.value)}
              className="bg-background border-border"
              placeholder="200"
            />
          </div>
          <div>
            <Label htmlFor="volume_bleu">Volume de bleu injecté V1 (ml)</Label>
            <Input
              id="volume_bleu"
              type="number"
              step="0.1"
              value={(resultats.volume_bleu as number) || ""}
              onChange={(e) => handleChange("volume_bleu", e.target.value)}
              className="bg-background border-border"
              placeholder="0.0"
            />
          </div>
        </div>

        {/* Résultat final */}
        <div className="bg-primary/20 border border-primary/30 rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Valeur au Bleu de Méthylène (MB)</p>
          <p className="text-4xl font-bold text-primary">
            {(resultats.valeur_mb as number) || "--"} g/kg
          </p>
        </div>

        {/* Classification */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm font-medium text-foreground mb-2">Classification selon NF EN 933-9 :</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• MB ≤ 0,5 : Sable propre</li>
            <li>• 0,5 &lt; MB ≤ 1,5 : Sable légèrement argileux</li>
            <li>• 1,5 &lt; MB ≤ 2,5 : Sable argileux</li>
            <li>• MB &gt; 2,5 : Sable très argileux</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
