import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TempsPriseFormProps {
  resultats: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export default function TempsPriseForm({ resultats, onChange }: TempsPriseFormProps) {
  const handleChange = (field: string, value: string | number) => {
    onChange({ ...resultats, [field]: value });
  };

  // Convert minutes to hours:minutes format
  const formatDuration = (minutes: number | undefined) => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const tempsInitial = resultats.temps_prise_initial as number;
  const tempsFinal = resultats.temps_prise_final as number;

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Détermination du Temps de Prise</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Temps de Prise Initial</h4>
            <div className="space-y-2">
              <Label>Temps de prise initial (minutes)</Label>
              <Input
                type="number"
                placeholder="Ex: 180"
                value={tempsInitial || ""}
                onChange={(e) => handleChange("temps_prise_initial", parseInt(e.target.value) || 0)}
              />
              <p className="text-sm text-muted-foreground">
                Formaté: {formatDuration(tempsInitial)}
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Temps de Prise Final</h4>
            <div className="space-y-2">
              <Label>Temps de prise final (minutes)</Label>
              <Input
                type="number"
                placeholder="Ex: 360"
                value={tempsFinal || ""}
                onChange={(e) => handleChange("temps_prise_final", parseInt(e.target.value) || 0)}
              />
              <p className="text-sm text-muted-foreground">
                Formaté: {formatDuration(tempsFinal)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Température de l'essai (°C)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="Ex: 20"
              value={(resultats.temperature_essai as number) || ""}
              onChange={(e) => handleChange("temperature_essai", parseFloat(e.target.value) || 0)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Méthode d'essai</Label>
            <Select
              value={(resultats.methode as string) || ""}
              onValueChange={(value) => handleChange("methode", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vicat">Aiguille de Vicat</SelectItem>
                <SelectItem value="penetrometre">Pénétromètre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Conformité</Label>
            <Select
              value={(resultats.conformite as string) || ""}
              onValueChange={(value) => handleChange("conformite", value)}
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
  );
}
