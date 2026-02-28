import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3, Loader2 } from "lucide-react";
import { MonthlyTestData } from "@/hooks/useDashboardStats";

interface MonthlyTestsChartProps {
  data: MonthlyTestData[];
  isLoading?: boolean;
}

export function MonthlyTestsChart({ data, isLoading }: MonthlyTestsChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl bg-card border border-border p-6 h-80">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const totalTests = data.reduce((sum, d) => sum + d.count, 0);
  const avgPerMonth = data.length > 0 ? Math.round(totalTests / data.length) : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-sm text-primary">
            {payload[0].value} essais
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl bg-card border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">
              Essais par Mois
            </h3>
            <p className="text-xs text-muted-foreground">
              12 derniers mois
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">{totalTests}</p>
          <p className="text-xs text-muted-foreground">
            ~{avgPerMonth}/mois
          </p>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(220, 20%, 18%)" 
              vertical={false}
            />
            <XAxis
              dataKey="monthLabel"
              stroke="hsl(200, 15%, 55%)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(200, 15%, 55%)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(220, 20%, 15%)" }} />
            <Bar
              dataKey="count"
              fill="hsl(185, 100%, 50%)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
