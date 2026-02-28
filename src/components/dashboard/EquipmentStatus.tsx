import { Microscope, CheckCircle, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMateriel } from "@/hooks/useMateriel";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const statusConfig = {
  operational: {
    label: "Opérationnel",
    icon: CheckCircle,
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
  maintenance: {
    label: "Maintenance",
    icon: AlertTriangle,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  offline: {
    label: "Hors service",
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-500/10",
  },
};

export function EquipmentStatus() {
  const { data: materiel, isLoading, error } = useMateriel();

  // Get only the first 6 items
  const displayedMateriel = materiel?.slice(0, 6);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: fr });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Microscope className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-foreground">
            État du Matériel
          </h3>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          Erreur lors du chargement
        </div>
      ) : displayedMateriel?.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Microscope className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>Aucun matériel enregistré</p>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {displayedMateriel?.map((item) => {
            const status = statusConfig[item.statut as keyof typeof statusConfig] || statusConfig.operational;
            const StatusIcon = status.icon;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-1.5 rounded", status.bg)}>
                    <StatusIcon className={cn("w-4 h-4", status.color)} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.nom}</p>
                    <p className="text-xs text-muted-foreground">
                      Dernier étalonnage: {formatDate(item.date_dernier_etalonnage)}
                    </p>
                  </div>
                </div>
                <span className={cn("text-xs font-medium", status.color)}>
                  {status.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
