import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

interface EquivalentSableResultsProps {
  resultats: Record<string, unknown>;
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

function getConformity(es: number, type: string) {
  const specs = type === "geotechnique" ? SPECS_GEO : SPECS_BETON;
  const spec = specs.find(s => es >= s.min && es < s.max);
  if (!spec) return null;
  const conforme = type === "geotechnique" ? es >= 20 : es >= 60;
  return { ...spec, conforme };
}

export default function EquivalentSableResults({ resultats }: EquivalentSableResultsProps) {
  const typeEssai = (resultats.type_essai as string) || "beton";
  const specs = typeEssai === "geotechnique" ? SPECS_GEO : SPECS_BETON;

  const display = (key: string) => {
    const v = resultats[key] as number;
    return v != null && v !== 0 ? v : "-";
  };

  const esvMoy = (resultats.esv_moyen as number) || (resultats.es_moyen as number) || 0;
  const espMoy = (resultats.esp_moyen as number) || 0;
  const conformityEsv = esvMoy > 0 ? getConformity(esvMoy, typeEssai) : null;
  const conformityEsp = espMoy > 0 ? getConformity(espMoy, typeEssai) : null;

  const fields: { label: string; unit: string; key1: string; key2: string }[] = [
    { label: "Poids humide (mh)", unit: "g", key1: "mh_essai1", key2: "mh_essai2" },
    { label: "Poids sec (ms)", unit: "g", key1: "ms_essai1", key2: "ms_essai2" },
    { label: "Teneur en eau", unit: "%", key1: "w_essai1", key2: "w_essai2" },
    { label: "Hauteur du floculat (h1)", unit: "cm", key1: "h1_essai1", key2: "h1_essai2" },
    { label: "Hauteur du sable visuelle (h2)", unit: "cm", key1: "h2_essai1", key2: "h2_essai2" },
    { label: "Hauteur du sable piston (h'2)", unit: "cm", key1: "h2p_essai1", key2: "h2p_essai2" },
    { label: "ESv (%)", unit: "%", key1: "esv_essai1", key2: "esv_essai2" },
    { label: "ESp (%)", unit: "%", key1: "esp_essai1", key2: "esp_essai2" },
  ];

  return (
    <div className="space-y-4">
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Résultats - Équivalent de Sable (NF EN 933-8)</CardTitle>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
              {typeEssai === "geotechnique" ? "Géotechnique" : "Béton"}
            </span>
          </div>
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
                  <tr key={i}>
                    <td className="border border-border px-3 py-2 text-foreground">{f.label}</td>
                    <td className="border border-border px-3 py-2 text-center text-muted-foreground">({f.unit})</td>
                    <td className="border border-border px-3 py-2 text-center font-medium text-foreground">{display(f.key1)}</td>
                    <td className="border border-border px-3 py-2 text-center font-medium text-foreground">{display(f.key2)}</td>
                  </tr>
                ))}

                <tr className="bg-muted/30">
                  <td className="border border-border px-3 py-2 font-medium text-foreground">Moyenne teneur en eau (W moy)</td>
                  <td className="border border-border px-3 py-2 text-center text-muted-foreground">(%)</td>
                  <td colSpan={2} className="border border-border px-3 py-2 text-center">
                    <span className="text-lg font-bold text-primary">{display("w_moyen")} %</span>
                  </td>
                </tr>

                <tr className="bg-primary/10">
                  <td className="border border-border px-3 py-2 font-medium text-foreground">Moyenne ESv</td>
                  <td className="border border-border px-3 py-2 text-center text-muted-foreground">(%)</td>
                  <td colSpan={2} className="border border-border px-3 py-2 text-center">
                    <span className="text-xl font-bold text-primary">{display("esv_moyen")} %</span>
                  </td>
                </tr>

                <tr className="bg-primary/10">
                  <td className="border border-border px-3 py-2 font-medium text-foreground">Moyenne ESp</td>
                  <td className="border border-border px-3 py-2 text-center text-muted-foreground">(%)</td>
                  <td colSpan={2} className="border border-border px-3 py-2 text-center">
                    <span className="text-xl font-bold text-primary">{display("esp_moyen")} %</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Conformité */}
          {(conformityEsv || conformityEsp) && (
            <Card className={`border-2 ${conformityEsv?.conforme ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" : "border-red-500/50 bg-red-50/50 dark:bg-red-950/20"}`}>
              <CardContent className="pt-4 space-y-2">
                <p className="text-sm font-semibold text-foreground">Conformité ({typeEssai === "geotechnique" ? "Géotechnique" : "Béton"}) :</p>
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
              Spécification ({typeEssai === "geotechnique" ? "Géotechnique" : "Béton"}) :
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {specs.map((s, i) => (
                <li key={i}>
                  • {s.min === 0 ? `ES < ${s.max}` : s.max === Infinity ? `ES ≥ ${s.min}` : `${s.min} ≤ ES < ${s.max}`} : {s.label} ({s.usage})
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
