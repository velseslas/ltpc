import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface MasseVolumiqueFormProps {
  resultats: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  produit?: string;
}

function isSandProduct(produit?: string): boolean {
  if (!produit) return false;
  const lower = produit.toLowerCase();
  return lower.includes("sable") || lower.includes("0/3") || lower.includes("0/4") || lower.includes("0/5") || lower.includes("0-3") || lower.includes("0-4") || lower.includes("0-5") || lower.includes("0–3") || lower.includes("0–4") || lower.includes("0–5");
}

function isGravelProduct(produit?: string): boolean {
  if (!produit) return false;
  return !isSandProduct(produit);
}

function getProductLabel(produit?: string): string {
  return produit || "Granulat";
}

// Helper to get/set nested module data
function getModule(resultats: Record<string, unknown>, key: string): Record<string, unknown> {
  const v = resultats[key];
  return (v && typeof v === "object" && !Array.isArray(v)) ? v as Record<string, unknown> : {};
}

function getNum(obj: Record<string, unknown>, field: string): number | undefined {
  const v = obj[field];
  return typeof v === "number" ? v : undefined;
}

function displayVal(obj: Record<string, unknown>, field: string): string {
  const v = getNum(obj, field);
  return v !== undefined ? String(v) : "";
}

function displayResult(obj: Record<string, unknown>, field: string): string {
  const v = getNum(obj, field);
  return v !== undefined ? v.toFixed(3) : "--";
}

function formatDensity(v: number | undefined): string {
  return v !== undefined ? v.toFixed(3) : "--";
}

function formatAbsorption(v: number | undefined): string {
  return v !== undefined ? v.toFixed(2) : "--";
}

// Validation warnings
function getWarnings(w1: number | undefined, w2: number | undefined, densiteSec: number | undefined, absorption: number | undefined): string[] {
  const warnings: string[] = [];
  if (w1 !== undefined && w2 !== undefined && w2 <= w1) {
    warnings.push("Erreur saturation SSD : W2 ≤ W1");
  }
  if (densiteSec !== undefined && densiteSec < 2) {
    warnings.push("Valeur suspecte : densité < 2");
  }
  if (absorption !== undefined && absorption > 6) {
    warnings.push("Granulat très poreux : absorption > 6%");
  }
  return warnings;
}

// ─── Sand Module (Pycnometer) ───
function calcSand(data: Record<string, unknown>): Record<string, unknown> {
  const updated = { ...data };
  const A = getNum(updated, "A");
  const B = getNum(updated, "B");
  const C = getNum(updated, "C");
  const D = getNum(updated, "D");
  const W3 = getNum(updated, "W3");
  const W4 = getNum(updated, "W4");

  // W1 = B - A, W2 = C - D
  const W1 = (B !== undefined && A !== undefined) ? B - A : undefined;
  const W2 = (C !== undefined && D !== undefined) ? C - D : undefined;
  updated.W1 = W1;
  updated.W2 = W2;

  // V1 = W2 + W4 - W3, V2 = W1 + W4 - W3
  const V1 = (W2 !== undefined && W4 !== undefined && W3 !== undefined) ? W2 + W4 - W3 : undefined;
  const V2 = (W1 !== undefined && W4 !== undefined && W3 !== undefined) ? W1 + W4 - W3 : undefined;
  updated.V1 = V1;
  updated.V2 = V2;

  // Densities
  updated.densite_seche = (W1 !== undefined && V1 !== undefined && V1 > 0) ? parseFloat((W1 / V1).toFixed(3)) : undefined;
  updated.densite_humide = (W2 !== undefined && V1 !== undefined && V1 > 0) ? parseFloat((W2 / V1).toFixed(3)) : undefined;
  updated.densite_effective = (W1 !== undefined && V2 !== undefined && V2 > 0) ? parseFloat((W1 / V2).toFixed(3)) : undefined;

  // Absorption
  updated.absorption = (W2 !== undefined && W1 !== undefined && W1 > 0) ? parseFloat((((W2 - W1) / W1) * 100).toFixed(2)) : undefined;

  return updated;
}

