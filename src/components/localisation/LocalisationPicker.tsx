import { useRef, useState } from "react";
import { Loader2, LocateFixed, MapPin, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChantierMap } from "./ChantierMap";
import { formatCoords, geocodeAdresse, reverseGeocode, type GeocodeResult } from "@/lib/geo";
import { toast } from "sonner";

export interface LocalisationValue {
  adresse_localisation: string;
  latitude: number | null;
  longitude: number | null;
}

interface LocalisationPickerProps {
  value: LocalisationValue;
  onChange: (value: LocalisationValue) => void;
}

/**
 * LOT 14.1 — Section « Localisation du chantier » des formulaires.
 * La géolocalisation du navigateur n'est demandée QUE sur clic explicite.
 */
export function LocalisationPicker({ value, onChange }: LocalisationPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const setPoint = async (lat: number, lng: number, label?: string) => {
    onChange({
      latitude: lat,
      longitude: lng,
      adresse_localisation: label ?? value.adresse_localisation,
    });
    if (!label) {
      const resolved = await reverseGeocode(lat, lng);
      if (resolved) {
        onChange({ latitude: lat, longitude: lng, adresse_localisation: resolved });
      }
    }
  };

  const handleSearch = async () => {
    if (query.trim().length < 3) {
      toast.error("Saisissez au moins 3 caractères pour rechercher");
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setSearching(true);
    try {
      const rows = await geocodeAdresse(query, ctrl.signal);
      setResults(rows);
      if (rows.length === 0) toast.info("Aucun résultat pour cette adresse");
    } catch (e: any) {
      if (e?.name !== "AbortError") toast.error("Recherche d'adresse indisponible");
    } finally {
      setSearching(false);
    }
  };

  const handleMaPosition = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Géolocalisation non disponible sur cet appareil");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocating(false);
        await setPoint(pos.coords.latitude, pos.coords.longitude);
        toast.success("Position actuelle appliquée");
      },
      (err) => {
        setLocating(false);
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "Accès à la position refusé — vous pouvez placer le marqueur manuellement"
            : "Impossible d'obtenir votre position",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const clear = () =>
    onChange({ latitude: null, longitude: null, adresse_localisation: "" });

  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-medium text-foreground">Localisation du chantier</h3>
        <span className="text-xs text-muted-foreground">(optionnel)</span>
      </div>

      {/* Recherche d'adresse */}
      <div className="space-y-2">
        <Label htmlFor="loc-search">Rechercher une adresse</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            id="loc-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
            placeholder="Ex: Cité 500 logements, Constantine"
            className="flex-1"
          />
          <div className="grid grid-cols-2 sm:flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSearch}
              disabled={searching}
              className="min-h-[44px] gap-2"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Rechercher
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleMaPosition}
              disabled={locating}
              className="min-h-[44px] gap-2"
            >
              {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
              Ma position
            </Button>
          </div>
        </div>

        {results.length > 0 && (
          <ul className="border border-border rounded-lg divide-y divide-border overflow-hidden">
            {results.map((r, i) => (
              <li key={`${r.latitude}-${r.longitude}-${i}`}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-3 min-h-[44px] text-sm hover:bg-muted/60 transition-colors"
                  onClick={() => {
                    setPoint(r.latitude, r.longitude, r.label);
                    setResults([]);
                    toast.success("Position appliquée");
                  }}
                >
                  {r.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Carte */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Cliquez sur la carte ou déplacez le marqueur pour ajuster la position.
        </p>
        <ChantierMap
          latitude={value.latitude}
          longitude={value.longitude}
          editable
          onChange={(lat, lng) => setPoint(lat, lng)}
          className="h-[280px] md:h-[340px]"
        />
      </div>

      {/* Adresse retenue + coordonnées */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="adresse_localisation">Adresse sélectionnée</Label>
          <Input
            id="adresse_localisation"
            value={value.adresse_localisation}
            onChange={(e) => onChange({ ...value, adresse_localisation: e.target.value })}
            placeholder="Aucune adresse sélectionnée"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Coordonnées GPS</Label>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-10 px-3 flex items-center rounded-md border border-border bg-muted/40 text-sm font-mono">
              {value.latitude !== null && value.longitude !== null
                ? formatCoords(value.latitude, value.longitude)
                : "Localisation non renseignée"}
            </div>
            {value.latitude !== null && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={clear}
                title="Effacer la localisation"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LocalisationPicker;
