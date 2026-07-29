import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CHANTIER_STATUT_LABELS: Record<string, string> = {
  planifie: "Planifié",
  en_cours: "En cours",
  suspendu: "Suspendu",
  termine: "Terminé",
};

const CHANTIER_STATUT_CLASSES: Record<string, string> = {
  planifie: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  en_cours: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  suspendu: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  termine: "bg-muted text-muted-foreground border-border",
};

interface ChantierStatutBadgeProps {
  statut?: string | null;
  className?: string;
}

/** Pastille de statut du chantier (source de vérité : table chantiers) */
export function ChantierStatutBadge({ statut, className }: ChantierStatutBadgeProps) {
  if (!statut) return null;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5",
        CHANTIER_STATUT_CLASSES[statut] ?? "bg-muted text-muted-foreground border-border",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      Chantier : {CHANTIER_STATUT_LABELS[statut] ?? statut}
    </Badge>
  );
}
