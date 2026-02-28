import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

const data = [
  { month: "Jan", essais: 45 },
  { month: "Fév", essais: 52 },
  { month: "Mar", essais: 48 },
  { month: "Avr", essais: 61 },
  { month: "Mai", essais: 55 },
  { month: "Jun", essais: 67 },
  { month: "Jul", essais: 72 },
  { month: "Aoû", essais: 68 },
  { month: "Sep", essais: 79 },
  { month: "Oct", essais: 85 },
  { month: "Nov", essais: 91 },
  { month: "Déc", essais: 78 },
];

export function ActivityChart() {
  return (
    <div className="rounded-xl bg-card border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">
              Activité Annuelle
            </h3>
            <p className="text-xs text-muted-foreground">
              Nombre d'essais par mois
            </p>
          </div>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorEssais" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
            <XAxis
              dataKey="month"
              stroke="hsl(200, 15%, 55%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(200, 15%, 55%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 25%, 10%)",
                border: "1px solid hsl(220, 20%, 18%)",
                borderRadius: "8px",
                color: "hsl(200, 20%, 95%)",
              }}
            />
            <Area
              type="monotone"
              dataKey="essais"
              stroke="hsl(185, 100%, 50%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorEssais)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
