import { Badge } from "@/components/ui/badge";

interface AffaissementResultsProps {
  resultats: Record<string, unknown>;
}

export default function AffaissementResults({ resultats }: AffaissementResultsProps) {
  const isConforme = resultats.conformite === "conforme";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Affaissement mesuré</p>
          <p className="text-2xl font-bold text-foreground">
            {resultats.affaissement ? `${resultats.affaissement} mm` : "-"}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Classe visée</p>
          <p className="text-xl font-semibold text-foreground">
            {(resultats.classe_visee as string) || "-"}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Classe mesurée</p>
          <p className="text-xl font-semibold text-foreground">
            {(resultats.classe_mesuree as string) || "-"}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Conformité</p>
          <Badge className={isConforme ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
            {isConforme ? "Conforme" : "Non conforme"}
          </Badge>
        </div>
      </div>
      
      {resultats.type_affaissement && (
        <div>
          <p className="text-sm text-muted-foreground">Type d'affaissement</p>
          <p className="font-medium text-foreground capitalize">
            {resultats.type_affaissement as string}
          </p>
        </div>
      )}
    </div>
  );
}
