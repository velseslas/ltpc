import { Badge } from "@/components/ui/badge";
import { formatDuration, SEUIL_PRISE_FINALE_MPA, SEUIL_PRISE_INITIALE_MPA } from "../lib/tempsPriseCalculs";

interface TempsPriseResultsProps {
  resultats: Record<string, unknown>;
}

interface MesureRow {
  temps_min?: number;
  force_N?: number;
  aiguille_mm2?: number;
}

export default function TempsPriseResults({ resultats }: TempsPriseResultsProps) {
  const isConforme = resultats.conformite === "conforme";
  const mesures = (resultats.mesures as MesureRow[] | undefined) ?? [];
  const tempsInitial = resultats.temps_prise_initial as number | null | undefined;
  const tempsFinal = resultats.temps_prise_final as number | null | undefined;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Début de prise ({SEUIL_PRISE_INITIALE_MPA} MPa)
          </p>
          <p className="text-2xl font-bold text-foreground">{formatDuration(tempsInitial)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            Fin de prise ({SEUIL_PRISE_FINALE_MPA} MPa)
          </p>
          <p className="text-2xl font-bold text-foreground">{formatDuration(tempsFinal)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Température d'essai</p>
          <p className="text-xl font-semibold text-foreground">
            {resultats.temperature_essai != null ? `${resultats.temperature_essai} °C` : "-"}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Conformité</p>
          <Badge
            className={
              isConforme ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
            }
          >
            {isConforme ? "Conforme" : "Non conforme"}
          </Badge>
        </div>
      </div>

      <div>
        <p className="text-sm text-muted-foreground">Méthode d'essai</p>
        <p className="font-medium text-foreground">
          Pénétromètre de résistance à la pénétration (ASTM C403/C403M)
        </p>
      </div>

      {mesures.length > 0 && (
        <div className="overflow-x-auto">
          <p className="text-sm text-muted-foreground mb-2">Mesures de pénétration</p>
          <table className="w-full text-sm border border-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-left border-b border-border">#</th>
                <th className="p-2 text-left border-b border-border">Temps (min)</th>
                <th className="p-2 text-left border-b border-border">Force (N)</th>
                <th className="p-2 text-left border-b border-border">Surface (mm²)</th>
                <th className="p-2 text-left border-b border-border">Résistance (MPa)</th>
              </tr>
            </thead>
            <tbody>
              {mesures.map((m, i) => {
                const r =
                  m.force_N && m.aiguille_mm2
                    ? Number(m.force_N) / Number(m.aiguille_mm2)
                    : null;
                return (
                  <tr key={i} className="border-b border-border">
                    <td className="p-2 text-muted-foreground">{i + 1}</td>
                    <td className="p-2">{m.temps_min ?? "-"}</td>
                    <td className="p-2">{m.force_N ?? "-"}</td>
                    <td className="p-2">{m.aiguille_mm2 ?? "-"}</td>
                    <td className="p-2 font-mono">{r != null ? r.toFixed(2) : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {resultats.observations ? (
        <div>
          <p className="text-sm text-muted-foreground">Observations</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {String(resultats.observations)}
          </p>
        </div>
      ) : null}
    </div>
  );
}
