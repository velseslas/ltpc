import { useHistoriqueEchantillons, HistoriqueEchantillon } from "@/hooks/useHistoriqueEchantillons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, User, Clock, FileEdit, Plus, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface EchantillonHistoriqueProps {
  echantillonId: string | undefined;
}

const getActionIcon = (action: string) => {
  switch (action) {
    case "creation":
      return <Plus className="h-4 w-4 text-emerald-500" />;
    case "modification":
      return <FileEdit className="h-4 w-4 text-sky-500" />;
    case "suppression":
      return <Trash2 className="h-4 w-4 text-red-500" />;
    default:
      return <History className="h-4 w-4 text-muted-foreground" />;
  }
};

const getActionLabel = (action: string) => {
  switch (action) {
    case "creation":
      return "Création";
    case "modification":
      return "Modification";
    case "suppression":
      return "Suppression";
    default:
      return action;
  }
};

const getActionBadgeVariant = (action: string) => {
  switch (action) {
    case "creation":
      return "border-emerald-500/50 text-emerald-500 bg-emerald-500/10";
    case "modification":
      return "border-sky-500/50 text-sky-500 bg-sky-500/10";
    case "suppression":
      return "border-red-500/50 text-red-500 bg-red-500/10";
    default:
      return "";
  }
};

const formatFieldName = (field: string): string => {
  const fieldLabels: Record<string, string> = {
    client_id: "Client",
    chantier_id: "Chantier",
    centrale_id: "Centrale",
    formulation_id: "Formulation",
    operateur_id: "Technicien",
    ouvrage: "Ouvrage",
    destination_beton: "Partie de l'ouvrage",
    condition_cure: "Condition de cure",
    date_coulage: "Date de coulage",
    type_eprouvette: "Type d'éprouvette",
    dimension_eprouvette: "Dimension",
    nombre_eprouvettes: "Nombre d'éprouvettes",
    jours_essai: "Jours d'essai",
    temperature_beton: "Température béton",
    temperature_air: "Température air",
    classe_consistance: "Classe de consistance",
    mode_coulage: "Mode de coulage",
  };
  return fieldLabels[field] || field;
};

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
};

const HistoriqueItem = ({ item }: { item: HistoriqueEchantillon }) => {
  const details = item.details as Record<string, unknown> | null;
  const modifications = details?.modifications as Record<string, { ancien: unknown; nouveau: unknown }> | undefined;

  return (
    <div className="py-4">
      <div className="flex items-start gap-3">
        <div className="mt-1">
          {getActionIcon(item.action)}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getActionBadgeVariant(item.action)}>
                {getActionLabel(item.action)}
              </Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                {item.utilisateur || "Système"}
              </span>
            </div>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(item.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
            </span>
          </div>

          {/* Show modifications details */}
          {item.action === "modification" && modifications && Object.keys(modifications).length > 0 && (
            <div className="mt-2 space-y-1">
              {Object.entries(modifications).map(([field, change]) => (
                <div key={field} className="text-xs bg-muted/50 rounded-md p-2">
                  <span className="font-medium text-foreground">{formatFieldName(field)}:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-red-400 line-through">{formatValue(change.ancien)}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-emerald-400">{formatValue(change.nouveau)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Show creation details */}
          {item.action === "creation" && details?.donnees_initiales && (
            <p className="text-xs text-muted-foreground">
              Échantillon créé avec les données initiales
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export const EchantillonHistorique = ({ echantillonId }: EchantillonHistoriqueProps) => {
  const { data: historique = [], isLoading } = useHistoriqueEchantillons(echantillonId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des modifications
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (historique.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des modifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun historique disponible pour cet échantillon
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historique des modifications
          <Badge variant="secondary" className="ml-2">{historique.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="divide-y divide-border">
            {historique.map((item, index) => (
              <HistoriqueItem key={item.id} item={item} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default EchantillonHistorique;
