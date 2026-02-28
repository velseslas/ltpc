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

interface TeneurAirFormProps {
  resultats: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export default function TeneurAirForm({ resultats, onChange }: TeneurAirFormProps) {
  const handleChange = (field: string, value: string | number) => {
    const newResultats = { ...resultats, [field]: value };
    
    // Auto-evaluate conformity based on teneur limits
    if (field === "teneur_air" || field === "teneur_min" || field === "teneur_max") {
      const teneur = (field === "teneur_air" ? value : newResultats.teneur_air) as number;
      const min = (field === "teneur_min" ? value : newResultats.teneur_min) as number || 0;
      const max = (field === "teneur_max" ? value : newResultats.teneur_max) as number || 100;
      
      if (teneur) {
        newResultats.conformite = teneur >= min && teneur <= max ? "conforme" : "non-conforme";
      }
    }
    
    onChange(newResultats);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Mesure de la Teneur en Air Occlus</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Teneur en air mesurée (%)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="Ex: 4.5"
              value={(resultats.teneur_air as number) || ""}
              onChange={(e) => handleChange("teneur_air", parseFloat(e.target.value) || 0)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Teneur minimale spécifiée (%)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="Ex: 3.5"
              value={(resultats.teneur_min as number) || ""}
              onChange={(e) => handleChange("teneur_min", parseFloat(e.target.value) || 0)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Teneur maximale spécifiée (%)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="Ex: 5.5"
              value={(resultats.teneur_max as number) || ""}
              onChange={(e) => handleChange("teneur_max", parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Méthode de mesure</Label>
            <Select
              value={(resultats.methode as string) || ""}
              onValueChange={(value) => handleChange("methode", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pressiometre">Pressiomètre</SelectItem>
                <SelectItem value="volumetrique">Volumétrique</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Facteur de correction d'agrégat</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="Ex: 0.2"
              value={(resultats.facteur_correction as number) || ""}
              onChange={(e) => handleChange("facteur_correction", parseFloat(e.target.value) || 0)}
            />
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