// ─── Gravel Module (Basket Immersion) ───
function calcGravel(data: Record<string, unknown>): Record<string, unknown> {
  const updated = { ...data };
  const A = getNum(updated, "A");
  const B = getNum(updated, "B");
  const C = getNum(updated, "C");
  const D = getNum(updated, "D");
  const E = getNum(updated, "E");
  const F = getNum(updated, "F");

  const W1 = (B !== undefined && A !== undefined) ? B - A : undefined;
  const W2 = (C !== undefined && D !== undefined) ? C - D : undefined;
  const W5 = (E !== undefined && F !== undefined) ? E - F : undefined;
  updated.W1 = W1;
  updated.W2 = W2;
  updated.W5 = W5;

  // V1 = W2 - W5, V2 = W1 - W5
  const V1 = (W2 !== undefined && W5 !== undefined) ? W2 - W5 : undefined;
  const V2 = (W1 !== undefined && W5 !== undefined) ? W1 - W5 : undefined;
  updated.V1 = V1;
  updated.V2 = V2;

  updated.densite_seche = (W1 !== undefined && V1 !== undefined && V1 > 0) ? parseFloat((W1 / V1).toFixed(3)) : undefined;
  updated.densite_humide = (W2 !== undefined && V1 !== undefined && V1 > 0) ? parseFloat((W2 / V1).toFixed(3)) : undefined;
  updated.densite_effective = (W1 !== undefined && V2 !== undefined && V2 > 0) ? parseFloat((W1 / V2).toFixed(3)) : undefined;
  updated.absorption = (W2 !== undefined && W1 !== undefined && W1 > 0) ? parseFloat((((W2 - W1) / W1) * 100).toFixed(2)) : undefined;

  return updated;
}

const GRAVEL_FRACTIONS = [
  { key: "gravier_4_8", label: "4 – 8 mm" },
  { key: "gravier_8_16", label: "8 – 16 mm" },
  { key: "gravier_16_25", label: "16 – 25 mm" },
];

function getGravelStorageKey(produit?: string): string {
  return "gravier";
}

// ─── Sub-components ───

