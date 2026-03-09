import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GranulometrieFormProps {
  resultats: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

const TAMIS_STANDARDS = [
  { ouverture: 31.5, label: "31.5 mm" },
  { ouverture: 25, label: "25 mm" },
  { ouverture: 20, label: "20 mm" },
  { ouverture: 16, label: "16 mm" },
  { ouverture: 12.5, label: "12.5 mm" },
  { ouverture: 10, label: "10 mm" },
  { ouverture: 8, label: "8 mm" },
  { ouverture: 6.3, label: "6.3 mm" },
  { ouverture: 5, label: "5 mm" },
  { ouverture: 4, label: "4 mm" },
  { ouverture: 2, label: "2 mm" },
  { ouverture: 1, label: "1 mm" },
  { ouverture: 0.5, label: "0.5 mm" },
  { ouverture: 0.25, label: "0.25 mm" },
  { ouverture: 0.125, label: "0.125 mm" },
  { ouverture: 0.063, label: "0.063 mm" },
];

interface TamisData {
  ouverture: number;
  refus: number;
  refusCumule: number;
  pourcentageRefusCumule: number;
  passant: number;
}

export default function GranulometrieForm({ resultats, onChange }: GranulometrieFormProps) {
  const masseSechM1 = (resultats.masse_seche_m1 as number) || 0;
  const masseHumideM1Prime = (resultats.masse_humide_m1_prime as number) || 0;
  const masseLavageM1M2 = (resultats.masse_lavage_m1_m2 as number) || 0;
  const masseApresLavageM2 = (resultats.masse_apres_lavage_m2 as number) || 0;
  const fondP = (resultats.fond_p as number) || 0;
  const procede = (resultats.procede as string) || "lavage_tamisage";

  const tamisData = (resultats.tamis as TamisData[]) || TAMIS_STANDARDS.map(t => ({
    ouverture: t.ouverture,
    refus: 0,
    refusCumule: 0,
    pourcentageRefusCumule: 0,
    passant: 100,
  }));

  const recalculate = (updated: Record<string, unknown>, tamis: TamisData[], newFondP?: number) => {
    const m1 = (updated.masse_seche_m1 as number) || 0;
    const fp = newFondP !== undefined ? newFondP : ((updated.fond_p as number) || 0);

    // Calculate M2 = M1 - (M1-M2)
    const m1m2 = (updated.masse_lavage_m1_m2 as number) || 0;
    const m2 = m1 > 0 ? m1 - m1m2 : 0;
    updated.masse_apres_lavage_m2 = parseFloat(m2.toFixed(2));

    let refusCumule = 0;
    const newTamis = tamis.map((t) => {
      refusCumule += t.refus;
      const pourcentageRefusCumule = m1 > 0 ? (refusCumule / m1) * 100 : 0;
      const passant = m1 > 0 ? 100 - pourcentageRefusCumule : 100;
      return {
        ...t,
        refusCumule: parseFloat(refusCumule.toFixed(2)),
        pourcentageRefusCumule: parseFloat(pourcentageRefusCumule.toFixed(2)),
        passant: parseFloat(Math.max(0, passant).toFixed(2)),
      };
    });

    // Σ Ri + P
    const sumRiPlusP = refusCumule + fp;
    updated.somme_ri_plus_p = parseFloat(sumRiPlusP.toFixed(2));

    // Perte = (M2 - (Σ Ri + P)) / M2 × 100
    const perte = m2 > 0 ? ((m2 - sumRiPlusP) / m2) * 100 : 0;
    updated.perte_pourcentage = parseFloat(perte.toFixed(2));

    // f = (M1 - M2) / M1 × 100 (teneur en fines par lavage)
    const f = m1 > 0 ? (m1m2 / m1) * 100 : 0;
    updated.teneur_fines_f = parseFloat(f.toFixed(2));

    // Module de Finesse: sum of cumulative % retained on 0.125, 0.25, 0.5, 1, 2, 4 mm / 100
    // Note: using pourcentageRefusCumule (which is (Rn/M1)*100)
    const mfSieves = [0.125, 0.25, 0.5, 1, 2, 4];
    const refusCumulesPourMF = mfSieves.map(ouv => {
      const tamis = newTamis.find(t => Math.abs(t.ouverture - ouv) < 0.001);
      return tamis ? tamis.pourcentageRefusCumule : 0;
    });
    const mf = refusCumulesPourMF.reduce((a, b) => a + b, 0) / 100;

    updated.tamis = newTamis;
    updated.module_finesse = parseFloat(mf.toFixed(2));
    updated.fond_p = fp;

    onChange(updated);
  };

  const handleFieldChange = (field: string, value: string) => {
    const num = parseFloat(value) || 0;
    const updated = { ...resultats, [field]: num };
    recalculate(updated, tamisData);
  };

  const handleFondPChange = (value: string) => {
    const fp = parseFloat(value) || 0;
    const updated = { ...resultats };
    recalculate(updated, tamisData, fp);
  };

  const handleRefusChange = (index: number, value: string) => {
    const refus = parseFloat(value) || 0;
    const newTamis = [...tamisData];
    newTamis[index] = { ...newTamis[index], refus };
    const updated = { ...resultats };
    recalculate(updated, newTamis);
  };

  const handleProcedeChange = (value: string) => {
    const updated = { ...resultats, procede: value };
    onChange(updated);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Expression des résultats - Analyse Granulométrique (NF EN 933-1)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Procédé et masses */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label>Procédé utilisé</Label>
            <Select value={procede} onValueChange={handleProcedeChange}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lavage_tamisage">Lavage et tamisage</SelectItem>
                <SelectItem value="tamisage_voie_seche">Tamisage par voie sèche</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="masse_seche_m1">Masse sèche M1 (g)</Label>
            <Input
              id="masse_seche_m1"
              type="number"
              step="0.01"
              value={masseSechM1 || ""}
              onChange={(e) => handleFieldChange("masse_seche_m1", e.target.value)}
              className="bg-background border-border"
              placeholder="1200"
            />
          </div>
          <div>
            <Label htmlFor="masse_humide_m1_prime">Masse Humide M'1 (g)</Label>
            <Input
              id="masse_humide_m1_prime"
              type="number"
              step="0.01"
              value={masseHumideM1Prime || ""}
              onChange={(e) => handleFieldChange("masse_humide_m1_prime", e.target.value)}
              className="bg-background border-border"
              placeholder=""
            />
          </div>
          <div>
            <Label htmlFor="masse_lavage_m1_m2">Masse sèche retirée par lavage M1 - M2 (g)</Label>
            <Input
              id="masse_lavage_m1_m2"
              type="number"
              step="0.01"
              value={masseLavageM1M2 || ""}
              onChange={(e) => handleFieldChange("masse_lavage_m1_m2", e.target.value)}
              className="bg-background border-border"
              placeholder="11.20"
            />
          </div>
          <div>
            <Label>Masse sèche après lavage M2 (g)</Label>
            <Input
              type="number"
              value={masseApresLavageM2 || ""}
              readOnly
              className="bg-muted border-border"
            />
          </div>
        </div>

        {/* Résultats calculés */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-primary/20 border border-primary/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Module de Finesse (FM)</p>
            <p className="text-xl font-bold text-primary">
              {(resultats.module_finesse as number) || "--"}
            </p>
          </div>
          <div className="bg-muted/50 border border-border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Σ Ri + P</p>
            <p className="text-xl font-bold text-foreground">
              {(resultats.somme_ri_plus_p as number) || "--"}
            </p>
          </div>
          <div className="bg-muted/50 border border-border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Perte (%)</p>
            <p className="text-xl font-bold text-foreground">
              {(resultats.perte_pourcentage as number) != null ? `${resultats.perte_pourcentage}%` : "--"}
            </p>
          </div>
          <div className="bg-muted/50 border border-border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Teneur fines f (%)</p>
            <p className="text-xl font-bold text-foreground">
              {(resultats.teneur_fines_f as number) != null ? `${resultats.teneur_fines_f}%` : "--"}
            </p>
          </div>
        </div>

        {/* Table des tamis */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Ouverture des tamis (mm)</th>
                <th className="text-center py-3 px-2 font-medium text-muted-foreground">Masse des refus Ri (g)</th>
                <th className="text-center py-3 px-2 font-medium text-muted-foreground">Masse des refus cumulés Rn (g)</th>
                <th className="text-center py-3 px-2 font-medium text-muted-foreground">% Refus cumulés (Rn/M1)×100</th>
                <th className="text-center py-3 px-2 font-medium text-muted-foreground">% Tamisât cumulé</th>
              </tr>
            </thead>
            <tbody>
              {tamisData.map((tamis, index) => (
                <tr key={tamis.ouverture} className="border-b border-border/50">
                  <td className="py-2 px-2 font-medium text-foreground">
                    {TAMIS_STANDARDS[index]?.label || tamis.ouverture}
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={tamis.refus || ""}
                      onChange={(e) => handleRefusChange(index, e.target.value)}
                      className="w-24 mx-auto bg-background border-border text-center"
                      placeholder="0"
                    />
                  </td>
                  <td className="py-2 px-2 text-center text-muted-foreground">
                    {tamis.refusCumule.toFixed(2)}
                  </td>
                  <td className="py-2 px-2 text-center text-muted-foreground">
                    {tamis.pourcentageRefusCumule.toFixed(2)}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                      {tamis.passant.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
              {/* Fond P row */}
              <tr className="border-t-2 border-border bg-muted/30">
                <td className="py-2 px-2 font-medium text-foreground">Fond P</td>
                <td className="py-2 px-2">
                  <Input
                    type="number"
                    step="0.1"
                    value={fondP || ""}
                    onChange={(e) => handleFondPChange(e.target.value)}
                    className="w-24 mx-auto bg-background border-border text-center"
                    placeholder="0"
                  />
                </td>
                <td className="py-2 px-2 text-center text-muted-foreground font-medium">
                  Σ Ri + P = {(resultats.somme_ri_plus_p as number)?.toFixed(2) || "--"}
                </td>
                <td className="py-2 px-2 text-center text-muted-foreground font-medium" colSpan={2}>
                  FM = {(resultats.module_finesse as number) || "--"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Formules de vérification */}
        <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded border border-border">
          <p className="font-medium mb-1">Vérification :</p>
          <p>
            (M2 - Σ Ri + P) / M2 × 100 {"<"} 1% → {" "}
            <span className={`font-bold ${
              Math.abs((resultats.perte_pourcentage as number) || 0) < 1 
                ? "text-green-600 dark:text-green-400" 
                : "text-destructive"
            }`}>
              {(resultats.perte_pourcentage as number)?.toFixed(2) || "--"}%
            </span>
          </p>
          <p className="mt-1">
            f = (M1 - M2) / M1 × 100 = {(resultats.teneur_fines_f as number)?.toFixed(2) || "--"}%
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
