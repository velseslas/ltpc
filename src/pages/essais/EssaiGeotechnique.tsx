import { ArrowLeft, Layers, Hammer, Mountain, Compass } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

const EssaiGeotechnique = () => {
  const navigate = useNavigate();

  const geotechniqueTypes = [
    {
      id: "identification",
      title: "Essais d'Identification",
      description: "Limites d'Atterberg, analyse granulométrique des sols, teneur en eau, classification",
      icon: Layers,
      gradient: "from-emerald-500/20 to-green-500/10",
      iconColor: "text-emerald-500",
      essaiCount: 4,
      path: "/essais/geotechnique/identification"
    },
    {
      id: "compactage",
      title: "Essais de Compactage",
      description: "Proctor Normal, Proctor Modifié, CBR, densité en place",
      icon: Hammer,
      gradient: "from-amber-500/20 to-orange-500/10",
      iconColor: "text-amber-500",
      essaiCount: 4,
      path: "/essais/geotechnique/compactage"
    },
    {
      id: "mecanique",
      title: "Essais Mécaniques des Sols",
      description: "Cisaillement direct, compression simple, essai triaxial, essai œdométrique",
      icon: Mountain,
      gradient: "from-rose-500/20 to-red-500/10",
      iconColor: "text-rose-500",
      essaiCount: 4,
      path: "/essais/geotechnique/mecanique"
    },
    {
      id: "in-situ",
      title: "Essais In-Situ",
      description: "Pénétromètre dynamique, pressiomètre, essai de plaque, sondage",
      icon: Compass,
      gradient: "from-sky-500/20 to-blue-500/10",
      iconColor: "text-sky-500",
      essaiCount: 5,
      path: "/essais/geotechnique/in-situ"
    },
  ];

  return (
    <>
      <EssaiBreadcrumb items={[{ label: "Géotechnique" }]} />
      
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/essais")}
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Essai <span className="text-primary text-glow">Géotechnique</span>
          </h1>
        </div>
        <p className="text-muted-foreground mt-2 ml-14">
          Sélectionnez le type d'essai à effectuer
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {geotechniqueTypes.map((type) => (
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
                <p className="text-sm text-muted-foreground mt-1 mb-3">
                  {type.description}
                </p>
                <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-0">
                  {type.essaiCount} types d'essais
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default EssaiGeotechnique;
