import { Button } from "@/components/ui/button";
import { Car, Map } from "lucide-react";
import {
  buildItineraireUrl,
  buildVoirSurCarteUrl,
  openExternalNavigation,
  type ChantierLocalisation,
} from "@/lib/geo";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
      onClick={() => {
        if (!url) {
          toast.error("Localisation non renseignée pour ce chantier");
          return;
        }
        openExternalNavigation(url);
      }}
      disabled={!url}
    >
      <Car className="h-4 w-4" />
      Itinéraire
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

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className={cn("min-h-[44px] gap-2", className)}
      onClick={() => url && openExternalNavigation(url)}
      disabled={!url}
    >
      <Map className="h-4 w-4" />
      Voir sur la carte
    </Button>
  );
}
