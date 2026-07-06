import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCreateProduit, useUpdateProduit } from "@/hooks/useProduits";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

interface ProduitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producteurId: string;
  producteurType: string;
  editingProduit?: { id: string; nom: string; densite?: number | null } | null;
}

const SHOW_DENSITE_TYPES = ["adjuvant"];

export function ProduitFormDialog({ open, onOpenChange, producteurId, producteurType, editingProduit }: ProduitFormDialogProps) {
  const [nom, setNom] = useState("");
  const [densite, setDensite] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const createProduit = useCreateProduit();
  const updateProduit = useUpdateProduit();

  const isEditing = !!editingProduit;
  const showDensite = SHOW_DENSITE_TYPES.includes(producteurType);

  useEffect(() => {
    if (editingProduit) {
      setNom(editingProduit.nom);
      setDensite(editingProduit.densite != null ? String(editingProduit.densite) : "");
    } else {
      setNom("");
      setDensite("");
    }
    setSubmitted(false);
  }, [editingProduit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!nom.trim()) {
      return;
    }

    const densiteValue = showDensite && densite.trim() ? parseFloat(densite) : null;

    try {
      if (isEditing) {
        await updateProduit.mutateAsync({
          id: editingProduit.id,
          nom: nom.trim(),
          densite: densiteValue,
          producteurId,
          producteurType,
        });
        toast.success("Produit modifié avec succès");
      } else {
        await createProduit.mutateAsync({
          nom: nom.trim(),
          densite: densiteValue,
          producteur_id: producteurId,
          producteur_type: producteurType,
        });
        toast.success("Produit ajouté avec succès");
      }
      setNom("");
      setDensite("");
      setSubmitted(false);
      onOpenChange(false);
    } catch (error) {
      toast.error(isEditing ? "Erreur lors de la modification" : "Erreur lors de l'ajout du produit");
    }
  };

  const handleCancel = () => {
    setNom("");
    setDensite("");
    setSubmitted(false);
    onOpenChange(false);
  };

  const hasError = submitted && !nom.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier le produit" : "Nouveau Produit"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nom">Nom du produit <span className="text-red-700">*</span></Label>
              <Input
                id="nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Entrez le nom du produit"
                autoFocus
                className={hasError ? "border-red-700 focus-visible:ring-red-700" : ""}
              />
              {hasError && (
                <p className="text-red-700 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Le nom du produit est requis
                </p>
              )}
            </div>
            {showDensite && (
              <div className="grid gap-2">
                <Label htmlFor="densite">Densité</Label>
                <Input
                  id="densite"
                  type="number"
                  step="0.001"
                  min="0"
                  value={densite}
                  onChange={(e) => setDensite(e.target.value)}
                  placeholder="Ex: 2.650"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Annuler
            </Button>
            <Button type="submit" disabled={createProduit.isPending || updateProduit.isPending}>
              {(createProduit.isPending || updateProduit.isPending) ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
