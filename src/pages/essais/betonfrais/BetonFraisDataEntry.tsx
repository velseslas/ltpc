import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { EssaiBreadcrumb, BreadcrumbItem } from "@/components/essais/EssaiBreadcrumb";
import {
  useEchantillonBetonFraisById,
  useUpdateEchantillonBetonFraisByType,
  getPrefix,
} from "@/hooks/useEchantillonsBetonFraisFactory";
import { Json } from "@/integrations/supabase/types";

// Import form components
import AffaissementForm from "./forms/AffaissementForm";
import TemperatureForm from "./forms/TemperatureForm";
import TempsPriseForm from "./forms/TempsPriseForm";
import TeneurAirForm from "./forms/TeneurAirForm";

const formComponents: Record<string, React.ComponentType<{ resultats: Record<string, unknown>; onChange: (data: Record<string, unknown>) => void }>> = {
  "affaissement": AffaissementForm,
  "temperature": TemperatureForm,
  "temps-prise": TempsPriseForm,
  "teneur-air": TeneurAirForm,
};

interface BetonFraisDataEntryProps {
  essaiType: string;
  essaiTitle: string;
  basePath: string;
}

export default function BetonFraisDataEntry({ essaiType, essaiTitle, basePath }: BetonFraisDataEntryProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: echantillon, isLoading } = useEchantillonBetonFraisById(essaiType, id);
  const updateEchantillon = useUpdateEchantillonBetonFraisByType(essaiType);
  const [resultats, setResultats] = useState<Record<string, unknown>>({});
  const [temperatureAmbiante, setTemperatureAmbiante] = useState("");
  const prefix = getPrefix(essaiType);

  useEffect(() => {
    if (echantillon?.resultats) {
      setResultats(echantillon.resultats as Record<string, unknown>);
    }
  }, [echantillon]);

  const handleSave = async () => {
    if (!id) return;

    try {
      const hasResults = Object.keys(resultats).length > 0 &&
        Object.values(resultats).some(v => v !== null && v !== undefined && v !== "");

      await updateEchantillon.mutateAsync({
        id,
        resultats: resultats as Json,
        statut: hasResults ? "termine" : "en-cours",
      });

      toast.success("Données enregistrées avec succès");
      navigate(basePath);
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const FormComponent = formComponents[essaiType];

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Béton", path: "/essais/beton" },
    { label: "Béton Frais", path: "/essais/beton/beton-frais" },
    { label: essaiTitle, path: basePath },
    { label: echantillon ? `${prefix}-${String(echantillon.numero).padStart(3, "0")}` : "Saisie", path: echantillon ? `${basePath}/${id}` : undefined },
    { label: "Saisie" },
  ];

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

  return (
    <div className="space-y-6 animate-fade-in">
      <EssaiBreadcrumb items={breadcrumbItems} />

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(`${basePath}/${id}`)}
          className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Saisie de Données - <span className="text-primary">{prefix}-{String(echantillon.numero).padStart(3, "0")}</span>
          </h1>
          <p className="text-muted-foreground mt-1">{essaiTitle}</p>
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Informations Échantillon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="font-medium text-foreground">{echantillon.clients?.nom || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Chantier</p>
              <p className="font-medium text-foreground">{echantillon.chantiers?.nom || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Centrale</p>
              <p className="font-medium text-foreground">{echantillon.centrales_beton?.nom || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date de prélèvement</p>
              <p className="font-medium text-foreground">
                {format(new Date(echantillon.date_prelevement), "dd/MM/yyyy", { locale: fr })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {FormComponent ? (
        <FormComponent resultats={resultats} onChange={setResultats} />
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="py-8 text-center text-muted-foreground">
            Formulaire de saisie non disponible pour ce type d'essai
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate(`${basePath}/${id}`)}>
          Annuler
        </Button>
        <Button
          onClick={handleSave}
          disabled={updateEchantillon.isPending}
          className="gradient-primary text-primary-foreground"
        >
          {updateEchantillon.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Sauvegarder
        </Button>
      </div>
    </div>
  );
}
