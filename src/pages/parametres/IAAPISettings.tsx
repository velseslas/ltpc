import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Brain, ExternalLink } from "lucide-react";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";

const IAAPISettings = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      <AppBreadcrumb items={[
        { label: "Paramètres", path: "/parametres" },
        { label: "IA & API" },
      ]} />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/parametres")}
          className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">IA & API</h1>
            <p className="text-sm text-muted-foreground">
              Configuration des assistants IA et des clés API
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Assistant IA</CardTitle>
            <CardDescription>
              Accéder au centre d'IA pour gérer les conversations, la base de connaissances et le monitoring.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => navigate("/ltpc-ai")}
              >
                <span>Ouvrir l'assistant IA</span>
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => navigate("/ltpc-ai/base-connaissances")}
              >
                <span>Base de connaissances</span>
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => navigate("/ltpc-ai/monitoring")}
              >
                <span>Monitoring</span>
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => navigate("/ltpc-ai/centre-pilotage")}
              >
                <span>Centre de pilotage</span>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Clés API</CardTitle>
            <CardDescription>
              Gestion des accès API et des connecteurs externes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Les clés API et les connecteurs sont configurés via le backend sécurisé. Contactez l'administrateur pour toute modification.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IAAPISettings;
