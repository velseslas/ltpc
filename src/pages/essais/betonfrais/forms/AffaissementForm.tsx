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

interface AffaissementFormProps {
  resultats: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

const CLASSES_CONSISTANCE = [
  { value: "S1", range: "10-40" },
  { value: "S2", range: "50-90" },
  { value: "S3", range: "100-150" },
  { value: "S4", range: "160-210" },
  { value: "S5", range: "≥220" },
];

export default function AffaissementForm({ resultats, onChange }: AffaissementFormProps) {
  const handleChange = (field: string, value: string | number) => {
    const newResultats = { ...resultats, [field]: value };
    
    // Calculate classe based on affaissement value
    if (field === "affaissement" && typeof value === "number") {
      let classe = "";
      if (value >= 10 && value <= 40) classe = "S1";
      else if (value >= 50 && value <= 90) classe = "S2";
      else if (value >= 100 && value <= 150) classe = "S3";
      else if (value >= 160 && value <= 210) classe = "S4";
      else if (value >= 220) classe = "S5";
      newResultats.classe_mesuree = classe;
      
      // Auto-calculate conformity based on classe_visee and classe_mesuree
      const classeVisee = newResultats.classe_visee as string;
      if (classeVisee && classe) {
        newResultats.conformite = classe === classeVisee ? "conforme" : "non-conforme";
      }
    }
    
    // Also recalculate conformity when classe_visee changes
    if (field === "classe_visee") {
      const classeMesuree = newResultats.classe_mesuree as string;
      if (classeMesuree && value) {
        newResultats.conformite = classeMesuree === value ? "conforme" : "non-conforme";
      }
    }
    
    onChange(newResultats);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Mesure de l'Affaissement (Cône d'Abrams)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Affaissement mesuré (mm)</Label>
            <Input
              type="number"
              placeholder="Ex: 120"
              value={(resultats.affaissement as number) || ""}
              onChange={(e) => handleChange("affaissement", parseFloat(e.target.value) || 0)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Classe de consistance visée</Label>
            <Select
              value={(resultats.classe_visee as string) || ""}
              onValueChange={(value) => handleChange("classe_visee", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {CLASSES_CONSISTANCE.map((classe) => (
                  <SelectItem key={classe.value} value={classe.value}>
                    {classe.value} ({classe.range} mm)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Classe mesurée</Label>
            <Input
              value={(resultats.classe_mesuree as string) || "-"}
              disabled
              className="bg-muted"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Type d'affaissement</Label>
            <Select
              value={(resultats.type_affaissement as string) || ""}
              onValueChange={(value) => handleChange("type_affaissement", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vrai">Vrai (symétrique)</SelectItem>
                <SelectItem value="cisaille">Cisaillé</SelectItem>
                <SelectItem value="affaisse">Affaissé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Conformité</Label>
            <Input
              value={
                resultats.conformite === "conforme" 
                  ? "Conforme" 
                  : resultats.conformite === "non-conforme" 
                    ? "Non conforme" 
                    : "-"
              }
              disabled
              className={`bg-muted font-semibold ${
                resultats.conformite === "conforme" 
                  ? "text-green-600" 
                  : resultats.conformite === "non-conforme" 
                    ? "text-red-600" 
                    : ""
              }`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
