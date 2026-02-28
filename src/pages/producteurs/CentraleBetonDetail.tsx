import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building, MapPin, Phone, Mail, User, Pencil, Trash2, Loader2 } from "lucide-react";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useCentraleBeton, useDeleteCentraleBeton } from "@/hooks/useCentralesBeton";
import { useToast } from "@/hooks/use-toast";
import { FormulationsSection } from "@/components/producteurs/FormulationsSection";
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

const CentraleBetonDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  const { data: centrale, isLoading } = useCentraleBeton(id || "");
  const deleteCentrale = useDeleteCentraleBeton();

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteCentrale.mutateAsync(id);
      toast({
        title: "Succès",
        description: "La centrale a été supprimée.",
      });
      navigate("/intervenant/producteurs/centrale");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la centrale.",
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

  if (!centrale) {
    return (
      <div className="text-center py-12">
        <Building className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Centrale non trouvée</h2>
        <Button onClick={() => navigate("/intervenant/producteurs/centrale")}>
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
        { label: "Centrales à béton", path: "/intervenant/producteurs/centrale" },
        { label: centrale.nom }
      ]} />

      <div className="mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/intervenant/producteurs/centrale")} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground text-glow">
            {centrale.nom}
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
                onClick={() => navigate(`/intervenant/producteurs/centrale/${id}/modifier`)}
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
                      Êtes-vous sûr de vouloir supprimer {centrale.nom} ? Cette action est irréversible.
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
                <p className="text-sm text-foreground font-medium">{centrale.contact || "Non renseigné"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 transition-colors">
              <Mail className="w-4 h-4 text-primary" />
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Email:</p>
                <p className="text-sm text-foreground font-medium">{centrale.email || "Non renseigné"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 transition-colors">
              <Phone className="w-4 h-4 text-primary" />
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Tél:</p>
                <p className="text-sm text-foreground font-medium">{centrale.telephone || "Non renseigné"}</p>
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
                <p className="text-sm text-foreground font-medium">{centrale.adresse || "Non renseigné"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 transition-colors">
              <MapPin className="w-4 h-4 text-primary" />
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Wilaya:</p>
                <p className="text-sm text-foreground font-medium">{centrale.ville || "Non renseigné"}</p>
              </div>
            </div>
            {centrale.capacite && (
              <div className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 transition-colors">
                <Building className="w-4 h-4 text-primary" />
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Capacité:</p>
                  <p className="text-sm text-foreground font-medium">{centrale.capacite}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <FormulationsSection centraleId={id!} />
    </>
  );
};

export default CentraleBetonDetail;
