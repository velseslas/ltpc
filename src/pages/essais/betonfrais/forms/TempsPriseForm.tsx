import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import {
  AIGUILLES_STANDARD_MM2,
  calculerTempsPrise,
  formatDuration,
  MesurePenetration,
  SEUIL_PRISE_FINALE_MPA,
  SEUIL_PRISE_INITIALE_MPA,
} from "../lib/tempsPriseCalculs";

interface TempsPriseFormProps {
  resultats: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

type MesureRow = Partial<MesurePenetration>;

export default function TempsPriseForm({ resultats, onChange }: TempsPriseFormProps) {
  const mesures: MesureRow[] =
    (resultats.mesures as MesureRow[] | undefined) ?? [{}];

  const updateResultats = (patch: Record<string, unknown>) => {
    onChange({ ...resultats, ...patch });
  };

  const setMesures = (next: MesureRow[]) => {
    const { temps_prise_initial, temps_prise_final } = calculerTempsPrise(next);
    updateResultats({
      mesures: next,
      temps_prise_initial,
      temps_prise_final,
    });
  };

  const addMesure = () => setMesures([...mesures, {}]);

  const removeMesure = (i: number) =>
    setMesures(mesures.filter((_, idx) => idx !== i));

  const updateMesure = (i: number, field: keyof MesurePenetration, value: string) => {
    const next = mesures.map((m, idx) =>
      idx === i ? { ...m, [field]: value === "" ? undefined : parseFloat(value) } : m
    );
    setMesures(next);
  };

  const tempsInitial = resultats.temps_prise_initial as number | null | undefined;
  const tempsFinal = resultats.temps_prise_final as number | null | undefined;

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">
            Essai de temps de prise du béton — Méthode par résistance à la pénétration (ASTM C403/C403M)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Le mortier est extrait du béton frais par tamisage à 4,75 mm.</p>
            <p>• Les mesures sont réalisées avec un pénétromètre équipé d'aiguilles de différentes surfaces.</p>
            <p>• Résistance à la pénétration R (MPa) = Force (N) / Surface aiguille (mm²).</p>
            <p>
              • Début de prise à <strong>{SEUIL_PRISE_INITIALE_MPA} MPa</strong> et fin de prise à{" "}
              <strong>{SEUIL_PRISE_FINALE_MPA} MPa</strong> (interpolation linéaire).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="space-y-2">
              <Label>Température de l'essai (°C)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="Ex: 20"
                value={(resultats.temperature_essai as number) ?? ""}
                onChange={(e) =>
                  updateResultats({
                    temperature_essai: e.target.value === "" ? null : parseFloat(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Heure de contact eau-ciment</Label>
              <Input
                type="time"
                value={(resultats.heure_contact_eau_ciment as string) ?? ""}
                onChange={(e) => updateResultats({ heure_contact_eau_ciment: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Conformité</Label>
              <Select
                value={(resultats.conformite as string) || ""}
                onValueChange={(value) => updateResultats({ conformite: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conforme">Conforme</SelectItem>
                  <SelectItem value="non-conforme">Non conforme</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Mesures de pénétration</CardTitle>
          <Button type="button" size="sm" onClick={addMesure} variant="outline">
            <Plus className="h-4 w-4 mr-1" /> Ajouter une mesure
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-2 text-left border-b border-border">#</th>
                  <th className="p-2 text-left border-b border-border">Temps (min)</th>
                  <th className="p-2 text-left border-b border-border">Force (N)</th>
                  <th className="p-2 text-left border-b border-border">Surface aiguille (mm²)</th>
                  <th className="p-2 text-left border-b border-border">Résistance (MPa)</th>
                  <th className="p-2 border-b border-border w-10"></th>
                </tr>
              </thead>
              <tbody>
                {mesures.map((m, i) => {
                  const r =
                    m.force_N && m.aiguille_mm2
                      ? Number(m.force_N) / Number(m.aiguille_mm2)
                      : null;
                  return (
                    <tr key={i} className="border-b border-border">
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      <td className="p-2">
                        <Input
                          type="number"
                          step="1"
                          value={m.temps_min ?? ""}
                          onChange={(e) => updateMesure(i, "temps_min", e.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          step="0.1"
                          value={m.force_N ?? ""}
                          onChange={(e) => updateMesure(i, "force_N", e.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <Select
                          value={m.aiguille_mm2 ? String(m.aiguille_mm2) : ""}
                          onValueChange={(v) => updateMesure(i, "aiguille_mm2", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Surface" />
                          </SelectTrigger>
                          <SelectContent>
                            {AIGUILLES_STANDARD_MM2.map((s) => (
                              <SelectItem key={s} value={String(s)}>
                                {s} mm²
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2 font-mono">
                        {r != null ? r.toFixed(2) : "-"}
                      </td>
                      <td className="p-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeMesure(i)}
                          disabled={mesures.length <= 1}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-md border border-border p-4 bg-muted/30">
              <p className="text-sm text-muted-foreground">
                Début de prise (R = {SEUIL_PRISE_INITIALE_MPA} MPa)
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatDuration(tempsInitial)}
              </p>
              {tempsInitial != null && (
                <p className="text-xs text-muted-foreground mt-1">
                  ≈ {Math.round(tempsInitial)} min
                </p>
              )}
            </div>
            <div className="rounded-md border border-border p-4 bg-muted/30">
              <p className="text-sm text-muted-foreground">
                Fin de prise (R = {SEUIL_PRISE_FINALE_MPA} MPa)
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatDuration(tempsFinal)}
              </p>
              {tempsFinal != null && (
                <p className="text-xs text-muted-foreground mt-1">
                  ≈ {Math.round(tempsFinal)} min
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Label>Observations</Label>
            <Textarea
              rows={3}
              value={(resultats.observations as string) ?? ""}
              onChange={(e) => updateResultats({ observations: e.target.value })}
              placeholder="Remarques éventuelles sur l'essai..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
