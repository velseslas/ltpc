import { Users, Factory, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";

const IntervenantSelection = () => {
  const navigate = useNavigate();

  const widgets = [
    {
      title: "Clients",
      description: "Gérez vos clients et leurs informations",
      icon: Users,
      path: "/intervenant/clients",
      gradient: "from-blue-500/20 to-cyan-500/10",
      iconColor: "text-blue-500",
    },
    {
      title: "Producteurs",
      description: "Gérez vos producteurs et fournisseurs",
      icon: Factory,
      path: "/intervenant/producteurs",
      gradient: "from-amber-500/20 to-orange-500/10",
      iconColor: "text-amber-500",
    },
    {
      title: "Prestataires",
      description: "Gérez vos prestataires et bons de commande",
      icon: Briefcase,
      path: "/intervenant/prestataires",
      gradient: "from-violet-500/20 to-purple-500/10",
      iconColor: "text-violet-500",
    },
  ];

  return (
    <>
      <AppBreadcrumb items={[{ label: "Intervenants" }]} />

      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">
          Gestion des <span className="text-primary text-glow">Intervenants</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Sélectionnez une catégorie pour gérer vos intervenants
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {widgets.map((widget) => (
          <div
            key={widget.path}
            onClick={() => navigate(widget.path)}
            className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10 hover:border-primary/50"
          >
            <div className="relative z-10 space-y-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${widget.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <widget.icon className={`w-7 h-7 ${widget.iconColor}`} />
              </div>
              
              <div>
                <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {widget.title}
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  {widget.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default IntervenantSelection;
