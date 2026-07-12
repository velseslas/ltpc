import { useState, useMemo } from "react";
import { ArrowLeft, Plus, Search, MoreHorizontal, Eye, Pencil, Trash2, UserPlus, Printer, Download, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/alert-dialog";
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeToDelete, setEmployeToDelete] = useState<string | null>(null);

  const { data: employes, isLoading } = useIntervenants();
  const { data: affectations } = useAffectations();
  const deleteEmploye = useDeleteIntervenant();

  const employesWithActiveAffectations = useMemo(() => {
    if (!affectations || affectations.length === 0) return new Set<string>();
    const today = new Date().toISOString().split("T")[0];
    const activeIntervenantIds = affectations
      .filter((aff) => {
        const isActiveStatus = aff.statut === "en_cours";
        const hasStarted = aff.date_debut <= today;
        const notEnded = !aff.date_fin || aff.date_fin >= today;
        return isActiveStatus && hasStarted && notEnded;
      })
      .map((aff) => aff.intervenant_id);
    return new Set(activeIntervenantIds);
  }, [affectations]);

  const getEffectiveStatus = (employe: { id: string; statut: string }) => {
    if (employesWithActiveAffectations.has(employe.id)) return "mission";
    return employe.statut;
  };

  const filteredEmployes = employes?.filter((employe) => {
    const effectiveStatus = getEffectiveStatus(employe);
    const matchesSearch =
      employe.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employe.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employe.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employe.role?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || effectiveStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async () => {
    if (!employeToDelete) return;
    try {
      await deleteEmploye.mutateAsync(employeToDelete);
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
    } finally {
      setDeleteDialogOpen(false);
      setEmployeToDelete(null);
    }
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case "active":
        return (
          <Badge variant="outline" className="border-emerald-500/50 text-emerald-500 bg-emerald-500/10">
            Actif
          </Badge>
        );
      case "mission":
        return (
          <Badge variant="outline" className="border-sky-500/50 text-sky-500 bg-sky-500/10">
            En mission
          </Badge>
        );
      case "conge":
        return (
          <Badge variant="outline" className="border-amber-500/50 text-amber-500 bg-amber-500/10">
            En congé
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="outline" className="border-red-500/50 text-red-500 bg-red-500/10">
            Inactif
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-muted-foreground/50 text-muted-foreground">
            {statut}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <AppBreadcrumb
        items={[
          { label: "Ressources Humaines", path: "/rh" },
          { label: "Employés" },
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
            <h1 className="text-2xl font-bold text-foreground">Gestion du Personnel</h1>
            <p className="text-muted-foreground">
              Gérez les informations et affectations du personnel
            </p>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-1 gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un employé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
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
        </div>
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
          <Button
            onClick={() => navigate("/rh/employes/nouveau")}
            className="gradient-primary text-primary-foreground gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouveau
          </Button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Liste des employés ({filteredEmployes?.length ?? 0})
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Chargement...
          </div>
        ) : !filteredEmployes || filteredEmployes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
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
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Nom & Prénom</TableHead>
                <TableHead className="text-muted-foreground">Poste</TableHead>
                <TableHead className="text-muted-foreground">Département</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">Téléphone</TableHead>
                <TableHead className="text-muted-foreground">Date d'embauche</TableHead>
                <TableHead className="text-muted-foreground">Statut</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployes.map((employe) => (
                <TableRow
                  key={employe.id}
                  className="border-border hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/rh/employes/${employe.id}`)}
                >
                  <TableCell className="font-medium text-foreground">
                    {employe.prenom} <span className="uppercase">{employe.nom}</span>
                  </TableCell>
                  <TableCell className="text-foreground">
                    {employe.postes?.nom || employe.role || "-"}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {employe.departement || "-"}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {employe.email || "-"}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {employe.telephone || "-"}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {employe.date_embauche
                      ? format(new Date(employe.date_embauche), "dd/MM/yyyy", { locale: fr })
                      : "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(getEffectiveStatus(employe))}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/rh/employes/${employe.id}`);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Voir les détails
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/rh/employes/${employe.id}/modifier`);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <AdminOnly>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setEmployeToDelete(employe.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </AdminOnly>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet employé ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Employes;
