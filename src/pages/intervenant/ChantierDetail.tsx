import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Calendar, MapPin, Phone, User, Plus, Factory, MoreHorizontal, Eye, Trash2, Pencil, HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useChantier } from "@/hooks/useChantiers";
import { useClient } from "@/hooks/useClients";
import { useChantierCentrales, useDetachCentraleFromChantier } from "@/hooks/useChantierCentrales";
import { AffectCentraleDialog } from "@/components/clients/AffectCentraleDialog";
import { toast } from "sonner";

const statusColor = (s?: string) => {
  switch (s) {
    case "actif":
    case "en_cours":
      return "bg-emerald-500/15 text-emerald-500 border-emerald-500/30";
    case "planifie":
      return "bg-blue-500/15 text-blue-500 border-blue-500/30";
    case "en_pause":
      return "bg-amber-500/15 text-amber-500 border-amber-500/30";
    case "termine":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

const statusLabel = (s?: string) => ({
  actif: "Actif",
  en_cours: "En cours",
  planifie: "Planifié",
  en_pause: "En pause",
  termine: "Terminé",
}[s ?? ""] ?? s ?? "—");

const ChantierDetail = () => {
  const { chantierId, id: clientId } = useParams<{ chantierId: string; id: string }>();
  const navigate = useNavigate();
  const [affectOpen, setAffectOpen] = useState(false);
  const [detachTarget, setDetachTarget] = useState<{ id: string; nom: string } | null>(null);

  const { data: chantier, isLoading } = useChantier(chantierId || "");
  const effectiveClientId = clientId || chantier?.client_id || "";
  const { data: client } = useClient(effectiveClientId);
  const { data: centrales = [] } = useChantierCentrales(chantierId || "");
  const detach = useDetachCentraleFromChantier();

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Chargement…</div>;
  }
  if (!chantier) {
    return <div className="p-8 text-center text-muted-foreground">Chantier introuvable</div>;
  }

  const handleDetach = async () => {
    if (!detachTarget || !chantierId) return;
    try {
      await detach.mutateAsync({ chantierId, centraleId: detachTarget.id });
      setDetachTarget(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    }
  };

  return (
    <div className="space-y-6">
      <AppBreadcrumb
        items={[
          { label: "Clients", path: "/intervenant/clients" },
          { label: client?.nom ?? "Client", path: effectiveClientId ? `/intervenant/clients/${effectiveClientId}` : undefined },
          { label: chantier.nom },
        ]}
      />

      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="outline"
          size="icon"
          className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          onClick={() => (effectiveClientId ? navigate(`/intervenant/clients/${effectiveClientId}`) : navigate(-1))}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <HardHat className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">{chantier.nom}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColor(chantier.statut)}`}>
              {statusLabel(chantier.statut)}
            </span>
          </div>
          {chantier.description && <p className="text-sm text-muted-foreground mt-2">{chantier.description}</p>}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/intervenant/chantiers/${chantierId}/modifier?clientId=${effectiveClientId}`)}
          className="gap-2"
        >
          <Pencil className="w-4 h-4" /> Modifier
        </Button>
      </div>

      {/* Infos chantier */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" /> Informations du chantier
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <InfoRow icon={<MapPin className="w-4 h-4" />} label="Localisation" value={chantier.ville || chantier.adresse || "—"} />
          <InfoRow icon={<User className="w-4 h-4" />} label="Contact" value={chantier.contact || "—"} />
          <InfoRow icon={<Phone className="w-4 h-4" />} label="Téléphone" value={chantier.telephone || "—"} />
          <InfoRow
            icon={<Calendar className="w-4 h-4" />}
            label="Date début"
            value={chantier.date_debut ? new Date(chantier.date_debut).toLocaleDateString("fr-FR") : "—"}
          />
          <InfoRow
            icon={<Calendar className="w-4 h-4" />}
            label="Date fin"
            value={chantier.date_fin ? new Date(chantier.date_fin).toLocaleDateString("fr-FR") : "—"}
          />
        </div>
      </div>

      {/* Centrales à béton */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-display font-semibold flex items-center gap-2">
            <Factory className="w-5 h-5 text-primary" /> Centrales à béton
            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary">{centrales.length}</span>
          </h2>
          <Button
            className="gap-2 gradient-primary text-primary-foreground"
            onClick={() => setAffectOpen(true)}
            disabled={!effectiveClientId}
          >
            <Plus className="w-4 h-4" /> Nouvelle centrale à béton
          </Button>
        </div>

        {centrales.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-lg">
            <Factory className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>Aucune centrale affectée à ce chantier</p>
            <p className="text-xs mt-1">Cliquez sur « Nouvelle centrale à béton » pour en affecter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {centrales.map((c) => (
              <div key={c.id} className="bg-background border border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Factory className="w-5 h-5 text-primary" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/intervenant/producteurs/centrale/${c.id}`)}>
                        <Eye className="w-4 h-4 mr-2" /> Détails
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDetachTarget({ id: c.id, nom: c.nom })}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Retirer du chantier
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">{c.nom}</h3>
                {c.ville && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {c.ville}
                  </p>
                )}
                {c.contact && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <User className="w-3 h-3" /> {c.contact}
                  </p>
                )}
                {c.telephone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" /> {c.telephone}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {effectiveClientId && chantierId && (
        <AffectCentraleDialog
          open={affectOpen}
          onOpenChange={setAffectOpen}
          clientId={effectiveClientId}
          chantierId={chantierId}
        />
      )}

      <AlertDialog open={!!detachTarget} onOpenChange={(v) => !v && setDetachTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer cette centrale du chantier ?</AlertDialogTitle>
            <AlertDialogDescription>
              La centrale « {detachTarget?.nom} » ne sera plus proposée pour les nouveaux échantillons de ce chantier.
              La centrale reste disponible pour le client.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDetach} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-2">
    <span className="text-primary/70 mt-0.5">{icon}</span>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  </div>
);

export default ChantierDetail;
