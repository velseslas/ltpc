import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, ClipboardEdit, FileText, Loader2 } from "lucide-react";
import { 
  useEchantillonGranulatById,
  formatNumero,
  getPrefix
} from "@/hooks/useEchantillonsGranulatFactory";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EssaiBreadcrumb, BreadcrumbItem as BreadcrumbItemType } from "@/components/essais/EssaiBreadcrumb";

// Import result display components
import EquivalentSableResults from "./resultats/EquivalentSableResults";
import BleuMethyleneResults from "./resultats/BleuMethyleneResults";
import MatiereOrganiqueResults from "./resultats/MatiereOrganiqueResults";
import GranulometrieResults from "./resultats/GranulometrieResults";
import MasseVolumiqueResults from "./resultats/MasseVolumiqueResults";
import FormeGranulatsResults from "./resultats/FormeGranulatsResults";
import TeneurEauResults from "./resultats/TeneurEauResults";
import LosAngelesResults from "./resultats/LosAngelesResults";
import MicroDevalResults from "./resultats/MicroDevalResults";
import EcrasementResults from "./resultats/EcrasementResults";
import FriabiliteResults from "./resultats/FriabiliteResults";

interface GranulatDetailProps {
  essaiType: string;
  essaiTitle: string;
  basePath: string;
}

// Configuration pour générer les breadcrumbs automatiquement
const breadcrumbConfig: Record<string, { category: string; categoryPath: string; categoryLabel: string }> = {
  "equivalent-sable": { category: "proprete", categoryPath: "/essais/granulat/proprete", categoryLabel: "Propreté" },
  "bleu-methylene": { category: "proprete", categoryPath: "/essais/granulat/proprete", categoryLabel: "Propreté" },
  "matiere-organique": { category: "proprete", categoryPath: "/essais/granulat/proprete", categoryLabel: "Propreté" },
  "granulometrie": { category: "physiques", categoryPath: "/essais/granulat/physiques", categoryLabel: "Physiques" },
  "masse-volumique": { category: "physiques", categoryPath: "/essais/granulat/physiques", categoryLabel: "Physiques" },
  "forme-granulats": { category: "physiques", categoryPath: "/essais/granulat/physiques", categoryLabel: "Physiques" },
  "teneur-eau": { category: "physiques", categoryPath: "/essais/granulat/physiques", categoryLabel: "Physiques" },
  "los-angeles": { category: "mecaniques", categoryPath: "/essais/granulat/mecaniques", categoryLabel: "Mécaniques" },
  "micro-deval": { category: "mecaniques", categoryPath: "/essais/granulat/mecaniques", categoryLabel: "Mécaniques" },
  "ecrasement": { category: "mecaniques", categoryPath: "/essais/granulat/mecaniques", categoryLabel: "Mécaniques" },
  "friabilite": { category: "mecaniques", categoryPath: "/essais/granulat/mecaniques", categoryLabel: "Mécaniques" },
};

const resultComponents: Record<string, React.ComponentType<{ resultats: Record<string, unknown> }>> = {
  "equivalent-sable": EquivalentSableResults,
  "bleu-methylene": BleuMethyleneResults,
  "matiere-organique": MatiereOrganiqueResults,
  "granulometrie": GranulometrieResults,
  "masse-volumique": MasseVolumiqueResults,
  "forme-granulats": FormeGranulatsResults,
  "teneur-eau": TeneurEauResults,
  "los-angeles": LosAngelesResults,
  "micro-deval": MicroDevalResults,
  "ecrasement": EcrasementResults,
  "friabilite": FriabiliteResults,
};

const getStatusBadge = (statut: string) => {
  switch (statut) {
    case "termine":
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
          Terminé
        </Badge>
      );
    case "en-cours":
      return (
        <Badge className="bg-amber-500/20 text-amber-400 border-0">
          En cours
        </Badge>
      );
    case "a-faire":
      return (
        <Badge className="bg-muted text-muted-foreground border-0">
          À faire
        </Badge>
      );
    default:
      return null;
  }
};

export default function GranulatDetail({ essaiType, essaiTitle, basePath }: GranulatDetailProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: echantillon, isLoading } = useEchantillonGranulatById(essaiType, id);

  const ResultComponent = resultComponents[essaiType];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!echantillon) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Échantillon non trouvé
      </div>
    );
  }

  const resultats = (echantillon.resultats as Record<string, unknown>) || {};
  const hasResults = Object.keys(resultats).length > 0;

  // Générer le breadcrumb automatiquement basé sur le type d'essai
  const config = breadcrumbConfig[essaiType];
  const breadcrumbItems: BreadcrumbItemType[] = config ? [
    { label: "Granulat", path: "/essais/granulat" },
    { label: config.categoryLabel, path: config.categoryPath },
    { label: essaiTitle, path: basePath },
    { 
      label: (
        <>
          <span className="text-primary">{getPrefix(essaiType)}</span>-{String(echantillon.numero).padStart(3, "0")}
        </>
      ) as React.ReactNode
    }
  ] : [];

  return (
    <>
      {breadcrumbItems.length > 0 && <EssaiBreadcrumb items={breadcrumbItems} />}
      
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(basePath)}
              className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-display font-bold text-foreground">
                  <span className="text-primary">{getPrefix(essaiType)}</span>-{String(echantillon.numero).padStart(3, "0")}
                </h1>
                {getStatusBadge(echantillon.statut)}
              </div>
              <p className="text-muted-foreground mt-1">{essaiTitle}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`${basePath}/${id}/modifier`)}
              className="border-border"
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`${basePath}/${id}/saisie`)}
              className="border-border"
            >
              <ClipboardEdit className="h-4 w-4 mr-2" />
              Saisie de données
            </Button>
            <Button
              onClick={() => navigate(`${basePath}/${id}/rapport`)}
              className="gradient-primary text-primary-foreground"
            >
              <FileText className="h-4 w-4 mr-2" />
              Rapport
            </Button>
          </div>
        </div>

        {/* Informations générales */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Informations de l'échantillon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">N° Échantillon</p>
                <p className="font-semibold text-foreground text-lg font-mono">
                  <span className="text-primary">{getPrefix(essaiType)}</span>-{String(echantillon.numero).padStart(3, "0")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Carrière</p>
                <p className="font-medium text-foreground">
                  {echantillon.carrieres?.nom || "-"}
                </p>
                {echantillon.carrieres?.ville && (
                  <p className="text-sm text-muted-foreground">
                    {echantillon.carrieres.ville}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Produit</p>
                <p className="font-medium text-foreground">{echantillon.produit}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date de réception</p>
                <p className="font-medium text-foreground">
                  {format(new Date(echantillon.date_reception), "dd MMMM yyyy", { locale: fr })}
                </p>
              </div>
            </div>
            {echantillon.observations && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground mb-1">Observations</p>
                <p className="text-foreground">{echantillon.observations}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Résultats */}
        {hasResults && ResultComponent ? (
          essaiType === "granulometrie" ? (
            <ResultComponent resultats={resultats} produit={echantillon.produit} />
          ) : (
            <ResultComponent resultats={resultats} />
          )
        ) : (
          <Card className="border-border bg-card">
            <CardContent className="py-12 text-center">
              <div className="text-muted-foreground mb-4">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Aucun résultat enregistré</p>
                <p className="text-sm">Cliquez sur "Saisie de données" pour ajouter les résultats de l'essai</p>
              </div>
              <Button
                onClick={() => navigate(`${basePath}/${id}/saisie`)}
                className="gradient-primary text-primary-foreground mt-4"
              >
                <ClipboardEdit className="h-4 w-4 mr-2" />
                Saisir les résultats
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
