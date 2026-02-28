import { Badge } from "@/components/ui/badge";

interface TeneurAirResultsProps {
  resultats: Record<string, unknown>;
}

export default function TeneurAirResults({ resultats }: TeneurAirResultsProps) {
  const isConforme = resultats.conformite === "conforme";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Teneur en air mesurée</p>
          <p className="text-2xl font-bold text-foreground">
            {resultats.teneur_air ? `${resultats.teneur_air} %` : "-"}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Teneur min.</p>
          <p className="text-xl font-semibold text-foreground">
            {resultats.teneur_min ? `${resultats.teneur_min} %` : "-"}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Teneur max.</p>
          <p className="text-xl font-semibold text-foreground">
            {resultats.teneur_max ? `${resultats.teneur_max} %` : "-"}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Conformité</p>
          <Badge className={isConforme ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
            {isConforme ? "Conforme" : "Non conforme"}
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {resultats.methode && (
          <div>
            <p className="text-sm text-muted-foreground">Méthode de mesure</p>
            <p className="font-medium text-foreground capitalize">
              {resultats.methode as string}
            </p>
          </div>
        )}
        {resultats.facteur_correction && (
          <div>
            <p className="text-sm text-muted-foreground">Facteur de correction</p>
            <p className="font-medium text-foreground">
              {resultats.facteur_correction as number}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
