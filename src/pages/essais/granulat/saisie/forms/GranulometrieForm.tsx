import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  { ouverture: 3.15, label: "3.15 mm" },
  { ouverture: 2.5, label: "2.5 mm" },
  { ouverture: 2, label: "2 mm" },
  { ouverture: 1.6, label: "1.6 mm" },
  { ouverture: 1.25, label: "1.25 mm" },
  { ouverture: 1, label: "1 mm" },
  { ouverture: 0.8, label: "0.8 mm" },
  { ouverture: 0.63, label: "0.63 mm" },
  { ouverture: 0.5, label: "0.5 mm" },
  { ouverture: 0.4, label: "0.4 mm" },
  { ouverture: 0.315, label: "0.315 mm" },
  { ouverture: 0.25, label: "0.25 mm" },
  { ouverture: 0.2, label: "0.2 mm" },
  { ouverture: 0.16, label: "0.16 mm" },
  { ouverture: 0.125, label: "0.125 mm" },
  { ouverture: 0.1, label: "0.1 mm" },
  { ouverture: 0.08, label: "0.08 mm" },
  { ouverture: 0.063, label: "0.063 mm" },
];

interface TamisData {
  ouverture: number;
  refus: number;
  refusCumule: number;
  passant: number;
}

export default function GranulometrieForm({ resultats, onChange }: GranulometrieFormProps) {
  const masseTotale = (resultats.masse_totale as number) || 0;
  const tamisData = (resultats.tamis as TamisData[]) || TAMIS_STANDARDS.map(t => ({
    ouverture: t.ouverture,
    refus: 0,
    refusCumule: 0,
    passant: 100,
  }));

  const handleMasseTotaleChange = (value: string) => {
    const masse = parseFloat(value) || 0;
    const updated = { ...resultats, masse_totale: masse };
    recalculateAll(updated, tamisData);
  };

  const handleRefusChange = (index: number, value: string) => {
    const refus = parseFloat(value) || 0;
    const newTamis = [...tamisData];
    newTamis[index] = { ...newTamis[index], refus };
    
    const updated = { ...resultats };
    recalculateAll(updated, newTamis);
  };

  const recalculateAll = (updated: Record<string, unknown>, tamis: TamisData[]) => {
    const masse = (updated.masse_totale as number) || 0;
    let refusCumule = 0;
    
    const newTamis = tamis.map((t, i) => {
      refusCumule += t.refus;
      const passant = masse > 0 ? ((masse - refusCumule) / masse) * 100 : 100;
      return {
        ...t,
        refusCumule,
        passant: parseFloat(Math.max(0, passant).toFixed(1)),
      };
    });
    
    // Calculate module de finesse (for sand)
    const refusCumules = [0.16, 0.315, 0.63, 1.25, 2.5, 5].map(ouv => {
      const tamis = newTamis.find(t => t.ouverture === ouv);
      return tamis ? (100 - tamis.passant) : 0;
    });
    const mf = refusCumules.reduce((a, b) => a + b, 0) / 100;
    
    updated.tamis = newTamis;
    updated.module_finesse = parseFloat(mf.toFixed(2));
    
    onChange(updated);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Résultats - Analyse Granulométrique (NF EN 933-1)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="masse_totale">Masse totale de l'échantillon (g)</Label>
            <Input
              id="masse_totale"
              type="number"
              step="0.1"
              value={masseTotale || ""}
              onChange={(e) => handleMasseTotaleChange(e.target.value)}
              className="bg-background border-border"
              placeholder="1000"
            />
          </div>
          <div className="bg-primary/20 border border-primary/30 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Module de Finesse</p>
            <p className="text-2xl font-bold text-primary">
              {(resultats.module_finesse as number) || "--"}
            </p>
          </div>
        </div>

        {/* Table des tamis */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Tamis (mm)</th>
                <th className="text-center py-3 px-2 font-medium text-muted-foreground">Refus (g)</th>
                <th className="text-center py-3 px-2 font-medium text-muted-foreground">Refus cumulé (g)</th>
                <th className="text-center py-3 px-2 font-medium text-muted-foreground">Passant (%)</th>
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
                    {tamis.refusCumule.toFixed(1)}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                      {tamis.passant.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
