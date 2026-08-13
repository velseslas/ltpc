import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface WilayaCardProps {
  nom: string;
  chantiersCount: number;
  maxChantiers: number;
  colorIndex: number;
  onClick: () => void;
  label?: string;
}

const colorVariants = [
  { bg: "bg-blue-500/20", icon: "text-blue-500", bar: "bg-blue-500" },
  { bg: "bg-emerald-500/20", icon: "text-emerald-500", bar: "bg-emerald-500" },
  { bg: "bg-cyan-500/20", icon: "text-cyan-500", bar: "bg-cyan-500" },
  { bg: "bg-orange-500/20", icon: "text-orange-500", bar: "bg-orange-500" },
  { bg: "bg-red-500/20", icon: "text-red-500", bar: "bg-red-500" },
  { bg: "bg-purple-500/20", icon: "text-purple-500", bar: "bg-purple-500" },
  { bg: "bg-pink-500/20", icon: "text-pink-500", bar: "bg-pink-500" },
  { bg: "bg-amber-500/20", icon: "text-amber-500", bar: "bg-amber-500" },
];

export function WilayaCard({ nom, chantiersCount, maxChantiers, colorIndex, onClick, label = "Chantiers actifs" }: WilayaCardProps) {
  const colors = colorVariants[colorIndex % colorVariants.length];
  const progressPercent = maxChantiers > 0 ? (chantiersCount / maxChantiers) * 100 : 0;

  return (
    <Card 
      className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg bg-card/50 backdrop-blur-sm border-border/50 group"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", colors.bg)}>
          <MapPin className={cn("h-7 w-7", colors.icon)} />
        </div>
        
        <h3 className="font-semibold text-lg text-foreground mb-3">{nom}</h3>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{label}</span>
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
