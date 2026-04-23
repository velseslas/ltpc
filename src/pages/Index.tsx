import { StatCard } from "@/components/dashboard/StatCard";
import { RecentTests } from "@/components/dashboard/RecentTests";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { EquipmentStatus } from "@/components/dashboard/EquipmentStatus";
import { MonthlyTestsChart } from "@/components/dashboard/MonthlyTestsChart";
import { TestTypeDistribution } from "@/components/dashboard/TestTypeDistribution";
import { ConformityGauge } from "@/components/dashboard/ConformityGauge";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { useEssaisStats } from "@/hooks/useEssais";
import { useIntervenantsStats } from "@/hooks/useIntervenants";
import { useLaboratoiresMobilesStats } from "@/hooks/useLaboratoiresMobiles";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import {
  FlaskConical,
  Users,
  Truck,
  Receipt,
  Calendar,
  Loader2,
} from "lucide-react";

const Index = () => {
  const { data: essaisStats, isLoading: loadingEssais } = useEssaisStats();
  const { data: intervenantsStats, isLoading: loadingIntervenants } = useIntervenantsStats();
  const { data: labosStats, isLoading: loadingLabos } = useLaboratoiresMobilesStats();
  const { data: dashboardStats, isLoading: loadingDashboard } = useDashboardStats();

  const isLoading = loadingEssais || loadingIntervenants || loadingLabos;

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">
          Tableau de <span className="text-primary text-glow">Bord</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Bienvenue dans votre système de gestion de laboratoire
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Essais en cours"
          value={isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : essaisStats?.inProgress ?? 0}
          subtitle={`${essaisStats?.pending ?? 0} en attente de validation`}
          icon={FlaskConical}
          trend={essaisStats?.total ? { value: 12, isPositive: true } : undefined}
        />
        <StatCard
          title="Intervenants actifs"
          value={isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : intervenantsStats?.active ?? 0}
          subtitle={`${intervenantsStats?.mission ?? 0} en mission externe`}
          icon={Users}
          trend={intervenantsStats?.total ? { value: 5, isPositive: true } : undefined}
        />
        <StatCard
          title="Laboratoires Mobiles"
          value={isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : labosStats?.total ?? 0}
          subtitle={`${labosStats?.deploye ?? 0} déployés sur site`}
          icon={Truck}
        />
        <StatCard
          title="Essais terminés"
          value={isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : essaisStats?.completed ?? 0}
          subtitle="ce mois"
          icon={Receipt}
          trend={essaisStats?.completed ? { value: 8, isPositive: true } : undefined}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Monthly Tests Chart - 2 columns */}
        <div className="lg:col-span-2">
          <MonthlyTestsChart 
            data={dashboardStats?.monthlyTests || []} 
            isLoading={loadingDashboard} 
          />
        </div>

        {/* Conformity Gauge - 1 column */}
        <div>
          <ConformityGauge 
            data={dashboardStats?.conformity || { conforme: 0, nonConforme: 0, enAttente: 0, total: 0, tauxConformite: 0 }} 
            isLoading={loadingDashboard} 
          />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Test Type Distribution - 2 columns */}
        <div className="lg:col-span-2">
          <TestTypeDistribution 
            data={dashboardStats?.testTypeDistribution || []} 
            isLoading={loadingDashboard} 
          />
        </div>

        {/* Quick Stats - 1 column */}
        <div>
          <QuickStats 
            clients={dashboardStats?.totalClients || 0}
            chantiers={dashboardStats?.totalChantiers || 0}
            intervenants={dashboardStats?.totalIntervenants || 0}
            isLoading={loadingDashboard}
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart - 2 columns */}
        <div className="lg:col-span-2">
          <ActivityChart />
        </div>

        {/* Equipment Status - 1 column */}
        <div>
          <EquipmentStatus />
        </div>

        {/* Recent Tests - Full width */}
        <div className="lg:col-span-3">
          <RecentTests />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl gradient-primary box-glow">
              <Calendar className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">
                Planification des essais
              </h3>
              <p className="text-sm text-muted-foreground">
                {essaisStats?.pending ?? 0} essais en attente de planification
              </p>
            </div>
          </div>
          <button className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity box-glow">
            Voir le planning
          </button>
        </div>
      </div>
    </>
  );
};

export default Index;
