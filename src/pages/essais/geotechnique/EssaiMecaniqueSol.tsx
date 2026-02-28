import { ArrowLeft, Scissors, ArrowDownToLine, Cylinder, Layers, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

const EssaiMecaniqueSol = () => {
  const navigate = useNavigate();

  const mecaniqueTypes = [
    {
      id: "normes",
      title: "Normes",
      description: "Références normatives et modes opératoires",
      icon: FileText,
      gradient: "from-purple-500/20 to-violet-500/10",
      iconColor: "text-purple-500",
      path: "/essais/geotechnique/mecanique/normes"
    },
    {
      id: "cisaillement",
      title: "Cisaillement Direct",
      description: "Détermination des paramètres de résistance au cisaillement à la boîte",
      icon: Scissors,
      gradient: "from-rose-500/20 to-red-500/10",
      iconColor: "text-rose-500",
      path: "/essais/geotechnique/mecanique/cisaillement"
    },
    {
      id: "compression-simple",
      title: "Compression Simple",
      description: "Résistance à la compression non confinée des sols cohérents",
      icon: ArrowDownToLine,
      gradient: "from-amber-500/20 to-orange-500/10",
      iconColor: "text-amber-500",
      path: "/essais/geotechnique/mecanique/compression-simple"
    },
    {
      id: "triaxial",
      title: "Essai Triaxial",
      description: "Détermination des caractéristiques mécaniques en compression triaxiale",
      icon: Cylinder,
      gradient: "from-sky-500/20 to-blue-500/10",
      iconColor: "text-sky-500",
      path: "/essais/geotechnique/mecanique/triaxial"
    },
    {
      id: "oedometrique",
      title: "Essai Œdométrique",
      description: "Détermination des caractéristiques de compressibilité et de consolidation",
      icon: Layers,
      gradient: "from-violet-500/20 to-purple-500/10",
      iconColor: "text-violet-500",
      path: "/essais/geotechnique/mecanique/oedometrique"
    },
  ];
  return (
    <>
      <EssaiBreadcrumb 
        items={[
          { label: "Géotechnique", path: "/essais/geotechnique" },
          { label: "Mécaniques" }
        ]} 
      />
      
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/essais/geotechnique")}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Essais <span className="text-primary text-glow">Mécaniques des Sols</span>
          </h1>
        </div>
        <p className="text-muted-foreground mt-2 ml-14">
          Sélectionnez le type d'essai à effectuer
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mecaniqueTypes.map((type) => (
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
    </>
  );
};

export default EssaiMecaniqueSol;
