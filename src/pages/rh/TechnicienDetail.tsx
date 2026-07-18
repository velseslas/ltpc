import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Building2, Calendar, MapPin, ArrowLeft, Pencil } from "lucide-react";
import { useIntervenant } from "@/hooks/useIntervenants";
import { useAffectationsByIntervenant } from "@/hooks/useAffectations";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";

export default function TechnicienDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: intervenant, isLoading: loadingIntervenant } = useIntervenant(id || "");
  const { data: affectations, isLoading: loadingAffectations } = useAffectationsByIntervenant(id || "");

  if (loadingIntervenant || loadingAffectations) {
    return (
      <div data-essai-mobile className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!intervenant) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Technicien non trouvé</div>
      </div>
    );
  }

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case "active":
        return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">Disponible</Badge>;
      case "mission":
        return <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">En mission</Badge>;
      default:
        return <Badge variant="outline" className="bg-muted text-muted-foreground">Inactif</Badge>;
    }
  };

  const getAffectationStatusBadge = (statut: string) => {
    if (statut === "en_cours") {
      return <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30">En cours</Badge>;
    }
    return <Badge variant="outline" className="bg-muted text-muted-foreground">{statut}</Badge>;
  };

  const formatPeriode = (dateDebut: string | null, dateFin: string | null) => {
    if (!dateDebut) return "N/A";
    const debut = format(new Date(dateDebut), "dd/MM/yyyy", { locale: fr });
    const fin = dateFin ? format(new Date(dateFin), "dd/MM/yyyy", { locale: fr }) : "...";
    return `${debut} - ${fin}`;
  };

  return (
    <div className="space-y-6">
        <AppBreadcrumb items={[
          { label: "Ressources Humaines", path: "/rh" },
          { label: "Affectations", path: "/rh/affectations" },
          { label: `${intervenant.prenom} ${intervenant.nom}` }
        ]} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
              onClick={() => navigate("/rh/affectations")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-semibold text-foreground">
              Détails du technicien
            </h1>
          </div>
          <Button
            variant="outline"
            className="gap-2 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
            onClick={() => navigate(`/rh/employes/${id}/modifier`)}
          >
            <Pencil className="h-4 w-4" />
            Modifier
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Personal Information */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  Informations <span className="text-primary">personnelles</span>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nom complet</p>
                <p className="font-medium text-foreground">
                  {intervenant.prenom} {intervenant.nom?.toUpperCase()}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Poste</p>
                <p className="font-medium text-foreground">{intervenant.role}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Spécialité</p>
                <p className="font-medium text-foreground">
                  {intervenant.specialite || "Non définie"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Statut</p>
                {getStatusBadge(intervenant.statut)}
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Date d'embauche</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium text-foreground">
                    {intervenant.date_embauche 
                      ? format(new Date(intervenant.date_embauche), "dd/MM/yyyy", { locale: fr })
                      : "Non définie"
                    }
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Téléphone</p>
                <p className="font-medium text-foreground">
                  {intervenant.telephone || "Non défini"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="font-medium text-primary">
                  {intervenant.email || "Non défini"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Affectations Table */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  Affectations ({affectations?.length || 0})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {affectations && affectations.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Chantier</TableHead>
                        <TableHead>Ville</TableHead>
                        <TableHead>Période</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {affectations.map((affectation) => (
                        <TableRow key={affectation.id}>
                          <TableCell className="font-medium">
                            {(affectation as any).client?.nom || "N/A"}
                          </TableCell>
                          <TableCell>
                            {(affectation as any).chantier?.nom || "N/A"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {(affectation as any).chantier?.ville || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatPeriode(affectation.date_debut, affectation.date_fin)}
                          </TableCell>
                          <TableCell>
                            {getAffectationStatusBadge(affectation.statut)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune affectation pour ce technicien
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
