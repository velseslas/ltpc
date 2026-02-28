import { ArrowLeft, Zap, Shield, Hammer, Circle, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

const EssaiMecanique = () => {
  const navigate = useNavigate();

  const mecaniqueTypes = [
    { id: "normes", title: "Normes", description: "Références normatives et modes opératoires", icon: FileText, gradient: "from-purple-500/20 to-violet-500/10", iconColor: "text-purple-500", essaiCount: null, path: "/essais/granulat/mecaniques/normes" },
    { id: "los-angeles", title: "Essai Los Angeles", description: "Résistance à la fragmentation par chocs et à l'usure par frottements mutuels", icon: Zap, gradient: "from-rose-500/20 to-red-500/10", iconColor: "text-rose-500", essaiCount: 12, path: "/essais/granulat/mecaniques/los-angeles" },
    { id: "micro-deval", title: "Essai Micro-Deval", description: "Résistance à l'usure par attrition", icon: Shield, gradient: "from-amber-500/20 to-orange-500/10", iconColor: "text-amber-500", essaiCount: 8, path: "/essais/granulat/mecaniques/micro-deval" },
    { id: "ecrasement", title: "Essai de Résistance à l'Écrasement", description: "Résistance à l'écrasement des granulats", icon: Hammer, gradient: "from-violet-500/20 to-purple-500/10", iconColor: "text-violet-500", essaiCount: 6, path: "/essais/granulat/mecaniques/ecrasement" },
    { id: "friabilite", title: "Essai de Friabilité", description: "Résistance à la friabilité des sables", icon: Circle, gradient: "from-sky-500/20 to-blue-500/10", iconColor: "text-sky-500", essaiCount: 4, path: "/essais/granulat/mecaniques/friabilite" },
  ];

  return (
    <>
      <EssaiBreadcrumb 
        items={[
          { label: "Granulat", path: "/essais/granulat" },
          { label: "Mécaniques" }
        ]} 
      />
      
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/essais/granulat")}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Essais <span className="text-primary text-glow">Mécaniques des Agrégats</span>
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
                <p className="text-sm text-muted-foreground mt-1 mb-3">
                  {type.description}
                </p>
                {type.essaiCount && (
                  <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-0">
                    {type.essaiCount} essais
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default EssaiMecanique;
