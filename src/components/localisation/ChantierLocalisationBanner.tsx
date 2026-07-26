import { MapPin } from "lucide-react";
import { ItineraireButton, VoirSurCarteButton } from "./ItineraireButton";
import { displayAdresse, hasCoords, type ChantierLocalisation } from "@/lib/geo";
import { cn } from "@/lib/utils";

/**
 * LOT 14.1 — Bandeau compact réutilisé dans les workflows terrain
 * (laboratoires mobiles, affectation technicien). Aucune donnée dupliquée :
 * la localisation provient toujours du chantier associé.
 */
export function ChantierLocalisationBanner({
  chantier,
  chantierNom,
  className,
}: {
  chantier?: ChantierLocalisation | null;
  chantierNom?: string | null;
  className?: string;
}) {
  const adresse = displayAdresse(chantier);
  const localise = hasCoords(chantier);

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-muted/30 p-4 flex flex-col sm:flex-row sm:items-center gap-3 max-w-full",
        className,
      )}
    >
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div className="min-w-0">
          {chantierNom && (
            <p className="text-sm font-medium text-foreground truncate">{chantierNom}</p>
          )}
          <p className="text-xs text-muted-foreground break-words">
            {adresse || "Localisation non renseignée"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:flex gap-2 shrink-0">
        <VoirSurCarteButton localisation={chantier} size="sm" className="w-full sm:w-auto" />
        <ItineraireButton
          localisation={chantier}
          size="sm"
          className={cn("w-full sm:w-auto", !localise && "opacity-60")}
        />
      </div>
    </div>
  );
}

export default ChantierLocalisationBanner;
