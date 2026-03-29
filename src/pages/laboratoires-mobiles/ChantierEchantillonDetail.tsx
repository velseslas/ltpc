import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Pencil, FileBarChart, ClipboardList, ClipboardEdit, Loader2, Calendar, Building, Thermometer, Beaker } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

interface EchantillonData {
  id: string;
  numero: number;
  numero_chantier: number;
  client_nom: string;
  chantier_nom: string;
  ouvrage: string;
  destination_beton: string;
  condition_cure: string;
  type_eprouvette: string;
  dimension_eprouvette: string;
  operateur_nom: string;
  date_coulage: string;
  nombre_eprouvettes: number;
  centrale_nom: string;
  formulation_nom: string;
  temperature_beton: number | null;
  temperature_air: number | null;
  classe_consistance: string | null;
  mode_coulage: string | null;
  statut: string;
  observations: string | null;
  jours_essai: { jour: number; nombre: number }[];
  essai_convenance: boolean;
  essai_convenance_details: string | null;
  date_essai: string | null;
  etuvage: string | null;
}

const getStatutBadge = (statut: string) => {
  switch (statut) {
    case "en-cours":
      return <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 bg-yellow-500/10">En cours</Badge>;
    case "termine":
      return <Badge variant="outline" className="border-emerald-500/50 text-emerald-500 bg-emerald-500/10">Terminé</Badge>;
    case "a-faire":
      return <Badge variant="outline" className="border-sky-500/50 text-sky-500 bg-sky-500/10">À faire</Badge>;
    default:
      return <Badge variant="outline" className="border-muted-foreground/50 text-muted-foreground">{statut}</Badge>;
  }
};

export default function ChantierEchantillonDetail() {
  const navigate = useNavigate();
  const { chantierId, echantillonId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [echantillon, setEchantillon] = useState<EchantillonData | null>(null);

  useEffect(() => {
    const fetchEchantillon = async () => {
      if (!echantillonId) return;
      
      try {
        const { data, error } = await supabase
          .from("echantillons_compression")
          .select(`
            *,
            clients:client_id(nom),
            chantiers:chantier_id(nom),
            intervenants:operateur_id(nom, prenom),
            centrales_beton:centrale_id(nom),
            formulations:formulation_id(nom)
          `)
          .eq("id", echantillonId)
          .single();

        if (error) throw error;

        const joursEssai = (Array.isArray(data.jours_essai) ? data.jours_essai : []) as { jour: number; nombre: number }[];

        setEchantillon({
          id: data.id,
          numero: data.numero,
          numero_chantier: (data as any).numero_chantier || data.numero,
          client_nom: data.clients?.nom || "-",
          chantier_nom: data.chantiers?.nom || "-",
          ouvrage: data.ouvrage || "-",
          destination_beton: data.destination_beton || "-",
          condition_cure: data.condition_cure || "-",
          type_eprouvette: data.type_eprouvette || "cube",
          dimension_eprouvette: data.dimension_eprouvette || "-",
          operateur_nom: data.intervenants 
            ? `${data.intervenants.prenom} ${data.intervenants.nom}`
            : "-",
          date_coulage: data.date_coulage || "",
          nombre_eprouvettes: data.nombre_eprouvettes || 0,
          centrale_nom: data.centrales_beton?.nom || "-",
          formulation_nom: data.formulations?.nom || "-",
          temperature_beton: data.temperature_beton,
          temperature_air: data.temperature_air,
          classe_consistance: data.classe_consistance,
          mode_coulage: data.mode_coulage,
          statut: data.statut,
          observations: data.observations,
          jours_essai: joursEssai,
          essai_convenance: data.essai_convenance || false,
          essai_convenance_details: data.essai_convenance_details || null,
          date_essai: data.date_essai || null,
          etuvage: (data as any).etuvage || null,
        });
      } catch (error) {
        console.error("Error fetching echantillon:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEchantillon();
  }, [echantillonId]);

  const basePath = `/laboratoires-mobiles/chantier/${chantierId}/echantillon/${echantillonId}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!echantillon) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Échantillon non trouvé</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(`/laboratoires-mobiles/chantier/${chantierId}`)}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EssaiBreadcrumb items={[
        { label: "Laboratoires Mobiles", path: "/laboratoires-mobiles" },
        { label: echantillon.chantier_nom, path: `/laboratoires-mobiles/chantier/${chantierId}` },
        { label: `EC-${String(echantillon.numero_chantier).padStart(3, "0")}` },
      ]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/laboratoires-mobiles/chantier/${chantierId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                Échantillon N° <span className="text-primary">EC</span>-{String(echantillon.numero_chantier).padStart(3, "0")}
              </h1>
              {getStatutBadge(echantillon.statut)}
            </div>
            <p className="text-muted-foreground">{echantillon.chantier_nom}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`${basePath}/bulletin`)}>
            <ClipboardList className="h-4 w-4 mr-2" />
            Bulletin
          </Button>
          <Button variant="outline" onClick={() => navigate(`${basePath}/saisie`)}>
            <ClipboardEdit className="h-4 w-4 mr-2" />
            Saisie données
          </Button>
          <Button variant="outline" onClick={() => navigate(`${basePath}/rapport`)}>
            <FileBarChart className="h-4 w-4 mr-2" />
            Rapport
          </Button>
          <Button onClick={() => navigate(`${basePath}/modifier`)}>
            <Pencil className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Identification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium">{echantillon.client_nom}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Chantier</p>
                <p className="font-medium">{echantillon.chantier_nom}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ouvrage</p>
                <p className="font-medium">{echantillon.ouvrage}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Partie de l'ouvrage</p>
                <p className="font-medium">{echantillon.destination_beton}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Centrale</p>
                <p className="font-medium">{echantillon.centrale_nom}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Formulation</p>
                <p className="font-medium">{echantillon.formulation_nom}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prélèvement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Prélèvement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Date de coulage</p>
                <p className="font-medium">
                  {echantillon.date_coulage 
                    ? format(new Date(echantillon.date_coulage), "dd MMMM yyyy", { locale: fr })
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Technicien</p>
                <p className="font-medium">{echantillon.operateur_nom}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Étuvage</p>
                <p className="font-medium">{echantillon.etuvage === "oui" ? "Oui" : "Non"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Températures */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Températures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Température béton</p>
                <p className="font-medium text-lg">
                  {echantillon.temperature_beton ? `${echantillon.temperature_beton}°C` : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Température air</p>
                <p className="font-medium text-lg">
                  {echantillon.temperature_air ? `${echantillon.temperature_air}°C` : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Éprouvettes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Beaker className="h-5 w-5" />
              Éprouvettes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">{echantillon.type_eprouvette}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dimension</p>
                <p className="font-medium">{echantillon.dimension_eprouvette}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nombre total</p>
                <p className="font-medium text-lg">{echantillon.nombre_eprouvettes}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Condition de cure</p>
                <p className="font-medium">{echantillon.condition_cure}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-2">Répartition par jours d'essai</p>
              <div className="flex flex-wrap gap-2">
                {echantillon.jours_essai
                  .filter(j => j.nombre > 0)
                  .map((j) => (
                    <Badge key={j.jour} variant="secondary">
                      {j.jour} jours: {j.nombre} épr.
                    </Badge>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Observations */}
      {echantillon.observations && (
        <Card>
          <CardHeader>
            <CardTitle>Observations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{echantillon.observations}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
