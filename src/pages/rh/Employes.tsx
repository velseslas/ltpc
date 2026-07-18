import { useState, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Eye,
  Printer,
  Download,
  Send,
  UserPlus,
  MoreVertical,
  ShieldCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SecuFormDialog } from "@/components/rh/SecuFormDialog";
import { useIntervenants, useDeleteIntervenant } from "@/hooks/useIntervenants";
import { useAffectations } from "@/hooks/useAffectations";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { AdminOnly } from "@/components/common/AdminOnly";

const Employes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: employes, isLoading } = useIntervenants();
  const { data: affectations } = useAffectations();
  const deleteEmploye = useDeleteIntervenant();
  const [secuEmploye, setSecuEmploye] = useState<any | null>(null);

  // Determine which employees have active assignments
  const employesWithActiveAffectations = useMemo(() => {
    if (!affectations || affectations.length === 0) return new Set<string>();
    const today = new Date().toISOString().split('T')[0];
    
    const activeIntervenantIds = affectations
      .filter(aff => {
        const isActiveStatus = aff.statut === 'en_cours';
        const hasStarted = aff.date_debut <= today;
        const notEnded = !aff.date_fin || aff.date_fin >= today;
        return isActiveStatus && hasStarted && notEnded;
      })
      .map(aff => aff.intervenant_id);
    
    return new Set(activeIntervenantIds);
  }, [affectations]);

  // Get the effective status based on active affectations
  const getEffectiveStatus = (employe: { id: string; statut: string }) => {
    if (employesWithActiveAffectations.has(employe.id)) {
      return 'mission';
    }
    return employe.statut;
  };

  const filteredEmployes = employes?.filter((employe) => {
    const effectiveStatus = getEffectiveStatus(employe);
    const matchesSearch =
      employe.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employe.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employe.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employe.role?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || effectiveStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteEmploye.mutateAsync(id);
      toast({
        title: "Employé supprimé",
        description: "L'employé a été supprimé avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'employé.",
        variant: "destructive",
      });
    }
  };

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

  return (
    <div data-essai-mobile className="space-y-6">
        {/* Header */}
        <AppBreadcrumb 
          items={[
            { label: "Ressources Humaines", path: "/rh" },
            { label: "Employés" }
          ]} 
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
              onClick={() => navigate("/rh")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Gestion du Personnel
              </h1>
              <p className="text-muted-foreground">
                Gérez les informations et affectations du personnel
              </p>
            </div>
          </div>
        </div>

        {/* Search + New */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un employé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={() => navigate("/rh/employes/nouveau")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouveau
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="mission">En mission</SelectItem>
              <SelectItem value="conge">En congé</SelectItem>
              <SelectItem value="inactive">Inactif</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimer
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Send className="h-4 w-4" />
              Courrier
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-10 w-full mt-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!filteredEmployes || filteredEmployes.length === 0) && (
          <Card className="border-border/50 bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Aucun employé trouvé
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery || statusFilter !== "all"
                  ? "Aucun employé ne correspond à vos critères de recherche."
                  : "Commencez par ajouter votre premier employé."}
              </p>
              <Button onClick={() => navigate("/rh/employes/nouveau")}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un employé
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Employees Grid */}
        {!isLoading && filteredEmployes && filteredEmployes.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEmployes.map((employe) => (
              <Card
                key={employe.id}
                className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors group"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      {employe.prenom} <span className="uppercase">{employe.nom}</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(getEffectiveStatus(employe))}
                      <AlertDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              aria-label="Actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => navigate(`/rh/employes/${employe.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir les détails
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/rh/employes/${employe.id}/modifier`)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSecuEmploye(employe)}>
                              <ShieldCheck className="h-4 w-4 mr-2" />
                              Sécu
                            </DropdownMenuItem>
                            <AdminOnly>
                              <DropdownMenuSeparator />
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                            </AdminOnly>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer {employe.prenom} {employe.nom} ?
                              Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(employe.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm text-primary font-medium">
                      {employe.postes?.nom || employe.role}
                    </p>
                  </div>

                  {employe.departement && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground">Spécialité</p>
                      <p className="text-sm font-medium text-muted-foreground">
                        {employe.departement}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 text-sm text-muted-foreground">
                    {employe.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{employe.email}</span>
                      </div>
                    )}
                    {employe.telephone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{employe.telephone}</span>
                      </div>
                    )}
                    {employe.date_embauche && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Embauché le{" "}
                          {format(new Date(employe.date_embauche), "dd/MM/yyyy", {
                            locale: fr,
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                      onClick={() => navigate(`/rh/employes/${employe.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                      Voir les détails
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <SecuFormDialog
          open={!!secuEmploye}
          onOpenChange={(o) => !o && setSecuEmploye(null)}
          employe={secuEmploye}
        />
    </div>
  );
};

export default Employes;