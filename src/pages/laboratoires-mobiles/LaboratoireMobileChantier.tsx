import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, 
  HardHat, 
  MapPin, 
  Building2, 
  Calendar,
  FlaskConical,
  User,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useChantier } from "@/hooks/useChantiers";
import { useClient } from "@/hooks/useClients";
import { useLaboratoiresMobiles } from "@/hooks/useLaboratoiresMobiles";
import { useChantierEchantillons } from "@/hooks/useChantierEchantillons";
import { ChantierEchantillonsList } from "@/components/laboratoires-mobiles/ChantierEchantillonsList";
import { EchantillonsStatsCards } from "@/components/laboratoires-mobiles/EchantillonsStatsCards";
import { useCurrentUserChantiers } from "@/hooks/useCurrentUserChantiers";
import { usePermissionContext } from "@/hooks/usePermissionContext";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { ChantierLocalisationBanner } from "@/components/localisation/ChantierLocalisationBanner";
import { useAffectationsByChantier } from "@/hooks/useAffectations";
import { useIntervenants } from "@/hooks/useIntervenants";


export default function LaboratoireMobileChantier() {
  const navigate = useNavigate();
  const { chantierId } = useParams();
  const { isAdmin } = usePermissionContext();
  const { data: userChantiers, isLoading: chantiersAccessLoading } = useCurrentUserChantiers();
  const { data: chantier, isLoading: chantierLoading } = useChantier(chantierId || "");
  const { data: client, isLoading: clientLoading } = useClient(chantier?.client_id || "");
  const { data: echantillons } = useChantierEchantillons(chantierId || "");
  const { data: labos } = useLaboratoiresMobiles();

  const { data: affectations } = useAffectationsByChantier(chantierId || "");
  const { data: intervenants } = useIntervenants();

  // Un chantier peut avoir plusieurs techniciens (affectations RH + responsable labo)
  const techniciensNoms = useMemo(() => {
    const noms: string[] = [];
    const seen = new Set<string>();

    const labo = labos?.find((l) => l.chantier_id === chantierId);
    if (labo?.responsable_id && labo?.intervenants) {
      seen.add(labo.responsable_id);
      noms.push(`${labo.intervenants.prenom} ${labo.intervenants.nom}`);
    }

    (affectations || []).forEach((a: any) => {
      const statut = (a.statut || "").toLowerCase();
      if (statut === "inactif" || statut === "termine" || statut === "terminé") return;
      if (a.date_fin && new Date(a.date_fin) < new Date()) return;
      if (!a.intervenant_id || seen.has(a.intervenant_id)) return;
      const i = intervenants?.find((x: any) => x.id === a.intervenant_id);
      if (!i) return;
      seen.add(a.intervenant_id);
      noms.push(`${i.prenom} ${i.nom}`);
    });

    return noms;
  }, [labos, chantierId, affectations, intervenants]);


  const wilayaPath = useMemo(() => {
    if (!chantier?.ville) return undefined;
    const params = new URLSearchParams({ level: "clients", wilaya: chantier.ville });
    return `/laboratoires-mobiles?${params.toString()}`;
  }, [chantier?.ville]);

  const clientPath = useMemo(() => {
    if (!chantier?.ville || !client?.id || !client?.nom) return undefined;
    const params = new URLSearchParams({
      level: "chantiers",
      wilaya: chantier.ville,
      clientId: client.id,
      clientNom: client.nom,
    });
    return `/laboratoires-mobiles?${params.toString()}`;
  }, [chantier?.ville, client?.id, client?.nom]);

  const echantillonStats = useMemo(() => {
    if (!echantillons) return { total: 0, enCours: 0, termines: 0, aFaire: 0 };
    return {
      total: echantillons.length,
      enCours: echantillons.filter(e => e.statut === "en-cours").length,
      termines: echantillons.filter(e => e.statut === "termine").length,
      aFaire: echantillons.filter(e => e.statut === "a-faire").length,
    };
  }, [echantillons]);

  if (chantierLoading || clientLoading || chantiersAccessLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Technicians can only access their assigned chantiers
  if (!isAdmin && chantierId && userChantiers && !userChantiers.chantierIds.includes(chantierId)) {
    return (
      <div className="text-center py-12">
        <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-destructive opacity-60" />
        <p className="text-muted-foreground font-medium">Accès non autorisé</p>
        <p className="text-sm text-muted-foreground mt-1">Vous n'êtes pas affecté à ce chantier</p>
        <Button className="mt-4" onClick={() => navigate("/laboratoires-mobiles")}>
          Retour aux laboratoires
        </Button>
      </div>
    );
  }

  if (!chantier) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Chantier non trouvé</p>
        <Button className="mt-4" onClick={() => navigate("/laboratoires-mobiles")}>
          Retour aux laboratoires
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Laboratoires Mobiles", path: "/laboratoires-mobiles" },
        ...(chantier.ville ? [{ label: chantier.ville, path: wilayaPath }] : []),
        ...(client?.nom ? [{ label: client.nom, path: clientPath }] : []),
        { label: chantier.nom },
      ]} />
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(clientPath || wilayaPath || "/laboratoires-mobiles")} className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{chantier.nom}</h1>
          <p className="text-muted-foreground">Essais de résistance à la compression</p>
        </div>
      </div>

      {/* Chantier Info */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <HardHat className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Chantier</p>
                <p className="font-medium">{chantier.nom}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Building2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium">{client?.nom || "Non renseigné"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <MapPin className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Localisation</p>
                <p className="font-medium">{chantier.ville || "Non renseignée"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Technicien</p>
                <p className="font-medium">{technicienNom || "Non affecté"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Calendar className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Statut</p>
                <Badge variant="outline">{chantier.statut}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LOT 14.1 — Localisation & itinéraire terrain */}
      <ChantierLocalisationBanner chantier={chantier as any} chantierNom={chantier.nom} />

      {/* Échantillons Stats */}
      <EchantillonsStatsCards

        total={echantillonStats.total}
        enCours={echantillonStats.enCours}
        termines={echantillonStats.termines}
        aFaire={echantillonStats.aFaire}
      />

      {/* Samples List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Échantillons de Compression
          </CardTitle>
          <CardDescription>Liste des échantillons pour ce chantier</CardDescription>
        </CardHeader>
        <CardContent>
          <ChantierEchantillonsList chantierId={chantierId || ""} />
        </CardContent>
      </Card>
    </div>
  );
}
