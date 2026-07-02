import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RedactionRapportTechnique() {
  return (
    <div className="space-y-6">
      <AppBreadcrumb
        items={[
          { label: "Essais", path: "/essais" },
          { label: "Rédaction de rapport technique" },
        ]}
      />

      <div className="flex items-center gap-3">
        <BackButton to="/essais" />
        <h1 className="text-2xl font-bold">Rédaction de rapport technique</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module en cours de configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Cet espace permettra de rédiger et gérer les rapports techniques des essais.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
