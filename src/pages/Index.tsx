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
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          Tableau de <span className="text-primary text-glow">Bord</span>
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
          Bienvenue dans votre système de gestion de laboratoire
        </p>
      </div>

      {/* Stats Grid: 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        <div className="lg:col-span-2 min-w-0">
          <MonthlyTestsChart
            data={dashboardStats?.monthlyTests || []}
            isLoading={loadingDashboard}
          />
        </div>
        <div className="min-w-0">
          <ConformityGauge
            data={dashboardStats?.conformity || { conforme: 0, nonConforme: 0, enAttente: 0, total: 0, tauxConformite: 0 }}
            isLoading={loadingDashboard}
          />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        <div className="lg:col-span-2 min-w-0">
          <TestTypeDistribution
            data={dashboardStats?.testTypeDistribution || []}
            isLoading={loadingDashboard}
          />
        </div>
        <div className="min-w-0">
          <QuickStats
            clients={dashboardStats?.totalClients || 0}
            chantiers={dashboardStats?.totalChantiers || 0}
            intervenants={dashboardStats?.totalIntervenants || 0}
            isLoading={loadingDashboard}
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 min-w-0">
          <ActivityChart />
        </div>
        <div className="min-w-0">
          <EquipmentStatus />
        </div>
        <div className="lg:col-span-3 min-w-0">
          <RecentTests />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 md:mt-8 p-4 md:p-6 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className="p-3 rounded-xl gradient-primary box-glow flex-shrink-0">
              <Calendar className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-foreground text-sm md:text-base">
                Planification des essais
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                {essaisStats?.pending ?? 0} essais en attente de planification
              </p>
            </div>
          </div>
          <button className="w-full md:w-auto px-4 py-3 md:py-2 rounded-lg gradient-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity box-glow touch-target">
            Voir le planning
          </button>
        </div>
      </div>
    </>
  );
};


export default Index;
