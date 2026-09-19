import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";

interface EquivalentSableFormProps {
  resultats: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

const SPECS_BETON = [
  { min: 80, max: Infinity, label: "Sable très propre", usage: "Béton de haute qualité" },
  { min: 70, max: 80, label: "Sable propre", usage: "Béton courant" },
  { min: 60, max: 70, label: "Sable légèrement argileux", usage: "Tolérable sous conditions" },
  { min: 0, max: 60, label: "Sable argileux", usage: "Impropre au béton" },
];

const SPECS_GEO = [
  { min: 40, max: Infinity, label: "Sol sableux propre", usage: "Remblai, couche de forme" },
  { min: 20, max: 40, label: "Sol légèrement argileux", usage: "Sous réserve d'étude" },
  { min: 10, max: 20, label: "Sol argileux", usage: "Déconseillé pour remblai" },
  { min: 0, max: 10, label: "Sol très argileux", usage: "Impropre" },
];

const SPECS_ROUTE = [
  { min: 50, max: Infinity, label: "Sable très propre", usage: "Couche de roulement, enrobés" },
  { min: 40, max: 50, label: "Sable propre", usage: "Couche de base" },
  { min: 30, max: 40, label: "Sable légèrement argileux", usage: "Couche de fondation" },
  { min: 20, max: 30, label: "Sable argileux", usage: "Sous couche, remblai technique" },
  { min: 0, max: 20, label: "Sable très argileux", usage: "Impropre pour corps de chaussée" },
];

function getSpecs(type: string) {
  if (type === "geotechnique") return SPECS_GEO;
  if (type === "route") return SPECS_ROUTE;
  return SPECS_BETON;
}

function getConformity(es: number, type: string) {
  const specs = getSpecs(type);
  const spec = specs.find(s => es >= s.min && es < s.max);
  if (!spec) return null;
  const conforme = type === "geotechnique" ? es >= 20 : type === "route" ? es >= 40 : es >= 60;
  return { ...spec, conforme };
}

export default function EquivalentSableForm({ resultats, onChange }: EquivalentSableFormProps) {
  const typeEssai = (resultats.type_essai as string) || "";

  const recalculate = (data: Record<string, unknown>): Record<string, unknown> => {
    const updated = { ...data };

    const mh1 = Number(updated.mh_essai1) || 0;
    const ms1 = Number(updated.ms_essai1) || 0;
    const mh2 = Number(updated.mh_essai2) || 0;
    const ms2 = Number(updated.ms_essai2) || 0;

    const w1 = ms1 > 0 ? ((mh1 - ms1) / ms1) * 100 : 0;
    const w2 = ms2 > 0 ? ((mh2 - ms2) / ms2) * 100 : 0;
    const wMoy = (w1 !== 0 && w2 !== 0) ? (w1 + w2) / 2 : (w1 !== 0 ? w1 : w2);

    updated.w_essai1 = parseFloat(w1.toFixed(2));
    updated.w_essai2 = parseFloat(w2.toFixed(2));
    updated.w_moyen = parseFloat(wMoy.toFixed(2));

    const h1_1 = Number(updated.h1_essai1) || 0;
    const h2_1 = Number(updated.h2_essai1) || 0;
    const h2p_1 = Number(updated.h2p_essai1) || 0;
    const h1_2 = Number(updated.h1_essai2) || 0;
    const h2_2 = Number(updated.h2_essai2) || 0;
    const h2p_2 = Number(updated.h2p_essai2) || 0;

    const esv1 = h1_1 > 0 ? (h2_1 / h1_1) * 100 : 0;
    const esv2 = h1_2 > 0 ? (h2_2 / h1_2) * 100 : 0;
    const esvMoy = (esv1 !== 0 && esv2 !== 0) ? (esv1 + esv2) / 2 : (esv1 !== 0 ? esv1 : esv2);

    updated.esv_essai1 = parseFloat(esv1.toFixed(2));
    updated.esv_essai2 = parseFloat(esv2.toFixed(2));
    updated.esv_moyen = parseFloat(esvMoy.toFixed(2));

    const esp1 = h1_1 > 0 ? (h2p_1 / h1_1) * 100 : 0;
    const esp2 = h1_2 > 0 ? (h2p_2 / h1_2) * 100 : 0;
    const espMoy = (esp1 !== 0 && esp2 !== 0) ? (esp1 + esp2) / 2 : (esp1 !== 0 ? esp1 : esp2);

    updated.esp_essai1 = parseFloat(esp1.toFixed(2));
    updated.esp_essai2 = parseFloat(esp2.toFixed(2));
    updated.esp_moyen = parseFloat(espMoy.toFixed(2));

    updated.es_essai1 = updated.esv_essai1;
    updated.es_essai2 = updated.esv_essai2;
    updated.es_moyen = updated.esv_moyen;

    return updated;
  };

  const handleChange = (field: string, value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    const updated = recalculate({ ...resultats, [field]: numValue });
    onChange(updated);
  };

  const handleTypeChange = (value: string) => {
    onChange({ ...resultats, type_essai: value });
  };

  const val = (key: string) => {
    const v = resultats[key];
    return v != null ? String(v) : "";
  };

  const display = (key: string, suffix = "") => {
    const v = resultats[key] as number;
    return v != null && v !== 0 ? `${v}${suffix}` : "--";
  };

  const esvMoy = (resultats.esv_moyen as number) || 0;
  const espMoy = (resultats.esp_moyen as number) || 0;
  const conformityEsv = esvMoy > 0 ? getConformity(esvMoy, typeEssai) : null;
  const conformityEsp = espMoy > 0 ? getConformity(espMoy, typeEssai) : null;
  const specs = getSpecs(typeEssai);

  const fields: { label: string; unit: string; key1: string; key2: string; readonly?: boolean }[] = [
    { label: "Poids humide de la prise d'essai (mh)", unit: "g", key1: "mh_essai1", key2: "mh_essai2" },
    { label: "Poids sec de la prise d'essai (ms)", unit: "g", key1: "ms_essai1", key2: "ms_essai2" },
    { label: "Teneur en eau", unit: "%", key1: "w_essai1", key2: "w_essai2", readonly: true },
    { label: "Hauteur du floculat (h1)", unit: "cm", key1: "h1_essai1", key2: "h1_essai2" },
    { label: "Hauteur du sable visuelle (h2)", unit: "cm", key1: "h2_essai1", key2: "h2_essai2" },
    { label: "Hauteur du sable piston (h'2)", unit: "cm", key1: "h2p_essai1", key2: "h2p_essai2" },
    { label: "Équivalent de sable visuel ESv", unit: "%", key1: "esv_essai1", key2: "esv_essai2", readonly: true },
    { label: "Équivalent de sable piston ESp", unit: "%", key1: "esp_essai1", key2: "esp_essai2", readonly: true },
  ];

  return (
    <div data-essai-mobile className="space-y-4">
      {/* Type d'essai selector */}
      <Card className="border-border bg-card">
        <CardContent className="pt-4">
          <div className="max-w-xs">
            <Label className="text-sm font-medium text-foreground">
              Type d'essai <span className="text-destructive">*</span>
            </Label>
            <Select value={typeEssai} onValueChange={handleTypeChange}>
              <SelectTrigger className={`mt-1 ${!typeEssai ? "animate-border-blink border-destructive" : ""}`}>
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
          <CardTitle className="text-lg">Expression des résultats - Équivalent de Sable (NF EN 933-8)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/60">
                  <th className="border border-border px-3 py-2.5 text-left font-medium text-foreground w-1/2">Échantillon N°</th>
                  <th className="border border-border px-3 py-2.5 text-center font-medium text-foreground w-16">Unité</th>
                  <th className="border border-border px-3 py-2.5 text-center font-medium text-foreground">1</th>
                  <th className="border border-border px-3 py-2.5 text-center font-medium text-foreground">2</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((f, i) => (
                  <tr key={i} className={f.readonly ? "bg-muted/30" : ""}>
                    <td className="border border-border px-3 py-2 text-foreground">{f.label}</td>
                    <td className="border border-border px-3 py-2 text-center text-muted-foreground">({f.unit})</td>
                    <td className="border border-border px-1 py-1 text-center">
                      {f.readonly ? (
                        <span className="font-medium text-foreground">{display(f.key1)}</span>
                      ) : (
                        <Input
                          type="number"
                          step="0.01"
                          value={val(f.key1)}
                          onChange={(e) => handleChange(f.key1, e.target.value)}
                          className="bg-background border-border text-center h-8"
                          placeholder="0.0"
                        />
                      )}
                    </td>
                    <td className="border border-border px-1 py-1 text-center">
                      {f.readonly ? (
                        <span className="font-medium text-foreground">{display(f.key2)}</span>
                      ) : (
                        <Input
                          type="number"
                          step="0.01"
                          value={val(f.key2)}
                          onChange={(e) => handleChange(f.key2, e.target.value)}
                          className="bg-background border-border text-center h-8"
                          placeholder="0.0"
                        />
                      )}
                    </td>
                  </tr>
                ))}

                <tr className="bg-muted/30">
                  <td className="border border-border px-3 py-2 text-foreground font-medium">Moyenne teneur en eau (W moy)</td>
                  <td className="border border-border px-3 py-2 text-center text-muted-foreground">(%)</td>
                  <td colSpan={2} className="border border-border px-3 py-2 text-center">
                    <span className="text-lg font-bold text-primary">{display("w_moyen", " %")}</span>
                  </td>
                </tr>

                <tr className="bg-primary/10">
                  <td className="border border-border px-3 py-2 text-foreground font-medium">Moyenne (ESv % moy)</td>
                  <td className="border border-border px-3 py-2 text-center text-muted-foreground">(%)</td>
                  <td colSpan={2} className="border border-border px-3 py-2 text-center">
                    <span className="text-xl font-bold text-primary">{display("esv_moyen", " %")}</span>
                  </td>
                </tr>

                <tr className="bg-primary/10">
                  <td className="border border-border px-3 py-2 text-foreground font-medium">Moyenne (ESp % moy)</td>
                  <td className="border border-border px-3 py-2 text-center text-muted-foreground">(%)</td>
                  <td colSpan={2} className="border border-border px-3 py-2 text-center">
                    <span className="text-xl font-bold text-primary">{display("esp_moyen", " %")}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Conformité */}
          {(conformityEsv || conformityEsp) && (
            <Card className={`border-2 ${conformityEsv?.conforme ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" : "border-red-500/50 bg-red-50/50 dark:bg-red-950/20"}`}>
              <CardContent className="pt-4 space-y-2">
                <p className="text-sm font-semibold text-foreground">Conformité ({typeEssai === "geotechnique" ? "Géotechnique" : typeEssai === "route" ? "Route" : "Béton"}) :</p>
                {conformityEsv && (
                  <div className="flex items-center gap-2">
                    {conformityEsv.conforme ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
                    <span className="text-sm">ESv = {esvMoy}% → <strong>{conformityEsv.label}</strong> — {conformityEsv.usage}</span>
                  </div>
                )}
                {conformityEsp && (
                  <div className="flex items-center gap-2">
                    {conformityEsp.conforme ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
                    <span className="text-sm">ESp = {espMoy}% → <strong>{conformityEsp.label}</strong> — {conformityEsp.usage}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Spécifications */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium text-foreground mb-2">
              Spécification ({typeEssai === "geotechnique" ? "Géotechnique" : typeEssai === "route" ? "Route" : "Béton"}) :
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {specs.map((s, i) => (
                <li key={i}>
                  • {s.min === 0 ? `ES < ${s.max}` : s.max === Infinity ? `ES ≥ ${s.min}` : `${s.min} ≤ ES < ${s.max}`} : {s.label} ({s.usage})
                </li>
              ))}
            </ul>
          </div>

          {/* Formules */}
          <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <p className="font-medium mb-1 text-foreground">Formules :</p>
            <p>W = ((mh - ms) / ms) × 100</p>
            <p>ESv = (h2 / h1) × 100 &nbsp;|&nbsp; ESp = (h'2 / h1) × 100</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
