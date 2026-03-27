import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

interface LosAngelesResultsProps {
  resultats: Record<string, unknown>;
}

const SPECS_BETON = [
  { min: 0, max: 20, label: "LA20 - Excellente résistance", usage: "Béton de haute qualité" },
  { min: 20, max: 25, label: "LA25 - Bonne résistance", usage: "Béton hydraulique" },
  { min: 25, max: 30, label: "LA30 - Résistance moyenne", usage: "Béton courant" },
  { min: 30, max: 40, label: "LA40 - Résistance faible", usage: "Tolérable sous conditions" },
  { min: 40, max: Infinity, label: "Non conforme", usage: "Impropre au béton" },
];

const SPECS_GEO = [
  { min: 0, max: 25, label: "Bonne résistance", usage: "Couche de forme, remblai technique" },
  { min: 25, max: 35, label: "Résistance acceptable", usage: "Remblai courant" },
  { min: 35, max: 45, label: "Résistance faible", usage: "Sous réserve d'étude" },
  { min: 45, max: Infinity, label: "Résistance insuffisante", usage: "Impropre" },
];

const SPECS_ROUTE = [
  { min: 0, max: 20, label: "LA20 - Excellente résistance", usage: "Couche de roulement, enrobés" },
  { min: 20, max: 25, label: "LA25 - Bonne résistance", usage: "Couche de base" },
  { min: 25, max: 30, label: "LA30 - Résistance moyenne", usage: "Couche de fondation" },
  { min: 30, max: 40, label: "LA40 - Résistance acceptable", usage: "Sous couche" },
  { min: 40, max: Infinity, label: "Non conforme", usage: "Impropre pour corps de chaussée" },
];

function getSpecs(type: string) {
  if (type === "geotechnique") return SPECS_GEO;
  if (type === "route") return SPECS_ROUTE;
  return SPECS_BETON;
}

function getConformity(la: number, type: string) {
  const specs = getSpecs(type);
  const spec = specs.find(s => la >= s.min && la < s.max);
  if (!spec) return null;
  const conforme = type === "geotechnique" ? la <= 35 : type === "route" ? la <= 30 : la <= 40;
  return { ...spec, conforme };
}

const typeLabel = (t: string) => t === "geotechnique" ? "Géotechnique" : t === "route" ? "Route" : "Béton";

export default function LosAngelesResults({ resultats }: LosAngelesResultsProps) {
  const typeEssai = (resultats.type_essai as string) || "beton";
  const coeff = (resultats.coefficient_la as number) || 0;
  const conformity = coeff > 0 ? getConformity(coeff, typeEssai) : null;
  const specs = getSpecs(typeEssai);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Résultats - Essai Los Angeles (NF EN 1097-2)</CardTitle>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
            {typeLabel(typeEssai)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Classe granulaire</p>
            <p className="font-medium text-foreground">{(resultats.granularite as string) || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Masse initiale M</p>
            <p className="font-medium text-foreground">{(resultats.masse_initiale as number) || "-"} g</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Masse finale m</p>
            <p className="font-medium text-foreground">{(resultats.masse_finale as number) || "-"} g</p>
          </div>
        </div>

        <div className="bg-primary/20 border border-primary/30 rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Coefficient Los Angeles (LA)</p>
          <p className="text-4xl font-bold text-primary">{coeff || "--"} %</p>
        </div>

        {conformity && (
          <Card className={`border-2 ${conformity.conforme ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" : "border-red-500/50 bg-red-50/50 dark:bg-red-950/20"}`}>
            <CardContent className="pt-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">Conformité ({typeLabel(typeEssai)}) :</p>
              <div className="flex items-center gap-2">
                {conformity.conforme ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
                <span className="text-sm">LA = {coeff}% → <strong>{conformity.label}</strong> — {conformity.usage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm font-medium text-foreground mb-2">Spécification ({typeLabel(typeEssai)}) :</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {specs.map((s, i) => (
              <li key={i}>
                • {s.max === Infinity ? `LA ≥ ${s.min}` : s.min === 0 ? `LA < ${s.max}` : `${s.min} ≤ LA < ${s.max}`} : {s.label} ({s.usage})
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
