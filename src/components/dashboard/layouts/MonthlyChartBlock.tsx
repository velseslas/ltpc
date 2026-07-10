import { MonthlyTestsChart } from "@/components/dashboard/MonthlyTestsChart";
import { useDashboardStats } from "@/hooks/useDashboardStats";
export default function MonthlyChartBlock() {
  const { data, isLoading } = useDashboardStats();
  return <MonthlyTestsChart data={data?.monthlyTests || []} isLoading={isLoading} />;
}
