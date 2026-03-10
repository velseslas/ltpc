import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MasseVolumiqueResultsProps {
  resultats: Record<string, unknown>;
}

export default function MasseVolumiqueResults({ resultats }: MasseVolumiqueResultsProps) {
  const getVal = (field: string) => {
    const v = resultats[field];
    return typeof v === "number" ? v : null;
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Résultats - Masse Volumique (NF EN 1097-6)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Masse sèche M1</p>
            <p className="font-medium text-foreground">{getVal("masse_seche") ?? "-"} g</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Masse saturée surface sèche M2</p>
            <p className="font-medium text-foreground">{getVal("masse_saturee") ?? "-"} g</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Masse immergée M3</p>
            <p className="font-medium text-foreground">{getVal("masse_immergee") ?? "-"} g</p>
          </div>
        </div>

        {/* Résultats calculés */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Masse volumique réelle ρrd</p>
            <p className="text-2xl font-bold text-primary">
              {getVal("mv_reelle") ?? "--"} <span className="text-sm font-normal">kg/m³</span>
            </p>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Masse volumique SSD ρssd</p>
            <p className="text-2xl font-bold text-primary">
              {getVal("mv_ssd") ?? "--"} <span className="text-sm font-normal">kg/m³</span>
            </p>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Masse volumique apparente ρa</p>
            <p className="text-2xl font-bold text-primary">
              {getVal("mv_apparente") ?? "--"} <span className="text-sm font-normal">kg/m³</span>
            </p>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Absorption d'eau WA</p>
            <p className="text-2xl font-bold text-primary">
              {getVal("absorption") ?? "--"} <span className="text-sm font-normal">%</span>
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
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
