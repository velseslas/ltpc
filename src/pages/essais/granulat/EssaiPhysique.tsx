import { ArrowLeft, Box, Scale, Shapes, Droplets, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

const EssaiPhysique = () => {
  const navigate = useNavigate();

  const physiqueTypes = [
    { id: "normes", title: "Normes", description: "Références normatives et modes opératoires", icon: FileText, gradient: "from-purple-500/20 to-violet-500/10", iconColor: "text-purple-500", essaiCount: null, path: "/essais/granulat/physiques/normes" },
    { id: "granulometrie", title: "Analyse Granulométrique", description: "Détermination de la distribution granulométrique par tamisage", icon: Box, gradient: "from-amber-500/20 to-orange-500/10", iconColor: "text-amber-500", essaiCount: 22, path: "/essais/granulat/physiques/granulometrie" },
    { id: "masse-volumique", title: "Masse Volumique", description: "Détermination de la masse volumique absolue et apparente", icon: Scale, gradient: "from-sky-500/20 to-blue-500/10", iconColor: "text-sky-500", essaiCount: 15, path: "/essais/granulat/physiques/masse-volumique" },
    { id: "forme", title: "Forme des Granulats", description: "Détermination du coefficient d'aplatissement et d'élongation", icon: Shapes, gradient: "from-emerald-500/20 to-green-500/10", iconColor: "text-emerald-500", essaiCount: 18, path: "/essais/granulat/physiques/forme" },
    { id: "teneur-eau", title: "Teneur en Eau", description: "Détermination de la teneur en eau des granulats", icon: Droplets, gradient: "from-rose-500/20 to-red-500/10", iconColor: "text-rose-500", essaiCount: 12, path: "/essais/granulat/physiques/teneur-eau" },
  ];

  return (
    <>
      <EssaiBreadcrumb 
        items={[
          { label: "Granulat", path: "/essais/granulat" },
          { label: "Physiques" }
        ]} 
      />
      
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/essais/granulat")}
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Essais <span className="text-primary text-glow">Physiques des Agrégats</span>
          </h1>
        </div>
        <p className="text-muted-foreground mt-2 ml-14">
          Sélectionnez le type d'essai à effectuer
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {physiqueTypes.map((type) => (
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

export default EssaiPhysique;
