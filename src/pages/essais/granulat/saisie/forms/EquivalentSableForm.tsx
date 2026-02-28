import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EquivalentSableFormProps {
  resultats: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export default function EquivalentSableForm({ resultats, onChange }: EquivalentSableFormProps) {
  const handleChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updated = { ...resultats, [field]: numValue };
    
    // Calculate ES values
    const h1_1 = (updated.h1_essai1 as number) || 0;
    const h2_1 = (updated.h2_essai1 as number) || 0;
    const h1_2 = (updated.h1_essai2 as number) || 0;
    const h2_2 = (updated.h2_essai2 as number) || 0;
    
    const es1 = h1_1 > 0 ? (h2_1 / h1_1) * 100 : 0;
    const es2 = h1_2 > 0 ? (h2_2 / h1_2) * 100 : 0;
    const esMoyen = (es1 + es2) / 2;
    
    updated.es_essai1 = parseFloat(es1.toFixed(1));
    updated.es_essai2 = parseFloat(es2.toFixed(1));
    updated.es_moyen = parseFloat(esMoyen.toFixed(1));
    
    onChange(updated);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Résultats - Équivalent de Sable (NF EN 933-8)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Essai 1 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b border-border pb-2">Essai 1</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="h1_essai1">H1 - Hauteur totale (mm)</Label>
                <Input
                  id="h1_essai1"
                  type="number"
                  step="0.1"
                  value={(resultats.h1_essai1 as number) || ""}
                  onChange={(e) => handleChange("h1_essai1", e.target.value)}
                  className="bg-background border-border"
                  placeholder="0.0"
                />
              </div>
              <div>
                <Label htmlFor="h2_essai1">H2 - Hauteur sable (mm)</Label>
                <Input
                  id="h2_essai1"
                  type="number"
                  step="0.1"
                  value={(resultats.h2_essai1 as number) || ""}
                  onChange={(e) => handleChange("h2_essai1", e.target.value)}
                  className="bg-background border-border"
                  placeholder="0.0"
                />
              </div>
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">ES Essai 1</p>
              <p className="text-2xl font-bold text-primary">
                {(resultats.es_essai1 as number) || "--"} %
              </p>
            </div>
          </div>

          {/* Essai 2 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b border-border pb-2">Essai 2</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="h1_essai2">H1 - Hauteur totale (mm)</Label>
                <Input
                  id="h1_essai2"
                  type="number"
                  step="0.1"
                  value={(resultats.h1_essai2 as number) || ""}
                  onChange={(e) => handleChange("h1_essai2", e.target.value)}
                  className="bg-background border-border"
                  placeholder="0.0"
                />
              </div>
              <div>
                <Label htmlFor="h2_essai2">H2 - Hauteur sable (mm)</Label>
                <Input
                  id="h2_essai2"
                  type="number"
                  step="0.1"
                  value={(resultats.h2_essai2 as number) || ""}
                  onChange={(e) => handleChange("h2_essai2", e.target.value)}
                  className="bg-background border-border"
                  placeholder="0.0"
                />
              </div>
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">ES Essai 2</p>
              <p className="text-2xl font-bold text-primary">
                {(resultats.es_essai2 as number) || "--"} %
              </p>
            </div>
          </div>
        </div>

        {/* Résultat final */}
        <div className="bg-primary/20 border border-primary/30 rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Équivalent de Sable Moyen</p>
          <p className="text-4xl font-bold text-primary">
            {(resultats.es_moyen as number) || "--"} %
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
