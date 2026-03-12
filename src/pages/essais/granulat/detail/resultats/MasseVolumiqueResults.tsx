import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface MasseVolumiqueResultsProps {
  resultats: Record<string, unknown>;
}

function getModule(resultats: Record<string, unknown>, key: string): Record<string, unknown> {
  const v = resultats[key];
  return (v && typeof v === "object" && !Array.isArray(v)) ? v as Record<string, unknown> : {};
}

function getNum(obj: Record<string, unknown>, field: string): number | undefined {
  const v = obj[field];
  return typeof v === "number" ? v : undefined;
}

function fmt3(v: number | undefined): string { return v !== undefined ? v.toFixed(3) : "-"; }
function fmt2(v: number | undefined): string { return v !== undefined ? v.toFixed(2) : "-"; }

function getWarnings(data: Record<string, unknown>): string[] {
  const w: string[] = [];
  const w1 = getNum(data, "W1"), w2 = getNum(data, "W2"), ds = getNum(data, "densite_seche"), ab = getNum(data, "absorption");
  if (w1 !== undefined && w2 !== undefined && w2 <= w1) w.push("Erreur saturation SSD");
  if (ds !== undefined && ds < 2) w.push("Valeur suspecte : densité < 2");
  if (ab !== undefined && ab > 6) w.push("Granulat très poreux : absorption > 6%");
  return w;
}

function ModuleResults({ data, label, method }: { data: Record<string, unknown>; label: string; method: string }) {
  const ds = getNum(data, "densite_seche");
  const dh = getNum(data, "densite_humide");
  const de = getNum(data, "densite_effective");
  const ab = getNum(data, "absorption");
  const warnings = getWarnings(data);
  const hasData = ds !== undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-foreground">{label}</h3>
        <Badge variant="outline" className="text-xs">{method}</Badge>
      </div>

      {/* Raw measurements */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        {["W1", "W2", ...(data.W5 !== undefined ? ["W5"] : []), "V1", "V2"].map(k => (
          <div key={k}>
            <p className="text-muted-foreground">{k}</p>
            <p className="font-medium text-foreground">{getNum(data, k) ?? "-"} g</p>
          </div>
        ))}
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Densité sèche</p>
          <p className="text-xl font-bold text-primary">{fmt3(ds)}</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Densité humide</p>
          <p className="text-xl font-bold text-primary">{fmt3(dh)}</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Densité effective</p>
          <p className="text-xl font-bold text-primary">{fmt3(de)}</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Absorption</p>
          <p className="text-xl font-bold text-primary">{fmt2(ab)} %</p>
        </div>
      </div>

      {warnings.length > 0 && warnings.map((w, i) => (
        <div key={i} className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          <AlertTriangle className="h-4 w-4" /> {w}
        </div>
      ))}
      {warnings.length === 0 && hasData && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4" /> Résultats conformes
        </div>
      )}
    </div>
  );
}

export default function MasseVolumiqueResults({ resultats }: MasseVolumiqueResultsProps) {
  const sandData = getModule(resultats, "sable");
  const genericGravelData = getModule(resultats, "gravier");
  const gravelFractions = [
    { key: "gravier_4_8", label: "Graviers 4–8 mm" },
    { key: "gravier_8_16", label: "Graviers 8–16 mm" },
    { key: "gravier_16_25", label: "Graviers 16–25 mm" },
  ];

  const hasSand = Object.keys(sandData).length > 0;
  const hasGenericGravel = Object.keys(genericGravelData).length > 0;
  const hasGravel = hasGenericGravel || gravelFractions.some(f => Object.keys(getModule(resultats, f.key)).length > 0);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Résultats – Masse Volumique & Absorption (NF EN 1097-6)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {hasSand && (
          <ModuleResults data={sandData} label="Sable 0–4 mm" method="Pycnomètre" />
        )}
        {hasGenericGravel && (
          <ModuleResults data={genericGravelData} label="Graviers" method="Panier immersion" />
        )}
        {gravelFractions.map(f => {
          const data = getModule(resultats, f.key);
          if (Object.keys(data).length === 0) return null;
          return <ModuleResults key={f.key} data={data} label={f.label} method="Panier immersion" />;
        })}
        {!hasSand && !hasGravel && (
          <p className="text-center text-muted-foreground py-4">Aucun résultat disponible</p>
        )}
      </CardContent>
    </Card>
  );
}
