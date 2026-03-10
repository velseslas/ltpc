import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MasseVolumiqueFormProps {
  resultats: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export default function MasseVolumiqueForm({ resultats, onChange }: MasseVolumiqueFormProps) {
  const getNum = (field: string): number | undefined => {
    const v = resultats[field];
    return typeof v === "number" ? v : undefined;
  };

  const handleChange = (field: string, value: string) => {
    const updated = { ...resultats };

    if (value === "" || value === undefined) {
      delete updated[field];
    } else {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return;
      updated[field] = numValue;
    }

    // Calculs automatiques
    const masseSeche = typeof updated.masse_seche === "number" ? updated.masse_seche : 0;
    const masseSaturee = typeof updated.masse_saturee === "number" ? updated.masse_saturee : 0;
    const masseImmergee = typeof updated.masse_immergee === "number" ? updated.masse_immergee : 0;

    const denominator = masseSaturee - masseImmergee;
    if (denominator > 0 && masseSeche > 0) {
      // Masse volumique réelle (ρrd)
      const mvReelle = (masseSeche / denominator) * 1000;
      updated.mv_reelle = parseFloat(mvReelle.toFixed(0));

      // Masse volumique saturée surface sèche (ρssd)
      const mvSsd = (masseSaturee / denominator) * 1000;
      updated.mv_ssd = parseFloat(mvSsd.toFixed(0));

      // Masse volumique apparente (ρa)
      const denominatorApp = masseSeche - masseImmergee;
      if (denominatorApp > 0) {
        const mvApparente = (masseSeche / denominatorApp) * 1000;
        updated.mv_apparente = parseFloat(mvApparente.toFixed(0));
      }

      // Coefficient d'absorption d'eau (WA)
      const absorption = ((masseSaturee - masseSeche) / masseSeche) * 100;
      updated.absorption = parseFloat(absorption.toFixed(2));
    } else {
      delete updated.mv_reelle;
      delete updated.mv_ssd;
      delete updated.mv_apparente;
      delete updated.absorption;
    }

    onChange(updated);
  };

  const displayValue = (field: string): string => {
    const v = getNum(field);
    return v !== undefined ? String(v) : "";
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
              value={displayValue("masse_seche")}
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
              value={displayValue("masse_saturee")}
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
              value={displayValue("masse_immergee")}
              onChange={(e) => handleChange("masse_immergee", e.target.value)}
              className="bg-background border-border"
              placeholder="0.0"
            />
          </div>
        </div>

        {/* Résultats calculés */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Masse volumique réelle ρrd</p>
            <p className="text-2xl font-bold text-primary">
              {getNum("mv_reelle") ?? "--"} <span className="text-sm font-normal">kg/m³</span>
            </p>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Masse volumique SSD ρssd</p>
            <p className="text-2xl font-bold text-primary">
              {getNum("mv_ssd") ?? "--"} <span className="text-sm font-normal">kg/m³</span>
            </p>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Masse volumique apparente ρa</p>
            <p className="text-2xl font-bold text-primary">
              {getNum("mv_apparente") ?? "--"} <span className="text-sm font-normal">kg/m³</span>
            </p>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Absorption d'eau WA</p>
            <p className="text-2xl font-bold text-primary">
              {getNum("absorption") ?? "--"} <span className="text-sm font-normal">%</span>
            </p>
          </div>
        </div>

        {/* Formules */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm font-medium text-foreground mb-2">Formules utilisées :</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• ρrd = M1 / (M2 - M3) × ρw</li>
            <li>• ρssd = M2 / (M2 - M3) × ρw</li>
            <li>• ρa = M1 / (M1 - M3) × ρw</li>
            <li>• WA = (M2 - M1) / M1 × 100</li>
            <li className="text-xs mt-1">Où ρw = 1000 kg/m³</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
