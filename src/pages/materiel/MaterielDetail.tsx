import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Microscope, Calendar, MapPin, Tag, Hash, Building2, Loader2 } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useMaterielItem, useDeleteMateriel } from "@/hooks/useMaterielLaboratoire";
import { useMaterielTimeline, MOUVEMENT_TYPE_LABEL } from "@/hooks/useMouvementsMateriel";
import { MaterielStatutBadge, MouvementTypeBadge, ItemEtatBadge } from "@/components/materiel/MovementBadges";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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

const etatBadge = (etat: string) => {
  switch (etat) {
    case "operationnel": return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Opérationnel</Badge>;
    case "hors_service": return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Hors service</Badge>;
    case "en_reparation": return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">En réparation</Badge>;
    default: return <Badge variant="outline">{etat}</Badge>;
  }
};

const categorieName = (cat: string) => {
  const map: Record<string, string> = {
    general: "Général", compression: "Compression", granulat: "Granulat",
    beton_frais: "Béton frais", mesure: "Mesure"
  };
  return map[cat] || cat;
};

export default function MaterielDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: materiel, isLoading } = useMaterielItem(id || "");
  const { data: timeline } = useMaterielTimeline(id || "");
  const deleteMutation = useDeleteMateriel();

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Matériel supprimé");
      navigate("/materiel/liste");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!materiel) {
    return (
      <div className="text-center py-12">
        <Microscope className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Matériel non trouvé</h2>
        <Button onClick={() => navigate("/materiel/liste")}>Retour à la liste</Button>
      </div>
    );
  }

  return (
    <>
      <AppBreadcrumb items={[
        { label: "Matériel Laboratoire", path: "/materiel" },
        { label: "Liste Matériel", path: "/materiel/liste" },
        { label: materiel.nom },
      ]} />

      <div>
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <BackButton to="/materiel/liste" />
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Microscope className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">{materiel.nom}</h1>
              <p className="text-muted-foreground text-sm">Détails du matériel</p>
            </div>
          </div>
        </div>

        {/* Identification */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Identification</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/materiel/liste/${id}/modifier`)}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Modifier
              </Button>
              <AdminOnly><AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive border-destructive/50 hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                    <AlertDialogDescription>
                      Êtes-vous sûr de vouloir supprimer {materiel.nom} ? Cette action est irréversible.
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
              </AlertDialog></AdminOnly>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <InfoItem icon={<Tag className="w-5 h-5 text-primary" />} label="Nom" value={materiel.nom} />
              <InfoItem icon={<Hash className="w-5 h-5 text-primary" />} label="Référence" value={materiel.reference} />
              <InfoItem icon={<Hash className="w-5 h-5 text-primary" />} label="N° Série" value={materiel.numero_serie} />
              <InfoItem icon={<Building2 className="w-5 h-5 text-primary" />} label="Marque" value={materiel.marque} />
              <InfoItem icon={<Tag className="w-5 h-5 text-primary" />} label="Modèle" value={materiel.modele} />
              <InfoItem icon={<Microscope className="w-5 h-5 text-primary" />} label="Catégorie" value={categorieName(materiel.categorie)} />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">État</p>
                  <div className="mt-0.5">{etatBadge(materiel.etat)}</div>
                </div>
              </div>
              <InfoItem icon={<MapPin className="w-5 h-5 text-primary" />} label="Localisation" value={materiel.localisation} />
              <InfoItem icon={<Calendar className="w-5 h-5 text-primary" />} label="Date d'acquisition" value={materiel.date_acquisition ? format(new Date(materiel.date_acquisition), "dd/MM/yyyy", { locale: fr }) : null} />
            </div>
          </CardContent>
        </Card>

        {/* Observations */}
        {materiel.observations && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Observations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">{materiel.observations}</p>
            </CardContent>
          </Card>
        )}

        {/* Statut courant & responsable */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm mt-6">
          <CardHeader><CardTitle className="text-lg">Statut & Responsabilité</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Statut courant</p>
              <MaterielStatutBadge statut={(materiel as any).statut_courant || "disponible"} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Responsable actuel</p>
              <p className="font-medium">{(materiel as any).responsable_courant_id ? "—" : "Aucun"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Chantier actuel</p>
              <p className="font-medium">{(materiel as any).chantier_courant_id ? "—" : "Aucun"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Timeline des mouvements */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm mt-6">
          <CardHeader><CardTitle className="text-lg">Historique des mouvements</CardTitle></CardHeader>
          <CardContent>
            {!timeline?.items?.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun mouvement</p>
            ) : (
              <ol className="relative border-l border-border ml-3 space-y-4">
                {timeline.items
                  .slice()
                  .sort((a: any, b: any) => new Date(b.materiel_movements.created_at).getTime() - new Date(a.materiel_movements.created_at).getTime())
                  .map((it: any) => {
                    const mv = it.materiel_movements;
                    return (
                      <li key={it.id} className="ml-6">
                        <span className="absolute -left-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-primary" />
                        <div className="flex items-center gap-2 flex-wrap">
                          <MouvementTypeBadge type={mv.type} />
                          <span className="font-mono text-sm cursor-pointer hover:underline" onClick={() => navigate(`/materiel/mouvements/${mv.id}`)}>{mv.numero}</span>
                          <ItemEtatBadge etat={it.etat} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(mv.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                          {mv.chantiers?.nom && ` · ${mv.chantiers.nom}`}
                          {mv.entrant && ` · ${mv.entrant.prenom} ${mv.entrant.nom}`}
                        </p>
                        {it.observations && <p className="text-sm mt-1">{it.observations}</p>}
                      </li>
                    );
                  })}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Historique */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Historique</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem icon={<Calendar className="w-5 h-5 text-primary" />} label="Créé le" value={format(new Date(materiel.created_at), "dd/MM/yyyy HH:mm", { locale: fr })} />
              <InfoItem icon={<Calendar className="w-5 h-5 text-primary" />} label="Mis à jour le" value={format(new Date(materiel.updated_at), "dd/MM/yyyy HH:mm", { locale: fr })} />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function InfoItem({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground">{value || "Non renseigné"}</p>
      </div>
    </div>
  );
}
