import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PieChart as PieIcon, Loader2 } from "lucide-react";
import { TestTypeDistribution as TestTypeData } from "@/hooks/useDashboardStats";

interface TestTypeDistributionProps {
  data: TestTypeData[];
  isLoading?: boolean;
}

const COLORS = [
  "hsl(185, 100%, 50%)", // primary cyan
  "hsl(142, 71%, 45%)", // green
  "hsl(262, 83%, 58%)", // purple
  "hsl(43, 96%, 56%)", // yellow
  "hsl(339, 90%, 51%)", // pink
  "hsl(201, 96%, 32%)", // blue
  "hsl(27, 98%, 54%)", // orange
  "hsl(173, 80%, 40%)", // teal
];

export function TestTypeDistribution({ data, isLoading }: TestTypeDistributionProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl bg-card border border-border p-6 h-80">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <PieIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">
              Répartition par Type
            </h3>
            <p className="text-xs text-muted-foreground">
              Distribution des essais
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          Aucune donnée disponible
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.type}</p>
          <p className="text-sm text-muted-foreground">
            {data.count} essais ({data.percentage}%)
          </p>
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
          <h3 className="font-display font-semibold text-foreground">
            Répartition par Type
          </h3>
          <p className="text-xs text-muted-foreground">
            Distribution des essais
          </p>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="count"
              nameKey="type"
            >
              {data.map((_, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  stroke="hsl(220, 25%, 10%)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => (
                <span className="text-xs text-muted-foreground">{value}</span>
              )}
              wrapperStyle={{ fontSize: "12px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
