import { Badge } from "@/components/ui/badge";

interface TempsPriseResultsProps {
  resultats: Record<string, unknown>;
}

export default function TempsPriseResults({ resultats }: TempsPriseResultsProps) {
  const isConforme = resultats.conformite === "conforme";

  const formatDuration = (minutes: number | undefined) => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Temps de prise initial</p>
          <p className="text-2xl font-bold text-foreground">
            {formatDuration(resultats.temps_prise_initial as number)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Temps de prise final</p>
          <p className="text-2xl font-bold text-foreground">
            {formatDuration(resultats.temps_prise_final as number)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Température d'essai</p>
          <p className="text-xl font-semibold text-foreground">
            {resultats.temperature_essai ? `${resultats.temperature_essai} °C` : "-"}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Conformité</p>
          <Badge className={isConforme ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
            {isConforme ? "Conforme" : "Non conforme"}
          </Badge>
        </div>
      </div>
      
      {resultats.methode && (
        <div>
          <p className="text-sm text-muted-foreground">Méthode d'essai</p>
          <p className="font-medium text-foreground capitalize">
            {resultats.methode === "vicat" ? "Aiguille de Vicat" : "Pénétromètre"}
          </p>
        </div>
      )}
    </div>
  );
}
