import { Drill, Anchor, Microscope, ArrowLeft, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

const EssaiDestructif = () => {
  const navigate = useNavigate();

  const essaisDestructifs = [
    {
      id: "normes",
      title: "Normes",
      norme: "Références",
      description: "Références normatives et modes opératoires",
      icon: FileText,
      gradient: "from-purple-500/20 to-violet-500/10",
      iconColor: "text-purple-500",
      path: "/essais/beton/destructif/normes"
    },
    {
      id: "carottage",
      title: "Carottage sur Béton",
      norme: "EN 12504-1 / NF EN 12504-1",
      description: "Prélèvement de carottes pour analyse de la structure béton",
      icon: Drill,
      gradient: "from-red-500/20 to-rose-500/10",
      iconColor: "text-red-500",
      path: "/essais/beton/destructif/carottage"
    },
    {
      id: "arrachement",
      title: "Essai d'Arrachement sur Béton",
      norme: "EN 12504-3 / NF EN 12504-3",
      description: "Mesure de la résistance à l'arrachement du béton en place",
      icon: Anchor,
      gradient: "from-orange-500/20 to-amber-500/10",
      iconColor: "text-orange-500",
      path: "/essais/beton/destructif/arrachement"
    },
    {
      id: "petrographique",
      title: "Analyse Pétrographique",
      norme: "EN 12407 / NF EN 12407",
      description: "Étude microscopique de la composition du béton",
      icon: Microscope,
      gradient: "from-purple-500/20 to-violet-500/10",
      iconColor: "text-purple-500",
      path: "/essais/beton/destructif/petrographique"
    },
  ];
  return (
    <>
      <EssaiBreadcrumb 
        items={[
          { label: "Béton", path: "/essais/beton" },
          { label: "Destructif" }
        ]} 
      />
      
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/essais/beton")}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Essais <span className="text-primary text-glow">Destructifs</span>
          </h1>
        </div>
        <p className="text-muted-foreground mt-2 ml-14">
          Sélectionnez le type d'essai destructif à effectuer
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {essaisDestructifs.map((essai) => (
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

export default EssaiDestructif;
