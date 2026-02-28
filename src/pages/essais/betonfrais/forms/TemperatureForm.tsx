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

interface TemperatureFormProps {
  resultats: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export default function TemperatureForm({ resultats, onChange }: TemperatureFormProps) {
  const handleChange = (field: string, value: string | number) => {
    const newResultats = { ...resultats, [field]: value };
    
    // Auto-evaluate conformity based on temperature limits
    if (field === "temperature_mesuree" && typeof value === "number") {
      const tempMin = (newResultats.temperature_min as number) || 5;
      const tempMax = (newResultats.temperature_max as number) || 32;
      newResultats.conformite = value >= tempMin && value <= tempMax ? "conforme" : "non-conforme";
    }
    
    onChange(newResultats);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Mesure de la Température du Béton</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Température mesurée (°C) *</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="Ex: 22.5"
              value={(resultats.temperature_mesuree as number) || ""}
              onChange={(e) => handleChange("temperature_mesuree", parseFloat(e.target.value) || 0)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Température minimale spécifiée (°C)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="Ex: 5"
              value={(resultats.temperature_min as number) || ""}
              onChange={(e) => handleChange("temperature_min", parseFloat(e.target.value) || 0)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Température maximale spécifiée (°C)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="Ex: 32"
              value={(resultats.temperature_max as number) || ""}
              onChange={(e) => handleChange("temperature_max", parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Type de thermomètre</Label>
            <Select
              value={(resultats.type_thermometre as string) || ""}
              onValueChange={(value) => handleChange("type_thermometre", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="numerique">Numérique</SelectItem>
                <SelectItem value="analogique">Analogique</SelectItem>
                <SelectItem value="infrarouge">Infrarouge</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Conformité</Label>
            <Input
              value={(resultats.conformite as string) === "conforme" ? "Conforme" : 
                     (resultats.conformite as string) === "non-conforme" ? "Non conforme" : "-"}
              disabled
              className="bg-muted"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
