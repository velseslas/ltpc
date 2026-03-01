import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Truck, 
  Edit, 
  Trash2, 
  MapPin, 
  User, 
  Calendar,
  CheckCircle2,
  Wrench,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLaboratoireMobile, useDeleteLaboratoireMobile } from "@/hooks/useLaboratoiresMobiles";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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

export default function LaboratoireMobileDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { data: labo, isLoading } = useLaboratoireMobile(id || "");
  const deleteMutation = useDeleteLaboratoireMobile();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id!);
      toast({ title: "Succès", description: "Laboratoire mobile supprimé" });
      navigate("/laboratoires-mobiles");
    } catch (error) {
      toast({ 
        title: "Erreur", 
        description: "Impossible de supprimer le laboratoire", 
        variant: "destructive" 
      });
    }
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case "disponible":
        return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />Disponible</Badge>;
      case "deploye":
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30"><Truck className="w-3 h-3 mr-1" />Déployé</Badge>;
      case "maintenance":
        return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30"><Wrench className="w-3 h-3 mr-1" />Maintenance</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!labo) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Laboratoire non trouvé</p>
        <Button className="mt-4" onClick={() => navigate("/laboratoires-mobiles")}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/laboratoires-mobiles")} className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{labo.nom}</h1>
            <p className="text-muted-foreground">{labo.immatriculation || "Sans immatriculation"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/laboratoires-mobiles/${id}/modifier`)}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer ce laboratoire mobile ? Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Details Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Informations du laboratoire
            </CardTitle>
            {getStatusBadge(labo.statut)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Truck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Nom</p>
                  <p className="font-medium">{labo.nom}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Immatriculation</p>
                  <p className="font-medium">{labo.immatriculation || "Non renseignée"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Responsable</p>
                  <p className="font-medium">
                    {labo.intervenants 
                      ? `${labo.intervenants.prenom} ${labo.intervenants.nom}` 
                      : "Non affecté"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Créé le</p>
                  <p className="font-medium">
                    {format(new Date(labo.created_at), "dd MMMM yyyy", { locale: fr })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
