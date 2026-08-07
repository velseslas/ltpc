import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Percent, Plus, Pencil, Trash2, Save, Loader2 } from "lucide-react";
import { ConfirmDelete } from "@/components/common/ConfirmDelete";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { 
  useTauxTVA, 
  useCreateTauxTVA, 
  useUpdateTauxTVA, 
  useDeleteTauxTVA 
} from "@/hooks/useParametres";

const TauxTVAPage = () => {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: tauxList = [], isLoading } = useTauxTVA();
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const createTaux = useCreateTauxTVA();
  const updateTaux = useUpdateTauxTVA();
  const deleteTaux = useDeleteTauxTVA();

  const [formData, setFormData] = useState({
    nom: "",
    taux: "",
    description: "",
    actif: true,
  });

  const handleOpenDialog = (taux?: typeof tauxList[0]) => {
    if (taux) {
      setEditingId(taux.id);
      setFormData({
        nom: taux.nom,
        taux: taux.taux.toString(),
        description: taux.description || "",
        actif: taux.actif,
      });
    } else {
      setEditingId(null);
      setFormData({
        nom: "",
        taux: "",
        description: "",
        actif: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nom || !formData.taux) {
      return;
    }

    const payload = {
      nom: formData.nom,
      taux: (() => { const parsed = parseFloat(formData.taux); return isNaN(parsed) ? null : parsed; })(),
      description: formData.description || null,
      actif: formData.actif,
    };

    if (editingId) {
      await updateTaux.mutateAsync({ id: editingId, ...payload });
    } else {
      await createTaux.mutateAsync(payload);
    }

    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteTaux.mutateAsync(id);
  };

  const handleToggleActif = async (id: string, currentActif: boolean) => {
    await updateTaux.mutateAsync({ id, actif: !currentActif });
  };

  const isSaving = createTaux.isPending || updateTaux.isPending;

  const totalPages = Math.ceil(tauxList.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedList = tauxList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, tauxList.length);

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Paramètres", path: "/parametres" },
        { label: "Taux TVA" },
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
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500">
              <Percent className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Taux <span className="text-primary">TVA</span>
              </h1>
              <p className="text-muted-foreground">
                Configuration des différents taux de TVA applicables
              </p>
            </div>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="hidden md:inline-block h-4 w-4" />
          Nouveau taux
        </Button>
      </div>

      {/* Liste des taux */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Taux de TVA configurés</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : tauxList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Percent className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucun taux TVA configuré</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Taux</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedList.map((taux) => (
                  <TableRow key={taux.id}>
                    <TableCell className="font-medium">{taux.nom}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {taux.taux}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {taux.description || "-"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={taux.actif}
                        onCheckedChange={() => handleToggleActif(taux.id, taux.actif)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(taux)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDelete
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              disabled={deleteTaux.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                          onConfirm={() => handleDelete(taux.id)}
                          description={`Supprimer le taux de TVA « ${taux.taux}% » ? Cette action est irréversible.`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {tauxList.length > ITEMS_PER_PAGE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border mt-4">
              <div className="text-sm text-muted-foreground">
                Affichage de {startIndex + 1} à {endIndex} sur {tauxList.length} éléments
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

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Modifier le taux TVA" : "Nouveau taux TVA"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom du taux</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                placeholder="TVA Standard"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taux">Taux (%)</Label>
              <Input
                id="taux"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.taux}
                onChange={(e) => setFormData(prev => ({ ...prev, taux: e.target.value }))}
                placeholder="19"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description optionnelle..."
                rows={2}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="actif">Actif</Label>
              <Switch
                id="actif"
                checked={formData.actif}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, actif: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TauxTVAPage;
