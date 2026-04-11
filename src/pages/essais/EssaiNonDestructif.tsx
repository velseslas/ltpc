import { Gauge, Waves, Zap, Wind, FlaskRound, Thermometer, ArrowLeft, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

const EssaiNonDestructif = () => {
  const navigate = useNavigate();

  const essaisNonDestructifs = [
    {
      id: "normes",
      title: "Normes et Feuilles d'essais",
      norme: "Références",
      description: "Références normatives et modes opératoires",
      icon: FileText,
      gradient: "from-purple-500/20 to-violet-500/10",
      iconColor: "text-purple-500",
      path: "/essais/beton/non-destructif/normes"
    },
    {
      id: "sclerometre",
      title: "Essai Scléromètre",
      norme: "EN 12504-2 / NF EN 12504-2",
      description: "Mesure de la dureté de surface du béton par rebond",
      icon: Gauge,
      gradient: "from-violet-500/20 to-purple-500/10",
      iconColor: "text-violet-500",
      path: "/essais/beton/non-destructif/sclerometre"
    },
    {
      id: "ultrason",
      title: "Essai Vitesse à Ultrason",
      norme: "EN 12504-4 / NF EN 12504-4",
      description: "Mesure de la vitesse de propagation des ondes ultrasonores",
      icon: Waves,
      gradient: "from-blue-500/20 to-cyan-500/10",
      iconColor: "text-blue-500",
      path: "/essais/beton/non-destructif/ultrason"
    },
    {
      id: "resistivite",
      title: "Résistivité Électrique",
      norme: "EN 12696 / NF EN 12696",
      description: "Mesure de la résistivité électrique du béton",
      icon: Zap,
      gradient: "from-yellow-500/20 to-amber-500/10",
      iconColor: "text-yellow-500",
      path: "/essais/beton/non-destructif/resistivite"
    },
    {
      id: "permeabilite",
      title: "Perméabilité à l'Air",
      norme: "EN 12390-8 / NF EN 12390-8",
      description: "Mesure de la perméabilité du béton à l'air",
      icon: Wind,
      gradient: "from-teal-500/20 to-emerald-500/10",
      iconColor: "text-teal-500",
      path: "/essais/beton/non-destructif/permeabilite"
    },
    {
      id: "carbonatation",
      title: "Essai Carbonatation",
      norme: "EN 14630 / NF EN 14630",
      description: "Mesure de la profondeur de carbonatation du béton",
      icon: FlaskRound,
      gradient: "from-pink-500/20 to-rose-500/10",
      iconColor: "text-pink-500",
      path: "/essais/beton/non-destructif/carbonatation"
    },
    {
      id: "thermographie",
      title: "Thermographie Infrarouge",
      norme: "EN 13187 / NF EN 13187",
      description: "Détection des défauts par analyse thermique",
      icon: Thermometer,
      gradient: "from-orange-500/20 to-red-500/10",
      iconColor: "text-orange-500",
      path: "/essais/beton/non-destructif/thermographie"
    },
  ];
  return (
    <>
      <EssaiBreadcrumb 
        items={[
          { label: "Béton", path: "/essais/beton" },
          { label: "Non Destructif" }
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
            Essais <span className="text-primary text-glow">Non Destructifs</span>
          </h1>
        </div>
        <p className="text-muted-foreground mt-2 ml-14">
          Sélectionnez le type d'essai non destructif à effectuer
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {essaisNonDestructifs.map((essai) => (
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

export default EssaiNonDestructif;
