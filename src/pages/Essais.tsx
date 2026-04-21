import { Box, Gem, Landmark, Hammer, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const Essais = () => {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();

  const essaiTypes = [
    {
      id: "beton",
      title: "Essai sur Béton",
      description: "Tests de résistance, affaissement, compression et durabilité du béton",
      icon: Box,
      gradient: "from-sky-500/20 to-blue-500/10",
      iconColor: "text-sky-500",
      path: "/essais/beton"
    },
    {
      id: "granulat",
      title: "Essai sur Granulat",
      description: "Analyses granulométriques, équivalent de sable, Los Angeles",
      icon: Gem,
      gradient: "from-amber-500/20 to-orange-500/10",
      iconColor: "text-amber-500",
      path: "/essais/granulat"
    },
    {
      id: "geotechnique",
      title: "Essai Géotechnique",
      description: "Études de sol, portance, compactage et limites d'Atterberg",
      icon: Landmark,
      gradient: "from-emerald-500/20 to-green-500/10",
      iconColor: "text-emerald-500",
      path: "/essais/geotechnique"
    },
    {
      id: "acier",
      title: "Essai sur Acier",
      description: "Tests de traction, dureté et analyse métallurgique",
      icon: Hammer,
      gradient: "from-rose-500/20 to-red-500/10",
      iconColor: "text-rose-500",
      path: "/essais/acier"
    },
  ];

  if (isAdmin) {
    essaiTypes.push({
      id: "audit",
      title: "Audit",
      description: "Historique des essais supprimés et restauration administrateur",
      icon: ShieldAlert,
      gradient: "from-destructive/20 to-destructive/5",
      iconColor: "text-destructive",
      path: "/essais/audit"
    });
  }

  return (
    <>
      <AppBreadcrumb items={[{ label: "Essais" }]} />

      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">
          Gestion des <span className="text-primary text-glow">Essais</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Sélectionnez un type d'essai pour commencer
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {essaiTypes.map((type) => (
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

export default Essais;
