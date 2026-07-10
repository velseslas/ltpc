import { QuickStats } from "@/components/dashboard/QuickStats";
import { useDashboardStats } from "@/hooks/useDashboardStats";
export default function QuickStatsBlock() {
  const { data, isLoading } = useDashboardStats();
  return <QuickStats clients={data?.totalClients || 0} chantiers={data?.totalChantiers || 0}
    intervenants={data?.totalIntervenants || 0} isLoading={isLoading} />;
}
