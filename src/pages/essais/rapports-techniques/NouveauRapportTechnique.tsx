import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function NouveauRapportTechnique() {
  return (
    <div className="space-y-6">
      <AppBreadcrumb
        items={[
          { label: "Essais", path: "/essais" },
          {
            label: "Assistant IA",
            path: "/essais/redaction-rapport-technique",
          },
          { label: "Nouveau rapport" },
        ]}
      />
      <div className="flex items-center gap-3">
        <BackButton to="/essais/redaction-rapport-technique" />
        <h1 className="text-2xl font-bold">Nouveau rapport technique</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            Phase 2 — Création & description
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Cette étape sera implémentée en Phase 2 : formulaire complet (client,
            chantier, matériau, description libre, upload photos/PDF/essais,
            sauvegarde brouillon).
          </p>
          <p>
            Fondations base de données et navigation en place (Phase 1). Dites-moi
            quand démarrer la Phase 2.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
