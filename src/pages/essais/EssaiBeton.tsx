import { ArrowLeft, Droplets, Cuboid, Hammer, Waves, FlaskConical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

const EssaiBeton = () => {
  const navigate = useNavigate();

  const betonTypes = [
    {
      id: "beton-frais",
      title: "Essai sur Béton Frais",
      description: "Affaissement au cône d'Abrams, air occlus, masse volumique",
      icon: Droplets,
      gradient: "from-cyan-500/20 to-sky-500/10",
      iconColor: "text-cyan-500",
      path: "/essais/beton/beton-frais"
    },
    {
      id: "beton-durci",
      title: "Essai sur Béton Durci",
      description: "Résistance à la compression, traction, flexion",
      icon: Cuboid,
      gradient: "from-slate-500/20 to-gray-500/10",
      iconColor: "text-slate-500",
      path: "/essais/beton/beton-durci"
    },
    {
      id: "destructif",
      title: "Essai Destructif",
      description: "Écrasement d'éprouvettes, carottage, tests de rupture",
      icon: Hammer,
      gradient: "from-red-500/20 to-rose-500/10",
      iconColor: "text-red-500",
      path: "/essais/beton/destructif"
    },
    {
      id: "non-destructif",
      title: "Essai Non Destructif",
      description: "Scléromètre, ultrasons, radar, mesure de recouvrement",
      icon: Waves,
      gradient: "from-violet-500/20 to-purple-500/10",
      iconColor: "text-violet-500",
      path: "/essais/beton/non-destructif"
    },
    {
      id: "formulation",
      title: "Formulation de Béton",
      description: "Étude de formulation, optimisation des dosages",
      icon: FlaskConical,
      gradient: "from-emerald-500/20 to-green-500/10",
      iconColor: "text-emerald-500",
      path: "/essais/beton/formulation"
    },
  ];

  return (
    <div data-essai-mobile>
      <EssaiBreadcrumb items={[{ label: "Béton" }]} />
      
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/essais")}
            className="hidden md:inline-flex border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Essai sur <span className="text-primary text-glow">Béton</span>
          </h1>
        </div>
        <p className="text-muted-foreground mt-2 md:ml-14 text-sm md:text-base">
          Sélectionnez le type d'essai à effectuer
        </p>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {betonTypes.map((type) => (
          <div
            key={type.id}
            onClick={() => navigate(type.path)}
            className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5 hover:border-primary/50"
          >
            <div className="space-y-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${type.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <type.icon className={`h-7 w-7 ${type.iconColor}`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
                  {type.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {type.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EssaiBeton;
