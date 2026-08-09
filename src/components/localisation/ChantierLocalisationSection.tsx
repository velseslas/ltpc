import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChantierMap } from "./ChantierMap";
import { ItineraireButton, PartagerButton, VoirSurCarteButton } from "./ItineraireButton";
import { ChantierLocalisationEditButton } from "./ChantierLocalisationEditButton";
import { displayAdresse, formatCoords, hasCoords, type ChantierLocalisation } from "@/lib/geo";

/**
 * LOT 14.1 — Section « Localisation » de la fiche chantier.
 * Aucune coordonnée n'est inventée : si le chantier n'a pas de position,
 * on affiche « Localisation non renseignée ».
 *
 * LOT Localisation 15-21 — bouton « Modifier la localisation » (Mobile + Desktop),
 * visible uniquement avec la permission `chantiers.modifier`.
 */
export function ChantierLocalisationSection({
  chantier,
  chantierId,
  clientId,
  onAddLocalisation,
}: {
  chantier?: ChantierLocalisation | null;
  chantierId?: string | null;
  clientId?: string | null;
  onAddLocalisation?: () => void;
}) {
  const adresse = displayAdresse(chantier);
  const localise = hasCoords(chantier);

  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-5 space-y-4 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-display font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" /> Localisation
        </h2>
        {localise && (
          <div className="grid grid-cols-2 sm:flex gap-2">
            <VoirSurCarteButton localisation={chantier} size="sm" className="w-full sm:w-auto" />
            <ItineraireButton localisation={chantier} size="sm" className="w-full sm:w-auto" />
            <PartagerButton
              localisation={chantier}
              chantierNom={chantier?.nom}
              size="sm"
              className="w-full sm:w-auto"
            />
            <ChantierLocalisationEditButton
              chantierId={chantierId}
              clientId={clientId}
              chantier={chantier}
              className="w-full sm:w-auto"
            />
          </div>
        )}
      </div>

      <div className="text-sm space-y-1">
        <p className="text-xs text-muted-foreground">Adresse</p>
        <p className="font-medium text-foreground break-words">{adresse || "—"}</p>
      </div>

      {localise ? (
        <>
          <ChantierMap
            latitude={chantier?.latitude}
            longitude={chantier?.longitude}
            className="h-[260px] md:h-[340px]"
          />
          <p className="text-xs text-muted-foreground font-mono">
            {formatCoords(chantier?.latitude, chantier?.longitude)}
          </p>
        </>
      ) : (
        <div className="text-center py-8 border border-dashed border-border rounded-lg">
          <MapPin className="w-10 h-10 mx-auto mb-3 opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground">Localisation non renseignée</p>
          <div className="mt-4 flex justify-center">
            <ChantierLocalisationEditButton
              chantierId={chantierId}
              clientId={clientId}
              chantier={chantier}
              mode="add"
            />
          </div>
          {!chantierId && onAddLocalisation && (
            <Button
              type="button"
              variant="outline"
              className="mt-4 min-h-[44px] gap-2"
              onClick={onAddLocalisation}
            >
              <Plus className="w-4 h-4" /> Ajouter la localisation
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default ChantierLocalisationSection;
