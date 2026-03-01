import { Factory, Mountain, Droplets, Droplet, Building, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";

const Producteurs = () => {
  const navigate = useNavigate();

  const widgets = [
    {
      title: "Cimenterie",
      description: "Gestion des producteurs de ciment",
      icon: Factory,
      path: "/intervenant/producteurs/cimenterie",
      gradient: "from-slate-500/20 to-slate-600/10",
      iconColor: "text-slate-500",
    },
    {
      title: "Carrière d'agrégats",
      description: "Gestion des carrières de granulats",
      icon: Mountain,
      path: "/intervenant/producteurs/carriere",
      gradient: "from-amber-500/20 to-yellow-600/10",
      iconColor: "text-amber-500",
    },
    {
      title: "Adjuvant",
      description: "Gestion des fournisseurs d'adjuvants",
      icon: Droplets,
      path: "/intervenant/producteurs/adjuvant",
      gradient: "from-purple-500/20 to-violet-600/10",
      iconColor: "text-purple-500",
    },
    {
      title: "Source d'eau",
      description: "Gestion des sources d'approvisionnement en eau",
      icon: Droplet,
      path: "/intervenant/producteurs/eau",
      gradient: "from-blue-500/20 to-cyan-500/10",
      iconColor: "text-blue-500",
    },
    {
      title: "Centrale à béton",
      description: "Gestion des centrales de production de béton",
      icon: Building,
      path: "/intervenant/producteurs/centrale",
      gradient: "from-green-500/20 to-emerald-600/10",
      iconColor: "text-green-500",
    },
  ];

  return (
    <>
      <AppBreadcrumb 
        items={[
          { label: "Intervenants", path: "/intervenant" },
          { label: "Producteurs" }
        ]} 
      />

      <div className="mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/intervenant")} className="shrink-0 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Gestion des <span className="text-primary text-glow">Producteurs</span>
          </h1>
        </div>
        <p className="text-muted-foreground mt-2">
          Sélectionnez une catégorie de producteur
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {widgets.map((widget) => (
          <div
            key={widget.path}
            onClick={() => navigate(widget.path)}
            className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5 hover:border-primary/50"
          >
            <div className="space-y-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${widget.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <widget.icon className={`h-7 w-7 ${widget.iconColor}`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
                  {widget.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
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

export default Producteurs;
