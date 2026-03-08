import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EquivalentSableFormProps {
  resultats: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export default function EquivalentSableForm({ resultats, onChange }: EquivalentSableFormProps) {
  const recalculate = (data: Record<string, unknown>): Record<string, unknown> => {
    const updated = { ...data };

    // Get values
    const mh1 = Number(updated.mh_essai1) || 0;
    const ms1 = Number(updated.ms_essai1) || 0;
    const mh2 = Number(updated.mh_essai2) || 0;
    const ms2 = Number(updated.ms_essai2) || 0;

    // Teneur en eau W = ((mh - ms) / ms) × 100
    const w1 = ms1 > 0 ? ((mh1 - ms1) / ms1) * 100 : 0;
    const w2 = ms2 > 0 ? ((mh2 - ms2) / ms2) * 100 : 0;
    const wMoy = (w1 !== 0 && w2 !== 0) ? (w1 + w2) / 2 : (w1 !== 0 ? w1 : w2);

    updated.w_essai1 = parseFloat(w1.toFixed(2));
    updated.w_essai2 = parseFloat(w2.toFixed(2));
    updated.w_moyen = parseFloat(wMoy.toFixed(2));

    // Heights
    const h1_1 = Number(updated.h1_essai1) || 0;
    const h2_1 = Number(updated.h2_essai1) || 0;
    const h2p_1 = Number(updated.h2p_essai1) || 0;
    const h1_2 = Number(updated.h1_essai2) || 0;
    const h2_2 = Number(updated.h2_essai2) || 0;
    const h2p_2 = Number(updated.h2p_essai2) || 0;

    // ESv (visuel) = h2/h1 * 100
    const esv1 = h1_1 > 0 ? (h2_1 / h1_1) * 100 : 0;
    const esv2 = h1_2 > 0 ? (h2_2 / h1_2) * 100 : 0;
    const esvMoy = (esv1 !== 0 && esv2 !== 0) ? (esv1 + esv2) / 2 : (esv1 !== 0 ? esv1 : esv2);

    updated.esv_essai1 = parseFloat(esv1.toFixed(2));
    updated.esv_essai2 = parseFloat(esv2.toFixed(2));
    updated.esv_moyen = parseFloat(esvMoy.toFixed(2));

    // ESp (piston) = h2'/h1 * 100
    const esp1 = h1_1 > 0 ? (h2p_1 / h1_1) * 100 : 0;
    const esp2 = h1_2 > 0 ? (h2p_2 / h1_2) * 100 : 0;
    const espMoy = (esp1 !== 0 && esp2 !== 0) ? (esp1 + esp2) / 2 : (esp1 !== 0 ? esp1 : esp2);

    updated.esp_essai1 = parseFloat(esp1.toFixed(2));
    updated.esp_essai2 = parseFloat(esp2.toFixed(2));
    updated.esp_moyen = parseFloat(espMoy.toFixed(2));

    // Keep legacy fields
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

  const val = (key: string) => {
    const v = resultats[key];
    return v != null ? String(v) : "";
  };

  const display = (key: string, suffix = "") => {
    const v = resultats[key] as number;
    return v ? `${v}${suffix}` : "--";
  };

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
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Expression des résultats - Équivalent de Sable (NF EN 933-8)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Table layout matching reference */}
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

              {/* Moyenne teneur en eau */}
              <tr className="bg-muted/30">
                <td className="border border-border px-3 py-2 text-foreground font-medium">Moyenne teneur en eau (W moy)</td>
                <td className="border border-border px-3 py-2 text-center text-muted-foreground">(%)</td>
                <td colSpan={2} className="border border-border px-3 py-2 text-center">
                  <span className="text-lg font-bold text-primary">{display("w_moyen", " %")}</span>
                </td>
              </tr>

              {/* Moyenne ESv */}
              <tr className="bg-primary/10">
                <td className="border border-border px-3 py-2 text-foreground font-medium">Moyenne (ESv % moy)</td>
                <td className="border border-border px-3 py-2 text-center text-muted-foreground">(%)</td>
                <td colSpan={2} className="border border-border px-3 py-2 text-center">
                  <span className="text-xl font-bold text-primary">{display("esv_moyen", " %")}</span>
                </td>
              </tr>

              {/* Moyenne ESp */}
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

        {/* Formules */}
        <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
          <p className="font-medium mb-1 text-foreground">Formules :</p>
          <p>W = ((mh - ms) / ms) × 100</p>
          <p>ESv = (h2 / h1) × 100 &nbsp;|&nbsp; ESp = (h'2 / h1) × 100</p>
        </div>
      </CardContent>
    </Card>
  );
}
