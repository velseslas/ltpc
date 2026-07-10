import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PieChart as PieIcon, Loader2 } from "lucide-react";
import { useFamilyDistribution } from "@/hooks/useDashboardWidgets";

export function DashboardFamilyDistribution() {
  const { data, isLoading } = useFamilyDistribution();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{d.famille}</p>
          <p className="text-sm text-muted-foreground">{d.count} essais ({d.percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl bg-card border border-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <PieIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground">Répartition par famille</h3>
          <p className="text-xs text-muted-foreground">Volume d'essais par domaine métier</p>
        </div>
      </div>
      <div className="h-64">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !data || data.every((d) => d.count === 0) ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">Aucune donnée disponible</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.filter((d) => d.count > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                paddingAngle={2} dataKey="count" nameKey="famille">
                {data.filter((d) => d.count > 0).map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} stroke="hsl(220, 25%, 10%)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} wrapperStyle={{ fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default DashboardFamilyDistribution;
