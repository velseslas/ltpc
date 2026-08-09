import { useEffect, useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItineraireButton, PartagerButton, VoirSurCarteButton } from "./ItineraireButton";
import { ChantierLocalisationEditButton } from "./ChantierLocalisationEditButton";
import { displayAdresse, hasCoords, type ChantierLocalisation } from "@/lib/geo";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

/**
 * LOT 14.1 — Bandeau compact réutilisé dans les workflows terrain
 * (laboratoires mobiles, affectation technicien). Aucune donnée dupliquée :
 * la localisation provient toujours du chantier associé.
 *
 * LOT Localisation mobile — sur mobile, le bandeau est replié derrière un
 * bouton « 📍 Localisation » ; le panneau (adresse + actions) est identique
 * à la version Desktop, qui reste inchangée.
 */
export function ChantierLocalisationBanner({
  chantier,
  chantierNom,
  chantierId,
  clientId,
  className,
}: {
  chantier?: ChantierLocalisation | null;
  chantierNom?: string | null;
  chantierId?: string | null;
  clientId?: string | null;
  className?: string;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const adresse = displayAdresse(chantier);
  const localise = hasCoords(chantier);

  // Changement de chantier → on repart d'un état replié cohérent.
  useEffect(() => {
    setOpen(false);
  }, [chantier?.latitude, chantier?.longitude, chantierNom]);

  const panel = (
    <div
      className={cn(
        "rounded-xl border border-border bg-muted/30 p-4 flex flex-col sm:flex-row sm:items-center gap-3 max-w-full",
        !isMobile && className,
      )}
    >
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div className="min-w-0">
          {chantierNom && (
            <p className="text-sm font-medium text-foreground truncate">{chantierNom}</p>
          )}
          <p className="text-xs text-muted-foreground break-words">
            {adresse || "Localisation du chantier non renseignée"}
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
        <PartagerButton
          localisation={chantier}
          chantierNom={chantierNom}
          size="sm"
          className="w-full sm:w-auto"
        />
        <ChantierLocalisationEditButton
          chantierId={chantierId}
          clientId={clientId}
          chantier={chantier}
          mode={localise ? "edit" : "add"}
          className="w-full sm:w-auto"
        />
      </div>
    </div>
  );

  if (!isMobile) return panel;

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full min-h-[44px] justify-between gap-2"
      >
        <span className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Localisation
        </span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", open && "rotate-180")} />
      </Button>
      {open && panel}
    </div>
  );
}

export default ChantierLocalisationBanner;
