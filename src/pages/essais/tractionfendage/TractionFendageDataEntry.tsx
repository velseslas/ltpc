import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useEchantillonTractionFendageById, useUpdateEchantillonTractionFendage } from "@/hooks/useEchantillonsTractionFendage";
import { toast } from "sonner";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

interface EprouvetteData {
  id: number;
  jour: number;
  dateEssai: string;
  poids: string;
  densite: string;
  charge: string;
  resistance: string;
}

const TractionFendageDataEntry = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: echantillon, isLoading } = useEchantillonTractionFendageById(id);
  const updateEchantillon = useUpdateEchantillonTractionFendage();

  const [eprouvettes, setEprouvettes] = useState<EprouvetteData[]>([]);

  // Initialize eprouvettes based on jours_essai
  useEffect(() => {
    if (echantillon) {
      const joursEssai = echantillon.jours_essai as Array<{ jour: number; nombre: number }> | null;
      const dateCoulage = echantillon.date_coulage ? new Date(echantillon.date_coulage) : new Date();
      
      // Check for existing results
      const existingResults = echantillon.resultats as unknown as { eprouvettes: EprouvetteData[] } | null;
      
      if (existingResults?.eprouvettes) {
        setEprouvettes(existingResults.eprouvettes);
      } else if (joursEssai) {
        const newEprouvettes: EprouvetteData[] = [];
        let counter = 1;
        
        joursEssai.forEach((jour) => {
          const dateEssai = addDays(dateCoulage, jour.jour);
          for (let i = 0; i < jour.nombre; i++) {
            newEprouvettes.push({
              id: counter,
              jour: jour.jour,
              dateEssai: format(dateEssai, "yyyy-MM-dd"),
              poids: "",
              densite: "",
              charge: "",
              resistance: "",
            });
            counter++;
          }
        });
        
        setEprouvettes(newEprouvettes);
      }
    }
  }, [echantillon]);

  // Get cylinder dimensions from dimension_eprouvette (e.g., "160x320")
  const getCylinderDimensions = () => {
    const dimension = echantillon?.dimension_eprouvette || "160x320";
    const parts = dimension.split("x").map(p => parseFloat(p.trim()));
    return {
      diameter: parts[0] || 160,
      length: parts[1] || 320,
    };
  };

  // Calculate density from weight for cylindrical specimen
  const calculateDensity = (poids: string): string => {
    const weight = parseFloat(poids);
    if (isNaN(weight) || weight === 0) return "";
    
    const { diameter, length } = getCylinderDimensions();
    // Volume in mm³ = π × (d/2)² × L
    const volumeMm3 = Math.PI * Math.pow(diameter / 2, 2) * length;
    // Convert to cm³ (divide by 1000)
    const volumeCm3 = volumeMm3 / 1000;
    // Density in t/m³ = weight(g) / volume(cm³) / 1000
    const density = weight / volumeCm3 / 1000;
    return density.toFixed(2);
  };

  // Calculate resistance from charge for cylindrical specimen
  const calculateResistance = (charge: string): string => {
    const p = parseFloat(charge);
    if (isNaN(p) || p === 0) return "";
    
    const { diameter, length } = getCylinderDimensions();
    // Formula for splitting tensile strength: fct = 2P / (π × d × L)
    // P in kN (×1000 for N), d and L in mm, result in MPa
    const fct = (2 * p * 1000) / (Math.PI * diameter * length);
    return fct.toFixed(2);
  };

  const handleFieldChange = (id: number, field: keyof EprouvetteData, value: string) => {
    setEprouvettes((prev) => {
      return prev.map((ep) => {
        if (ep.id !== id) return ep;
        
        const updated = { ...ep, [field]: value };
        
        // Recalculate density if weight changed
        if (field === "poids") {
          updated.densite = calculateDensity(value);
        }
        
        // Recalculate resistance if charge changed
        if (field === "charge") {
          updated.resistance = calculateResistance(value);
        }
        
        return updated;
      });
    });
  };

  const handleSave = async () => {
    if (!id) return;

    // Check if all specimens have data
    const allComplete = eprouvettes.every(
      (ep) => ep.poids && ep.densite && ep.charge && ep.resistance
    );

    // Calculate moyenne per jour
    const joursGroups = eprouvettes.reduce((acc, ep) => {
      if (!acc[ep.jour]) acc[ep.jour] = [];
      if (ep.resistance) acc[ep.jour].push(parseFloat(ep.resistance));
      return acc;
    }, {} as Record<number, number[]>);

    const moyennes = Object.entries(joursGroups).map(([jour, resistances]) => ({
      jour: parseInt(jour),
      moyenne: resistances.length > 0 
        ? (resistances.reduce((a, b) => a + b, 0) / resistances.length).toFixed(2)
        : null,
    }));

    try {
      await updateEchantillon.mutateAsync({
        id,
        resultats: JSON.parse(JSON.stringify({ eprouvettes, moyennes })),
        statut: allComplete ? "termine" : "en-cours",
      });
      toast.success("Données enregistrées avec succès");
      navigate(`/essais/beton/beton-durci/traction-fendage/${id}`);
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!echantillon) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Échantillon non trouvé
      </div>
    );
  }

  // Group eprouvettes by jour
  const groupedByJour = eprouvettes.reduce((acc, ep) => {
    if (!acc[ep.jour]) acc[ep.jour] = [];
    acc[ep.jour].push(ep);
    return acc;
  }, {} as Record<number, EprouvetteData[]>);

  return (
    <div className="space-y-6">
      <EssaiBreadcrumb 
        items={[
          { label: "Béton", path: "/essais/beton" },
          { label: "Béton Durci", path: "/essais/beton/beton-durci" },
          { label: "Traction par Fendage", path: "/essais/beton/beton-durci/traction-fendage" },
          { label: <><span className="text-primary">TF</span>-{String(echantillon.numero).padStart(3, "0")}</>, path: `/essais/beton/beton-durci/traction-fendage/${id}` },
          { label: "Saisie de données" }
        ]} 
      />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(`/essais/beton/beton-durci/traction-fendage/${id}`)}
          className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Saisie de données - <span className="text-primary">TF-{String(echantillon.numero).padStart(3, "0")}</span>
          </h1>
          <p className="text-muted-foreground">Essai de Traction par Fendage - NF EN 12390-6</p>
        </div>
      </div>

      {/* Data entry cards by jour */}
      {Object.entries(groupedByJour)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([jour, jourEprouvettes]) => (
          <Card key={jour} className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Essai à {jour} jours</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Date d'essai: {format(new Date(jourEprouvettes[0].dateEssai), "dd/MM/yyyy", { locale: fr })}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 text-sm font-medium text-muted-foreground">N°</th>
                      <th className="text-left p-2 text-sm font-medium text-muted-foreground">Poids (g)</th>
                      <th className="text-left p-2 text-sm font-medium text-muted-foreground">Densité (t/m³)</th>
                      <th className="text-left p-2 text-sm font-medium text-muted-foreground">Charge (kN)</th>
                      <th className="text-left p-2 text-sm font-medium text-muted-foreground">fct (MPa)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jourEprouvettes.map((ep) => (
                      <tr key={ep.id} className="border-b last:border-0">
                        <td className="p-2 font-medium">{ep.id}</td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="1"
                            value={ep.poids}
                            onChange={(e) => handleFieldChange(ep.id, "poids", e.target.value)}
                            className="w-24"
                            placeholder="9500"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={ep.densite}
                            readOnly
                            className="w-24 bg-muted"
                            placeholder="-"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={ep.charge}
                            onChange={(e) => handleFieldChange(ep.id, "charge", e.target.value)}
                            className="w-24"
                            placeholder="150"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={ep.resistance}
                            readOnly
                            className="w-24 bg-muted"
                            placeholder="-"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Moyenne for this jour */}
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Résistance moyenne à {jour} jours:</span>
                  <span className="text-xl font-bold text-primary">
                    {(() => {
                      const resistances = jourEprouvettes
                        .filter((ep) => ep.resistance)
                        .map((ep) => parseFloat(ep.resistance));
                      if (resistances.length === 0) return "-";
                      return (resistances.reduce((a, b) => a + b, 0) / resistances.length).toFixed(2) + " MPa";
                    })()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => navigate(`/essais/beton/beton-durci/traction-fendage/${id}`)}
        >
          Annuler
        </Button>
        <Button
          onClick={handleSave}
          disabled={updateEchantillon.isPending}
        >
          {updateEchantillon.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          <Save className="mr-2 h-4 w-4" />
          Enregistrer
        </Button>
      </div>
    </div>
  );
};

export default TractionFendageDataEntry;
