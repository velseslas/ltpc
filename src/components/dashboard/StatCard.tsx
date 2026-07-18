import { LucideIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number | ReactNode;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-card border border-border p-4 sm:p-6 transition-all duration-300 hover:border-primary/50 hover:box-glow group",
        className
      )}
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-sm text-muted-foreground font-medium truncate">{title}</p>
            <h3 className="text-xl sm:text-3xl font-display font-bold text-foreground mt-1 sm:mt-2 break-words">
              {value}
            </h3>
            {subtitle && (
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-2">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                <span
                  className={cn(
                    "text-[10px] sm:text-xs font-medium",
                    trend.isPositive ? "text-green-400" : "text-red-400"
                  )}
                >
                  {trend.isPositive ? "+" : ""}{trend.value}%
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">vs mois dernier</span>
              </div>
            )}
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
            <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
          </div>
        </div>
      </div>
    </div>

  );
}
