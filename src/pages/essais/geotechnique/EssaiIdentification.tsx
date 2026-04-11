import { ArrowLeft, Droplets, BarChart3, Thermometer, ClipboardList, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

const EssaiIdentification = () => {
  const navigate = useNavigate();

  const identificationTypes = [
    {
      id: "normes",
      title: "Normes et Feuilles d'essais",
      description: "Références normatives et modes opératoires",
      icon: FileText,
      gradient: "from-purple-500/20 to-violet-500/10",
      iconColor: "text-purple-500",
      essaiCount: null,
      path: "/essais/geotechnique/identification/normes"
    },
    {
      id: "limites-atterberg",
      title: "Limites d'Atterberg",
      description: "Détermination des limites de liquidité et de plasticité des sols",
      icon: Droplets,
      gradient: "from-sky-500/20 to-blue-500/10",
      iconColor: "text-sky-500",
      essaiCount: null,
      path: "/essais/geotechnique/identification/limites-atterberg"
    },
    {
      id: "granulometrie-sol",
      title: "Analyse Granulométrique des Sols",
      description: "Distribution granulaire par tamisage et sédimentométrie",
      icon: BarChart3,
      gradient: "from-amber-500/20 to-orange-500/10",
      iconColor: "text-amber-500",
      essaiCount: null,
      path: "/essais/geotechnique/identification/granulometrie-sol"
    },
    {
      id: "teneur-eau-sol",
      title: "Teneur en Eau des Sols",
      description: "Détermination de la teneur en eau pondérale par étuvage",
      icon: Thermometer,
      gradient: "from-emerald-500/20 to-green-500/10",
      iconColor: "text-emerald-500",
      essaiCount: null,
      path: "/essais/geotechnique/identification/teneur-eau-sol"
    },
    {
      id: "classification-sol",
      title: "Classification des Sols",
      description: "Classification GTR et USCS des sols pour les travaux de terrassement",
      icon: ClipboardList,
      gradient: "from-violet-500/20 to-purple-500/10",
      iconColor: "text-violet-500",
      essaiCount: null,
      path: "/essais/geotechnique/identification/classification-sol"
    },
  ];
  return (
    <>
      <EssaiBreadcrumb 
        items={[
          { label: "Géotechnique", path: "/essais/geotechnique" },
          { label: "Identification" }
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
            Essais d'<span className="text-primary text-glow">Identification</span>
          </h1>
        </div>
        <p className="text-muted-foreground mt-2 ml-14">
          Sélectionnez le type d'essai à effectuer
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {identificationTypes.map((type) => (
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

export default EssaiIdentification;