function SandInputFields({ data, onFieldChange }: { data: Record<string, unknown>; onFieldChange: (field: string, value: string) => void }) {
  return (
    <div data-essai-mobile className="space-y-6">
      {/* Pesées */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Pesées</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { id: "A", label: "A – Tare (g)" },
            { id: "B", label: "B – Poids sec + tare (g)" },
            { id: "C", label: "C – Poids humide + tare (g)" },
            { id: "D", label: "D – Tare (g)" },
          ].map(f => (
            <div key={f.id}>
              <Label htmlFor={`sand_${f.id}`}>{f.label}</Label>
              <Input id={`sand_${f.id}`} type="number" step="0.1" placeholder="0.0"
                className="bg-background border-border mt-1"
                value={displayVal(data, f.id)}
                onChange={e => onFieldChange(f.id, e.target.value)} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">W1 = B − A (poids sec)</p>
            <p className="text-lg font-bold text-foreground">{displayResult(data, "W1")} g</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">W2 = C − D (poids humide)</p>
            <p className="text-lg font-bold text-foreground">{displayResult(data, "W2")} g</p>
          </div>
        </div>
      </div>

      {/* Pycnomètre */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Pycnomètre</h4>
        <div className="grid grid-cols-2 gap-4">
          {[
            { id: "W3", label: "W3 – Pycno + sable + eau (g)" },
            { id: "W4", label: "W4 – Pycno + eau (g)" },
          ].map(f => (
            <div key={f.id}>
              <Label htmlFor={`sand_${f.id}`}>{f.label}</Label>
              <Input id={`sand_${f.id}`} type="number" step="0.1" placeholder="0.0"
                className="bg-background border-border mt-1"
                value={displayVal(data, f.id)}
                onChange={e => onFieldChange(f.id, e.target.value)} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">V1 = W2 + W4 − W3</p>
            <p className="text-lg font-bold text-foreground">{displayResult(data, "V1")}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">V2 = W1 + W4 − W3</p>
            <p className="text-lg font-bold text-foreground">{displayResult(data, "V2")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GravelInputFields({ data, label, onFieldChange }: { data: Record<string, unknown>; label: string; onFieldChange: (field: string, value: string) => void }) {
  return (
    <div className="space-y-6">
      <h4 className="text-sm font-semibold text-foreground">Fraction {label}</h4>
      {/* Pesées */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Pesées</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { id: "A", label: "A – Tare (g)" },
            { id: "B", label: "B – Poids sec + tare (g)" },
            { id: "C", label: "C – Poids humide + tare (g)" },
            { id: "D", label: "D – Tare (g)" },
          ].map(f => (
            <div key={f.id}>
              <Label htmlFor={`grav_${label}_${f.id}`}>{f.label}</Label>
              <Input id={`grav_${label}_${f.id}`} type="number" step="0.1" placeholder="0.0"
                className="bg-background border-border mt-1"
                value={displayVal(data, f.id)}
                onChange={e => onFieldChange(f.id, e.target.value)} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">W1 = B − A</p>
            <p className="text-lg font-bold text-foreground">{displayResult(data, "W1")} g</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">W2 = C − D</p>
            <p className="text-lg font-bold text-foreground">{displayResult(data, "W2")} g</p>
          </div>
        </div>
      </div>

      {/* Panier immersion */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Panier immersion</p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { id: "E", label: "E – Poids humide + panier dans l'eau (g)" },
            { id: "F", label: "F – Poids panier (g)" },
          ].map(f => (
            <div key={f.id}>
              <Label htmlFor={`grav_${label}_${f.id}`}>{f.label}</Label>
              <Input id={`grav_${label}_${f.id}`} type="number" step="0.1" placeholder="0.0"
                className="bg-background border-border mt-1"
                value={displayVal(data, f.id)}
                onChange={e => onFieldChange(f.id, e.target.value)} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4 mt-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">W5 = E − F</p>
            <p className="text-lg font-bold text-foreground">{displayResult(data, "W5")} g</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">V1 = W2 − W5</p>
            <p className="text-lg font-bold text-foreground">{displayResult(data, "V1")}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">V2 = W1 − W5</p>
            <p className="text-lg font-bold text-foreground">{displayResult(data, "V2")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultCards({ data, label }: { data: Record<string, unknown>; label: string }) {
  const ds = getNum(data, "densite_seche");
  const dh = getNum(data, "densite_humide");
  const de = getNum(data, "densite_effective");
  const ab = getNum(data, "absorption");
  const w1 = getNum(data, "W1");
  const w2 = getNum(data, "W2");
  const warnings = getWarnings(w1, w2, ds, ab);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-foreground">{label}</h4>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Densité sèche</p>
          <p className="text-xl font-bold text-primary">{formatDensity(ds)}</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Densité humide (SSD)</p>
          <p className="text-xl font-bold text-primary">{formatDensity(dh)}</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Densité effective</p>
          <p className="text-xl font-bold text-primary">{formatDensity(de)}</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Absorption (%)</p>
          <p className="text-xl font-bold text-primary">{formatAbsorption(ab)} <span className="text-sm font-normal">%</span></p>
        </div>
      </div>
      {warnings.length > 0 && (
        <div className="space-y-1">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {w}
            </div>
          ))}
        </div>
      )}
      {warnings.length === 0 && ds !== undefined && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          Résultats conformes
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───

export default function MasseVolumiqueForm({ resultats, onChange, produit }: MasseVolumiqueFormProps) {
  const showSand = !produit || isSandProduct(produit);
  const showGravel = !produit || isGravelProduct(produit);
  const productLabel = getProductLabel(produit);

  const sandData = getModule(resultats, "sable");
  const gravelKey = getGravelStorageKey(produit);
  const gravelData = getModule(resultats, gravelKey);

  const handleSandChange = (field: string, value: string) => {
    const mod = { ...sandData };
    if (value === "") {
      delete mod[field];
    } else {
      const n = parseFloat(value);
      if (isNaN(n)) return;
      mod[field] = n;
    }
    const calculated = calcSand(mod);
    onChange({ ...resultats, sable: calculated });
  };

  const handleGravelChange = (field: string, value: string) => {
    const mod = { ...gravelData };
    if (value === "") {
      delete mod[field];
    } else {
      const n = parseFloat(value);
      if (isNaN(n)) return;
      mod[field] = n;
    }
    const calculated = calcGravel(mod);
    onChange({ ...resultats, [gravelKey]: calculated });
  };

  const moduleTitle = showSand && !showGravel
    ? `${productLabel} – Méthode Pycnomètre`
    : showGravel && !showSand
      ? `${productLabel} – Méthode Panier immersion`
      : "Masse Volumique & Absorption";

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{moduleTitle} (NF EN 1097-6)</CardTitle>
          <Badge variant="outline" className="text-xs">NF EN 1097-6</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Both modules (no product info) → show tabs */}
        {showSand && showGravel && (
          <Tabs defaultValue="sable" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="sable">🏖️ Sable (Pycnomètre)</TabsTrigger>
              <TabsTrigger value="graviers">🪨 Graviers (Panier immersion)</TabsTrigger>
            </TabsList>
            <TabsContent value="sable" className="space-y-6">
              <SandInputFields data={sandData} onFieldChange={handleSandChange} />
              <ResultCards data={sandData} label="Résultats – Sable" />
              <SandFormulas />
            </TabsContent>
            <TabsContent value="graviers" className="space-y-8">
              <GravelInputFields data={gravelData} label="Gravier" onFieldChange={handleGravelChange} />
              <ResultCards data={gravelData} label="Résultats – Gravier" />
              <GravelFormulas />
            </TabsContent>
          </Tabs>
        )}

        {/* Sand only */}
        {showSand && !showGravel && (
          <div className="space-y-6">
            <SandInputFields data={sandData} onFieldChange={handleSandChange} />
            <ResultCards data={sandData} label={`Résultats – ${productLabel}`} />
            <SandFormulas />
          </div>
        )}

        {/* Gravel only */}
        {showGravel && !showSand && (
          <div className="space-y-6">
            <GravelInputFields data={gravelData} label={productLabel} onFieldChange={handleGravelChange} />
            <ResultCards data={gravelData} label={`Résultats – ${productLabel}`} />
            <GravelFormulas />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SandFormulas() {
  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <p className="text-sm font-medium text-foreground mb-2">Formules (Pycnomètre) :</p>
      <ul className="text-sm text-muted-foreground space-y-1">
        <li>• W1 = B − A &nbsp;|&nbsp; W2 = C − D</li>
        <li>• V1 = W2 + W4 − W3 &nbsp;|&nbsp; V2 = W1 + W4 − W3</li>
        <li>• Densité sèche = W1 / V1</li>
        <li>• Densité humide = W2 / V1</li>
        <li>• Densité effective = W1 / V2</li>
        <li>• Absorption = (W2 − W1) / W1 × 100</li>
      </ul>
    </div>
  );
}

function GravelFormulas() {
  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <p className="text-sm font-medium text-foreground mb-2">Formules (Panier immersion) :</p>
      <ul className="text-sm text-muted-foreground space-y-1">
        <li>• W1 = B − A &nbsp;|&nbsp; W2 = C − D &nbsp;|&nbsp; W5 = E − F</li>
        <li>• V1 = W2 − W5 &nbsp;|&nbsp; V2 = W1 − W5</li>
        <li>• Densité sèche = W1 / V1</li>
        <li>• Densité humide = W2 / V1</li>
        <li>• Densité effective = W1 / V2</li>
        <li>• Absorption = (W2 − W1) / W1 × 100</li>
      </ul>
    </div>
  );
}
