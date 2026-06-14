import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ArrowLeft, 
  Pencil, 
  Users, 
  Building2, 
  Calendar, 
  MapPin,
  Phone,
  Mail,
  CreditCard,
  FileText,
  Briefcase,
  Clock,
  BadgeCheck,
  Wallet,
  Home,
  Image,
  Download
} from "lucide-react";
import { useIntervenant } from "@/hooks/useIntervenants";
import { useAffectationsByIntervenant } from "@/hooks/useAffectations";
import { useDocumentsRH } from "@/hooks/useDocumentsRH";
import { usePostes } from "@/hooks/usePostes";
import { format, differenceInYears, differenceInMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";

export default function EmployeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: employe, isLoading: loadingEmploye } = useIntervenant(id || "");
  const { data: affectations, isLoading: loadingAffectations } = useAffectationsByIntervenant(id || "");
  const { documents, isLoading: loadingDocuments } = useDocumentsRH();
  const { data: postes } = usePostes();

  // Filter documents for this employee
  const employeDocuments = documents?.filter(doc => doc.intervenant_id === id) || [];

  // Get poste name
  const poste = postes?.find(p => p.id === employe?.poste_id);

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case "active":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            Actif
          </Badge>
        );
      case "mission":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            En mission
          </Badge>
        );
      case "conge":
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            En congé
          </Badge>
        );
      case "inactive":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            Inactif
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground">
            {statut}
          </Badge>
        );
    }
  };

  const getAffectationStatusBadge = (statut: string) => {
    switch (statut) {
      case "en_cours":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            En cours
          </Badge>
        );
      case "terminee":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            Terminée
          </Badge>
        );
      case "annulee":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            Annulée
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground">
            {statut}
          </Badge>
        );
    }
  };

  const formatPeriode = (dateDebut: string | null, dateFin: string | null) => {
    if (!dateDebut) return "N/A";
    const debut = format(new Date(dateDebut), "dd/MM/yyyy", { locale: fr });
    const fin = dateFin ? format(new Date(dateFin), "dd/MM/yyyy", { locale: fr }) : "En cours";
    return `${debut} - ${fin}`;
  };

  const getAnciennete = (dateEmbauche: string | null) => {
    if (!dateEmbauche) return null;
    const now = new Date();
    const embauche = new Date(dateEmbauche);
    const years = differenceInYears(now, embauche);
    const months = differenceInMonths(now, embauche) % 12;
    
    if (years > 0) {
      return `${years} an${years > 1 ? 's' : ''} et ${months} mois`;
    }
    return `${months} mois`;
  };

  const getDocumentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'contrat': 'Contrat de travail',
      'cv': 'CV',
      'diplome': 'Diplôme',
      'attestation': 'Attestation',
      'certificat': 'Certificat',
      'autre': 'Autre document'
    };
    return types[type] || type;
  };

  if (loadingEmploye) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!employe) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Employé non trouvé</h3>
        <p className="text-muted-foreground mb-4">L'employé que vous recherchez n'existe pas ou a été supprimé.</p>
        <Button onClick={() => navigate("/rh/employes")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Ressources Humaines", path: "/rh" },
        { label: "Employés", path: "/rh/employes" },
        { label: `${employe.prenom} ${employe.nom}` }
      ]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
            onClick={() => navigate("/rh/employes")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {employe.prenom} <span className="uppercase">{employe.nom}</span>
              </h1>
              {getStatusBadge(employe.statut)}
            </div>
            <p className="text-muted-foreground">
              {poste?.nom || employe.role} {employe.departement && `• ${employe.departement}`}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate(`/rh/employes/${id}/modifier`)} className="gap-2">
          <Pencil className="h-4 w-4" />
          Modifier
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Information */}
        <div className="space-y-6">
          {/* Informations personnelles */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  Informations <span className="text-primary">personnelles</span>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-primary">
                    {employe.email || "Non renseigné"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-medium text-foreground">
                    {employe.telephone || "Non renseigné"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Home className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Adresse</p>
                  <p className="font-medium text-foreground">
                    {employe.adresse || "Non renseignée"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Date de naissance</p>
                  <p className="font-medium text-foreground">
                    {employe.date_naissance 
                      ? format(new Date(employe.date_naissance), "dd MMMM yyyy", { locale: fr })
                      : "Non renseignée"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations administratives */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  Informations <span className="text-primary">administratives</span>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <BadgeCheck className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Numéro CIN</p>
                  <p className="font-medium text-foreground font-mono">
                    {employe.cin || "Non renseigné"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Numéro CNAS</p>
                  <p className="font-medium text-foreground font-mono">
                    {employe.cnas || "Non renseigné"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Briefcase className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Date d'embauche</p>
                  <p className="font-medium text-foreground">
                    {employe.date_embauche 
                      ? format(new Date(employe.date_embauche), "dd MMMM yyyy", { locale: fr })
                      : "Non renseignée"
                    }
                  </p>
                </div>
              </div>

              {employe.date_embauche && (
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ancienneté</p>
                    <p className="font-medium text-primary">
                      {getAnciennete(employe.date_embauche)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Wallet className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Salaire</p>
                  <p className="font-medium text-foreground">
                    {employe.salaire 
                      ? `${employe.salaire.toLocaleString('fr-DZ')} DA`
                      : "Non renseigné"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Signature */}
          {employe.signature_url && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    <span className="text-primary">Signature</span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg p-4 border">
                  <img 
                    src={employe.signature_url} 
                    alt="Signature" 
                    className="max-h-24 mx-auto"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {employe.notes && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    <span className="text-primary">Notes</span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {employe.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Affectations & Documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Historique des Affectations */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    Historique des <span className="text-primary">Affectations</span>
                  </CardTitle>
                </div>
                <Badge variant="outline">
                  {affectations?.length || 0} affectation{(affectations?.length || 0) > 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loadingAffectations ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : affectations && affectations.length > 0 ? (
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
                        <TableRow 
                          key={affectation.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/rh/affectations/${affectation.id}`)}
                        >
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
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune affectation pour cet employé</p>
                  <Button 
                    variant="link" 
                    className="mt-2"
                    onClick={() => navigate("/rh/affectations/nouveau")}
                  >
                    Créer une affectation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    <span className="text-primary">Documents</span> associés
                  </CardTitle>
                </div>
                <Badge variant="outline">
                  {employeDocuments.length} document{employeDocuments.length > 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loadingDocuments ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : employeDocuments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Nom du fichier</TableHead>
                        <TableHead>Date d'ajout</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeDocuments.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <Badge variant="outline">
                              {getDocumentTypeLabel(doc.type_document)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {doc.nom_fichier || "Sans nom"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(doc.created_at), "dd/MM/yyyy", { locale: fr })}
                          </TableCell>
                          <TableCell className="text-right">
                            {doc.url_fichier && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => window.open(doc.url_fichier!, '_blank')}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun document pour cet employé</p>
                  <Button 
                    variant="link" 
                    className="mt-2"
                    onClick={() => navigate("/rh/documents")}
                  >
                    Gérer les documents
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Spécialité et compétences */}
          {(employe.specialite || poste?.competences) && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    Compétences et <span className="text-primary">spécialités</span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {employe.specialite && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Spécialité</p>
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      {employe.specialite}
                    </Badge>
                  </div>
                )}
                {poste?.competences && poste.competences.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Compétences du poste</p>
                    <div className="flex flex-wrap gap-2">
                      {poste.competences.map((comp, i) => (
                        <Badge key={i} variant="outline">
                          {comp}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
