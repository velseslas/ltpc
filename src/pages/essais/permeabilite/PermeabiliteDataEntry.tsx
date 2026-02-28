import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useEchantillonPermeabiliteById, useUpdateEchantillonPermeabilite } from "@/hooks/useEchantillonsPermeabilite";
import { toast } from "sonner";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

interface EprouvetteData {
  id: number;
  jour: number;
  dateEssai: string;
  profondeurMin: string;
  profondeurMax: string;
  profondeurMoyenne: string;
}

const PermeabiliteDataEntry = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: echantillon, isLoading } = useEchantillonPermeabiliteById(id);
  const updateEchantillon = useUpdateEchantillonPermeabilite();

  const [eprouvettes, setEprouvettes] = useState<EprouvetteData[]>([]);

  useEffect(() => {
    if (echantillon) {
      const joursEssai = echantillon.jours_essai as Array<{ jour: number; nombre: number }> | null;
      const dateCoulage = echantillon.date_coulage ? new Date(echantillon.date_coulage) : new Date();
      
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
              profondeurMin: "",
              profondeurMax: "",
              profondeurMoyenne: "",
            });
            counter++;
          }
        });
        
        setEprouvettes(newEprouvettes);
      }
    }
  }, [echantillon]);

  const calculateMoyenne = (min: string, max: string): string => {
    const minVal = parseFloat(min);
    const maxVal = parseFloat(max);
    if (isNaN(minVal) || isNaN(maxVal)) return "";
    return ((minVal + maxVal) / 2).toFixed(1);
  };

  const handleFieldChange = (id: number, field: keyof EprouvetteData, value: string) => {
    setEprouvettes((prev) => {
      return prev.map((ep) => {
        if (ep.id !== id) return ep;
        
        const updated = { ...ep, [field]: value };
        
        if (field === "profondeurMin" || field === "profondeurMax") {
          updated.profondeurMoyenne = calculateMoyenne(
            field === "profondeurMin" ? value : updated.profondeurMin,
            field === "profondeurMax" ? value : updated.profondeurMax
          );
        }
        
        return updated;
      });
    });
  };

  const handleSave = async () => {
    if (!id) return;

    const allComplete = eprouvettes.every(
      (ep) => ep.profondeurMin && ep.profondeurMax && ep.profondeurMoyenne
    );

    const joursGroups = eprouvettes.reduce((acc, ep) => {
      if (!acc[ep.jour]) acc[ep.jour] = [];
      if (ep.profondeurMoyenne) acc[ep.jour].push(parseFloat(ep.profondeurMoyenne));
      return acc;
    }, {} as Record<number, number[]>);

    const moyennes = Object.entries(joursGroups).map(([jour, profondeurs]) => ({
      jour: parseInt(jour),
      moyenne: profondeurs.length > 0 
        ? (profondeurs.reduce((a, b) => a + b, 0) / profondeurs.length).toFixed(1)
        : null,
    }));

    try {
      await updateEchantillon.mutateAsync({
        id,
        resultats: JSON.parse(JSON.stringify({ eprouvettes, moyennes })),
        statut: allComplete ? "termine" : "en-cours",
      });
      toast.success("Données enregistrées avec succès");
      navigate(`/essais/beton/beton-durci/permeabilite/${id}`);
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
          { label: "Perméabilité", path: "/essais/beton/beton-durci/permeabilite" },
          { label: <><span className="text-primary">PE</span>-{String(echantillon.numero).padStart(3, "0")}</>, path: `/essais/beton/beton-durci/permeabilite/${id}` },
          { label: "Saisie de données" }
        ]} 
      />

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/essais/beton/beton-durci/permeabilite/${id}`)}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Saisie de données - <span className="text-primary">PE-{String(echantillon.numero).padStart(3, "0")}</span>
          </h1>
          <p className="text-muted-foreground">Perméabilité - NF EN 12390-8</p>
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Paramètres de l'essai</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-muted-foreground">Pression d'essai</span>
            <p className="font-medium">{echantillon.pression_essai} kPa</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Durée d'essai</span>
            <p className="font-medium">{echantillon.duree_essai} heures</p>
          </div>
        </CardContent>
      </Card>

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
                      <th className="text-left p-2 text-sm font-medium text-muted-foreground">Prof. Min (mm)</th>
                      <th className="text-left p-2 text-sm font-medium text-muted-foreground">Prof. Max (mm)</th>
                      <th className="text-left p-2 text-sm font-medium text-muted-foreground">Prof. Moy (mm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jourEprouvettes.map((ep) => (
                      <tr key={ep.id} className="border-b last:border-0">
                        <td className="p-2 font-medium">{ep.id}</td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={ep.profondeurMin}
                            onChange={(e) => handleFieldChange(ep.id, "profondeurMin", e.target.value)}
                            className="w-24"
                            placeholder="10"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={ep.profondeurMax}
                            onChange={(e) => handleFieldChange(ep.id, "profondeurMax", e.target.value)}
                            className="w-24"
                            placeholder="25"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={ep.profondeurMoyenne}
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

              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Profondeur moyenne de pénétration à {jour} jours:</span>
                  <span className="text-xl font-bold text-primary">
                    {(() => {
                      const profondeurs = jourEprouvettes
                        .filter((ep) => ep.profondeurMoyenne)
                        .map((ep) => parseFloat(ep.profondeurMoyenne));
                      if (profondeurs.length === 0) return "-";
                      return (profondeurs.reduce((a, b) => a + b, 0) / profondeurs.length).toFixed(1) + " mm";
                    })()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => navigate(`/essais/beton/beton-durci/permeabilite/${id}`)}
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

export default PermeabiliteDataEntry;
