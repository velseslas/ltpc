import { StatCard } from "@/components/dashboard/StatCard";
import { RecentTests } from "@/components/dashboard/RecentTests";
import { MonthlyTestsChart } from "@/components/dashboard/MonthlyTestsChart";
import { TestTypeDistribution } from "@/components/dashboard/TestTypeDistribution";
import { useEssaisStats } from "@/hooks/useEssais";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import {
  FlaskConical,
  Building2,
  HardHat,
  Loader2,
} from "lucide-react";

const Index = () => {
  const { data: essaisStats, isLoading: loadingEssais } = useEssaisStats();
  const { data: dashboardStats, isLoading: loadingDashboard } = useDashboardStats();

  const isLoading = loadingEssais || loadingDashboard;

  const totalEssais =
    (dashboardStats?.monthlyTests || []).reduce((sum, m) => sum + m.count, 0);

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">
          Tableau de <span className="text-primary text-glow">Bord</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Vue d'ensemble de l'activité du laboratoire
        </p>
      </div>

      {/* Stats Grid - 3 indicateurs uniquement */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Clients"
          value={isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : dashboardStats?.totalClients ?? 0}
          subtitle="Entreprises enregistrées"
          icon={Building2}
        />
        <StatCard
          title="Chantiers"
          value={isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : dashboardStats?.totalChantiers ?? 0}
          subtitle="Projets suivis"
          icon={HardHat}
        />
        <StatCard
          title="Essais"
          value={isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : totalEssais}
          subtitle={`${essaisStats?.inProgress ?? 0} en cours`}
          icon={FlaskConical}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <MonthlyTestsChart
            data={dashboardStats?.monthlyTests || []}
            isLoading={loadingDashboard}
          />
        </div>
        <div>
          <TestTypeDistribution
            data={dashboardStats?.testTypeDistribution || []}
            isLoading={loadingDashboard}
          />
        </div>
      </div>

      {/* Recent Tests */}
      <RecentTests />
    </>
  );
};

export default Index;
