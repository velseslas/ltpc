import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Wrench, Calendar, Building2, Loader2, DollarSign, FileText, Tag, Factory, Box, Hash } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useMaintenanceMaterielItem, useDeleteMaintenanceMateriel } from "@/hooks/useMaterielLaboratoire";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const typeBadge = (t: string) => {
  switch (t) {
    case "preventive": return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Préventive</Badge>;
    case "corrective": return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Corrective</Badge>;
    case "curative": return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Curative</Badge>;
    default: return <Badge variant="outline">{t}</Badge>;
  }
};

const statutBadge = (s: string) => {
  switch (s) {
    case "planifie": return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Planifié</Badge>;
    case "en_cours": return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">En cours</Badge>;
    case "termine": return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Terminé</Badge>;
    default: return <Badge variant="outline">{s}</Badge>;
  }
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

export default function MaterielMaintenanceDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: maintenance, isLoading } = useMaintenanceMaterielItem(id || "");
  const deleteMutation = useDeleteMaintenanceMateriel();

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Maintenance supprimée");
      navigate("/materiel/maintenance");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!maintenance) {
    return (
      <div className="text-center py-12">
        <Wrench className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Maintenance non trouvée</h2>
        <Button onClick={() => navigate("/materiel/maintenance")}>Retour à la liste</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Matériel Laboratoire", path: "/materiel" },
        { label: "Maintenance Matériel", path: "/materiel/maintenance" },
        { label: maintenance.materiel_laboratoire?.nom || "Détails" },
      ]} />

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <BackButton to="/materiel/maintenance" />
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Détails de la maintenance</h1>
              <p className="text-muted-foreground text-sm">{maintenance.materiel_laboratoire?.nom}</p>
            </div>
          </div>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Informations</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(`/materiel/maintenance/${id}/modifier`)} className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50">
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
                    <AlertDialogDescription>Êtes-vous sûr de vouloir supprimer cette maintenance ? Cette action est irréversible.</AlertDialogDescription>
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
              <InfoItem icon={<Wrench className="w-5 h-5 text-primary" />} label="Matériel" value={maintenance.materiel_laboratoire?.nom} />
              <InfoItem icon={<Tag className="w-5 h-5 text-primary" />} label="Référence" value={maintenance.materiel_laboratoire?.reference} />
              <InfoItem icon={<Factory className="w-5 h-5 text-primary" />} label="Marque" value={maintenance.materiel_laboratoire?.marque} />
              <InfoItem icon={<Box className="w-5 h-5 text-primary" />} label="Modèle" value={maintenance.materiel_laboratoire?.modele} />
              <InfoItem icon={<Hash className="w-5 h-5 text-primary" />} label="N° de série" value={maintenance.materiel_laboratoire?.numero_serie} />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Wrench className="w-5 h-5 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <div className="mt-0.5">{typeBadge(maintenance.type_maintenance)}</div>
                </div>
              </div>
              <InfoItem icon={<Calendar className="w-5 h-5 text-primary" />} label="Date" value={format(new Date(maintenance.date_maintenance), "dd/MM/yyyy", { locale: fr })} />
              <InfoItem icon={<Building2 className="w-5 h-5 text-primary" />} label="Prestataire" value={maintenance.prestataire} />
              <InfoItem icon={<DollarSign className="w-5 h-5 text-primary" />} label="Coût" value={maintenance.cout ? `${maintenance.cout.toLocaleString()} DA` : null} />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Wrench className="w-5 h-5 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Statut</p>
                  <div className="mt-0.5">{statutBadge(maintenance.statut)}</div>
                </div>
              </div>
              <InfoItem icon={<Calendar className="w-5 h-5 text-primary" />} label="Prochaine maintenance" value={maintenance.date_prochaine_maintenance ? format(new Date(maintenance.date_prochaine_maintenance), "dd/MM/yyyy", { locale: fr }) : null} />
            </div>
          </CardContent>
        </Card>

        {maintenance.description && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader><CardTitle className="text-lg">Description</CardTitle></CardHeader>
            <CardContent><p className="text-foreground whitespace-pre-wrap">{maintenance.description}</p></CardContent>
          </Card>
        )}

        {maintenance.observations && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader><CardTitle className="text-lg">Observations</CardTitle></CardHeader>
            <CardContent><p className="text-foreground whitespace-pre-wrap">{maintenance.observations}</p></CardContent>
          </Card>
        )}

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader><CardTitle className="text-lg">Historique</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem icon={<Calendar className="w-5 h-5 text-primary" />} label="Créé le" value={format(new Date(maintenance.created_at), "dd/MM/yyyy HH:mm", { locale: fr })} />
              <InfoItem icon={<Calendar className="w-5 h-5 text-primary" />} label="Mis à jour le" value={format(new Date(maintenance.updated_at), "dd/MM/yyyy HH:mm", { locale: fr })} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
