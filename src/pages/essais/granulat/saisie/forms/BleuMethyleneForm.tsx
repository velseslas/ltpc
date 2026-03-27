import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";

interface BleuMethyleneFormProps {
  resultats: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

const SPECS_BETON = [
  { min: 0, max: 0.5, label: "Sable propre", usage: "Béton de haute qualité" },
  { min: 0.5, max: 1.5, label: "Sable légèrement argileux", usage: "Béton courant" },
  { min: 1.5, max: 2.5, label: "Sable argileux", usage: "Tolérable sous conditions" },
  { min: 2.5, max: Infinity, label: "Sable très argileux", usage: "Impropre au béton" },
];

const SPECS_GEO = [
  { min: 0, max: 1.5, label: "Sol peu sensible à l'eau", usage: "Remblai, couche de forme" },
  { min: 1.5, max: 2.5, label: "Sol sensible à l'eau", usage: "Sous réserve d'étude" },
  { min: 2.5, max: 6, label: "Sol argileux", usage: "Traitement nécessaire" },
  { min: 6, max: Infinity, label: "Sol très argileux", usage: "Impropre" },
];

const SPECS_ROUTE = [
  { min: 0, max: 1, label: "Sable très propre", usage: "Couche de roulement, enrobés" },
  { min: 1, max: 1.5, label: "Sable propre", usage: "Couche de base" },
  { min: 1.5, max: 2, label: "Sable légèrement argileux", usage: "Couche de fondation" },
  { min: 2, max: Infinity, label: "Sable argileux", usage: "Impropre pour corps de chaussée" },
];

function getSpecs(type: string) {
  if (type === "geotechnique") return SPECS_GEO;
  if (type === "route") return SPECS_ROUTE;
  return SPECS_BETON;
}

function getConformity(mb: number, type: string) {
  const specs = getSpecs(type);
  const spec = specs.find(s => mb >= s.min && mb < s.max);
  if (!spec) return null;
  const conforme = type === "geotechnique" ? mb <= 2.5 : type === "route" ? mb <= 2 : mb <= 1.5;
  return { ...spec, conforme };
}

const typeLabel = (t: string) => t === "geotechnique" ? "Géotechnique" : t === "route" ? "Route" : "Béton";

export default function BleuMethyleneForm({ resultats, onChange }: BleuMethyleneFormProps) {
  const typeEssai = (resultats.type_essai as string) || "beton";

  const handleChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updated = { ...resultats, [field]: numValue };
    
    const v1 = (updated.volume_bleu as number) || 0;
    const m1 = (updated.masse_echantillon as number) || 0;
    const mb = m1 > 0 ? (v1 / m1) * 10 : 0;
    updated.valeur_mb = parseFloat(mb.toFixed(2));
    
    onChange(updated);
  };

  const handleTypeChange = (value: string) => {
    onChange({ ...resultats, type_essai: value });
  };

  const mb = (resultats.valeur_mb as number) || 0;
  const conformity = mb > 0 ? getConformity(mb, typeEssai) : null;
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
              {mb || "--"} g/kg
            </p>
          </div>

          {/* Conformité */}
          {conformity && (
            <Card className={`border-2 ${conformity.conforme ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" : "border-red-500/50 bg-red-50/50 dark:bg-red-950/20"}`}>
              <CardContent className="pt-4 space-y-2">
                <p className="text-sm font-semibold text-foreground">Conformité ({typeLabel(typeEssai)}) :</p>
                <div className="flex items-center gap-2">
                  {conformity.conforme ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
                  <span className="text-sm">MB = {mb} g/kg → <strong>{conformity.label}</strong> — {conformity.usage}</span>
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
                  • {s.max === Infinity ? `MB ≥ ${s.min}` : s.min === 0 ? `MB < ${s.max}` : `${s.min} ≤ MB < ${s.max}`} : {s.label} ({s.usage})
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
