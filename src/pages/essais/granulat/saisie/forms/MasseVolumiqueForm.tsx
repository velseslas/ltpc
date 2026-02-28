import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MasseVolumiqueFormProps {
  resultats: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export default function MasseVolumiqueForm({ resultats, onChange }: MasseVolumiqueFormProps) {
  const handleChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updated = { ...resultats, [field]: numValue };
    
    // Calculs automatiques
    const masseSeche = (updated.masse_seche as number) || 0;
    const masseSaturee = (updated.masse_saturee as number) || 0;
    const masseImmergee = (updated.masse_immergee as number) || 0;
    
    // Masse volumique réelle (ρrd)
    const denominator = masseSaturee - masseImmergee;
    if (denominator > 0) {
      const mvReelle = (masseSeche / denominator) * 1000;
      updated.mv_reelle = parseFloat(mvReelle.toFixed(0));
      
      // Masse volumique saturée surface sèche (ρssd)
      const mvSsd = (masseSaturee / denominator) * 1000;
      updated.mv_ssd = parseFloat(mvSsd.toFixed(0));
      
      // Coefficient d'absorption d'eau
      if (masseSeche > 0) {
        const absorption = ((masseSaturee - masseSeche) / masseSeche) * 100;
        updated.absorption = parseFloat(absorption.toFixed(2));
      }
    }
    
    onChange(updated);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Résultats - Masse Volumique (NF EN 1097-6)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="masse_seche">Masse sèche M1 (g)</Label>
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
          <div>
            <Label htmlFor="masse_saturee">Masse saturée surface sèche M2 (g)</Label>
            <Input
              id="masse_saturee"
              type="number"
              step="0.1"
              value={(resultats.masse_saturee as number) || ""}
              onChange={(e) => handleChange("masse_saturee", e.target.value)}
              className="bg-background border-border"
              placeholder="0.0"
            />
          </div>
          <div>
            <Label htmlFor="masse_immergee">Masse immergée M3 (g)</Label>
            <Input
              id="masse_immergee"
              type="number"
              step="0.1"
              value={(resultats.masse_immergee as number) || ""}
              onChange={(e) => handleChange("masse_immergee", e.target.value)}
              className="bg-background border-border"
              placeholder="0.0"
            />
          </div>
        </div>

        {/* Résultats calculés */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Masse volumique réelle ρrd</p>
            <p className="text-2xl font-bold text-primary">
              {(resultats.mv_reelle as number) || "--"} kg/m³
            </p>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Masse volumique SSD ρssd</p>
            <p className="text-2xl font-bold text-primary">
              {(resultats.mv_ssd as number) || "--"} kg/m³
            </p>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Absorption d'eau WA</p>
            <p className="text-2xl font-bold text-primary">
              {(resultats.absorption as number) || "--"} %
            </p>
          </div>
        </div>

        {/* Formules */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm font-medium text-foreground mb-2">Formules utilisées :</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• ρrd = M1 / (M2 - M3) × 1000</li>
            <li>• ρssd = M2 / (M2 - M3) × 1000</li>
            <li>• WA = (M2 - M1) / M1 × 100</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
