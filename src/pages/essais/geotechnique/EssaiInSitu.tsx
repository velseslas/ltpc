import { ArrowLeft, ArrowDownCircle, Gauge, SquareStack, Search, FileText, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

const EssaiInSitu = () => {
  const navigate = useNavigate();

  const inSituTypes = [
    {
      id: "normes",
      title: "Normes",
      description: "Références normatives et modes opératoires",
      icon: FileText,
      gradient: "from-purple-500/20 to-violet-500/10",
      iconColor: "text-purple-500",
      path: "/essais/geotechnique/in-situ/normes"
    },
    {
      id: "penetrometre",
      title: "Pénétromètre Dynamique",
      description: "Essai de pénétration dynamique pour reconnaissance des sols",
      icon: ArrowDownCircle,
      gradient: "from-sky-500/20 to-blue-500/10",
      iconColor: "text-sky-500",
      path: "/essais/geotechnique/in-situ/penetrometre"
    },
    {
      id: "pressiometre",
      title: "Essai Pressiométrique",
      description: "Mesure des caractéristiques mécaniques des sols en place",
      icon: Gauge,
      gradient: "from-amber-500/20 to-orange-500/10",
      iconColor: "text-amber-500",
      path: "/essais/geotechnique/in-situ/pressiometre"
    },
    {
      id: "plaque",
      title: "Essai de Plaque",
      description: "Détermination du module de déformation par chargement à la plaque",
      icon: SquareStack,
      gradient: "from-emerald-500/20 to-green-500/10",
      iconColor: "text-emerald-500",
      path: "/essais/geotechnique/in-situ/plaque"
    },
    {
      id: "sondage",
      title: "Sondage Carotté",
      description: "Reconnaissance géologique par prélèvement de carottes de sol",
      icon: Search,
      gradient: "from-violet-500/20 to-purple-500/10",
      iconColor: "text-violet-500",
      path: "/essais/geotechnique/in-situ/sondage"
    },
    {
      id: "densitometre",
      title: "Densitomètre à Membrane",
      description: "Détermination de la densité en place par densitomètre à membrane",
      icon: Circle,
      gradient: "from-rose-500/20 to-pink-500/10",
      iconColor: "text-rose-500",
      path: "/essais/geotechnique/in-situ/densitometre"
    },
  ];
  return (
    <>
      <EssaiBreadcrumb 
        items={[
          { label: "Géotechnique", path: "/essais/geotechnique" },
          { label: "In-Situ" }
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
            Essais <span className="text-primary text-glow">In-Situ</span>
          </h1>
        </div>
        <p className="text-muted-foreground mt-2 ml-14">
          Sélectionnez le type d'essai à effectuer
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inSituTypes.map((type) => (
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

export default EssaiInSitu;
