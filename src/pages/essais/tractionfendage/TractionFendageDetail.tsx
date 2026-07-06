import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, FileText, ClipboardEdit, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useEchantillonTractionFendageById } from "@/hooks/useEchantillonsTractionFendage";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { ModificationsHistory } from "@/components/essais/ModificationsHistory";

const TractionFendageDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: echantillon, isLoading } = useEchantillonTractionFendageById(id);

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

  const joursEssai = echantillon.jours_essai as Array<{ jour: number; nombre: number }> | null;

  return (
    <div className="space-y-6">
      <EssaiBreadcrumb 
        items={[
          { label: "Béton", path: "/essais/beton" },
          { label: "Béton Durci", path: "/essais/beton/beton-durci" },
          { label: "Traction par Fendage", path: "/essais/beton/beton-durci/traction-fendage" },
          { label: <><span className="text-primary">TF</span>-{String(echantillon.numero).padStart(3, "0")}</> }
        ]} 
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/essais/beton/beton-durci/traction-fendage")}
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              <span className="text-primary">TF</span>-{String(echantillon.numero).padStart(3, "0")}
            </h1>
            <p className="text-muted-foreground">Essai de Traction par Fendage</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/essais/beton/beton-durci/traction-fendage/${id}/saisie`)}
            className=""
          >
            <ClipboardEdit className="h-4 w-4 mr-2" />
            Saisie de données
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/essais/beton/beton-durci/traction-fendage/${id}/rapport`)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Rapport
          </Button>
          <Button
            onClick={() => navigate(`/essais/beton/beton-durci/traction-fendage/${id}/modifier`)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations Générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium">{echantillon.clients?.nom || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Chantier</p>
                <p className="font-medium">{echantillon.chantiers?.nom || "-"}</p>
              </div>
              {echantillon.essai_convenance ? (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Essai de convenance</p>
                  <p className="font-medium">{echantillon.essai_convenance_details || "Oui"}</p>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Ouvrage</p>
                    <p className="font-medium">{echantillon.ouvrage || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Partie de l'ouvrage</p>
                    <p className="font-medium">{echantillon.destination_beton || "-"}</p>
                  </div>
                </>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Date de coulage</p>
                <p className="font-medium">
                  {echantillon.date_coulage 
                    ? format(new Date(echantillon.date_coulage), "dd MMMM yyyy", { locale: fr })
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Statut</p>
                <Badge 
                  variant="outline" 
                  className={
                    echantillon.statut === "termine" 
                      ? "border-emerald-500/50 text-emerald-500 bg-emerald-500/10"
                      : echantillon.statut === "en-cours"
                      ? "border-yellow-500/50 text-yellow-500 bg-yellow-500/10"
                      : "border-sky-500/50 text-sky-500 bg-sky-500/10"
                  }
                >
                  {echantillon.statut === "termine" ? "Terminé" : echantillon.statut === "en-cours" ? "En cours" : "À faire"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Caractéristiques de l'essai */}
        <Card>
          <CardHeader>
            <CardTitle>Caractéristiques de l'Essai</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Centrale à Béton</p>
                <p className="font-medium">{echantillon.centrales_beton?.nom || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Formulation</p>
                <p className="font-medium">{echantillon.formulations?.nom || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Condition de cure</p>
                <p className="font-medium capitalize">{echantillon.condition_cure || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dimension éprouvette</p>
                <p className="font-medium">{echantillon.dimension_eprouvette || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nombre d'éprouvettes</p>
                <p className="font-medium">{echantillon.nombre_eprouvettes || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Classe de consistance</p>
                <p className="font-medium">{echantillon.classe_consistance || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Température béton</p>
                <p className="font-medium">{echantillon.temperature_beton ? `${echantillon.temperature_beton}°C` : "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Température air</p>
                <p className="font-medium">{echantillon.temperature_air ? `${echantillon.temperature_air}°C` : "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jours d'essai */}
        <Card>
          <CardHeader>
            <CardTitle>Jours d'Essai</CardTitle>
          </CardHeader>
          <CardContent>
            {joursEssai && joursEssai.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {joursEssai.map((jour) => (
                  <div key={jour.jour} className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-lg font-bold text-primary">{jour.jour}j</p>
                    <p className="text-sm text-muted-foreground">{jour.nombre} éprouvettes</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Aucun jour d'essai configuré</p>
            )}
          </CardContent>
        </Card>

        {/* Opérateur */}
        <Card>
          <CardHeader>
            <CardTitle>Technicien</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {echantillon.intervenants 
                ? `${echantillon.intervenants.prenom} ${echantillon.intervenants.nom}`
                : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      {id && <ModificationsHistory tableName="echantillons_traction_fendage" recordId={id} />}
    </div>
  );
};

export default TractionFendageDetail;
