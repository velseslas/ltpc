import { Badge } from "@/components/ui/badge";

interface TemperatureResultsProps {
  resultats: Record<string, unknown>;
}

export default function TemperatureResults({ resultats }: TemperatureResultsProps) {
  const isConforme = resultats.conformite === "conforme";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Température mesurée</p>
          <p className="text-2xl font-bold text-foreground">
            {resultats.temperature_mesuree ? `${resultats.temperature_mesuree} °C` : "-"}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Température min.</p>
          <p className="text-xl font-semibold text-foreground">
            {resultats.temperature_min ? `${resultats.temperature_min} °C` : "-"}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Température max.</p>
          <p className="text-xl font-semibold text-foreground">
            {resultats.temperature_max ? `${resultats.temperature_max} °C` : "-"}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Conformité</p>
          <Badge className={isConforme ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
            {isConforme ? "Conforme" : "Non conforme"}
          </Badge>
        </div>
      </div>
      
      {resultats.type_thermometre && (
        <div>
          <p className="text-sm text-muted-foreground">Type de thermomètre</p>
          <p className="font-medium text-foreground capitalize">
            {resultats.type_thermometre as string}
          </p>
        </div>
      )}
    </div>
  );
}
