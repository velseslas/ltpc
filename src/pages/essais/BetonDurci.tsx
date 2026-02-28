import { useNavigate } from "react-router-dom";
import { ArrowDownToLine, Split, Activity, Droplets, ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

const BetonDurci = () => {
  const navigate = useNavigate();

  const essaisTypes = [
    {
      id: "normes",
      title: "Normes",
      norme: "Références",
      description: "Références normatives et modes opératoires",
      icon: FileText,
      gradient: "from-purple-500/20 to-violet-500/10",
      iconColor: "text-purple-500",
      path: "/essais/beton/beton-durci/normes"
    },
    {
      id: "compression",
      title: "Résistance à la Compression",
      norme: "NF EN 12390-3",
      description: "Détermination de la résistance à la compression",
      icon: ArrowDownToLine,
      gradient: "from-emerald-500/20 to-green-500/10",
      iconColor: "text-emerald-500",
      path: "/essais/beton/beton-durci/compression"
    },
    {
      id: "traction-fendage",
      title: "Traction par Fendage",
      norme: "NF EN 12390-6",
      description: "Essai de traction par fendage",
      icon: Split,
      gradient: "from-violet-500/20 to-purple-500/10",
      iconColor: "text-violet-500",
      path: "/essais/beton/beton-durci/traction-fendage"
    },
    {
      id: "module-elasticite",
      title: "Module d'Élasticité",
      norme: "NF EN 12390-13",
      description: "Détermination du module d'élasticité",
      icon: Activity,
      gradient: "from-orange-500/20 to-red-500/10",
      iconColor: "text-orange-500",
      path: "/essais/beton/beton-durci/module-elasticite"
    },
    {
      id: "permeabilite",
      title: "Perméabilité",
      norme: "NF EN 12390-8",
      description: "Essai de perméabilité à l'eau",
      icon: Droplets,
      gradient: "from-sky-500/20 to-blue-500/10",
      iconColor: "text-sky-500",
      path: "/essais/beton/beton-durci/permeabilite"
    }
  ];
  return (
    <>
      <EssaiBreadcrumb 
        items={[
          { label: "Béton", path: "/essais/beton" },
          { label: "Béton Durci" }
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
            Essai sur <span className="text-primary text-glow">Béton Durci</span>
          </h1>
        </div>
        <p className="text-muted-foreground mt-2 ml-14">
          Sélectionnez le type d'essai à réaliser
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

export default BetonDurci;
