import { ConformityGauge } from "@/components/dashboard/ConformityGauge";
import { useDashboardStats } from "@/hooks/useDashboardStats";
export default function ConformityBlock() {
  const { data, isLoading } = useDashboardStats();
  return <ConformityGauge data={data?.conformity || { conforme: 0, nonConforme: 0, enAttente: 0, total: 0, tauxConformite: 0 }} isLoading={isLoading} />;
}
