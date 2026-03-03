import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Users, Lock, Plus, Trash2, Check, X, Info, Search } from "lucide-react";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

import {
  usePermissions,
  usePermissionsByModule,
  useAllRolePermissions,
  useToggleRolePermission,
  useUsersWithRoles,
  useAssignRole,
  useCreatePermission,
  useDeletePermission,
  AppRole,
  ROLE_LABELS,
  ROLE_COLORS,
  ROLE_DESCRIPTIONS,
} from "@/hooks/useRolesPermissions";

const ROLES: AppRole[] = ['super_admin', 'admin', 'manager', 'technicien', 'operateur', 'lecteur'];

const ROLE_SHORT_LABELS: Record<AppRole, string> = {
  super_admin: 'SA',
  admin: 'AD',
  manager: 'MG',
  technicien: 'TE',
  operateur: 'OP',
  lecteur: 'LE',
};

const MODULE_ICONS: Record<string, string> = {
  'Clients': '👥',
  'Chantiers': '🏗️',
  'Essais': '🔬',
  'Rapports': '📊',
  'Producteurs': '🏭',
  'RH': '👔',
  'Paramètres': '⚙️',
  'Facturation': '💰',
};

const RolesPermissions = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<AppRole>('admin');
  const [searchTerm, setSearchTerm] = useState("");
  const [matrixSearch, setMatrixSearch] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [isNewPermissionOpen, setIsNewPermissionOpen] = useState(false);
  const [newPermission, setNewPermission] = useState({
    code: "",
    nom: "",
    description: "",
    module: ""
  });

  const { data: permissions, isLoading: permissionsLoading } = usePermissions();
  const { data: permissionsByModule, isLoading: modulesLoading } = usePermissionsByModule();
  const { data: rolePermissions, isLoading: rolePermissionsLoading } = useAllRolePermissions();
  const { data: usersWithRoles, isLoading: usersLoading } = useUsersWithRoles();
  
  const togglePermission = useToggleRolePermission();
  const assignRole = useAssignRole();
  const createPermission = useCreatePermission();
  const deletePermission = useDeletePermission();

  const handleTogglePermission = (role: AppRole, permissionId: string) => {
    const hasPermission = rolePermissions?.[role]?.includes(permissionId) || false;
    togglePermission.mutate({ role, permissionId, hasPermission });
  };

  const handleAssignRole = (userId: string, role: AppRole) => {
    assignRole.mutate({ userId, role });
  };

  const handleCreatePermission = () => {
    if (!newPermission.code || !newPermission.nom || !newPermission.module) return;
    createPermission.mutate({
      code: newPermission.code,
      nom: newPermission.nom,
      description: newPermission.description || null,
      module: newPermission.module
    }, {
      onSuccess: () => {
        setIsNewPermissionOpen(false);
        setNewPermission({ code: "", nom: "", description: "", module: "" });
      }
    });
  };

  const filteredPermissions = permissions?.filter(p => 
    p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.module.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = usersWithRoles?.filter(u =>
    u.nom.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const modules = permissionsByModule ? Object.keys(permissionsByModule) : [];

  const filteredModulesForMatrix = modules.filter(module => {
    if (!matrixSearch) return true;
    const modulePerms = permissionsByModule?.[module] || [];
    return modulePerms.some(p =>
      p.nom.toLowerCase().includes(matrixSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(matrixSearch.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Paramètres", path: "/parametres" },
        { label: "Rôles & Permissions" },
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
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            <span className="text-primary text-glow">Rôles & Permissions</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les rôles utilisateurs et leurs permissions d'accès
          </p>
        </div>
      </div>

      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Rôles
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Utilisateurs
          </TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-6">
          {/* Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ROLES.map((role) => (
              <Card 
                key={role} 
                className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                  selectedRole === role ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedRole(role)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge className={`${ROLE_COLORS[role]} border`}>
                      {ROLE_LABELS[role]}
                    </Badge>
                    {selectedRole === role && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {ROLE_DESCRIPTIONS[role]}
                  </p>
                  <div className="mt-3 text-xs text-muted-foreground">
                    {rolePermissions?.[role]?.length || 0} permissions
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Permissions Matrix */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Matrice des permissions pour {ROLE_LABELS[selectedRole]}
              </CardTitle>
              <CardDescription>
                Cochez les permissions à attribuer à ce rôle
              </CardDescription>
            </CardHeader>
            <CardContent>
              {modulesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {modules.map((module) => (
                    <div key={module} className="space-y-3">
                      <div className="flex items-center gap-2 py-2 border-b">
                        <span className="text-xl">{MODULE_ICONS[module] || '📁'}</span>
                        <h3 className="font-semibold text-lg">{module}</h3>
                        <Badge variant="outline" className="ml-auto">
                          {permissionsByModule?.[module]?.length || 0}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pl-8">
                        {permissionsByModule?.[module]?.map((perm) => {
                          const hasPermission = rolePermissions?.[selectedRole]?.includes(perm.id) || false;
                          return (
                            <div 
                              key={perm.id}
                              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                                hasPermission 
                                  ? 'bg-primary/10 border-primary/30' 
                                  : 'bg-muted/30 border-border hover:border-primary/50'
                              }`}
                            >
                              <Checkbox
                                id={perm.id}
                                checked={hasPermission}
                                onCheckedChange={() => handleTogglePermission(selectedRole, perm.id)}
                                disabled={togglePermission.isPending}
                              />
                              <div className="flex-1 space-y-1">
                                <Label 
                                  htmlFor={perm.id} 
                                  className="font-medium cursor-pointer"
                                >
                                  {perm.nom}
                                </Label>
                                {perm.description && (
                                  <p className="text-xs text-muted-foreground">
                                    {perm.description}
                                  </p>
                                )}
                                <code className="text-[10px] text-muted-foreground bg-muted px-1 rounded">
                                  {perm.code}
                                </code>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Full Permissions Matrix */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Matrice complète des permissions
                  </CardTitle>
                  <CardDescription>
                    Cliquez sur les cases pour activer/désactiver les permissions pour chaque rôle
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Filtrer les permissions..."
                      value={matrixSearch}
                      onChange={(e) => setMatrixSearch(e.target.value)}
                      className="pl-10 w-[250px]"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {rolePermissionsLoading || modulesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table className="w-full table-fixed [&_th]:px-2 [&_td]:px-2 [&_th]:py-2 [&_td]:py-2">
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="w-8 text-center">#</TableHead>
                        <TableHead className="w-[44%]">Permission</TableHead>
                        <TableHead className="w-[14%]">Module</TableHead>
                        {ROLES.map(role => (
                          <TableHead key={role} className="text-center w-[7%]">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-border bg-muted px-1.5 text-[10px] font-semibold text-foreground cursor-help">
                                    {ROLE_SHORT_LABELS[role]}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-[200px] text-sm">{ROLE_LABELS[role]}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredModulesForMatrix.map(module => (
                        <>
                          <TableRow key={`module-${module}`} className="bg-muted/50 hover:bg-muted/60">
                            <TableCell colSpan={ROLES.length + 3} className="font-semibold py-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{MODULE_ICONS[module] || '📁'}</span>
                                  <span>{module}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {permissionsByModule?.[module]?.filter(p =>
                                      p.nom.toLowerCase().includes(matrixSearch.toLowerCase()) ||
                                      p.code.toLowerCase().includes(matrixSearch.toLowerCase())
                                    ).length || 0} permissions
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1">
                                  {ROLES.map(role => {
                                    const modulePerms = permissionsByModule?.[module] || [];
                                    const assignedCount = modulePerms.filter(p => rolePermissions?.[role]?.includes(p.id)).length;
                                    const totalCount = modulePerms.length;
                                    return (
                                      <TooltipProvider key={role}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                              assignedCount === totalCount 
                                                ? 'bg-green-500/20 text-green-400' 
                                                : assignedCount > 0 
                                                  ? 'bg-yellow-500/20 text-yellow-400' 
                                                  : 'bg-muted text-muted-foreground'
                                            }`}>
                                              {assignedCount}/{totalCount}
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            {ROLE_LABELS[role]}: {assignedCount}/{totalCount}
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    );
                                  })}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                          {permissionsByModule?.[module]
                            ?.filter(p =>
                              p.nom.toLowerCase().includes(matrixSearch.toLowerCase()) ||
                              p.code.toLowerCase().includes(matrixSearch.toLowerCase())
                            )
                            .map((perm, idx) => (
                              <TableRow key={perm.id} className="group">
                                <TableCell className="text-center text-xs text-muted-foreground">
                                  {idx + 1}
                                </TableCell>
                                <TableCell className="align-top">
                                  <div className="space-y-0.5 break-words">
                                    <p className="font-medium text-sm leading-tight">{perm.nom}</p>
                                    <code className="text-[10px] text-muted-foreground bg-muted px-1 py-0.5 rounded break-all">
                                      {perm.code}
                                    </code>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-xs text-muted-foreground leading-tight break-words">
                                    {MODULE_ICONS[perm.module]} {perm.module}
                                  </span>
                                </TableCell>
                                {ROLES.map(role => {
                                  const hasPermission = rolePermissions?.[role]?.includes(perm.id) || false;
                                  return (
                                    <TableCell key={role} className="text-center px-1">
                                      <div className="flex justify-center">
                                        <Checkbox
                                          checked={hasPermission}
                                          onCheckedChange={() => handleTogglePermission(role, perm.id)}
                                          disabled={togglePermission.isPending}
                                          className={hasPermission ? 'data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500' : ''}
                                        />
                                      </div>
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            ))}
                        </>
                      ))}
                      {filteredModulesForMatrix.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={ROLES.length + 3} className="text-center py-8 text-muted-foreground">
                            Aucune permission trouvée pour "{matrixSearch}"
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-6 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Checkbox checked className="h-3.5 w-3.5 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" disabled />
                  <span>Autorisé</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Checkbox className="h-3.5 w-3.5" disabled />
                  <span>Non autorisé</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">3/3</span>
                  <span>Toutes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">1/3</span>
                  <span>Partielle</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-muted">0/3</span>
                  <span>Aucune</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestion des permissions</CardTitle>
                  <CardDescription>
                    {permissions?.length || 0} permissions configurées
                  </CardDescription>
                </div>
                <Dialog open={isNewPermissionOpen} onOpenChange={setIsNewPermissionOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nouvelle permission
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Créer une permission</DialogTitle>
                      <DialogDescription>
                        Ajoutez une nouvelle permission au système
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="perm-code">Code</Label>
                        <Input
                          id="perm-code"
                          placeholder="module.action"
                          value={newPermission.code}
                          onChange={(e) => setNewPermission(prev => ({ ...prev, code: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="perm-nom">Nom</Label>
                        <Input
                          id="perm-nom"
                          placeholder="Nom de la permission"
                          value={newPermission.nom}
                          onChange={(e) => setNewPermission(prev => ({ ...prev, nom: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="perm-desc">Description</Label>
                        <Input
                          id="perm-desc"
                          placeholder="Description de la permission"
                          value={newPermission.description}
                          onChange={(e) => setNewPermission(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="perm-module">Module</Label>
                        <Select
                          value={newPermission.module}
                          onValueChange={(value) => setNewPermission(prev => ({ ...prev, module: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un module" />
                          </SelectTrigger>
                          <SelectContent>
                            {modules.map(module => (
                              <SelectItem key={module} value={module}>
                                {MODULE_ICONS[module]} {module}
                              </SelectItem>
                            ))}
                            <SelectItem value="Autre">📁 Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsNewPermissionOpen(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleCreatePermission} disabled={createPermission.isPending}>
                        Créer
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher une permission..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {permissionsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Nom</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Module</TableHead>
                          <TableHead className="text-center">Rôles</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPermissions?.map((perm) => {
                          const rolesWithPerm = ROLES.filter(
                            role => rolePermissions?.[role]?.includes(perm.id)
                          );
                          return (
                            <TableRow key={perm.id}>
                              <TableCell>
                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                  {perm.code}
                                </code>
                              </TableCell>
                              <TableCell className="font-medium">{perm.nom}</TableCell>
                              <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                                {perm.description || "-"}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {MODULE_ICONS[perm.module]} {perm.module}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1 justify-center">
                                  {rolesWithPerm.map(role => (
                                    <TooltipProvider key={role}>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <Badge className={`${ROLE_COLORS[role]} border text-[10px] px-1`}>
                                            {ROLE_LABELS[role].charAt(0)}
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          {ROLE_LABELS[role]}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => deletePermission.mutate(perm.id)}
                                  disabled={deletePermission.isPending}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attribution des rôles utilisateurs</CardTitle>
              <CardDescription>
                Attribuez des rôles aux utilisateurs du système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un utilisateur..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {usersLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : filteredUsers?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun utilisateur trouvé</p>
                    <p className="text-sm">Ajoutez des utilisateurs dans le module Utilisateurs</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Utilisateur</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Rôle actuel</TableHead>
                          <TableHead>Attribuer un rôle</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers?.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.nom}</TableCell>
                            <TableCell className="text-muted-foreground">{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={user.statut === 'actif' ? 'default' : 'secondary'}>
                                {user.statut}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${ROLE_COLORS[user.role as AppRole] || ROLE_COLORS.lecteur} border`}>
                                {ROLE_LABELS[user.role as AppRole] || 'Lecteur'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={user.role}
                                onValueChange={(value) => {
                                  if (user.user_id) {
                                    handleAssignRole(user.user_id, value as AppRole);
                                  }
                                }}
                                disabled={!user.user_id}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ROLES.map(role => (
                                    <SelectItem key={role} value={role}>
                                      {ROLE_LABELS[role]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Role Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {ROLES.map(role => {
              const count = usersWithRoles?.filter(u => u.role === role).length || 0;
              return (
                <Card key={role}>
                  <CardContent className="pt-6 text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${ROLE_COLORS[role].replace('text-', 'bg-').split(' ')[0]}`}>
                      <Shield className="h-6 w-6" />
                    </div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{ROLE_LABELS[role]}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RolesPermissions;
