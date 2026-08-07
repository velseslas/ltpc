import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Package, Trash2, Pencil } from "lucide-react";
import { useProduits, useDeleteProduit } from "@/hooks/useProduits";
import { ProduitFormDialog } from "./ProduitFormDialog";
import { toast } from "sonner";
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
import { AdminOnly } from "@/components/common/AdminOnly";

interface ProduitsSectionProps {
  producteurId: string;
  producteurType: string;
}

export function ProduitsSection({ producteurId, producteurType }: ProduitsSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduit, setEditingProduit] = useState<{ id: string; nom: string; densite?: number | null } | null>(null);
  const { data: produits, isLoading } = useProduits(producteurId, producteurType);
  const deleteProduit = useDeleteProduit();

  const handleDelete = async (id: string) => {
    try {
      await deleteProduit.mutateAsync({ id, producteurId, producteurType });
      toast.success("Produit supprimé");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleEdit = (produit: { id: string; nom: string; densite?: number | null }) => {
    setEditingProduit(produit);
    setDialogOpen(true);
  };

  const handleNewProduit = () => {
    setEditingProduit(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Produits</h2>
        <Button onClick={handleNewProduit}>
          <Plus className="hidden md:inline-block md:mr-2 h-4 w-4" />
          Nouveau Produit
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Chargement...</p>
      ) : produits && produits.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {produits.map((produit) => (
            <Card key={produit.id} className="group relative">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  {produit.nom}
                </CardTitle>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={() => handleEdit(produit)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <AdminOnly><AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer le produit</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer "{produit.nom}" ? Cette action est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(produit.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog></AdminOnly>
                </div>
              </CardHeader>
              <CardContent>
                {produit.densite != null && (
                  <p className="text-sm text-foreground mb-1">Densité : {produit.densite}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Ajouté le {new Date(produit.created_at).toLocaleDateString("fr-FR")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun produit enregistré</p>
          </CardContent>
        </Card>
      )}

      <ProduitFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        producteurId={producteurId}
        producteurType={producteurType}
        editingProduit={editingProduit}
      />
    </div>
  );
}
