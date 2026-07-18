import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle } from "lucide-react";

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

export default function LosAngelesForm({ resultats, onChange }: LosAngelesFormProps) {
  const typeEssai = (resultats.type_essai as string) || "beton";

  const handleChange = (field: string, value: string | number) => {
    const updated = { ...resultats, [field]: typeof value === "string" ? value : value };
    
    const masseInitiale = parseFloat(String(updated.masse_initiale)) || 0;
    const masseFinale = parseFloat(String(updated.masse_finale)) || 0;
    
    if (masseInitiale > 0) {
      const coeffLA = ((masseInitiale - masseFinale) / masseInitiale) * 100;
      updated.coefficient_la = parseFloat(coeffLA.toFixed(1));
    }
    
    onChange(updated);
  };

  const handleTypeChange = (value: string) => {
    onChange({ ...resultats, type_essai: value });
  };

  const coeff = (resultats.coefficient_la as number) || 0;
  const conformity = coeff > 0 ? getConformity(coeff, typeEssai) : null;
  const specs = getSpecs(typeEssai);

  return (
    <div data-essai-mobile className="space-y-4">
      {/* Type d'essai */}
      <Card className="border-border bg-card">
        <CardContent className="pt-4">
          <div className="max-w-xs">
            <Label className="text-sm font-medium text-foreground">Type d'essai</Label>
            <Select value={typeEssai} onValueChange={handleTypeChange}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner le type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beton">Béton</SelectItem>
                <SelectItem value="geotechnique">Géotechnique</SelectItem>
                <SelectItem value="route">Route</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

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
          </div>

          {/* Conformité */}
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

          {/* Spécifications */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium text-foreground mb-2">
              Spécification ({typeLabel(typeEssai)}) :
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {specs.map((s, i) => (
                <li key={i}>
                  • {s.max === Infinity ? `LA ≥ ${s.min}` : s.min === 0 ? `LA < ${s.max}` : `${s.min} ≤ LA < ${s.max}`} : {s.label} ({s.usage})
                </li>
              ))}
            </ul>
          </div>

          {/* Formule */}
          <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <p className="font-medium mb-1 text-foreground">Formule :</p>
            <p>LA = ((M - m) / M) × 100</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
