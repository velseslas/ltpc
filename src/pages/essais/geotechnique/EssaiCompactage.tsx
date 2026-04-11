import { ArrowLeft, Hammer, Target, BarChart, Gauge, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

const EssaiCompactage = () => {
  const navigate = useNavigate();

  const compactageTypes = [
    {
      id: "normes",
      title: "Normes et Feuilles d'essais",
      description: "Références normatives et modes opératoires",
      icon: FileText,
      gradient: "from-purple-500/20 to-violet-500/10",
      iconColor: "text-purple-500",
      path: "/essais/geotechnique/compactage/normes"
    },
    {
      id: "proctor-normal",
      title: "Essai Proctor Normal",
      description: "Détermination des caractéristiques de compactage à l'énergie normale",
      icon: Hammer,
      gradient: "from-amber-500/20 to-orange-500/10",
      iconColor: "text-amber-500",
      path: "/essais/geotechnique/compactage/proctor-normal"
    },
    {
      id: "proctor-modifie",
      title: "Essai Proctor Modifié",
      description: "Détermination des caractéristiques de compactage à l'énergie modifiée",
      icon: Target,
      gradient: "from-rose-500/20 to-red-500/10",
      iconColor: "text-rose-500",
      path: "/essais/geotechnique/compactage/proctor-modifie"
    },
    {
      id: "cbr",
      title: "Essai CBR",
      description: "Indice de portance californien pour dimensionnement de chaussées",
      icon: BarChart,
      gradient: "from-sky-500/20 to-blue-500/10",
      iconColor: "text-sky-500",
      path: "/essais/geotechnique/compactage/cbr"
    },
    {
      id: "densite-place",
      title: "Densité en Place",
      description: "Mesure de la densité sèche in-situ par gammadensimètre ou au sable",
      icon: Gauge,
      gradient: "from-emerald-500/20 to-green-500/10",
      iconColor: "text-emerald-500",
      path: "/essais/geotechnique/compactage/densite-place"
    },
  ];
  return (
    <>
      <EssaiBreadcrumb 
        items={[
          { label: "Géotechnique", path: "/essais/geotechnique" },
          { label: "Compactage" }
        ]} 
      />
      
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/essais/geotechnique")}
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Essais de <span className="text-primary text-glow">Compactage</span>
          </h1>
        </div>
        <p className="text-muted-foreground mt-2 ml-14">
          Sélectionnez le type d'essai à effectuer
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {compactageTypes.map((type) => (
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

export default EssaiCompactage;
