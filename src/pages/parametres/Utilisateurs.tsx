import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Users, Plus, Search, MoreHorizontal, Shield, Clock, Loader2 } from "lucide-react";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { ConfirmDelete } from "@/components/common/ConfirmDelete";
import { AdminOnly } from "@/components/common/AdminOnly";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  useUtilisateurs,
  useCreateUtilisateur,
  useUpdateUtilisateur,
  useDeleteUtilisateur,
  Utilisateur,
} from "@/hooks/useParametres";
import { usePostes } from "@/hooks/usePostes";
import { useIntervenants } from "@/hooks/useIntervenants";

const Utilisateurs = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Utilisateur | null>(null);
  const [formData, setFormData] = useState({
    poste_id: "",
    intervenant_id: "",
    role: "technicien",
    statut: "actif",
  });

  const { data: utilisateurs = [], isLoading } = useUtilisateurs();
  const { data: postes = [] } = usePostes();
  const { data: intervenants = [] } = useIntervenants();
  const createUtilisateur = useCreateUtilisateur();
  const updateUtilisateur = useUpdateUtilisateur();
  const deleteUtilisateur = useDeleteUtilisateur();

  // Filter intervenants by selected poste
  const filteredIntervenants = useMemo(() => {
    if (!formData.poste_id) return [];
    return intervenants.filter((i) => i.poste_id === formData.poste_id);
  }, [intervenants, formData.poste_id]);

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const filteredUsers = utilisateurs.filter(
    (user) =>
      user.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length);

  const handleOpenDialog = (user?: Utilisateur) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        poste_id: user.poste_id || "",
        intervenant_id: user.intervenant_id || "",
        role: user.role,
        statut: user.statut,
      });
    } else {
      setEditingUser(null);
      setFormData({
        poste_id: "",
        intervenant_id: "",
        role: "technicien",
        statut: "actif",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.intervenant_id) return;

    // Get selected intervenant info
    const selectedIntervenant = intervenants.find((i) => i.id === formData.intervenant_id);
    if (!selectedIntervenant) return;

    const nom = `${selectedIntervenant.nom} ${selectedIntervenant.prenom || ""}`.trim();
    const email = selectedIntervenant.email || "";

    if (editingUser) {
      await updateUtilisateur.mutateAsync({
        id: editingUser.id,
        nom,
        email,
        role: formData.role,
        statut: formData.statut,
        poste_id: formData.poste_id || null,
        intervenant_id: formData.intervenant_id || null,
      });
    } else {
      await createUtilisateur.mutateAsync({
        nom,
        email,
        role: formData.role,
        statut: formData.statut,
        poste_id: formData.poste_id || null,
        intervenant_id: formData.intervenant_id || null,
        user_id: null,
        derniere_connexion: null,
      });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteUtilisateur.mutateAsync(id);
  };

  const handleToggleStatus = async (user: Utilisateur) => {
    const newStatut = user.statut === "actif" ? "inactif" : "actif";
    await updateUtilisateur.mutateAsync({
      id: user.id,
      statut: newStatut,
    });
  };

  const roleLabels: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    manager: "Manager",
    technicien: "Technicien",
    operateur: "Opérateur",
    lecteur: "Lecteur",
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      admin: "bg-red-500/20 text-red-400 border-red-500/30",
      manager: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      technicien: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      operateur: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      lecteur: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    };
    return (
      <Badge className={colors[role] || "bg-muted text-muted-foreground"}>
        {roleLabels[role] || role}
      </Badge>
    );
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "actif":
        return <Badge className="bg-emerald-500/20 text-emerald-400">Actif</Badge>;
      case "inactif":
        return <Badge className="bg-red-500/20 text-red-400">Inactif</Badge>;
      case "en_attente":
        return <Badge className="bg-amber-500/20 text-amber-400">En attente</Badge>;
      default:
        return null;
    }
  };

  const getInitials = (nom: string) => {
    return nom
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const activeCount = utilisateurs.filter((u) => u.statut === "actif").length;
  const pendingCount = utilisateurs.filter((u) => u.statut === "en_attente").length;

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Paramètres", path: "/parametres" },
        { label: "Utilisateurs" },
      ]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/parametres")}
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                <span className="text-primary">Utilisateurs</span>
              </h1>
              <p className="text-muted-foreground">
                Gérer les utilisateurs, les rôles et les permissions
              </p>
            </div>
          </div>
        </div>
        <Button className="gap-2" onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4" />
          Ajouter un utilisateur
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{utilisateurs.length}</p>
              <p className="text-sm text-muted-foreground">Total utilisateurs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <Shield className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liste des utilisateurs</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? "Aucun utilisateur trouvé"
                : "Aucun utilisateur. Cliquez sur 'Ajouter un utilisateur' pour commencer."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(user.nom)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.nom}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatutBadge(user.statut)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(user)}>
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                            {user.statut === "actif" ? "Désactiver" : "Activer"}
                          </DropdownMenuItem>
                          <AdminOnly>
                            <ConfirmDelete
                              trigger={
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onSelect={(ev) => ev.preventDefault()}
                                >
                                  Supprimer
                                </DropdownMenuItem>
                              }
                              onConfirm={() => handleDelete(user.id)}
                              description={`Supprimer l'utilisateur « ${user.nom} » ? Cette action est irréversible.`}
                              adminOnly={false}
                            />
                          </AdminOnly>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {filteredUsers.length > ITEMS_PER_PAGE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border mt-4">
              <div className="text-sm text-muted-foreground">
                Affichage de {startIndex + 1} à {endIndex} sur {filteredUsers.length} utilisateurs
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Précédent</Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)} className="w-8 h-8 p-0">{page}</Button>
                ))}
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Suivant</Button>
              </div>
           </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for create/edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Poste de travail</Label>
              <Select
                value={formData.poste_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, poste_id: value, intervenant_id: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un poste" />
                </SelectTrigger>
                <SelectContent>
                  {postes.map((poste) => (
                    <SelectItem key={poste.id} value={poste.id}>
                      {poste.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Employé</Label>
              <Select
                value={formData.intervenant_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, intervenant_id: value })
                }
                disabled={!formData.poste_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.poste_id ? "Sélectionner un employé" : "Sélectionnez d'abord un poste"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredIntervenants.length === 0 ? (
                    <SelectItem value="__empty" disabled>
                      Aucun employé pour ce poste
                    </SelectItem>
                  ) : (
                    filteredIntervenants.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.nom} {emp.prenom || ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="technicien">Technicien</SelectItem>
                  <SelectItem value="operateur">Opérateur</SelectItem>
                  <SelectItem value="lecteur">Lecteur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={formData.statut}
                onValueChange={(value) =>
                  setFormData({ ...formData, statut: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="inactif">Inactif</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.intervenant_id ||
                createUtilisateur.isPending || updateUtilisateur.isPending
              }
            >
              {(createUtilisateur.isPending || updateUtilisateur.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingUser ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Utilisateurs;
