import { ArrowLeft, ClipboardList, FlaskConical, Leaf, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

const EssaiProprete = () => {
  const navigate = useNavigate();

  const propreteTypes = [
    { id: "normes", title: "Normes et Feuilles d'essais", description: "Références normatives et modes opératoires", icon: FileText, gradient: "from-purple-500/20 to-violet-500/10", iconColor: "text-purple-500", essaiCount: null, path: "/essais/granulat/proprete/normes" },
    { id: "equivalent-sable", title: "Équivalent de Sable", description: "Détermination de la propreté des sables par l'essai d'équivalent de sable", icon: ClipboardList, gradient: "from-sky-500/20 to-blue-500/10", iconColor: "text-sky-500", essaiCount: 15, path: "/essais/granulat/proprete/equivalent-sable" },
    { id: "bleu-methylene", title: "Essai au Bleu de Méthylène", description: "Détermination de la valeur au bleu de méthylène des granulats fins", icon: FlaskConical, gradient: "from-indigo-500/20 to-violet-500/10", iconColor: "text-indigo-500", essaiCount: 12, path: "/essais/granulat/proprete/bleu-methylene" },
    { id: "matiere-organique", title: "Teneur en Matière Organique", description: "Détermination qualitative de la teneur en matière organique des sables", icon: Leaf, gradient: "from-emerald-500/20 to-green-500/10", iconColor: "text-emerald-500", essaiCount: 8, path: "/essais/granulat/proprete/matiere-organique" },
  ];

  return (
    <>
      <EssaiBreadcrumb 
        items={[
          { label: "Granulat", path: "/essais/granulat" },
          { label: "Propreté" }
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
            Essais de <span className="text-primary text-glow">Propreté des Agrégats</span>
          </h1>
        </div>
        <p className="text-muted-foreground mt-2 ml-14">
          Sélectionnez le type d'essai à effectuer
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {propreteTypes.map((type) => (
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

export default EssaiProprete;
