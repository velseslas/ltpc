import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Edit, ClipboardEdit, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EssaiBreadcrumb, BreadcrumbItem } from "@/components/essais/EssaiBreadcrumb";
import { ModificationsHistory } from "@/components/essais/ModificationsHistory";
import {
  useEchantillonBetonFraisById,
  getPrefix,
} from "@/hooks/useEchantillonsBetonFraisFactory";

const TABLE_BY_TYPE: Record<string, string> = {
  "affaissement": "echantillons_affaissement",
  "temperature": "echantillons_temperature",
  "temps-prise": "echantillons_temps_prise",
  "teneur-air": "echantillons_teneur_air",
};

// Import result components
import AffaissementResults from "./resultats/AffaissementResults";
import TemperatureResults from "./resultats/TemperatureResults";
import TempsPriseResults from "./resultats/TempsPriseResults";
import TeneurAirResults from "./resultats/TeneurAirResults";

const resultComponents: Record<string, React.ComponentType<{ resultats: Record<string, unknown> }>> = {
  "affaissement": AffaissementResults,
  "temperature": TemperatureResults,
  "temps-prise": TempsPriseResults,
  "teneur-air": TeneurAirResults,
};

const getStatusBadge = (statut: string) => {
  switch (statut) {
    case "termine":
      return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Terminé</Badge>;
    case "en-cours":
      return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">En cours</Badge>;
    case "a-faire":
      return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">À faire</Badge>;
    default:
      return null;
  }
};

interface BetonFraisDetailProps {
  essaiType: string;
  essaiTitle: string;
  basePath: string;
}

// Define which fields are available for each test type
const getFieldsForType = (essaiType: string) => {
  switch (essaiType) {
    case "affaissement":
      return { showTemperatureBeton: true, showTemperatureAir: true, showTemperatureAmbiante: false };
    case "temperature":
      return { showTemperatureBeton: false, showTemperatureAir: false, showTemperatureAmbiante: true };
    case "temps-prise":
      return { showTemperatureBeton: true, showTemperatureAir: true, showTemperatureAmbiante: false };
    case "teneur-air":
      return { showTemperatureBeton: true, showTemperatureAir: true, showTemperatureAmbiante: false };
    default:
      return { showTemperatureBeton: true, showTemperatureAir: true, showTemperatureAmbiante: false };
  }
};

export default function BetonFraisDetail({ essaiType, essaiTitle, basePath }: BetonFraisDetailProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: echantillon, isLoading } = useEchantillonBetonFraisById(essaiType, id);
  const prefix = getPrefix(essaiType);
  const fieldConfig = getFieldsForType(essaiType);

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Béton", path: "/essais/beton" },
    { label: "Béton Frais", path: "/essais/beton/beton-frais" },
    { label: essaiTitle, path: basePath },
    { label: echantillon ? `${prefix}-${String(echantillon.numero).padStart(3, "0")}` : "Détail" },
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
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">Échantillon non trouvé</p>
        <Button onClick={() => navigate(basePath)}>Retour à la liste</Button>
      </div>
    );
  }

  const ResultComponent = resultComponents[essaiType];
  const resultats = echantillon.resultats as Record<string, unknown> | null;

  return (
    <>
      <EssaiBreadcrumb items={breadcrumbItems} />

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(basePath)}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-display font-bold text-foreground">
                  <span className="text-primary">{prefix}</span>-{String(echantillon.numero).padStart(3, "0")}
                </h1>
                {getStatusBadge(echantillon.statut)}
              </div>
              <p className="text-muted-foreground mt-1">{essaiTitle}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`${basePath}/${id}/saisie`)} className="">
              <ClipboardEdit className="h-4 w-4 mr-2" />
              Saisie de données
            </Button>
            <Button variant="outline" onClick={() => navigate(`${basePath}/${id}/rapport`)}>
              <FileText className="h-4 w-4 mr-2" />
              Rapport
            </Button>
            <Button variant="outline" onClick={() => navigate(`${basePath}/${id}/modifier`)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Identification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium">{echantillon.clients?.nom || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Chantier</p>
                <p className="font-medium">{echantillon.chantiers?.nom || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Centrale à béton</p>
                <p className="font-medium">{echantillon.centrales_beton?.nom || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Formulation</p>
                <p className="font-medium">{echantillon.formulations?.nom || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Prélèvement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {format(new Date(echantillon.date_prelevement), "dd/MM/yyyy", { locale: fr })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Heure</p>
                <p className="font-medium">{echantillon.heure_prelevement || "-"}</p>
              </div>
              {fieldConfig.showTemperatureBeton && (
                <div>
                  <p className="text-sm text-muted-foreground">Température béton</p>
                  <p className="font-medium">
                    {echantillon.temperature_beton ? `${echantillon.temperature_beton} °C` : "-"}
                  </p>
                </div>
              )}
              {fieldConfig.showTemperatureAir && (
                <div>
                  <p className="text-sm text-muted-foreground">Température air</p>
                  <p className="font-medium">
                    {echantillon.temperature_air ? `${echantillon.temperature_air} °C` : "-"}
                  </p>
                </div>
              )}
              {fieldConfig.showTemperatureAmbiante && (
                <div>
                  <p className="text-sm text-muted-foreground">Température ambiante</p>
                  <p className="font-medium">
                    {echantillon.temperature_ambiante ? `${echantillon.temperature_ambiante} °C` : "-"}
                  </p>
                </div>
              )}
              {echantillon.intervenants && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Technicien</p>
                  <p className="font-medium">
                    {echantillon.intervenants.prenom} {echantillon.intervenants.nom}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {resultats && ResultComponent ? (
          <Card className="border-border bg-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Résultats</CardTitle>
            </CardHeader>
            <CardContent>
              <ResultComponent resultats={resultats} />
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border bg-card lg:col-span-2">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">Aucun résultat disponible</p>
              <Button onClick={() => navigate(`${basePath}/${id}/saisie`)} className="">
                <ClipboardEdit className="h-4 w-4 mr-2" />
                Saisie de données
              </Button>
            </CardContent>
          </Card>
        )}

        {echantillon.observations && (
          <Card className="border-border bg-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Observations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">{echantillon.observations}</p>
            </CardContent>
          </Card>
        )}

        {id && TABLE_BY_TYPE[essaiType] && (
          <div className="lg:col-span-2">
            <ModificationsHistory tableName={TABLE_BY_TYPE[essaiType]} recordId={id} />
          </div>
        )}
      </div>
    </>
  );
}
