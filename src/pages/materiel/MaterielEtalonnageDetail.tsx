import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Gauge, ArrowLeft, Calendar, Hash, Building2, Loader2, Wrench, Tag, Factory, Box } from "lucide-react";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useEtalonnageMaterielItem, useDeleteEtalonnageMateriel } from "@/hooks/useMaterielLaboratoire";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const resultatBadge = (r: string) => {
  switch (r) {
    case "conforme": return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Conforme</Badge>;
    case "non_conforme": return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Non conforme</Badge>;
    default: return <Badge variant="outline">{r}</Badge>;
  }
};

const echeanceBadge = (date: string | null) => {
  if (!date) return <span className="text-muted-foreground">Non renseigné</span>;
  const days = differenceInDays(new Date(date), new Date());
  if (days < 0) return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Échu ({format(new Date(date), "dd/MM/yyyy", { locale: fr })})</Badge>;
  if (days <= 30) return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Dans {days}j ({format(new Date(date), "dd/MM/yyyy", { locale: fr })})</Badge>;
  return <span className="font-medium text-foreground">{format(new Date(date), "dd/MM/yyyy", { locale: fr })}</span>;
};

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground">{value || "Non renseigné"}</p>
      </div>
    </div>
  );
}

export default function MaterielEtalonnageDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: etalonnage, isLoading } = useEtalonnageMaterielItem(id || "");
  const deleteMutation = useDeleteEtalonnageMateriel();

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Étalonnage supprimé");
      navigate("/materiel/etalonnage");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!etalonnage) {
    return (
      <div className="text-center py-12">
        <Gauge className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Étalonnage non trouvé</h2>
        <Button onClick={() => navigate("/materiel/etalonnage")}>Retour à la liste</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Matériel Laboratoire", path: "/materiel" },
        { label: "Étalonnage Matériel", path: "/materiel/etalonnage" },
        { label: etalonnage.materiel_laboratoire?.nom || "Détails" },
      ]} />

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => navigate("/materiel/etalonnage")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Gauge className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Détails de l'étalonnage</h1>
              <p className="text-muted-foreground text-sm">{etalonnage.materiel_laboratoire?.nom}</p>
            </div>
          </div>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Informations</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(`/materiel/etalonnage/${id}/modifier`)} className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50">
                <Pencil className="w-4 h-4" />
                Modifier
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="border-border text-destructive hover:bg-destructive/10 hover:border-destructive/50"><Trash2 className="w-4 h-4" />Supprimer</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                    <AlertDialogDescription>Êtes-vous sûr de vouloir supprimer cet étalonnage ? Cette action est irréversible.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <InfoItem icon={<Wrench className="w-5 h-5 text-primary" />} label="Matériel" value={etalonnage.materiel_laboratoire?.nom} />
              <InfoItem icon={<Tag className="w-5 h-5 text-primary" />} label="Référence" value={etalonnage.materiel_laboratoire?.reference} />
              <InfoItem icon={<Factory className="w-5 h-5 text-primary" />} label="Marque" value={etalonnage.materiel_laboratoire?.marque} />
              <InfoItem icon={<Box className="w-5 h-5 text-primary" />} label="Modèle" value={etalonnage.materiel_laboratoire?.modele} />
              <InfoItem icon={<Hash className="w-5 h-5 text-primary" />} label="N° de série" value={etalonnage.materiel_laboratoire?.numero_serie} />
              <InfoItem icon={<Calendar className="w-5 h-5 text-primary" />} label="Date d'étalonnage" value={format(new Date(etalonnage.date_etalonnage), "dd/MM/yyyy", { locale: fr })} />
              <InfoItem icon={<Building2 className="w-5 h-5 text-primary" />} label="Organisme" value={etalonnage.organisme} />
              <InfoItem icon={<Hash className="w-5 h-5 text-primary" />} label="N° Certificat" value={etalonnage.numero_certificat} />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Gauge className="w-5 h-5 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Résultat</p>
                  <div className="mt-0.5">{resultatBadge(etalonnage.resultat)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Calendar className="w-5 h-5 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Prochaine échéance</p>
                  <div className="mt-0.5">{echeanceBadge(etalonnage.date_prochain_etalonnage)}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {etalonnage.observations && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader><CardTitle className="text-lg">Observations</CardTitle></CardHeader>
            <CardContent><p className="text-foreground whitespace-pre-wrap">{etalonnage.observations}</p></CardContent>
          </Card>
        )}

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader><CardTitle className="text-lg">Historique</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem icon={<Calendar className="w-5 h-5 text-primary" />} label="Créé le" value={format(new Date(etalonnage.created_at), "dd/MM/yyyy HH:mm", { locale: fr })} />
              <InfoItem icon={<Calendar className="w-5 h-5 text-primary" />} label="Mis à jour le" value={format(new Date(etalonnage.updated_at), "dd/MM/yyyy HH:mm", { locale: fr })} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
