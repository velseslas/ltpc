import { useNavigate } from "react-router-dom";
import { ArrowDown, Thermometer, Clock, Wind, ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

const BetonFrais = () => {
  const navigate = useNavigate();

  const essaisTypes = [
    {
      id: "affaissement",
      title: "Essai d'Affaissement",
      norme: "NF EN 12350-2",
      description: "Mesure de la consistance du béton frais",
      icon: ArrowDown,
      gradient: "from-blue-500/20 to-cyan-500/10",
      iconColor: "text-blue-500",
      path: "/essais/beton/beton-frais/affaissement"
    },
    {
      id: "temperature",
      title: "Essai de Température",
      norme: "NF EN 12350-1",
      description: "Contrôle de la température du béton",
      icon: Thermometer,
      gradient: "from-red-500/20 to-orange-500/10",
      iconColor: "text-red-500",
      path: "/essais/beton/beton-frais/temperature"
    },
    {
      id: "temps-prise",
      title: "Temps de Prise sur Site",
      norme: "NF EN 480-2",
      description: "Détermination du temps de prise initial",
      icon: Clock,
      gradient: "from-amber-500/20 to-yellow-500/10",
      iconColor: "text-amber-500",
      path: "/essais/beton/beton-frais/temps-prise"
    },
    {
      id: "teneur-air",
      title: "Teneur en Air",
      norme: "NF EN 12350-7",
      description: "Mesure de la teneur en air occlus",
      icon: Wind,
      gradient: "from-cyan-500/20 to-teal-500/10",
      iconColor: "text-cyan-500",
      path: "/essais/beton/beton-frais/teneur-air"
    }
  ];

  return (
    <>
      <EssaiBreadcrumb 
        items={[
          { label: "Béton", path: "/essais/beton" },
          { label: "Béton Frais" }
        ]} 
      />
      
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/essais/beton")}
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Essai sur <span className="text-primary text-glow">Béton Frais</span>
          </h1>
        </div>
        <p className="text-muted-foreground mt-2 ml-14">
          Tableau de bord et gestion des essais sur béton frais
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Widget Normes */}
        <div
          onClick={() => navigate("/essais/beton/beton-frais/normes")}
          className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5 hover:border-primary/50"
        >
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FileText className="h-7 w-7 text-purple-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
                Normes
              </h2>
              <span className="inline-block text-xs font-medium bg-muted px-2 py-1 rounded-full text-muted-foreground mt-1 mb-2">
                Références
              </span>
              <p className="text-sm text-muted-foreground">
                Normes et modes opératoires des essais
              </p>
            </div>
          </div>
        </div>

        {/* Test Types Widgets */}
        {essaisTypes.map((essai) => (
          <div
            key={essai.id}
            onClick={() => navigate(essai.path)}
            className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5 hover:border-primary/50"
          >
            <div className="space-y-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${essai.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <essai.icon className={`h-7 w-7 ${essai.iconColor}`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
                  {essai.title}
                </h2>
                <span className="inline-block text-xs font-medium bg-muted px-2 py-1 rounded-full text-muted-foreground mt-1 mb-2">
                  {essai.norme}
                </span>
                <p className="text-sm text-muted-foreground">
                  {essai.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default BetonFrais;
