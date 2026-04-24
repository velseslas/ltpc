import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, KeyRound, Plus, MoreHorizontal, Users, Loader2, Eye, EyeOff } from "lucide-react";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { ConfirmDelete } from "@/components/common/ConfirmDelete";
import { AdminOnly } from "@/components/common/AdminOnly";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePostes } from "@/hooks/usePostes";
import { useIntervenants } from "@/hooks/useIntervenants";
import { supabase } from "@/integrations/supabase/client";

interface UtilisateurRow {
  id: string;
  nom: string;
  email: string;
  role: string;
  statut: string;
  poste_id: string | null;
  intervenant_id: string | null;
}

const Authentification = () => {
  const navigate = useNavigate();
  const { data: postes = [] } = usePostes();
  const { data: intervenants = [] } = useIntervenants();

  const [utilisateurs, setUtilisateurs] = useState<UtilisateurRow[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<UtilisateurRow | null>(null);
  const [formData, setFormData] = useState({
    poste_id: "",
    intervenant_id: "",
    mot_de_passe: "",
    statut: "actif",
    role: "technicien",
  });
  const [editFormData, setEditFormData] = useState({
    mot_de_passe: "",
    statut: "actif",
    role: "technicien",
    poste_id: "",
  });
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    const { data } = await supabase
      .from("utilisateurs")
      .select("id, nom, email, role, statut, poste_id, intervenant_id")
      .order("nom");
    if (data) setUtilisateurs(data as UtilisateurRow[]);
    setIsLoadingUsers(false);
  };

  const filteredIntervenants = useMemo(() => {
    if (!formData.poste_id) return [];
    return intervenants.filter((i) => i.poste_id === formData.poste_id);
  }, [intervenants, formData.poste_id]);

  const handleCreateUser = async () => {
    if (!formData.intervenant_id || !formData.mot_de_passe) return;

    const selectedIntervenant = intervenants.find((i) => i.id === formData.intervenant_id);
    if (!selectedIntervenant) return;

    const nom = `${selectedIntervenant.nom} ${selectedIntervenant.prenom || ""}`.trim();
    const email = selectedIntervenant.email || `${selectedIntervenant.nom.toLowerCase().replace(/\s/g, ".")}@lab.local`;

    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          nom,
          email,
          password: formData.mot_de_passe,
          role: formData.role,
          statut: formData.statut,
          poste_id: formData.poste_id || null,
          intervenant_id: formData.intervenant_id || null,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Utilisateur créé avec succès");
      setIsDialogOpen(false);
      setFormData({ poste_id: "", intervenant_id: "", mot_de_passe: "", statut: "actif", role: "technicien" });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la création");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditUser = (user: UtilisateurRow) => {
    setEditingUser(user);
    setEditFormData({
      mot_de_passe: "",
      statut: user.statut,
      role: user.role,
      poste_id: user.poste_id || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    const newPassword = editFormData.mot_de_passe?.trim() || "";
    const passwordChanged = !!newPassword;
    if (passwordChanged && newPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("update-user", {
        body: {
          utilisateur_id: editingUser.id,
          password: passwordChanged ? newPassword : undefined,
          role: editFormData.role,
          statut: editFormData.statut,
          poste_id: editFormData.poste_id || null,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Utilisateur modifié avec succès");
      setIsEditDialogOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la modification");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    await supabase.from("utilisateurs").delete().eq("id", id);
    setUtilisateurs((prev) => prev.filter((u) => u.id !== id));
    toast.success("Utilisateur supprimé");
  };

  const getPosteName = (posteId: string | null) => {
    if (!posteId) return "-";
    return postes.find((p) => p.id === posteId)?.nom || "-";
  };

  const getRoleBadge = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: "Super Admin", admin: "Admin", manager: "Manager",
      technicien: "Technicien", operateur: "Opérateur", lecteur: "Lecteur",
    };
    const colors: Record<string, string> = {
      super_admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      admin: "bg-red-500/20 text-red-400 border-red-500/30",
      manager: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      technicien: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      operateur: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      lecteur: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    };
    return <Badge className={colors[role] || "bg-muted text-muted-foreground"}>{labels[role] || role}</Badge>;
  };

  const getStatutBadge = (statut: string) => {
    if (statut === "actif") return <Badge className="bg-emerald-500/20 text-emerald-400">Actif</Badge>;
    if (statut === "inactif") return <Badge className="bg-red-500/20 text-red-400">Inactif</Badge>;
    return <Badge className="bg-amber-500/20 text-amber-400">{statut}</Badge>;
  };

  const getInitials = (nom: string) =>
    nom.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6 animate-fade-in">
      <AppBreadcrumb items={[
        { label: "Paramètres", path: "/parametres" },
        { label: "Authentification" },
      ]} />

      {/* Header */}
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
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-500">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              <span className="text-primary">Authentification</span>
            </h1>
            <p className="text-muted-foreground">
              Gestion des comptes utilisateurs et authentification
            </p>
          </div>
        </div>
      </div>

      {/* Users List */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle>Utilisateurs</CardTitle>
              <Badge variant="outline" className="ml-2">{utilisateurs.length}</Badge>
            </div>
            <Button className="gap-2" onClick={() => {
              setFormData({ poste_id: "", intervenant_id: "", mot_de_passe: "", statut: "actif", role: "technicien" });
              setIsDialogOpen(true);
            }}>
              <Plus className="h-4 w-4" />
              Nouveau
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : utilisateurs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun utilisateur. Cliquez sur &apos;Nouveau&apos; pour commencer.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Poste</TableHead>
                  <TableHead>Mot de passe</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  const totalPages = Math.ceil(utilisateurs.length / ITEMS_PER_PAGE);
                  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
                  const paginatedUsers = utilisateurs.slice(startIdx, startIdx + ITEMS_PER_PAGE);
                  const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, utilisateurs.length);
                  return paginatedUsers;
                })().map((user) => (
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
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getPosteName(user.poste_id)}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{user.mot_de_passe || "••••••"}</TableCell>
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
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            Modifier
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
                              onConfirm={() => handleDeleteUser(user.id)}
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
          {utilisateurs.length > ITEMS_PER_PAGE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border mt-4">
              <div className="text-sm text-muted-foreground">
                Affichage de {(currentPage - 1) * ITEMS_PER_PAGE + 1} à {Math.min(currentPage * ITEMS_PER_PAGE, utilisateurs.length)} sur {utilisateurs.length} utilisateurs
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Précédent</Button>
                {Array.from({ length: Math.ceil(utilisateurs.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map(page => (
                  <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)} className="w-8 h-8 p-0">{page}</Button>
                ))}
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(Math.ceil(utilisateurs.length / ITEMS_PER_PAGE), p + 1))} disabled={currentPage === Math.ceil(utilisateurs.length / ITEMS_PER_PAGE)}>Suivant</Button>
              </div>
           </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel utilisateur</DialogTitle>
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
              <Label>Utilisateur</Label>
              <Select
                value={formData.intervenant_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, intervenant_id: value })
                }
                disabled={!formData.poste_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.poste_id ? "Sélectionner un utilisateur" : "Sélectionnez d'abord un poste"} />
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
              <Label>Mot de passe</Label>
              <div className="relative">
                <Input
                  type={showCreatePassword ? "text" : "password"}
                  placeholder="Minimum 6 caractères"
                  value={formData.mot_de_passe}
                  onChange={(e) => setFormData({ ...formData, mot_de_passe: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword(!showCreatePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
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
                onValueChange={(value) => setFormData({ ...formData, statut: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="inactif">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={!formData.intervenant_id || !formData.mot_de_passe || formData.mot_de_passe.length < 6 || isCreating}
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(editingUser.nom)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{editingUser.nom}</p>
                  <p className="text-sm text-muted-foreground">{editingUser.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Poste de travail</Label>
                <Select
                  value={editFormData.poste_id}
                  onValueChange={(value) => setEditFormData({ ...editFormData, poste_id: value })}
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
                <Label>Mot de passe</Label>
                <div className="relative">
                  <Input
                    type={showEditPassword ? "text" : "password"}
                    placeholder="Laisser vide pour ne pas changer"
                    value={editFormData.mot_de_passe}
                    onChange={(e) => setEditFormData({ ...editFormData, mot_de_passe: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select
                  value={editFormData.role}
                  onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
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
                  value={editFormData.statut}
                  onValueChange={(value) => setEditFormData({ ...editFormData, statut: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actif">Actif</SelectItem>
                    <SelectItem value="inactif">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Authentification;
