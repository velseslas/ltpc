import { StatCard } from "@/components/dashboard/StatCard";
import { useEssaisStats } from "@/hooks/useEssais";
import { useIntervenantsStats } from "@/hooks/useIntervenants";
import { useLaboratoiresMobilesStats } from "@/hooks/useLaboratoiresMobiles";
import { FlaskConical, Users, Truck, Receipt, Loader2 } from "lucide-react";

export default function AdminStatsCards() {
  const { data: essaisStats, isLoading: loadingEssais } = useEssaisStats();
  const { data: intervenantsStats, isLoading: loadingIntervenants } = useIntervenantsStats();
  const { data: labosStats, isLoading: loadingLabos } = useLaboratoiresMobilesStats();
  const isLoading = loadingEssais || loadingIntervenants || loadingLabos;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Essais en cours"
        value={isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : essaisStats?.inProgress ?? 0}
        subtitle={`${essaisStats?.pending ?? 0} en attente de validation`} icon={FlaskConical}
        trend={essaisStats?.total ? { value: 12, isPositive: true } : undefined} />
      <StatCard title="Intervenants actifs"
        value={isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : intervenantsStats?.active ?? 0}
        subtitle={`${intervenantsStats?.mission ?? 0} en mission externe`} icon={Users}
        trend={intervenantsStats?.total ? { value: 5, isPositive: true } : undefined} />
      <StatCard title="Laboratoires Mobiles"
        value={isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : labosStats?.total ?? 0}
        subtitle={`${labosStats?.deploye ?? 0} déployés sur site`} icon={Truck} />
      <StatCard title="Essais terminés"
        value={isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : essaisStats?.completed ?? 0}
        subtitle="ce mois" icon={Receipt}
        trend={essaisStats?.completed ? { value: 8, isPositive: true } : undefined} />
    </div>
  );
}
