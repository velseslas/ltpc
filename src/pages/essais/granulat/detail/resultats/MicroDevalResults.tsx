import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

interface MicroDevalResultsProps {
  resultats: Record<string, unknown>;
}

const SPECS_BETON = [
  { min: 0, max: 10, label: "MDE10 - Excellente résistance", usage: "Béton de haute qualité" },
  { min: 10, max: 15, label: "MDE15 - Très bonne résistance", usage: "Béton hydraulique" },
  { min: 15, max: 20, label: "MDE20 - Bonne résistance", usage: "Béton courant" },
  { min: 20, max: 25, label: "MDE25 - Résistance moyenne", usage: "Tolérable sous conditions" },
  { min: 25, max: Infinity, label: "Non conforme", usage: "Impropre au béton" },
];

const SPECS_GEO = [
  { min: 0, max: 20, label: "Bonne résistance à l'usure", usage: "Couche de forme, remblai technique" },
  { min: 20, max: 35, label: "Résistance acceptable", usage: "Remblai courant" },
  { min: 35, max: 45, label: "Résistance faible", usage: "Sous réserve d'étude" },
  { min: 45, max: Infinity, label: "Résistance insuffisante", usage: "Impropre" },
];

const SPECS_ROUTE = [
  { min: 0, max: 15, label: "MDE15 - Excellente résistance", usage: "Couche de roulement, enrobés" },
  { min: 15, max: 20, label: "MDE20 - Bonne résistance", usage: "Couche de base" },
  { min: 20, max: 25, label: "MDE25 - Résistance moyenne", usage: "Couche de fondation" },
  { min: 25, max: 35, label: "MDE35 - Résistance acceptable", usage: "Sous couche" },
  { min: 35, max: Infinity, label: "Non conforme", usage: "Impropre pour corps de chaussée" },
];

function getSpecs(type: string) {
  if (type === "geotechnique") return SPECS_GEO;
  if (type === "route") return SPECS_ROUTE;
  return SPECS_BETON;
}

function getConformity(mde: number, type: string) {
  const specs = getSpecs(type);
  const spec = specs.find(s => mde >= s.min && mde < s.max);
  if (!spec) return null;
  const conforme = type === "geotechnique" ? mde <= 35 : type === "route" ? mde <= 25 : mde <= 25;
  return { ...spec, conforme };
}

const typeLabel = (t: string) => t === "geotechnique" ? "Géotechnique" : t === "route" ? "Route" : "Béton";

export default function MicroDevalResults({ resultats }: MicroDevalResultsProps) {
  const typeEssai = (resultats.type_essai as string) || "beton";
  const coeff = (resultats.coefficient_mde as number) || 0;
  const conformity = coeff > 0 ? getConformity(coeff, typeEssai) : null;
  const specs = getSpecs(typeEssai);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div data-essai-mobile className="flex items-center justify-between">
          <CardTitle className="text-lg">Résultats - Essai Micro-Deval (NF EN 1097-1)</CardTitle>
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
          <p className="text-sm text-muted-foreground mb-2">Coefficient Micro-Deval (MDE)</p>
          <p className="text-4xl font-bold text-primary">{coeff || "--"} %</p>
        </div>

        {conformity && (
          <Card className={`border-2 ${conformity.conforme ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" : "border-red-500/50 bg-red-50/50 dark:bg-red-950/20"}`}>
            <CardContent className="pt-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">Conformité ({typeLabel(typeEssai)}) :</p>
              <div className="flex items-center gap-2">
                {conformity.conforme ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
                <span className="text-sm">MDE = {coeff}% → <strong>{conformity.label}</strong> — {conformity.usage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm font-medium text-foreground mb-2">Spécification ({typeLabel(typeEssai)}) :</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {specs.map((s, i) => (
              <li key={i}>
                • {s.max === Infinity ? `MDE ≥ ${s.min}` : s.min === 0 ? `MDE < ${s.max}` : `${s.min} ≤ MDE < ${s.max}`} : {s.label} ({s.usage})
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
