import { Button } from "@/components/ui/button";
import { Car, Map, Share, Check } from "lucide-react";
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

/** LOT 14.1 — Partage la position du chantier (API Web Share ou copie dans le presse-papiers). */
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
  const [copied, setCopied] = useState(false);
  const url = buildVoirSurCarteUrl(localisation);

  const handleShare = async () => {
    if (!url) return;
    const title = chantierNom ? `Localisation — ${chantierNom}` : "Localisation du chantier";
    const text = `Localisation du chantier${chantierNom ? ` « ${chantierNom} »` : ""}`;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
    } catch (e: any) {
      // AbortError = utilisateur a annulé le partage natif, on ne fait rien.
      if (e?.name === "AbortError") return;
      // Sinon on tente le fallback presse-papiers.
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Lien de localisation copié dans le presse-papiers");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de partager la localisation");
    }
  };

  const content = (
    <>
      {copied ? <Check className="h-4 w-4" /> : <Share className="h-4 w-4" />}
      Partager
    </>
  );

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className={cn("min-h-[44px] gap-2", className)}
      disabled={!url}
      onClick={handleShare}
    >
      {content}
    </Button>
  );
}
