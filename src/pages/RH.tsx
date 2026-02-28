import { Card, CardContent } from "@/components/ui/card";
import { Users, Briefcase, MapPin, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";

const rhWidgets = [
  {
    id: "employes",
    title: "Employés",
    description: "Gestion des employés et du personnel",
    icon: Users,
    path: "/rh/employes",
    gradient: "from-blue-500/20 to-blue-600/10",
    iconColor: "text-blue-500",
  },
  {
    id: "postes",
    title: "Postes de Travail",
    description: "Configuration des postes et fonctions",
    icon: Briefcase,
    path: "/rh/postes",
    gradient: "from-emerald-500/20 to-emerald-600/10",
    iconColor: "text-emerald-500",
  },
  {
    id: "affectations",
    title: "Affectations",
    description: "Gestion des affectations et missions",
    icon: MapPin,
    path: "/rh/affectations",
    gradient: "from-orange-500/20 to-orange-600/10",
    iconColor: "text-orange-500",
  },
  {
    id: "documents",
    title: "Documents",
    description: "Gestion des documents du personnel",
    icon: FileText,
    path: "/rh/documents",
    gradient: "from-purple-500/20 to-purple-600/10",
    iconColor: "text-purple-500",
  },
];

export default function RH() {
  const navigate = useNavigate();

  return (
    <>
      <AppBreadcrumb items={[{ label: "Ressources Humaines" }]} />

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Ressources <span className="text-primary">Humaines</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestion du personnel, des postes et des affectations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rhWidgets.map((widget) => {
            const IconComponent = widget.icon;
            return (
              <Card
                key={widget.id}
                className="group cursor-pointer border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 overflow-hidden"
                onClick={() => navigate(widget.path)}
              >
              <CardContent className="p-6 relative">
                  <div className="space-y-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${widget.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className={`h-7 w-7 ${widget.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                        {widget.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {widget.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
