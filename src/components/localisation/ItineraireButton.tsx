import { Button } from "@/components/ui/button";
import { Car, Map, Share } from "lucide-react";
import {
  buildItineraireUrl,
  buildVoirSurCarteUrl,
  displayAdresse,
  type ChantierLocalisation,
} from "@/lib/geo";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { LocalisationShareDialog } from "./LocalisationShareDialog";



/** LOT 14.1 — Lance la navigation externe (Google Maps / URL universelle). */
export function ItineraireButton({
  localisation,
  className,
  size = "default",
  variant,
}: {
  localisation?: ChantierLocalisation | null;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "secondary";
}) {
  const url = buildItineraireUrl(localisation);

  const content = (
    <>
      <Car className="h-4 w-4" />
      Itinéraire
    </>
  );

  if (!url) {
    return (
      <Button
        type="button"
        size={size}
        variant={variant}
        className={cn(
          "min-h-[44px] gap-2",
          !variant && "gradient-primary text-primary-foreground",
          className,
        )}
        disabled
      >
        {content}
      </Button>
    );
  }

  return (
    <Button
      asChild
      size={size}
      variant={variant}
      className={cn(
        "min-h-[44px] gap-2",
        !variant && "gradient-primary text-primary-foreground",
        className,
      )}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer external"
        onClick={(event) => event.stopPropagation()}
      >
        {content}
      </a>
    </Button>
  );
}

/** LOT 14.1 — Ouvre la position du chantier sur une carte externe. */
export function VoirSurCarteButton({
  localisation,
  className,
  size = "default",
}: {
  localisation?: ChantierLocalisation | null;
  className?: string;
  size?: "sm" | "default" | "lg";
}) {
  const url = buildVoirSurCarteUrl(localisation);

  const content = (
    <>
      <Map className="h-4 w-4" />
      Voir sur la carte
    </>
  );

  if (!url) {
    return (
      <Button
        type="button"
        variant="outline"
        size={size}
        className={cn("min-h-[44px] gap-2", className)}
        disabled
      >
        {content}
      </Button>
    );
  }

  return (
    <Button
      asChild
      variant="outline"
      size={size}
      className={cn("min-h-[44px] gap-2", className)}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer external"
        onClick={(event) => event.stopPropagation()}
      >
        {content}
      </a>
    </Button>
  );
}

/** Partage la localisation du chantier via le dialogue de partage LTPC (même UX que les rapports/documents). */
export function PartagerButton({
  localisation,
  chantierNom,
  className,
  size = "default",
}: {
  localisation?: ChantierLocalisation | null;
  chantierNom?: string | null;
  className?: string;
  size?: "sm" | "default" | "lg";
}) {
  const [open, setOpen] = useState(false);
  const url = buildVoirSurCarteUrl(localisation);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={size}
        className={cn("min-h-[44px] gap-2", className)}
        disabled={!url}
        onClick={() => setOpen(true)}
      >
        <Share className="h-4 w-4" />
        Partager
      </Button>
      <LocalisationShareDialog
        open={open}
        onOpenChange={setOpen}
        chantierNom={chantierNom}
        adresse={displayAdresse(localisation)}
        url={url}
      />
    </>
  );
}


