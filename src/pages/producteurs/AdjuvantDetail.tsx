import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Droplets, MapPin, Phone, Mail, User, Pencil, Trash2, Loader2 } from "lucide-react";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useAdjuvant, useDeleteAdjuvant } from "@/hooks/useAdjuvants";
import { useToast } from "@/hooks/use-toast";
import { ProduitsSection } from "@/components/producteurs/ProduitsSection";
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

const AdjuvantDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  const { data: adjuvant, isLoading } = useAdjuvant(id || "");
  const deleteAdjuvant = useDeleteAdjuvant();

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteAdjuvant.mutateAsync(id);
      toast({
        title: "Succès",
        description: "Le fournisseur a été supprimé.",
      });
      navigate("/intervenant/producteurs/adjuvant");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le fournisseur.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!adjuvant) {
    return (
      <div className="text-center py-12">
        <Droplets className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Fournisseur non trouvé</h2>
        <Button onClick={() => navigate("/intervenant/producteurs/adjuvant")}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <>
      <AppBreadcrumb items={[
        { label: "Intervenants", path: "/intervenant" },
        { label: "Producteurs", path: "/intervenant/producteurs" },
        { label: "Adjuvants", path: "/intervenant/producteurs/adjuvant" },
        { label: adjuvant.nom }
      ]} />

      <div className="mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/intervenant/producteurs/adjuvant")} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground text-glow">
            {adjuvant.nom}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
              <h3 className="text-base font-medium text-foreground">
                Informations de contact
              </h3>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/intervenant/producteurs/adjuvant/${id}/modifier`)}
                className="h-7 w-7 text-muted-foreground hover:text-primary"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                    <AlertDialogDescription>
                      Êtes-vous sûr de vouloir supprimer {adjuvant.nom} ? Cette action est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
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
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 transition-colors">
              <User className="w-4 h-4 text-primary" />
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Contact:</p>
                <p className="text-sm text-foreground font-medium">{adjuvant.contact || "Non renseigné"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 transition-colors">
              <Mail className="w-4 h-4 text-primary" />
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Email:</p>
                <p className="text-sm text-foreground font-medium">{adjuvant.email || "Non renseigné"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 transition-colors">
              <Phone className="w-4 h-4 text-primary" />
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Tél:</p>
                <p className="text-sm text-foreground font-medium">{adjuvant.telephone || "Non renseigné"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5 text-primary" />
              </div>
              <h3 className="text-base font-medium text-foreground">
                Localisation & détails
              </h3>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 transition-colors">
              <MapPin className="w-4 h-4 text-primary" />
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Commune:</p>
                <p className="text-sm text-foreground font-medium">{adjuvant.adresse || "Non renseigné"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 transition-colors">
              <MapPin className="w-4 h-4 text-primary" />
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Wilaya:</p>
                <p className="text-sm text-foreground font-medium">{adjuvant.ville || "Non renseigné"}</p>
              </div>
            </div>
            {adjuvant.produits && (
              <div className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 transition-colors">
                <Droplets className="w-4 h-4 text-primary" />
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Produits:</p>
                  <p className="text-sm text-foreground font-medium">{adjuvant.produits}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProduitsSection producteurId={id!} producteurType="adjuvant" />
    </>
  );
};

export default AdjuvantDetail;
