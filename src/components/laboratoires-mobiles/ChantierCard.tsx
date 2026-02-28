import { HardHat } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChantierCardProps {
  nom: string;
  adresse?: string;
  statut: string;
  colorIndex: number;
  onClick: () => void;
}

const colorVariants = [
  { bg: "bg-amber-500/20", icon: "text-amber-500" },
  { bg: "bg-orange-500/20", icon: "text-orange-500" },
  { bg: "bg-yellow-500/20", icon: "text-yellow-500" },
  { bg: "bg-lime-500/20", icon: "text-lime-500" },
  { bg: "bg-emerald-500/20", icon: "text-emerald-500" },
  { bg: "bg-cyan-500/20", icon: "text-cyan-500" },
];

const getStatusBadge = (statut: string) => {
  switch (statut) {
    case "en_cours":
      return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">En cours</Badge>;
    case "termine":
      return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Terminé</Badge>;
    case "suspendu":
      return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Suspendu</Badge>;
    default:
      return <Badge variant="outline">{statut}</Badge>;
  }
};

export function ChantierCard({ nom, adresse, statut, colorIndex, onClick }: ChantierCardProps) {
  const colors = colorVariants[colorIndex % colorVariants.length];

  return (
    <Card 
      className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg bg-card/50 backdrop-blur-sm border-border/50 group"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", colors.bg)}>
          <HardHat className={cn("h-7 w-7", colors.icon)} />
        </div>
        
        <h3 className="font-semibold text-lg text-foreground mb-2">{nom}</h3>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
          {adresse || "Adresse non renseignée"}
        </p>
        
        {getStatusBadge(statut)}
      </CardContent>
    </Card>
  );
}
