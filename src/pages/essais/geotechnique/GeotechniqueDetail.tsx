import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Pencil, ClipboardEdit } from "lucide-react";
import { useEchantillonGeotechniqueById, getGeoPrefix } from "@/hooks/useEchantillonsGeotechniqueFactory";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

interface GeotechniqueDetailProps {
  essaiType: string;
  essaiTitle: string;
  basePath: string;
  categoryPath: string;
  categoryLabel: string;
}

const getStatutBadge = (statut: string) => {
  switch (statut) {
    case "en-cours":
      return <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 bg-yellow-500/10">En cours</Badge>;
    case "termine":
      return <Badge variant="outline" className="border-emerald-500/50 text-emerald-500 bg-emerald-500/10">Terminé</Badge>;
    case "a-faire":
      return <Badge variant="outline" className="border-sky-500/50 text-sky-500 bg-sky-500/10">À faire</Badge>;
    default:
      return <Badge variant="outline">{statut}</Badge>;
  }
};

export default function GeotechniqueDetail({ essaiType, essaiTitle, basePath, categoryPath, categoryLabel }: GeotechniqueDetailProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: echantillon, isLoading } = useEchantillonGeotechniqueById(essaiType, id);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!echantillon) {
    return <div className="text-center py-8 text-muted-foreground">Échantillon non trouvé</div>;
  }

  const prefix = getGeoPrefix(essaiType);
  const numero = `${prefix}-${String(echantillon.numero).padStart(3, "0")}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <EssaiBreadcrumb items={[
        { label: "Géotechnique", path: "/essais/geotechnique" },
        { label: categoryLabel, path: categoryPath },
        { label: essaiTitle, path: basePath },
        { label: <><span className="text-primary">{prefix}</span>-{String(echantillon.numero).padStart(3, "0")}</> }
      ]} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(basePath)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Échantillon <span className="text-primary">{numero}</span>
            </h1>
            <p className="text-muted-foreground mt-1">{essaiTitle}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`${basePath}/${id}/saisie`)}>
            <ClipboardEdit className="w-4 h-4 mr-2" />Saisie
          </Button>
          <Button variant="outline" onClick={() => navigate(`${basePath}/${id}/modifier`)}>
            <Pencil className="w-4 h-4 mr-2" />Modifier
          </Button>
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Identification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Numéro</p>
              <p className="font-medium font-mono text-foreground">{numero}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Statut</p>
              <div className="mt-1">{getStatutBadge(echantillon.statut)}</div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="font-medium text-foreground">{echantillon.clients?.nom || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Chantier</p>
              <p className="font-medium text-foreground">{echantillon.chantiers?.nom || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type de sol</p>
              <p className="font-medium text-foreground">{echantillon.type_sol}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Profondeur</p>
              <p className="font-medium text-foreground">{echantillon.profondeur || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date de prélèvement</p>
              <p className="font-medium text-foreground">
                {format(new Date(echantillon.date_prelevement), "dd/MM/yyyy", { locale: fr })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Opérateur</p>
              <p className="font-medium text-foreground">
                {echantillon.intervenants ? `${echantillon.intervenants.prenom} ${echantillon.intervenants.nom}` : "-"}
              </p>
            </div>
            {echantillon.observations && (
              <div className="md:col-span-3">
                <p className="text-sm text-muted-foreground">Observations</p>
                <p className="font-medium text-foreground">{echantillon.observations}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {echantillon.resultats && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Résultats</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-foreground bg-muted/50 p-4 rounded-lg overflow-auto">
              {JSON.stringify(echantillon.resultats, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
