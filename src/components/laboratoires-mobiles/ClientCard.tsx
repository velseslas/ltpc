import { Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ClientCardProps {
  nom: string;
  chantiersCount: number;
  maxChantiers: number;
  colorIndex: number;
  onClick: () => void;
}

const colorVariants = [
  { bg: "bg-emerald-500/20", icon: "text-emerald-500", bar: "bg-emerald-500" },
  { bg: "bg-blue-500/20", icon: "text-blue-500", bar: "bg-blue-500" },
  { bg: "bg-violet-500/20", icon: "text-violet-500", bar: "bg-violet-500" },
  { bg: "bg-amber-500/20", icon: "text-amber-500", bar: "bg-amber-500" },
  { bg: "bg-rose-500/20", icon: "text-rose-500", bar: "bg-rose-500" },
  { bg: "bg-teal-500/20", icon: "text-teal-500", bar: "bg-teal-500" },
];

export function ClientCard({ nom, chantiersCount, maxChantiers, colorIndex, onClick }: ClientCardProps) {
  const colors = colorVariants[colorIndex % colorVariants.length];
  const progressPercent = maxChantiers > 0 ? (chantiersCount / maxChantiers) * 100 : 0;

  return (
    <Card 
      className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg bg-card/50 backdrop-blur-sm border-border/50 group"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", colors.bg)}>
          <Building2 className={cn("h-7 w-7", colors.icon)} />
        </div>
        
        <h3 className="font-semibold text-lg text-foreground mb-3">{nom}</h3>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Chantiers</span>
          <span className="text-sm font-semibold text-foreground">{chantiersCount}</span>
        </div>
        
        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <div 
            className={cn("h-full rounded-full transition-all duration-500", colors.bar)}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
