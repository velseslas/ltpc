import { DashboardRoleRenderer } from "@/components/dashboard/DashboardRoleProvider";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import { useEssaisStats } from "@/hooks/useEssais";

const Index = () => {
  const navigate = useNavigate();
  const { data: essaisStats } = useEssaisStats();

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">
          Tableau de <span className="text-primary text-glow">Bord</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Bienvenue dans votre système de gestion de laboratoire
        </p>
      </div>

      <DashboardRoleRenderer />

      <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl gradient-primary box-glow">
              <Calendar className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">Planification des essais</h3>
              <p className="text-sm text-muted-foreground">
                {essaisStats?.pending ?? 0} essais en attente de planification
              </p>
            </div>
          </div>
          <button onClick={() => navigate("/essais")}
            className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity box-glow">
            Voir le planning
          </button>
        </div>
      </div>
    </>
  );
};

export default Index;
