import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

/**
 * LOT 14.1 — Carte interactive (OpenStreetMap / Leaflet, sans clé API).
 * Utilisée en lecture (fiche chantier) et en édition (choix du marqueur).
 */

const markerIcon = L.divIcon({
  className: "ltpc-map-marker",
  html: `<span style="display:block;width:22px;height:22px;border-radius:9999px;background:hsl(var(--primary));border:3px solid hsl(var(--background));box-shadow:0 0 0 3px hsl(var(--primary)/0.35)"></span>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function Recenter({ lat, lng, zoom }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom ?? map.getZoom(), { animate: true });
  }, [lat, lng, zoom, map]);
  return null;
}

/** Recalcule la taille de la carte après ouverture du modal / redimensionnement. */
function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const invalidate = () => map.invalidateSize({ animate: false });
    const t1 = window.setTimeout(invalidate, 60);
    const t2 = window.setTimeout(invalidate, 350);
    const container = map.getContainer();
    const ro = new ResizeObserver(() => invalidate());
    ro.observe(container);
    window.addEventListener("resize", invalidate);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      ro.disconnect();
      window.removeEventListener("resize", invalidate);
    };
  }, [map]);
  return null;
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onPick(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

interface ChantierMapProps {
  latitude?: number | null;
  longitude?: number | null;
  /** Mode édition : clic sur la carte + marqueur déplaçable. */
  editable?: boolean;
  onChange?: (lat: number, lng: number) => void;
  className?: string;
  zoom?: number;
}

export function ChantierMap({
  latitude,
  longitude,
  editable = false,
  onChange,
  className,
  zoom = 15,
}: ChantierMapProps) {
  const hasPoint =
    typeof latitude === "number" && typeof longitude === "number" &&
    Number.isFinite(latitude) && Number.isFinite(longitude);

  // Centre par défaut : Algérie (aucune coordonnée inventée n'est enregistrée).
  const center = useMemo<[number, number]>(
    () => (hasPoint ? [latitude as number, longitude as number] : [28.0339, 1.6596]),
    [hasPoint, latitude, longitude],
  );

  return (
    <div
      className={cn(
        "relative w-full max-w-full min-h-0 overflow-hidden rounded-xl border border-border bg-muted/30",
        className,
      )}
    >
      <MapContainer
        center={center}
        zoom={hasPoint ? zoom : 5}
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{ height: "100%", width: "100%" }}
      >
        <InvalidateSize />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasPoint && (
          <>
            <Recenter lat={latitude as number} lng={longitude as number} zoom={zoom} />
            <Marker
              position={[latitude as number, longitude as number]}
              icon={markerIcon}
              draggable={editable}
              eventHandlers={
                editable
                  ? {
                      dragend: (e) => {
                        const p = (e.target as L.Marker).getLatLng();
                        onChange?.(p.lat, p.lng);
                      },
                    }
                  : undefined
              }
            />
          </>
        )}
        {editable && onChange && <ClickHandler onPick={onChange} />}
      </MapContainer>
    </div>
  );
}

export default ChantierMap;
