import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, FileText, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { ModificationsHistory } from "@/components/essais/ModificationsHistory";
import { useEchantillonPermeabiliteById } from "@/hooks/useEchantillonsPermeabilite";

const getStatutBadge = (statut: string) => {
  switch (statut) {
    case "termine":
      return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Terminé</Badge>;
    case "en-cours":
      return <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30">En cours</Badge>;
    default:
      return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">En attente</Badge>;
  }
};

const PermeabiliteDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: echantillon, isLoading } = useEchantillonPermeabiliteById(id);

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
    <div className="space-y-6">
      <EssaiBreadcrumb
        items={[
          { label: "Béton", path: "/essais/beton" },
          { label: "Béton Durci", path: "/essais/beton/beton-durci" },
          { label: "Perméabilité", path: "/essais/beton/beton-durci/permeabilite" },
          { label: <><span className="text-primary">PE</span>-{String(echantillon.numero).padStart(3, "0")}</> },
        ]}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3 sm:gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`/essais/beton/beton-durci/permeabilite?echantillon=${id}`)}
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-display font-bold text-foreground">
              <span className="text-primary">PE</span>-{String(echantillon.numero).padStart(3, "0")}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base truncate">Perméabilité - NF EN 12390-8</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center lg:justify-end">
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => navigate(`/essais/beton/beton-durci/permeabilite/${id}/modifier`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button size="sm" className="w-full sm:w-auto" onClick={() => navigate(`/essais/beton/beton-durci/permeabilite/${id}/saisie`)}>
            <Plus className="h-4 w-4 mr-2" />
            Saisie
          </Button>
          {echantillon.statut === "termine" && (
            <Button
              size="sm"
              onClick={() => navigate(`/essais/beton/beton-durci/permeabilite/${id}/rapport`)}
              className="gradient-primary text-primary-foreground w-full sm:w-auto col-span-2 sm:col-auto"
            >
              <FileText className="h-4 w-4 mr-2" />
              Rapport
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Identification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Client</span>
              <span className="font-medium">{echantillon.clients?.nom || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chantier</span>
              <span className="font-medium">{echantillon.chantiers?.nom || "-"}</span>
            </div>
            {echantillon.essai_convenance ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Essai de convenance</span>
                <span className="font-medium">{echantillon.essai_convenance_details || "Oui"}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ouvrage</span>
                  <span className="font-medium">{echantillon.ouvrage || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Partie de l'ouvrage</span>
                  <span className="font-medium">{echantillon.destination_beton || "-"}</span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Statut</span>
              {getStatutBadge(echantillon.statut)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Caractéristiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date de coulage</span>
              <span className="font-medium">
                {echantillon.date_coulage
                  ? format(new Date(echantillon.date_coulage), "dd/MM/yyyy", { locale: fr })
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Condition de cure</span>
              <span className="font-medium capitalize">{echantillon.condition_cure || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dimension éprouvette</span>
              <span className="font-medium">{echantillon.dimension_eprouvette}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pression d'essai</span>
              <span className="font-medium">{echantillon.pression_essai} kPa</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Durée d'essai</span>
              <span className="font-medium">{echantillon.duree_essai} h</span>
            </div>
          </CardContent>
        </Card>
      </div>

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

      {id && <ModificationsHistory tableName="echantillons_permeabilite" recordId={id} />}
    </div>
  );
};

export default PermeabiliteDetail;
