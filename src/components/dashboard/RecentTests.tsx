import { Badge } from "@/components/ui/badge";
import { FlaskConical, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useEssais } from "@/hooks/useEssais";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const statusConfig = {
  completed: {
    label: "Terminé",
    icon: CheckCircle,
    className: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  "in-progress": {
    label: "En cours",
    icon: Clock,
    className: "bg-primary/10 text-primary border-primary/20",
  },
  pending: {
    label: "En attente",
    icon: AlertCircle,
    className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  cancelled: {
    label: "Annulé",
    icon: AlertCircle,
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};

export function RecentTests() {
  const { data: essais, isLoading, error } = useEssais();
  
  // Get only the 5 most recent tests
  const recentTests = essais?.slice(0, 5);

  const formatDate = (dateStr: string) => {
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
            <FlaskConical className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-foreground">
            Essais Récents
          </h3>
        </div>
        <a href="/essais" className="text-sm text-primary hover:text-primary/80 transition-colors">
          Voir tout
        </a>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          Erreur lors du chargement
        </div>
      ) : recentTests?.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>Aucun essai enregistré</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {recentTests?.map((test) => {
            const status = statusConfig[test.statut as keyof typeof statusConfig];
            const StatusIcon = status?.icon || AlertCircle;
            return (
              <div
                key={test.id}
                className="p-4 hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground">
                        {test.reference}
                      </span>
                      <Badge variant="outline" className={status?.className}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status?.label || test.statut}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground mt-1">
                      {test.nom}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {test.clients?.nom || "Client non spécifié"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(test.date_reception)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
