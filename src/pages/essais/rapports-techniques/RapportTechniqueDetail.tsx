import { useParams } from "react-router-dom";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { BackButton } from "@/components/ui/back-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useRapportTechnique,
  STATUT_LABELS,
  STATUT_COLORS,
} from "@/hooks/useRapportsTechniques";

export default function RapportTechniqueDetail() {
  const { id = "" } = useParams();
  const { data: r, isLoading } = useRapportTechnique(id);

  return (
    <div className="space-y-6">
      <AppBreadcrumb
        items={[
          { label: "Essais", path: "/essais" },
          {
            label: "Assistant IA",
            path: "/essais/redaction-rapport-technique",
          },
          { label: r?.numero || r?.titre || "Rapport" },
        ]}
      />
      <div className="flex items-center gap-3">
        <BackButton to="/essais/redaction-rapport-technique" />
        <h1 className="text-2xl font-bold">
          {r?.numero || r?.titre || "Rapport technique"}
        </h1>
        {r && (
          <Badge className={STATUT_COLORS[r.statut]} variant="outline">
            {STATUT_LABELS[r.statut]}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-muted-foreground">Chargement…</CardContent>
        </Card>
      ) : !r ? (
        <Card>
          <CardContent className="p-6 text-muted-foreground">
            Rapport introuvable.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Description du problème</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{r.description_probleme}</p>
            <p className="text-xs text-muted-foreground mt-4">
              Éditeur riche, analyse IA, workflow de validation et export PDF seront
              disponibles dans les prochaines phases du module.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
