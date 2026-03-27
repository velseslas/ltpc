import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle } from "lucide-react";

interface MicroDevalFormProps {
  resultats: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

const GRANULARITES = [
  { value: "10-14", label: "10-14 mm" },
  { value: "4-6.3", label: "4-6.3 mm" },
  { value: "6.3-10", label: "6.3-10 mm" },
  { value: "25-50", label: "25-50 mm" },
];

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

export default function MicroDevalForm({ resultats, onChange }: MicroDevalFormProps) {
  const typeEssai = (resultats.type_essai as string) || "beton";

  const handleChange = (field: string, value: string | number) => {
    const updated = { ...resultats, [field]: value };
    
    const masseInitiale = parseFloat(String(updated.masse_initiale)) || 0;
    const masseFinale = parseFloat(String(updated.masse_finale)) || 0;
    
    if (masseInitiale > 0) {
      const coeffMDE = ((masseInitiale - masseFinale) / masseInitiale) * 100;
      updated.coefficient_mde = parseFloat(coeffMDE.toFixed(1));
    }
    
    onChange(updated);
  };

  const handleTypeChange = (value: string) => {
    onChange({ ...resultats, type_essai: value });
  };

  const coeff = (resultats.coefficient_mde as number) || 0;
  const conformity = coeff > 0 ? getConformity(coeff, typeEssai) : null;
  const specs = getSpecs(typeEssai);

  return (
    <div className="space-y-4">
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
          <CardTitle className="text-lg">Résultats - Essai Micro-Deval en présence d'eau (NF EN 1097-1)</CardTitle>
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
                placeholder="500"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="charge_abrasive">Charge abrasive (g)</Label>
              <Input
                id="charge_abrasive"
                type="number"
                value={(resultats.charge_abrasive as number) || 2500}
                onChange={(e) => handleChange("charge_abrasive", parseInt(e.target.value) || 2500)}
                className="bg-background border-border"
                placeholder="2500"
              />
            </div>
            <div>
              <Label htmlFor="volume_eau">Volume d'eau (ml)</Label>
              <Input
                id="volume_eau"
                type="number"
                value={(resultats.volume_eau as number) || 2500}
                onChange={(e) => handleChange("volume_eau", parseInt(e.target.value) || 2500)}
                className="bg-background border-border"
                placeholder="2500"
              />
            </div>
          </div>

          {/* Résultat principal */}
          <div className="bg-primary/20 border border-primary/30 rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Coefficient Micro-Deval (MDE)</p>
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
                  <span className="text-sm">MDE = {coeff}% → <strong>{conformity.label}</strong> — {conformity.usage}</span>
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
                  • {s.max === Infinity ? `MDE ≥ ${s.min}` : s.min === 0 ? `MDE < ${s.max}` : `${s.min} ≤ MDE < ${s.max}`} : {s.label} ({s.usage})
                </li>
              ))}
            </ul>
          </div>

          {/* Formule */}
          <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <p className="font-medium mb-1 text-foreground">Formule :</p>
            <p>MDE = ((M - m) / M) × 100</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
